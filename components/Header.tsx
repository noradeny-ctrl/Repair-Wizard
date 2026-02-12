
import React from 'react';
import { Language, UserRole } from '../types';
import { useTranslation } from '../services/i18n';
import Logo from './Logo';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  role: UserRole;
  onPartnerClick: () => void;
  onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ lang, onLanguageChange, role, onPartnerClick, onHomeClick }) => {
  const t = useTranslation(lang);
  const isPartner = role === UserRole.PARTNER;

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[100] pt-safe">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Group - Clickable Home */}
        <button 
          onClick={onHomeClick}
          className="flex items-center gap-3 group transition-transform active:scale-95 text-left"
        >
          <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-lg group-hover:border-blue-500/50 transition-colors">
            <Logo className="w-7 h-7" />
          </div>
          <h1 className="font-extrabold text-slate-100 text-lg tracking-tight group-hover:text-blue-400 transition-colors">
            {t('app_name')}
          </h1>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
           <span className="hidden lg:inline-flex px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
             {t('system_live')}
           </span>

           {/* Home Button */}
           <button 
             onClick={onHomeClick}
             className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center hover:text-blue-400 hover:border-blue-500/30 transition-all active:scale-90"
             title="Home"
           >
             <i className="fa-solid fa-house text-sm"></i>
           </button>

           {/* Crown Icon Trigger for Partner Portal */}
           <button 
             onClick={onPartnerClick}
             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
               isPartner 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse-soft' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/30'
             }`}
             title={isPartner ? "Partner Dashboard" : "Become a Partner"}
           >
             <i className="fa-solid fa-crown text-sm"></i>
           </button>
           
           <div className="flex bg-slate-900 border border-slate-800 rounded-full p-1">
              <button 
                onClick={() => onLanguageChange(Language.EN)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${lang === Language.EN ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >EN</button>
              <button 
                onClick={() => onLanguageChange(Language.AR)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${lang === Language.AR ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >AR</button>
              <button 
                onClick={() => onLanguageChange(Language.KU_BADINI)}
                title="Kurdish Badini"
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${lang === Language.KU_BADINI ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              >KB</button>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
