
import React, { useState, useEffect, useMemo } from 'react';
import { WizardResult, Language, WizardIntent, Shop } from '../types';
import { useTranslation, convertToArabicIndicNumerals } from '../services/i18n';
import { getRecommendedShops } from '../services/partners';
import ShopProfile from './ShopProfile';

interface WizardDisplayProps {
  result: WizardResult;
  onReset: () => void;
  lang: Language;
  showAmazon: boolean;
  showPartners?: boolean;
  userCity?: string;
}

const WizardDisplay: React.FC<WizardDisplayProps> = ({ result, onReset, lang, showAmazon, showPartners = false, userCity = '' }) => {
  const t = useTranslation(lang);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [recommendedShops, setRecommendedShops] = useState<Shop[]>([]);

  const isLearn = result.intent === WizardIntent.LEARN;
  const isRepair = result.intent === WizardIntent.REPAIR;
  const modules = result.modules || [];
  const hasModules = modules.length > 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeModuleIndex]);

  useEffect(() => {
    if (isLearn && hasModules && completedModules.size === modules.length && !showCelebration) {
      setShowCelebration(true);
    }
  }, [completedModules.size, isLearn, hasModules, modules.length, showCelebration]);

  useEffect(() => {
    if (isRepair && showPartners) {
      const loadRecommended = async () => {
        try {
          const shops = await getRecommendedShops(result.title, result.summary, lang, userCity);
          setRecommendedShops(shops);
        } catch (error) {
          console.error("Failed to load recommended shops:", error);
          setRecommendedShops([]);
        }
      };
      loadRecommended();
    } else {
      setRecommendedShops([]);
    }
  }, [isRepair, showPartners, result.title, result.summary, lang, userCity]);


  const toggleStep = (moduleIdx: number, stepIdx: number) => {
    const key = `${moduleIdx}-${stepIdx}`;
    const newSteps = new Set(completedSteps);
    if (newSteps.has(key)) {
      newSteps.delete(key);
    } else {
      newSteps.add(key);
    }
    setCompletedSteps(newSteps);

    const currentSteps = moduleIdx === -1 ? result.steps : modules[moduleIdx].steps;
    const allDone = currentSteps.every((_, i) => newSteps.has(`${moduleIdx}-${i}`));
    if (allDone && moduleIdx !== -1) {
      setCompletedModules(prev => new Set(prev).add(moduleIdx));
    }
  };

  const currentContent = useMemo(() => {
    if (activeModuleIndex === -1) {
      return { title: result.title, summary: result.summary, steps: result.steps, tip: result.wizardTip };
    }
    const mod = modules[activeModuleIndex];
    return { title: mod.title, summary: mod.summary, steps: mod.steps, tip: mod.wizardTip };
  }, [activeModuleIndex, result, modules]);

  const isRecommendationVisible = useMemo(() => {
    if (!result.monetizationMessage) return false;
    const msg = result.monetizationMessage.toLowerCase();
    const containsAmazon = msg.includes('amazon') || msg.includes('amzn.to');
    const containsPartner = msg.includes('wa.me') || msg.includes('whatsapp') || msg.includes('expert');
    
    if (containsAmazon && !showAmazon) return false;
    if (containsPartner && !showPartners) return false;
    
    return true;
  }, [result.monetizationMessage, showAmazon, showPartners]);

  const renderMonetizationMessage = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const isAmazon = part.includes('amazon') || part.includes('amzn.to');
        const isWhatsApp = part.includes('wa.me') || part.includes('whatsapp');
        
        if (isWhatsApp && !showPartners) return null;
        if (isAmazon && !showAmazon) return null;

        let label = t('view_reference_btn');
        let icon = 'fa-arrow-up-right-from-square';
        let btnClasses = "bg-slate-800 text-white";

        if (isAmazon) {
          label = t('amazon_button_label');
          icon = 'fa-brands fa-amazon';
          btnClasses = "bg-[#FF9900] text-black shadow-amber-500/20";
        } else if (isWhatsApp) {
          label = t('whatsapp_button_label');
          icon = 'fa-brands fa-whatsapp';
          btnClasses = "bg-[#25D366] text-white shadow-emerald-500/20";
        }

        return (
          <div key={i} className="mt-8 pt-4">
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[12px] transition-all shadow-2xl hover:scale-[1.03] active:scale-95 group relative overflow-hidden ${btnClasses}`}
            >
              <i className={`fa-solid ${icon} text-xl group-hover:rotate-12 transition-transform`} />
              {label}
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[35deg] group-hover:animate-[shine_1.5s_infinite]" />
            </a>
          </div>
        );
      }
      return <span key={i} className="block mb-2 last:mb-0 leading-relaxed">{part}</span>;
    });
  };

  return (
    <div className="space-y-12 pb-32 max-w-4xl mx-auto w-full px-4 md:px-0 animate-in fade-in duration-1000">
      
      {selectedShop && (
        <ShopProfile 
          shop={selectedShop} 
          diagnosisTitle={result.title}
          lang={lang}
          onClose={() => setSelectedShop(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={onReset} className="group px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3 w-fit">
          <i className="fa-solid fa-chevron-left group-hover:-translate-x-1 transition-transform"></i> {t('start_new')}
        </button>
        
        <div className="flex items-center gap-5 px-6 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isLearn ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
            <span className={`text-[11px] font-black uppercase tracking-widest ${isLearn ? 'text-blue-400' : 'text-rose-400'}`}>
              {isLearn ? t('welcome_title_learn') : t('welcome_title_repair')}
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800"></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            {t('wizard_logic_version')}
          </span>
        </div>
      </div>

      <section className={`rounded-[4rem] p-10 md:p-20 shadow-2xl relative overflow-hidden border-2 text-left animate-in zoom-in-95 ${isLearn ? 'bg-slate-900/40 border-white/5' : 'bg-slate-950/40 border-rose-500/20'}`}>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-10">
          <div className={`inline-flex px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] ${isLearn ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
             {activeModuleIndex === -1 ? t('wizard_diagnosis_label') : `${t('module_authorized_prefix')} ${convertToArabicIndicNumerals(activeModuleIndex + 1, lang)}`}
          </div>
          <h3 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white max-w-2xl">
            {currentContent.title}
          </h3>
          <p className="text-xl md:text-2xl font-medium leading-relaxed italic border-l-8 border-slate-800 pl-10 py-4 text-slate-400 max-w-3xl">
            "{currentContent.summary}"
          </p>
        </div>
      </section>

      {isRecommendationVisible && (
        <section className={`bg-gradient-to-br ${result.monetizationMessage.toLowerCase().includes('amazon') ? 'from-amber-600/10 to-transparent border-amber-500/20' : 'from-emerald-600/10 to-transparent border-emerald-500/20'} border-2 rounded-[3.5rem] p-8 md:p-14 text-left relative overflow-hidden animate-in slide-in-from-top-4`}>
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <i className={`fa-solid ${result.monetizationMessage.toLowerCase().includes('amazon') ? 'fa-bolt' : 'fa-handshake'} text-9xl`}></i>
          </div>
          <div className="relative z-10">
            <h4 className={`text-[10px] font-black uppercase tracking-[0.5em] mb-8 ${result.monetizationMessage.toLowerCase().includes('amazon') ? 'text-amber-500' : 'text-emerald-500'} flex items-center gap-3`}>
              <i className="fa-solid fa-star"></i> {t('wizard_recommendation_header')}
            </h4>
            <div className="text-white font-bold text-lg md:text-2xl leading-relaxed">
              {renderMonetizationMessage(result.monetizationMessage)}
            </div>
          </div>
        </section>
      )}

      {isRepair && showPartners && recommendedShops.length > 0 && (
        <section className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500">{t('pro_partners_title')}</h2>
              <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black">
                 <i className="fa-solid fa-crown"></i> {t('premium_network')}
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedShops.map(shop => (
                <button 
                  key={shop.id}
                  onClick={() => setSelectedShop(shop)}
                  className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-8 text-left group hover:border-amber-500/50 transition-all active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] -mr-16 -mt-16"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-amber-500">
                          <i className="fa-solid fa-store"></i>
                       </div>
                       <div>
                          <h4 className="font-black text-white text-lg leading-none">{shop.name}</h4>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{shop.distance || t('verified_partner')}</span>
                       </div>
                    </div>
                    <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                       {t('verified_label')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                     {shop.specialization.slice(0, 3).map((s, i) => (
                       <span key={i} className="px-3 py-1 bg-slate-950 text-slate-500 text-[9px] font-black rounded-lg uppercase">{s}</span>
                     ))}
                  </div>
                </button>
              ))}
           </div>
        </section>
      )}

      <section className={`rounded-[4.5rem] border border-slate-800 p-10 md:p-20 text-left shadow-2xl relative bg-slate-950/40 backdrop-blur-3xl`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 px-4">
           <h2 className="text-[14px] font-black uppercase tracking-[0.5em] flex items-center gap-6 text-slate-100">
            <i className={`fa-solid ${isLearn ? 'fa-terminal' : 'fa-list-check'} ${isLearn ? 'text-blue-500' : 'text-rose-500'} text-2xl`}></i> 
            {isLearn ? t('instructional_core') : t('tactical_sequence')}
          </h2>
        </div>
        
        <div className="space-y-6">
          {currentContent.steps.map((step, idx) => {
            const stepKey = `${activeModuleIndex}-${idx}`;
            const isCompleted = completedSteps.has(stepKey);
            return (
              <div 
                key={idx} 
                onClick={() => toggleStep(activeModuleIndex, idx)}
                className={`flex items-start gap-8 p-8 rounded-[3rem] border cursor-pointer transition-all duration-500 group ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50' : 'bg-slate-950 border-slate-800 hover:border-blue-500/40 hover:translate-x-3'}`}
              >
                <div className={`shrink-0 w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-xl font-black transition-all ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                  {isCompleted ? <i className="fa-solid fa-check"></i> : convertToArabicIndicNumerals(idx + 1, lang)}
                </div>
                <p className={`font-bold text-xl md:text-2xl leading-snug pt-3 flex-grow ${isCompleted ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border border-slate-800 rounded-[4rem] p-12 md:p-20 flex flex-col md:flex-row gap-16 items-center text-center md:text-left shadow-2xl border-l-[16px] border-l-blue-600 bg-slate-900/40 relative">
        <div className="shrink-0 w-28 h-28 rounded-[2.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-500 shadow-2xl">
          <i className="fa-solid fa-robot text-5xl"></i>
        </div>
        <div className="space-y-4">
          <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-500">{t('wizard_log')}</h4>
          <p className="font-black text-3xl md:text-4xl leading-tight text-slate-100 italic tracking-tight">"{currentContent.tip}"</p>
        </div>
      </section>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
};

export default WizardDisplay;
