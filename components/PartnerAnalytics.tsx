import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getBusinessInsights } from '../services/gemini';
import { useTranslation } from '../services/i18n';

interface PartnerAnalyticsProps {
  city: string;
  lang: Language;
}

const PartnerAnalytics: React.FC<PartnerAnalyticsProps> = ({ city, lang }) => {
  const t = useTranslation(lang);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await getBusinessInsights(city, lang);
        setInsights(data);
      } catch (err) {
        setInsights("Failed to sync market intelligence.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [city, lang]);

  return (
    <div className="bg-slate-900/40 border border-amber-500/20 rounded-[3rem] p-8 md:p-12 text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-700 shadow-2xl">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <i className="fa-solid fa-chart-line text-8xl text-amber-500"></i>
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">Business Intelligence</h3>
            <p className="text-2xl font-black text-white tracking-tighter">Market Trends: {city}</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 animate-pulse">
            <i className="fa-solid fa-microchip"></i>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-800 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded-full w-1/2 animate-pulse"></div>
            <div className="h-4 bg-slate-800 rounded-full w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <div className="text-slate-300 font-medium text-lg leading-relaxed space-y-4 whitespace-pre-wrap">
            {insights}
          </div>
        )}

        <div className="pt-4 flex items-center gap-3 text-slate-500 text-[9px] font-black uppercase tracking-widest">
           <i className="fa-solid fa-clock-rotate-left"></i>
           Last synced: Just now
        </div>
      </div>
    </div>
  );
};

export default PartnerAnalytics;