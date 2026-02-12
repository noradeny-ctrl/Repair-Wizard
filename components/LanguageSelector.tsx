
import React from 'react';
import { Language } from '../types';
import Logo from './Logo';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
}

const KurdishFlag = () => (
  <svg viewBox="0 0 512 512" className="w-full h-full block">
    <rect width="512" height="170.6" fill="#E41E20"/>
    <rect y="170.6" width="512" height="170.6" fill="#FFF"/>
    <rect y="341.3" width="512" height="170.6" fill="#278E43"/>
    <circle cx="256" cy="256" r="65" fill="#FECA07"/>
    {[...Array(21)].map((_, i) => (
      <rect
        key={i}
        x="254"
        y="175"
        width="4"
        height="25"
        fill="#FECA07"
        transform={`rotate(${i * (360 / 21)} 256 256)`}
      />
    ))}
  </svg>
);

const USFlag = () => (
  <svg viewBox="0 0 512 512" className="w-full h-full block">
    <rect width="512" height="512" fill="#fff"/>
    <g fill="#B22234">
      {[0, 2, 4, 6, 8, 10, 12].map(i => (
        <rect key={i} y={i * (512/13)} width="512" height={512/13} />
      ))}
    </g>
    <rect width="256" height={(512/13) * 7} fill="#3C3B6E"/>
    <g fill="#fff">
      {[...Array(5)].map((_, r) => 
        [...Array(6)].map((_, c) => (
          <circle key={`r${r}c${c}`} cx={22 + c * 42} cy={20 + r * 54} r="6" />
        ))
      )}
      {[...Array(4)].map((_, r) => 
        [...Array(5)].map((_, c) => (
          <circle key={`ra${r}c${c}`} cx={43 + c * 42} cy={47 + r * 54} r="6" />
        ))
      )}
    </g>
  </svg>
);

const IraqFlag = () => (
  <svg viewBox="0 0 512 512" className="w-full h-full block">
    <rect width="512" height="170.6" fill="#ce1126"/>
    <rect y="170.6" width="512" height="170.6" fill="#ffffff"/>
    <rect y="341.3" width="512" height="170.6" fill="#000000"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#007a3d" fontSize="60" fontWeight="900" style={{fontFamily: 'Noto Sans Arabic'}}>الله أكبر</text>
  </svg>
);

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const options = [
    { 
      lang: Language.EN, 
      label: 'English', 
      sub: 'Professional Technical Support', 
      icon: <USFlag />,
      gradient: 'from-blue-600 to-cyan-500'
    },
    { 
      lang: Language.AR, 
      label: 'العربية', 
      sub: 'دعم فني متخصص', 
      icon: <IraqFlag />,
      gradient: 'from-emerald-600 to-teal-500'
    },
    { 
      lang: Language.KU_BADINI, 
      label: 'بادینی', 
      sub: 'هاریکاریا تەکنیکی ب زمانێ دایک', 
      icon: <KurdishFlag />,
      gradient: 'from-amber-500 to-orange-600'
    },
  ];

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10 space-y-12 py-12">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex w-32 h-32 bg-slate-900 border border-slate-800 rounded-3xl items-center justify-center shadow-2xl shadow-blue-900/40 mb-6 group transition-all hover:border-blue-500">
            <Logo className="w-24 h-24" showText />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            Repair Wizard
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            Select your interface language to initialize the diagnostic logic engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, idx) => (
            <button
              key={opt.lang}
              onClick={() => onSelect(opt.lang)}
              style={{ animationDelay: `${idx * 150}ms` }}
              className="group relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-left transition-all hover:border-blue-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform overflow-hidden`}>
                {opt.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                  {opt.label}
                </h3>
                <p className="text-slate-500 font-bold text-sm leading-snug group-hover:text-slate-400 transition-colors">
                  {opt.sub}
                </p>
              </div>
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                <i className="fa-solid fa-arrow-right text-blue-500 text-xl"></i>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-8 animate-in fade-in duration-1000 delay-700">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700">
            Precision Logic Engine v4.0.2
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
