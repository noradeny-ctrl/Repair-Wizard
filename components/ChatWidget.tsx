import React, { useState, useRef, useEffect } from 'react';
import { Message, WizardResult, Language, GroundingSource, UserRole } from '../types';
import { chatRepair } from '../services/gemini';
import { useTranslation } from '../services/i18n';

interface ChatWidgetProps {
  context: WizardResult | null;
  lang: Language;
  role: UserRole;
  forcedOpen?: boolean;
  onClose?: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ context, lang, role, forcedOpen, onClose }) => {
  const t = useTranslation(lang);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forcedOpen && role === UserRole.PARTNER) {
      setIsOpen(true);
    }
  }, [forcedOpen, role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [messages, isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || role !== UserRole.PARTNER) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatRepair(messages, input, context, lang);
      const aiMsg: Message = { 
        role: 'model', 
        text: response.text, 
        groundingSources: response.sources 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Connection to the Wizard lost.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!forcedOpen && context && role === UserRole.PARTNER && (
        <button 
          onClick={() => setIsOpen(true)} 
          className={`fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] right-8 w-16 h-16 wizard-gradient text-white rounded-2xl shadow-2xl flex items-center justify-center ios-transition z-[70] border-4 border-[#000] ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
        >
          <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex flex-col justify-end lg:justify-center lg:items-end lg:p-12 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500 cursor-pointer" 
            onClick={handleClose}
          />

          <div className="relative bg-[#050510] rounded-t-[3rem] lg:rounded-[3rem] h-[92vh] lg:h-[700px] w-full lg:w-[480px] flex flex-col shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-500 will-change-transform">
            
            <div className="lg:hidden w-12 h-1 bg-slate-800 rounded-full mx-auto mt-4 mb-2 opacity-50 shrink-0"></div>

            <div className="p-6 pt-4 lg:pt-8 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 wizard-gradient rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse-soft">
                  <i className="fa-solid fa-wand-magic text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">
                    {t('wizard_assistant')} (Pro)
                  </h3>
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">
                    {t('always_active')}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleClose} 
                className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 bg-black/40">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 px-12">
                   <i className="fa-solid fa-wand-magic text-4xl text-slate-700"></i>
                   <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                     Initialization complete. Direct your technical inquiries to the lead engineer.
                   </p>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-[2rem] text-[15px] font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-[#101025] border border-white/10 text-slate-200 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                  
                  {m.role === 'model' && m.groundingSources && m.groundingSources.length > 0 && (
                    <div className="mt-4 space-y-2 w-full pl-2">
                      <div className="flex flex-wrap gap-2">
                        {m.groundingSources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] px-3 py-1.5 rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
                          >
                            <i className="fa-solid fa-link text-[8px]"></i> {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#101025] border border-white/10 p-5 rounded-[2rem] rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSend} className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] border-t border-white/5 bg-black/60 shrink-0">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder={t('ask_wizard')} 
                  className="flex-grow p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 text-white placeholder:text-slate-600 transition-all font-medium text-[16px]" 
                />
                <button 
                  disabled={loading || !input.trim()} 
                  className="wizard-gradient text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0 active:scale-90 disabled:opacity-30 transition-all w-14 h-14"
                >
                  <i className="fa-solid fa-paper-plane text-lg"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;