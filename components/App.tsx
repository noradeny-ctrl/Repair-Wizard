
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DiagnosisForm from './components/DiagnosisForm';
import WizardDisplay from './components/WizardDisplay';
import ChatWidget from './components/ChatWidget';
import LanguageSelector from './components/LanguageSelector';
import PartnerForm from './components/PartnerForm';
import PartnerAnalytics from './PartnerAnalytics';
import Logo from './components/Logo';
import { invokeWizard } from './services/gemini';
import { useTranslation } from './services/i18n';
import { AppState, WizardResult, Language, WizardIntent, UserRole } from './types';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [lang, setLang] = useState<Language>(Language.EN);
  const [role, setRole] = useState<UserRole>(UserRole.CONSUMER);
  const [isLanguageSet, setIsLanguageSet] = useState(false);
  const [countryCode, setCountryCode] = useState<string>('US');
  const [userCity, setUserCity] = useState<string>('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<WizardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [showAmazon, setShowAmazon] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [isPartnerChatOpen, setIsPartnerChatOpen] = useState(false);

  const t = useTranslation(lang);

  const businessWhatsAppUrl = "https://wa.me/16153392046?text=Hello!%20I%20am%20using%20the%20Repair%20Wizard%20and%20would%20like%20to%20speak%20with%20a%20human%20expert.";

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 4500);
    const savedLang = localStorage.getItem('user_lang') as Language;
    if (savedLang) {
      setLang(savedLang);
      setIsLanguageSet(true);
    }
    const applyMonetization = async () => {
      // Force location for testing logic
      const code = 'IQ';
      const city = 'Duhok';
      
      setCountryCode(code);
      setUserCity(city);
      
      const amazonCountries = ['US', 'GB', 'CA', 'DE', 'FR', 'AU', 'IT', 'ES'];
      const localCountries = ['IQ', 'AE', 'SA', 'JO', 'KW', 'BH', 'QA', 'OM', 'LB', 'SY', 'EG', 'TR'];
      
      setShowAmazon(amazonCountries.includes(code));
      setShowPartners(localCountries.includes(code));
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
    setIsPartnerChatOpen(false);
    setFormKey(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleToggle = () => {
    setAppState(AppState.PARTNER_SIGNUP);
  };

  const handlePartnerSignupSuccess = (newRole: UserRole) => {
    setRole(newRole);
    setAppState(AppState.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMainChat = () => {
    if (role === UserRole.PARTNER) {
      setIsPartnerChatOpen(true);
    } else {
      setAppState(AppState.PARTNER_SIGNUP);
    }
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

  return (
    <div className={`min-h-screen flex flex-col text-slate-100 ${(lang === Language.KU_BADINI || lang === Language.AR) ? 'font-ku' : ''} ${appState === AppState.DIAGNOSING ? 'hologram-scan' : ''}`}>
      <Header 
        lang={lang} 
        onLanguageChange={setLang} 
        role={role} 
        onPartnerClick={handleRoleToggle} 
        onHomeClick={handleReset}
      />
      
      <main className="flex-grow flex flex-col items-center py-6 px-6 relative z-10">
        <div className="w-full max-w-4xl mx-auto text-center">
          {appState === AppState.PARTNER_SIGNUP ? (
            <PartnerForm lang={lang} onCancel={handleReset} onSuccess={handlePartnerSignupSuccess} />
          ) : (appState === AppState.IDLE || appState === AppState.DIAGNOSING) ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              <div className="flex flex-col items-center pt-2">
                {role === UserRole.CONSUMER && (
                  <button 
                    onClick={() => setAppState(AppState.PARTNER_SIGNUP)}
                    className="mb-6 px-4 py-1.5 bg-emerald-500/5 backdrop-blur-md border border-emerald-500/10 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-500/80 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center gap-2 shadow-xl"
                  >
                    <i className="fa-solid fa-store"></i> {t('partner_portal_label')}
                  </button>
                )}

                <div className="relative group mb-6">
                   <div className="w-28 h-28 md:w-32 md:h-32 bg-white/[0.02] border border-white/5 rounded-[2rem] flex items-center justify-center shadow-2xl backdrop-blur-2xl relative transition-all duration-700 hover:scale-105 hover:border-blue-500/40">
                      <Logo className="w-20 h-20 md:w-24 md:h-24" />
                   </div>
                   
                   {role === UserRole.PARTNER && (
                     <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 border border-amber-400/50 rounded-full text-[7px] font-black uppercase tracking-widest text-slate-950 shadow-lg whitespace-nowrap">
                       <i className="fa-solid fa-crown mr-0.5"></i> Authorized Partner
                     </div>
                   )}
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-xl">
                    {t('app_name')}
                  </h2>
                  <p className="text-slate-500 font-bold tracking-[0.2em] text-[9px] uppercase max-w-xs mx-auto leading-relaxed">
                    {t('welcome_subtitle')}
                  </p>
                </div>
              </div>

              {role === UserRole.PARTNER && appState === AppState.IDLE && (
                <div className="w-full max-w-2xl mx-auto mb-10">
                   <PartnerAnalytics city={userCity || 'Your City'} lang={lang} />
                </div>
              )}
              
              <div className="max-w-xl mx-auto w-full space-y-6">
                <DiagnosisForm key={formKey} onDiagnose={handleConsultation} loading={appState === AppState.DIAGNOSING} lang={lang} />
                
                {appState === AppState.IDLE && (
                  <button 
                    onClick={openMainChat}
                    className={`w-full py-6 ${role === UserRole.PARTNER ? 'bg-amber-600 shadow-[0_15px_40px_rgba(245,158,11,0.3)]' : 'bg-slate-800 shadow-xl'} text-white rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] group relative overflow-hidden`}
                  >
                    <i className={`fa-solid ${role === UserRole.PARTNER ? 'fa-wand-magic-sparkles' : 'fa-lock'} text-xl group-hover:rotate-12 transition-transform`}></i>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">{role === UserRole.PARTNER ? "Partner AI Engineering Chat" : 'Partner AI Chat (Locked)'}</span>
                    {role === UserRole.PARTNER && <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[35deg] group-hover:animate-[shine_1.5s_infinite]"></div>}
                  </button>
                )}
              </div>
            </div>
          ) : appState === AppState.RESULT && result ? (
            <>
              <WizardDisplay 
                result={result} 
                onReset={handleReset} 
                lang={lang} 
                showAmazon={showAmazon} 
                showPartners={showPartners}
                userCity={userCity}
                role={role}
              />
              <ChatWidget context={result} lang={lang} role={role} />
            </>
          ) : appState === AppState.ERROR && (
            <div className="py-20 bg-slate-900/40 backdrop-blur-3xl border border-rose-500/30 shadow-2xl p-10 animate-in zoom-in-95 rounded-[3.5rem] max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-8">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-black mb-4 text-slate-50">{t('logic_fault_title')}</h3>
              <p className="text-slate-400 mb-10 text-sm font-medium">{error}</p>
              <button onClick={handleReset} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-[11px]">{t('reconnect_label')}</button>
            </div>
          )}
        </div>
      </main>

      <a 
        href={businessWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Business Support"
        className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-8 w-14 h-14 bg-[#25D366] text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[70] border-4 border-[#000] animate-pulse-soft"
      >
        <i className="fa-brands fa-whatsapp text-xl"></i>
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-black rounded-full animate-ping"></div>
      </a>

      <ChatWidget 
        context={null} 
        lang={lang} 
        role={role}
        forcedOpen={isPartnerChatOpen} 
        onClose={() => setIsPartnerChatOpen(false)} 
      />

      <footer className="py-8 text-center opacity-20">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-700">Repair Wizard &copy; 2025</p>
      </footer>
    </div>
  );
};

export default App;
