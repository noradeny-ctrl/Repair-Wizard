
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Language, WizardIntent } from '../types';
import { useTranslation, convertToArabicIndicNumerals } from '../services/i18n';
import MagicLens from './MagicLens';

interface DiagnosisFormProps {
  onDiagnose: (description: string, intent: WizardIntent, images?: string[]) => void;
  loading: boolean;
  lang: Language;
}

const LoadingTerminal: React.FC<{ lang: Language, description: string }> = ({ lang, description }) => {
  const t = useTranslation(lang);
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  
  // High-fidelity checkpoints that "lock in" at specific progress points
  const checkpoints = useMemo(() => [
    { threshold: 15, label: "HARDWARE_IDENTIFIED", key: 'check_hw' },
    { threshold: 35, label: "LOGIC_STREAM_SYNC", key: 'check_sync' },
    { threshold: 60, label: "COMPONENT_MAP_LOCK", key: 'check_map' },
    { threshold: 85, label: "SYNTHESIZING_CURE", key: 'check_cure' }
  ], []);

  const statuses = useMemo(() => {
    const isMech = description.toLowerCase().match(/car|engine|motor|wheel|brake|gear/);
    const isElec = description.toLowerCase().match(/phone|laptop|circuit|wire|power|light|battery/);

    if (lang === Language.KU_BADINI) {
      return [
        "دەسپێکرنا پرۆتۆکۆڵێن پاراستی...",
        isMech ? "شیکارکرنا سیستەمێ ميكانيكى..." : isElec ? "پشکنینا بازنەیێن کارەبێ..." : "پشکنینا زنجیرەیا داتایان...",
        "ڤاڵڤا پشکنینێ دپشکنیت...",
        "ئامادەکرنا پلانا ویزاردی..."
      ];
    }
    if (lang === Language.AR) {
      return [
        "إنشاء بروتوكول آمن...",
        isMech ? "تحليل الأنظمة الميكانيكية..." : isElec ? "فحص الدوائر الكهربائية..." : "مزامنة تدفق البيانات...",
        "تحليل مكونات النظام...",
        "توليد منطق الإصلاح النهائي..."
      ];
    }
    return [
      "Establishing Secure Logic Stream...",
      isMech ? "Analyzing Mechanical Tolerances..." : isElec ? "Probing Electrical Nodes..." : "Synchronizing Data Packets...",
      "Identifying Critical Component Failures...",
      "Synthesizing Wizard Repair Protocol..."
    ];
  }, [lang, description]);

  const jargon = [
    "0x88AF_SYNC", "V_RAIL_STABLE", "GATEWAY_AUTH", "HEURISTIC_OK",
    "DEPTH_LOCK_1", "KERN_LOGIC_INIT", "SIGNAL_CLEAN", "BUS_READY",
    "NODE_ACTIVE", "SCAN_COMPLETE", "PULSE_LOCK", "PROTOCOL_v5"
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % statuses.length);
    }, 1500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99;
        // Slow down as we reach the end to simulate heavy computation
        const factor = prev > 80 ? 0.5 : 1.5;
        const increment = Math.random() * 3 * factor;
        return Math.min(99, prev + increment);
      });
    }, 50);

    const telemetryInterval = setInterval(() => {
      const newLine = jargon[Math.floor(Math.random() * jargon.length)] + " >> " + convertToArabicIndicNumerals((Math.random() * 1000).toFixed(0), lang);
      setTelemetry(prev => [...prev.slice(-8), newLine]);
    }, 300);

    return () => {
      clearInterval(statusInterval);
      clearInterval(progressInterval);
      clearInterval(telemetryInterval);
    };
  }, [statuses.length, lang]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700 overflow-hidden">
      {/* Background Scanning Grids */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_30px_#22d3ee] animate-scan-fast"></div>
      </div>

      <div className="relative mb-10">
        {/* Logic Node Visualizer */}
        <div className="w-56 h-56 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/20 animate-[spin_15s_linear_infinite_reverse]"></div>
          
          {/* Animated Logic Points */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 ${progress > (i * 12) ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-800'}`}
                style={{ 
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                }}
              ></div>
            ))}
          </div>

          <div className="w-32 h-32 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center relative group overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-50"></div>
             <i className="fa-solid fa-wand-magic-sparkles text-cyan-400 text-5xl drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse"></i>
          </div>
        </div>
      </div>

      <div className="space-y-8 max-w-sm w-full relative z-10">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-xl font-black text-white tracking-tight h-10 flex items-center justify-center uppercase leading-none px-4">
              {statuses[statusIdx]}
            </h3>
            <div className="flex gap-1.5">
               {checkpoints.map((cp, i) => (
                 <div 
                   key={cp.key} 
                   className={`h-1 rounded-full transition-all duration-500 ${progress >= cp.threshold ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-800'}`}
                 ></div>
               ))}
            </div>
          </div>
        </div>

        {/* Technical Kernel Logs */}
        <div className="bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[8px] text-left h-32 flex flex-col justify-end gap-1 opacity-60 overflow-hidden shadow-inner relative">
           <div className="absolute top-2 right-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-emerald-500 text-[7px] font-black uppercase tracking-widest">Live_Kernel</span>
           </div>
           {telemetry.map((line, i) => (
             <div key={i} className="text-cyan-400/70 tracking-[0.2em] animate-in slide-in-from-bottom-1 truncate">
               <span className="text-slate-600 mr-2">[{convertToArabicIndicNumerals(i, lang)}]</span> {line}
             </div>
           ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-microchip text-[10px] text-cyan-400 animate-pulse"></i>
              {t('logic_synchronization_label')}
            </span>
            <span className="font-mono text-cyan-400">{convertToArabicIndicNumerals(Math.round(progress), lang)}%</span>
          </div>
          
          <div className="relative h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
              style={{ width: `${progress}%` }}
            ></div>
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>

          {/* Granular Step Checkpoints */}
          <div className="grid grid-cols-2 gap-2">
             {checkpoints.map(cp => (
               <div key={cp.key} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${progress >= cp.threshold ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-900/50 border-slate-800 text-slate-700'}`}>
                 <i className={`fa-solid ${progress >= cp.threshold ? 'fa-circle-check' : 'fa-circle-notch animate-spin'} text-[8px]`}></i>
                 <span className="text-[7px] font-black uppercase tracking-widest">{cp.label}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-fast {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .animate-scan-fast {
          animation: scan-fast 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ onDiagnose, loading, lang }) => {
  const t = useTranslation(lang);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isMagicLensOpen, setIsMagicLensOpen] = useState(false);
  const [isFocusLocked, setIsFocusLocked] = useState(false);
  const [intent] = useState<WizardIntent>(WizardIntent.REPAIR);
  const [cameraError, setCameraError] = useState<{title: string, message: string} | null>(null);

  const handleMagicLensCapture = (capturedImages: string[]) => {
    setImages(capturedImages);
    setIsMagicLensOpen(false);
    setCameraError(null);
  };

  const handleCameraError = (err: { title: string; message: string }) => {
    console.error("DiagnosisForm caught camera error:", err);
    setCameraError(err);
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 md:p-10 relative overflow-hidden text-left ios-transition">
      {loading && <LoadingTerminal lang={lang} description={description} />}
      
      <form onSubmit={(e) => { e.preventDefault(); onDiagnose(description, intent, images); }} className={`space-y-8 ${loading ? 'blur-md opacity-30 pointer-events-none transition-all duration-700' : ''}`}>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('scan_subject')}</span>
             <button 
                type="button"
                onClick={() => setIsFocusLocked(!isFocusLocked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border ${isFocusLocked ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                <i className={`fa-solid ${isFocusLocked ? 'fa-lock' : 'fa-lock-open'}`}></i>
                {t('focus_label')} {isFocusLocked ? t('locked_label') : ''}
              </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {images.length > 0 ? (
              images.map((img, i) => (
                <div key={i} className={`relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-rose-600 bg-slate-950 shadow-lg group`}>
                  <img src={img} className="w-full h-full object-cover" alt="Scan" />
                  <button type="button" onClick={() => setImages([])} className="absolute top-2 right-2 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-transform">
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              ))
            ) : cameraError ? (
              <div 
                onClick={() => { setCameraError(null); setIsMagicLensOpen(true); }}
                className="col-span-2 aspect-[16/9] rounded-3xl border-2 border-rose-500/30 bg-rose-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-500/10 transition-all p-8 text-center"
              >
                <i className="fa-solid fa-camera-slash text-2xl text-rose-500 mb-4"></i>
                <h4 className="text-white font-black text-sm uppercase mb-1 tracking-widest">{cameraError.title}</h4>
                <p className="text-slate-500 text-[10px] max-w-xs mx-auto mb-4">{cameraError.message}</p>
                <span className="text-rose-400 text-[9px] font-black uppercase tracking-widest underline decoration-dotted">Retry Optical Link</span>
              </div>
            ) : (
              <div 
                onClick={() => setIsMagicLensOpen(true)} 
                className={`col-span-2 aspect-[16/9] rounded-3xl border-2 border-dashed border-slate-800 bg-slate-950 flex flex-col items-center justify-center cursor-pointer hover:border-rose-600 transition-all active:scale-[0.98] group`}
              >
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 text-rose-500 group-hover:scale-110 transition-transform">
                  <i className={`fa-solid fa-wand-magic-sparkles text-xl`}></i>
                </div>
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">{t('identity_scan')}</span>
              </div>
            )}
          </div>
        </div>

        {isMagicLensOpen && (
          <MagicLens 
            lang={lang} 
            onCaptureComplete={handleMagicLensCapture} 
            onClose={() => setIsMagicLensOpen(false)} 
            initialFocusLocked={isFocusLocked}
            onCameraError={handleCameraError}
          />
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`w-full min-h-[140px] p-6 bg-slate-950 border border-slate-800 rounded-[2rem] focus:border-rose-600/50 outline-none transition-all text-slate-100 font-medium text-[17px] leading-relaxed shadow-inner resize-none placeholder:text-slate-700`}
          placeholder={t('diagnosis_placeholder')}
        />

        <button 
          type="submit" 
          disabled={loading || (!description && images.length === 0)} 
          className={`w-full py-6 rounded-[2rem] bg-gradient-to-r from-rose-700 to-orange-600 text-white font-black uppercase tracking-[0.3em] text-[13px] shadow-xl active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden`}
        >
          <span className="relative z-10">{t('initiate_diagnostic')}</span>
        </button>
      </form>
    </div>
  );
};

export default DiagnosisForm;
