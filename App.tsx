
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DiagnosisForm from './components/DiagnosisForm';
import WizardDisplay from './components/WizardDisplay';
import LanguageSelector from './components/LanguageSelector';
import PartnerForm from './components/PartnerForm';
import Logo from './components/Logo';
import { invokeWizard } from './services/gemini';
import { useTranslation } from './services/i18n';
// Added UserRole to imports
import { AppState, WizardResult, Language, WizardIntent, UserRole } from './types';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [lang, setLang] = useState<Language>(Language.EN);
  // Added role state to track user type
  const [role, setRole] = useState<UserRole>(UserRole.CONSUMER);
  const [isLanguageSet, setIsLanguageSet] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('US');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<WizardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [showAmazon, setShowAmazon] = useState(false);

  const t = useTranslation(lang);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 4500);
    const savedLang = localStorage.getItem('user_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
      setIsLanguageSet(true);
    }
    const applyMonetization = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setCountryCode(data.country_code || 'US');
        setShowAmazon(['US', 'GB', 'CA', 'DE', 'FR'].includes(data.country_code));
      } catch (err) {
        setCountryCode('US');
        setShowAmazon(true);
      }
    };
    applyMonetization();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isRTL = (lang === Language.KU_BADINI || lang === Language.AR);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleLanguageSelect = (selectedLang: Language) => {
    setLang(selectedLang);
    setIsLanguageSet(true);
    localStorage.setItem('user_lang', selectedLang);
  };

  const handleConsultation = async (desc: string, intent: WizardIntent, images?: string[]) => {
    try {
      setAppState(AppState.DIAGNOSING);
      setError(null);
      const wizardResponse = await invokeWizard(desc, lang, countryCode, intent, images);
      setResult(wizardResponse);
      setAppState(AppState.RESULT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || "Logic engine disruption.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setError(null);
    setFormKey(prev => prev + 1);
  };

  // Callback to handle successful partner registration
  const handlePartnerSignupSuccess = (newRole: UserRole) => {
    setRole(newRole);
    setAppState(AppState.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Added handleRoleToggle to satisfy Header props requirements
  const handleRoleToggle = () => {
    setAppState(AppState.PARTNER_SIGNUP);
  };

  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 z-[3000] overflow-hidden hologram-scan">
        <div className="relative mb-16 perspective-logo">
          <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full animate-pulse"></div>
          <div className="w-56 h-56 flex items-center justify-center relative rotate-y-anim">
            <Logo className="w-56 h-56" />
          </div>
        </div>
        <div className="space-y-8 text-center relative z-10">
          <div className="flex justify-center"><div className="spell-loader"><div></div><div></div><div></div></div></div>
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-[1.5em] text-blue-400 animate-pulse-soft">{t('initializing_core_label')}</h2>
            <div className="flex items-center justify-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.5em]">{t('wizard_logic_version')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLanguageSet) return <LanguageSelector onSelect={handleLanguageSelect} />;

  const isRTL = (lang === Language.KU_BADINI || lang === Language.AR);

  return (
    <div className={`min-h-screen flex flex-col text-slate-100 ${isRTL ? 'font-ku' : ''} ${appState === AppState.DIAGNOSING ? 'hologram-scan' : ''}`}>
      {/* Fix: Added missing onHomeClick prop to Header component to resolve line 126 error */}
      <Header 
        lang={lang} 
        onLanguageChange={(newLang) => setLang(newLang)} 
        role={role}
        onPartnerClick={handleRoleToggle}
        onHomeClick={handleReset}
      />
      
      <main className="flex-grow flex flex-col items-center py-10 px-6 relative z-10">
        <div className="w-full max-w-4xl mx-auto text-center">
          {appState === AppState.IDLE && (
            <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4">
              <button 
                onClick={() => setAppState(AppState.PARTNER_SIGNUP)}
                className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-store"></i> {t('partner_portal_label')}
              </button>
            </div>
          )}

          {appState === AppState.PARTNER_SIGNUP ? (
            // Added required onSuccess prop
            <PartnerForm 
              lang={lang} 
              onCancel={handleReset} 
              onSuccess={handlePartnerSignupSuccess} 
            />
          ) : (appState === AppState.IDLE || appState === AppState.DIAGNOSING) ? (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="flex justify-center mb-4">
                   <div className="w-40 h-40 bg-slate-900/40 border-2 border-slate-700/50 rounded-[3.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.1)] backdrop-blur-2xl relative group hover:border-blue-500/80 transition-all duration-700 hover:scale-105">
                      <Logo className="w-36 h-36" />
                   </div>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">{t('app_name')}</h2>
                <p className="text-slate-400 font-medium tracking-[0.2em] text-xs uppercase max-w-md mx-auto leading-relaxed">{t('welcome_subtitle')}</p>
              </div>
              
              <div className="max-w-2xl mx-auto w-full space-y-8">
                <DiagnosisForm key={formKey} onDiagnose={handleConsultation} loading={appState === AppState.DIAGNOSING} lang={lang} />
              </div>
            </div>
          ) : appState === AppState.RESULT && result ? (
            <WizardDisplay result={result} onReset={handleReset} lang={lang} showAmazon={showAmazon} />
          ) : appState === AppState.ERROR && (
            <div className="py-24 bg-slate-900/40 backdrop-blur-3xl border border-rose-500/30 shadow-2xl p-12 animate-in zoom-in-95 rounded-[4rem] max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-10">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 text-4xl"></i>
              </div>
              <h3 className="text-3xl font-black mb-6 text-slate-50">{t('logic_fault_title')}</h3>
              <p className="text-slate-400 mb-12 max-w-xs mx-auto text-lg font-medium">{error}</p>
              <button onClick={handleReset} className="w-full py-6 bg-blue-600 text-white font-black rounded-[2rem] uppercase tracking-widest text-sm">{t('reconnect_label')}</button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-700">Repair Wizard &copy; 2025</p>
      </footer>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s infinite;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default App;
