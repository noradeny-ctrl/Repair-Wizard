
import React, { useState } from 'react';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface OnboardingFlowProps {
  onComplete: () => void;
  lang: Language;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, lang }) => {
  const t = useTranslation(lang);
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: t('onboarding_step1_title'),
      description: t('onboarding_step1_desc'),
      icon: 'fa-wand-sparkles',
      color: 'from-blue-600 to-indigo-600'
    },
    {
      title: t('onboarding_step2_title'),
      description: t('onboarding_step2_desc'),
      icon: 'fa-layer-group',
      color: 'from-indigo-600 to-violet-600'
    },
    {
      title: t('onboarding_step3_title'),
      description: t('onboarding_step3_desc'),
      icon: 'fa-eye',
      color: 'from-violet-600 to-purple-600'
    },
    {
      title: t('onboarding_step4_title'),
      description: t('onboarding_step4_desc'),
      icon: 'fa-comments-dollar',
      color: 'from-purple-600 to-blue-600'
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative">
        <div className={`h-2 bg-gradient-to-r ${steps[step].color} transition-all duration-700`} style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        
        <div className="p-10 pt-16 flex flex-col items-center text-center space-y-8">
          <div className={`w-24 h-24 rounded-[2rem] bg-gradient-to-br ${steps[step].color} flex items-center justify-center text-white text-4xl shadow-2xl animate-float`}>
            <i className={`fa-solid ${steps[step].icon}`}></i>
          </div>

          <div className="space-y-4 px-4">
            <h2 className="text-3xl font-black text-slate-50 tracking-tight leading-tight animate-in slide-in-from-bottom-2 duration-500">
              {steps[step].title}
            </h2>
            <p className="text-slate-400 font-medium leading-relaxed animate-in slide-in-from-bottom-4 duration-700">
              {steps[step].description}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-slate-800'}`}></div>
            ))}
          </div>

          <div className="w-full flex gap-4 pt-6">
            <button 
              onClick={onComplete}
              className="flex-1 py-5 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
            >
              {t('onboarding_skip')}
            </button>
            <button 
              onClick={nextStep}
              className={`flex-[2] py-5 rounded-2xl bg-gradient-to-r ${steps[step].color} text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-900/20 active:scale-95 transition-all`}
            >
              {step === steps.length - 1 ? t('onboarding_finish') : t('onboarding_next')}
            </button>
          </div>
        </div>

        <div className="absolute top-6 right-8">
          <div className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{step + 1} / {steps.length}</div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
