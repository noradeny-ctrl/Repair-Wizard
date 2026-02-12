
import React, { useState } from 'react';
import { Shop, Language } from '../types';
import { useTranslation, convertToArabicIndicNumerals } from '../services/i18n';
import { generateWhatsAppLink, logLeadHit } from '../services/partners';

interface ShopProfileProps {
  shop: Shop;
  diagnosisTitle: string;
  onClose: () => void;
  lang: Language;
}

const ShopProfile: React.FC<ShopProfileProps> = ({ shop, diagnosisTitle, onClose, lang }) => {
  const t = useTranslation(lang);
  const [isConnecting, setIsConnecting] = useState(false);

  const whatsappLink = generateWhatsAppLink(shop, diagnosisTitle);

  const handleLeadTracking = async () => {
    setIsConnecting(true);
    // Log hit in background, don't wait for it if it delays the browser interaction
    logLeadHit(shop.id).finally(() => {
      setTimeout(() => setIsConnecting(false), 2000);
    });
  };

  const getIconForSpec = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes('electronic') || s.includes('chip') || s.includes('phone') || s.includes('motherboard')) return 'fa-microchip';
    if (s.includes('mechanical') || s.includes('engine') || s.includes('wrench') || s.includes('auto') || s.includes('transmission')) return 'fa-wrench';
    if (s.includes('hvac') || s.includes('ac') || s.includes('cooling')) return 'fa-snowflake';
    if (s.includes('programming') || s.includes('ecu')) return 'fa-laptop-code';
    return 'fa-gears';
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 backdrop-blur-xl">
      <div 
        className="absolute inset-0 z-0"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl bg-[#0a0a1a] border border-white/10 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col h-[92vh] md:h-auto animate-in slide-in-from-bottom-12 duration-500">
        
        <div className="relative h-48 md:h-64 bg-slate-950 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)] animate-pulse"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-transparent to-[#0a0a1a]">
             <div className="relative mb-4 group">
                <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-100/30">
                  <i className="fa-solid fa-crown text-white text-3xl"></i>
                </div>
             </div>
             <div className="space-y-1">
               <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-amber-500">{t('verified_partner')}</h4>
               <p className="text-white font-black text-2xl md:text-3xl tracking-tighter uppercase leading-none">{t('premium_facility')}</p>
             </div>
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/70 transition-all z-20"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar text-left">
          {/* Availability & Location Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-blue-500/5 border border-white/5 rounded-3xl">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                <i className="fa-solid fa-location-dot text-xl"></i>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Facility Location</p>
                <h5 className="text-white font-black text-lg leading-none">{shop.location.city}, {shop.location.neighborhood}</h5>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="px-6 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Open Now
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{shop.availability || 'Schedule varies'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{shop.name}</h2>
            <div className="flex items-center gap-2">
               {[...Array(5)].map((_, i) => (
                 <i key={i} className={`fa-solid fa-star text-[10px] ${i < Math.floor(shop.rating) ? 'text-amber-500' : 'text-slate-800'}`}></i>
               ))}
               <span className="text-[10px] font-black ml-3 text-slate-500 uppercase tracking-widest">{convertToArabicIndicNumerals(shop.rating, lang)} Verified Score</span>
            </div>
            {shop.bio && <p className="text-slate-400 font-medium text-lg leading-relaxed">{shop.bio}</p>}
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Authorized Specialties</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shop.specialization.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                    <i className={`fa-solid ${getIconForSpec(spec)}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-200 uppercase tracking-tight">{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-2">Customer Feedback</h5>
            <div className="space-y-4">
              {shop.reviews && shop.reviews.length > 0 ? (
                shop.reviews.map((rev, idx) => (
                  <div key={idx} className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-white">
                          {rev.user.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-white">{rev.user}</span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className={`fa-solid fa-star text-[8px] ${i < rev.rating ? 'text-amber-500' : 'text-slate-800'}`}></i>
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed italic">"{rev.comment}"</p>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">{convertToArabicIndicNumerals(rev.date, lang)}</div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-[2rem]">
                  <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No reviews synchronized yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-black/40 border-t border-white/5">
          {isConnecting && (
            <div className="absolute inset-0 z-50 bg-[#25D366] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
               <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
               <h3 className="text-white font-black text-xl tracking-tighter uppercase">{t('connecting_expert')}</h3>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLeadTracking}
              className="w-full py-8 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-[0.98] group relative overflow-hidden no-underline"
            >
              <div className="flex items-center gap-4">
                <i className="fa-brands fa-whatsapp text-3xl group-hover:rotate-12 transition-transform"></i>
                <span className="text-lg font-black uppercase tracking-[0.2em]">Request Service</span>
              </div>
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Priority WhatsApp Channel</span>
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[35deg] group-hover:animate-[shine_1.5s_infinite]"></div>
            </a>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default ShopProfile;
