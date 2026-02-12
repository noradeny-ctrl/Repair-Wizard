
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { getBusinessInsights, BusinessInsights } from '../services/gemini';
import { useTranslation } from '../services/i18n';

interface PartnerAnalyticsProps {
  city: string;
  lang: Language;
}

const InsightCard: React.FC<{ 
  title: string; 
  icon: string; 
  items: string[]; 
  color: string; 
  loading: boolean;
}> = ({ title, icon, items, color, loading }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 group hover:border-white/10 transition-all">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center ${color} shadow-lg`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{title}</h4>
    </div>
    
    <div className="space-y-3">
      {loading ? (
        [...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-slate-900/50 rounded-full w-full animate-pulse"></div>
        ))
      ) : (
        items.map((item, i) => (
          <div key={i} className="flex gap-3 text-slate-300">
            <span className={`text-[10px] mt-1.5 ${color}`}>
              <i className="fa-solid fa-chevron-right"></i>
            </span>
            <p className="text-sm font-bold leading-relaxed">{item}</p>
          </div>
        ))
      )}
    </div>
  </div>
);

const PartnerAnalytics: React.FC<PartnerAnalyticsProps> = ({ city, lang }) => {
  const t = useTranslation(lang);
  const [data, setData] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const insights = await getBusinessInsights(city, lang);
        setData(insights);
      } catch (err) {
        console.error("Failed to fetch insights:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [city, lang]);

  return (
    <div className="bg-slate-900/40 border border-amber-500/20 rounded-[3rem] p-8 md:p-12 text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-700 shadow-2xl">
      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
        <i className="fa-solid fa-chart-line text-9xl text-amber-500"></i>
      </div>
      
      <div className="relative z-10 space-y-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-500">Business Intelligence</h3>
            <p className="text-2xl font-black text-white tracking-tighter">Market Pulse: {city}</p>
          </div>
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] flex items-center justify-center text-amber-500 animate-pulse shadow-xl shadow-amber-500/10">
            <i className="fa-solid fa-microchip text-xl"></i>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InsightCard 
            title="Market Trends" 
            icon="fa-chart-line" 
            items={data?.trends || []} 
            color="text-blue-400" 
            loading={loading}
          />
          <InsightCard 
            title="Stocking Strategy" 
            icon="fa-box-open" 
            items={data?.parts || []} 
            color="text-amber-400" 
            loading={loading}
          />
          <InsightCard 
            title="Common Repairs" 
            icon="fa-screwdriver-wrench" 
            items={data?.repairs || []} 
            color="text-emerald-400" 
            loading={loading}
          />
        </div>

        <div className="pt-4 flex items-center justify-between">
           <div className="flex items-center gap-3 text-slate-500 text-[9px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-clock-rotate-left"></i>
              Last synced: Just now
           </div>
           <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Logic Stream Active</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerAnalytics;
