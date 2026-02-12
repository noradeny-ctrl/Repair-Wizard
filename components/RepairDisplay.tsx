
import React, { useState } from 'react';
import { WizardResult, Language, ArsenalItem } from '../types';
import { useTranslation, convertToArabicIndicNumerals } from '../services/i18n';

interface RepairDisplayProps {
  result: WizardResult;
  onReset: () => void;
  lang: Language;
  showAmazon: boolean;
  onUpdateResult: (newResult: WizardResult) => void;
}

const RepairDisplay: React.FC<RepairDisplayProps> = ({ result, onReset, lang, showAmazon, onUpdateResult }) => {
  const t = useTranslation(lang);
  const [refineInput, setRefineInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleAmazonSearch = (term: string) => {
    const cleanTerm = term.replace(/[\[\]]/g, '').trim();
    // Updated affiliate tag to repairwizar0d-20
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(cleanTerm)}&tag=repairwizar0d-20&ref=repair_wizard`;
    window.open(url, '_blank');
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || isRefining) return;
    console.warn("Refinement is currently disabled.");
  };

  const ArsenalCard: React.FC<{ type: string, item: ArsenalItem, icon: string, color: string }> = ({ type, item, icon, color }) => (
    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-7 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden text-left flex flex-col justify-between h-full">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
            <i className={`fa-solid ${icon} text-lg`}></i>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-0.5">{type}</span>
            <p className="font-bold text-slate-100 text-base leading-tight group-hover:text-blue-400 transition-colors">{item.label}</p>
          </div>
        </div>
        {showAmazon && item.buyersGuide && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Buyer's Guide</p>
             <p className="text-slate-400 text-xs font-medium italic">{item.buyersGuide}</p>
          </div>
        )}
      </div>
      {showAmazon && (
        <button 
          onClick={() => handleAmazonSearch(item.searchTerm)} 
          className="w-full py-4 bg-[#FF9900] border border-[#E68A00] rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-[#FFAC33] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          <i className="fa-brands fa-amazon text-lg"></i> {t('view_on_amazon_btn')}
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <button onClick={onReset} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-100 transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left"></i> {t('start_new')}
        </button>
        <div className="flex items-center gap-2.5 bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
           <span className="text-blue-400 font-black text-[10px] uppercase tracking-widest">{t('status_ready')}</span>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-slate-800 text-left">
        <div className="relative z-10 space-y-8">
          <div className="inline-flex px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
            🔮 Wizard Diagnosis
          </div>
          <div className="space-y-3">
            <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
              {result.title}
            </h3>
          </div>
          <p className="text-xl text-slate-400 font-medium leading-relaxed italic max-w-xl">"{result.summary}"</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-100 px-3">
          <i className={`fa-solid ${showAmazon ? 'fa-cart-shopping' : 'fa-toolbox'} text-amber-500`}></i>
          <h2 className="text-[12px] font-black uppercase tracking-[0.3em]">{t('tools_needed')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {result.arsenal.slice(0, 2).map((item, idx) => (
            <ArsenalCard 
              key={idx}
              type={idx === 0 ? "The Cure" : "The Tool"} 
              item={item} 
              icon={idx === 0 ? "fa-briefcase-medical" : "fa-screwdriver-wrench"} 
              color={idx === 0 ? "bg-emerald-600" : "bg-blue-600"} 
            />
          ))}
        </div>
      </section>

      <section className="bg-slate-900 rounded-[3.5rem] border border-slate-800 p-10 md:p-14 shadow-sm text-left">
        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 mb-12 flex items-center gap-3">
          <i className="fa-solid fa-list-check text-blue-500"></i> {t('steps_title')}
        </h2>
        <div className="space-y-12 relative">
          {result.steps.map((step, idx) => (
            <div key={idx} className="flex gap-8 relative z-10">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center font-black text-sm text-slate-500">{convertToArabicIndicNumerals(idx + 1, lang)}</div>
              <p className="text-slate-300 font-semibold text-xl leading-relaxed pt-2">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-8 items-center text-center md:text-left shadow-xl border-l-4 border-l-amber-500 group relative">
        <div className="shrink-0 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-amber-500 shadow-xl border border-slate-700 bg-slate-800">
          <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
        </div>
        <div className="flex-grow">
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/70">{t('wizard_tip')}</h4>
          <p className="text-slate-200 font-bold text-lg leading-relaxed">{result.wizardTip}</p>
        </div>
      </section>

      <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 space-y-4">
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-2">{t('refine_action')}</h4>
         <div className="flex gap-3">
            <input 
              type="text" 
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              placeholder={t('refine_placeholder')}
              className="flex-grow p-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-blue-500 text-slate-100 text-sm"
            />
            <button 
              onClick={handleRefine}
              disabled={isRefining || !refineInput.trim()}
              className="w-14 h-14 wizard-gradient text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isRefining ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-flask-vial"></i>}
            </button>
         </div>
      </div>
    </div>
  );
};

export default RepairDisplay;
