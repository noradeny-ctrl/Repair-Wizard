
import React, { useState, useEffect } from 'react';
import { WizardResult, Language } from '../types';
import { useTranslation, convertToArabicIndicNumerals } from '../services/i18n';

interface LearningDisplayProps {
  result: WizardResult;
  onReset: () => void;
  lang: Language;
  showAmazon: boolean;
}

const LearningDisplay: React.FC<LearningDisplayProps> = ({ result, onReset, lang, showAmazon }) => {
  const t = useTranslation(lang);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAmazonSearch = (term: string) => {
    // Updated affiliate tag to repairwizar0d-20
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(term)}&tag=repairwizar0d-20`;
    window.open(url, '_blank');
  };

  const toggleStep = (idx: number) => {
    const newSteps = new Set(completedSteps);
    if (newSteps.has(idx)) newSteps.delete(idx); else newSteps.add(idx);
    setCompletedSteps(newSteps);
  };

  const parseStepText = (text: string) => {
    const visualMatch = text.match(/\[Visual: (.*?)\]/);
    if (visualMatch) {
      const cleanText = text.replace(visualMatch[0], '').trim();
      return { main: cleanText, visual: visualMatch[1] };
    }
    return { main: text, visual: null };
  };

  const currentStepIndex = result.steps.findIndex((_, i) => !completedSteps.has(i));
  const progressPercent = (completedSteps.size / result.steps.length) * 100;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24 max-w-3xl mx-auto w-full px-4 md:px-0">
      <div className="flex items-center justify-between">
        <button onClick={onReset} className="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
          <i className="fa-solid fa-arrow-left"></i> {t('start_new')}
        </button>
        <div className="flex items-center gap-4 bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('mastery_level_text')} {convertToArabicIndicNumerals('01', lang)}</span>
          <div className="w-px h-4 bg-slate-800"></div>
          <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-clock"></i> {result.estimatedTime}
          </span>
        </div>
      </div>

      <section className="bg-slate-900 rounded-[3.5rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden border border-slate-800 text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
            {t('instructor_guide_title')}
          </div>
          <h3 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-tight">
            {result.title}
          </h3>
          <p className="text-xl text-slate-400 font-medium leading-relaxed italic border-l-4 border-blue-500 pl-6 py-2">
            {result.summary}
          </p>
        </div>
      </section>

      <section className="bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] p-8 md:p-10 text-left">
        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-rose-500 mb-6 flex items-center gap-3">
          <i className="fa-solid fa-triangle-exclamation"></i> {t('safety_header')}
        </h4>
        <ul className="space-y-4">
          {result.safety.map((warning, i) => (
            <li key={i} className="flex gap-4 items-start text-slate-300 font-bold text-lg leading-tight">
              <i className="fa-solid fa-circle-exclamation text-rose-500/60 mt-1"></i>
              {warning}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4 flex items-center gap-3">
          <i className="fa-solid fa-toolbox text-amber-500"></i> {t('equipment_title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {result.arsenal.map((item, i) => (
            <div key={i} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 text-left group hover:border-blue-500 transition-all flex flex-col justify-between h-full shadow-lg">
              <div>
                <p className="font-black text-slate-100 text-xl leading-tight mb-2 group-hover:text-blue-400 transition-colors">{item.label}</p>
                {item.buyersGuide && <p className="text-xs text-slate-500 font-medium italic mb-4">{item.buyersGuide}</p>}
              </div>
              {showAmazon && (
                <button onClick={() => handleAmazonSearch(item.searchTerm)} className="w-full py-4 bg-amber-500 border border-amber-600 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-950 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-900/20 active:scale-95">
                  <i className="fa-brands fa-amazon text-lg"></i> {t('buy_pro_grade_btn')}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 rounded-[4rem] border border-slate-800 p-8 md:p-14 text-left shadow-2xl relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <h2 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-100 flex items-center gap-4">
            <i className="fa-solid fa-list-ol text-blue-500"></i> {t('practice_steps_title')}
          </h2>
          <div className="w-full md:w-auto flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>{t('progress_label')}</span>
              <span>{convertToArabicIndicNumerals(Math.round(progressPercent), lang)}%</span>
            </div>
            <div className="w-full md:w-48 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
               <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="space-y-8 relative">
          {result.steps.map((step, idx) => {
            const { main, visual } = parseStepText(step);
            const isCurrent = idx === currentStepIndex;
            const isCompleted = completedSteps.has(idx);

            return (
              <div 
                key={idx} 
                className={`flex flex-col md:flex-row gap-6 md:gap-8 group transition-all relative z-10 p-6 md:p-8 rounded-[2.5rem] border ${isCurrent ? 'bg-blue-500/10 border-blue-500/40 shadow-xl shadow-blue-900/10 scale-[1.02]' : 'border-transparent'} ${isCompleted ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-4 shrink-0">
                  <div 
                    onClick={() => toggleStep(idx)}
                    className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black transition-all border-2 cursor-pointer ${isCompleted ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : isCurrent ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]' : 'bg-slate-950 border-slate-800 text-slate-500 group-hover:border-blue-500'}`}
                  >
                    {isCompleted ? <i className="fa-solid fa-check"></i> : convertToArabicIndicNumerals(idx + 1, lang)}
                  </div>
                </div>

                <div className="space-y-3 pt-2 flex-grow">
                  <p className={`font-black text-xl md:text-2xl leading-relaxed transition-all ${isCompleted ? 'text-emerald-500/70 line-through' : isCurrent ? 'text-white' : 'text-slate-100 group-hover:text-blue-400'}`}>
                    {main}
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {visual && !isCompleted && (
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3 animate-in fade-in duration-500">
                        <i className="fa-solid fa-eye text-[10px] text-amber-500"></i>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{visual}</span>
                      </div>
                    )}
                    {isCurrent && !isCompleted && (
                       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                          <i className="fa-solid fa-arrow-right animate-bounce-x"></i> {t('active_task_label')}: Practice this now
                       </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 md:p-14 text-left shadow-xl">
        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-3">
          <i className="fa-solid fa-wrench text-amber-500"></i> {t('failure_q')}
        </h2>
        <div className="space-y-6">
          {result.troubleshooting.map((item, i) => (
            <div key={i} className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-4 hover:border-amber-500/30 transition-all group">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:animate-ping"></span>
                <p className="font-black text-slate-200 text-lg">{item.scenario}</p>
              </div>
              <p className="text-slate-400 font-medium italic leading-relaxed pl-5 border-l border-slate-800">
                <i className="fa-solid fa-lightbulb text-amber-500/50 mr-2"></i> {item.solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-10 flex flex-col md:flex-row gap-10 items-center text-center md:text-left shadow-2xl border-l-8 border-l-blue-600">
        <div className="shrink-0 w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-blue-500 shadow-2xl border border-slate-800">
          <i className="fa-solid fa-shield-halved text-4xl"></i>
        </div>
        <div className="space-y-3">
          <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-blue-500">{t('wizard_tip')}</h4>
          <p className="text-slate-100 font-black text-2xl leading-relaxed">{result.wizardTip}</p>
        </div>
      </section>
      
      {completedSteps.size === result.steps.length && (
        <div className="py-12 animate-in zoom-in-95 duration-500 text-center">
           <div className="inline-flex px-12 py-6 bg-emerald-500 text-white rounded-full font-black uppercase tracking-[0.4em] text-sm shadow-[0_0_40px_rgba(16,185,129,0.4)] items-center gap-4 active:scale-95 cursor-pointer transition-all" onClick={onReset}>
              <i className="fa-solid fa-medal text-3xl"></i>
              {t('execution_perfected')}
           </div>
        </div>
      )}
    </div>
  );
};

export default LearningDisplay;
