
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Language } from '../types';
import { useTranslation, convertToArabicIndicNumerals, TranslationKey } from '../services/i18n';
import { validateObject } from '../services/gemini';

interface MagicLensProps {
  onCaptureComplete: (images: string[]) => void;
  onClose: () => void;
  lang: Language;
  initialFocusLocked?: boolean;
  onCameraError?: (err: { title: string; message: string; code?: string }) => void;
}

interface ARBox {
  id: string;
  top: number;
  left: number;
  w: number;
  h: number;
  label: string;
  type: 'IDENT' | 'TEMP' | 'VOLT' | 'COMP';
  confidence: number;
  depth: string;
  isLocked: boolean;
}

const MagicLens: React.FC<MagicLensProps> = ({ 
  onCaptureComplete, 
  onClose, 
  lang, 
  initialFocusLocked = false,
  onCameraError 
}) => {
  const t = useTranslation(lang);
  const [phase, setPhase] = useState<'IDENTITY' | 'ANOMALY'>('IDENTITY');
  const [images, setImages] = useState<string[]>([]);
  const [shutterEffect, setShutterEffect] = useState(false);
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [error, setError] = useState<{title: string, message: string, code?: string} | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocusLocked, setIsFocusLocked] = useState(initialFocusLocked);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [canTorch, setCanTorch] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{x: number, y: number} | null>(null);
  const [arBoxes, setArBoxes] = useState<ARBox[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initTimeoutRef = useRef<number | null>(null);

  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);
  const grainLines = useMemo(() => [...Array(20)].map(() => Math.random() * 100), []);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  const applyCameraConstraints = async (constraints: any) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [constraints] } as any);
    } catch (e) {
      console.warn("Camera constraint failure:", e);
    }
  };

  const startCamera = async () => {
    setError(null);
    setValidationError(null);
    setShowHelp(false);
    setIsInitializing(true);

    if (initTimeoutRef.current) window.clearTimeout(initTimeoutRef.current);

    initTimeoutRef.current = window.setTimeout(() => {
      if (isInitializing && !streamRef.current) {
        handleCameraFailure({ name: 'TimeoutError', message: 'Hardware handshake timed out' });
      }
    }, 15000);

    if (!window.isSecureContext) {
      handleCameraFailure({ name: 'SecurityError', message: 'Lens requires a secure context (HTTPS).' });
      return;
    }

    const configs = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false }
    ];

    let success = false;
    let lastErr: any = null;

    for (const constraints of configs) {
      if (success) break;
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) setCanTorch(true);
            if (initTimeoutRef.current) window.clearTimeout(initTimeoutRef.current);
            setIsInitializing(false);
            triggerHaptic(50);
          };
        }
        success = true;
      } catch (err: any) {
        lastErr = err;
      }
    }

    if (!success) handleCameraFailure(lastErr);
  };

  const handleCameraFailure = (lastErr: any) => {
    if (initTimeoutRef.current) window.clearTimeout(initTimeoutRef.current);
    
    let errorKey: TranslationKey = 'camera_error_generic';
    const errName = lastErr?.name;

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      errorKey = 'camera_err_permission';
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      errorKey = 'camera_err_not_found';
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      errorKey = 'camera_err_busy';
    } else if (errName === 'SecurityError') {
      errorKey = 'camera_err_secure';
    }

    const errObj = { 
      title: t('optical_failure_title'), 
      message: t(errorKey),
      code: errName || "LENS_0x0"
    };
    setError(errObj);
    setIsInitializing(false);
    if (onCameraError) onCameraError(errObj);
  };

  const handleTapToFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!videoRef.current || !streamRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    triggerHaptic(15);
    setFocusPoint({ x: clientX, y: clientY });
    setIsFocusLocked(true);
    await applyCameraConstraints({ focusMode: 'manual', pointsOfInterest: [{ x, y }] });
    setTimeout(() => setFocusPoint(null), 2000);
  };

  const toggleTorch = async () => {
    if (!canTorch) return;
    const nextState = !isTorchOn;
    await applyCameraConstraints({ torch: nextState });
    setIsTorchOn(nextState);
    triggerHaptic(10);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!error && !isValidating && !validationError && !isInitializing) {
        const centerX = focusPoint ? (focusPoint.x / window.innerWidth) * 100 : 50;
        const centerY = focusPoint ? (focusPoint.y / window.innerHeight) * 100 : 50;

        if (Math.random() > 0.8 && arBoxes.length < 5) {
          const labels = ["IDENT_PKT", "THERM_SYNC", "V_RAIL_01", "WIZ_CORE", "CONN_PIN", "LOGIC_NODE", "DEPTH_PKT"];
          const types: ('IDENT' | 'TEMP' | 'VOLT' | 'COMP')[] = ['IDENT', 'TEMP', 'VOLT', 'COMP'];
          const offsetX = (Math.random() - 0.5) * 40;
          const offsetY = (Math.random() - 0.5) * 40;
          
          const newBox: ARBox = {
            id: Math.random().toString(36).substr(2, 9),
            top: centerY + offsetY - 10,
            left: centerX + offsetX - 10,
            w: 12 + Math.random() * 10,
            h: 12 + Math.random() * 10,
            label: labels[Math.floor(Math.random() * labels.length)],
            type: types[Math.floor(Math.random() * types.length)],
            confidence: 0.85 + Math.random() * 0.14,
            depth: (0.2 + Math.random() * 1.5).toFixed(2) + "m",
            isLocked: false
          };
          setArBoxes(prev => [...prev, newBox]);
          triggerHaptic(5);
          setTimeout(() => {
            setArBoxes(current => current.map(b => b.id === newBox.id ? {...b, isLocked: true} : b));
          }, 400);
        } else if (Math.random() > 0.4 && arBoxes.length > 0) {
          setArBoxes(prev => prev.filter((_, i) => i !== 0 || Math.random() > 0.7));
        }

        const debugLogs = ["OPTIC_LINK...", "HW_HANDSHAKE", "LENS_STABLE", "SYNC_LOGIC", "SCAN_READY", "0x88AF_OK"];
        setTelemetry(prev => [...prev.slice(-10), `[WIZ_LENS] ${debugLogs[Math.floor(Math.random() * debugLogs.length)]} >> ${convertToArabicIndicNumerals(Math.random().toFixed(3), lang)}`]);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [error, isValidating, validationError, isInitializing, lang, focusPoint, arBoxes.length]);

  useEffect(() => {
    startCamera();
    return () => {
      if (initTimeoutRef.current) window.clearTimeout(initTimeoutRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const captureShot = async () => {
    if (!videoRef.current || !canvasRef.current || error || isValidating || validationError || isInitializing) return;
    
    triggerHaptic([50, 20, 50]);
    setShutterEffect(true);
    setTimeout(() => setShutterEffect(false), 200);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      if (phase === 'IDENTITY') {
        setIsValidating(true);
        try {
          const validation = await validateObject(dataUrl);
          if (validation.valid) {
            triggerHaptic([40, 60, 40]);
            setImages([dataUrl]);
            setPhase('ANOMALY');
          } else {
            setValidationError(t('invalid_input_title'));
          }
        } catch (err) {
          setValidationError(t('invalid_input_title'));
        } finally {
          setIsValidating(false);
        }
      } else {
        onCaptureComplete([...images, dataUrl]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black overflow-hidden flex flex-col font-mono animate-in fade-in duration-500">
      <canvas ref={canvasRef} className="hidden" />
      
      {!error && (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onClick={handleTapToFocus}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${isValidating || isInitializing ? 'opacity-40 scale-105 blur-sm' : 'opacity-80 scale-100'}`} 
        />
      )}

      {/* Static HUD Elements */}
      <div className="absolute inset-0 z-[3007] pointer-events-none border-[12px] border-black/20 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        {grainLines.map((top, i) => (
          <div key={i} className="absolute left-0 w-full h-px bg-white/5" style={{ top: `${top}%` }}></div>
        ))}
      </div>

      {/* Telemetry Overlays */}
      <div className="absolute top-24 left-10 z-[3010] pointer-events-none space-y-2 max-w-xs">
        <div className="flex items-center gap-3 mb-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90">OPTIC_STREAM_v5.4</span>
        </div>
        {telemetry.map((line, i) => (
          <div key={i} className="text-[8px] text-cyan-400/70 font-mono tracking-widest leading-none drop-shadow-md">
            {line}
          </div>
        ))}
      </div>

      {/* AR Component Boxes */}
      {!error && !isValidating && !validationError && !isInitializing && (
        <div className="absolute inset-0 z-[3015] pointer-events-none">
          {arBoxes.map((box) => (
            <div 
              key={box.id} 
              className={`absolute border transition-all duration-300 ease-out flex flex-col items-start ${box.isLocked ? 'scale-100' : 'scale-125 opacity-50'} ${box.type === 'TEMP' ? 'border-amber-500/80 bg-amber-500/5' : box.type === 'VOLT' ? 'border-emerald-500/80 bg-emerald-500/5' : 'border-cyan-400/80 bg-cyan-400/5'} animate-ar-detect`}
              style={{ top: `${box.top}%`, left: `${box.left}%`, width: `${box.w}%`, height: `${box.h}%` }}
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current -m-[2px]"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current -m-[2px]"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current -m-[2px]"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current -m-[2px]"></div>
              <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-black ${box.type === 'TEMP' ? 'bg-amber-500' : box.type === 'VOLT' ? 'bg-emerald-500' : 'bg-cyan-400'}`}>
                {box.label}
              </div>
            </div>
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-64 h-64 border border-white/5 relative">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-400"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Main UI States */}
      {isInitializing && !error && (
        <div className="absolute inset-0 z-[3100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl">
          <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-12"></div>
          <p className="text-cyan-400 text-[11px] font-black uppercase tracking-[0.8em] animate-pulse">{t('initializing_optics_label')}</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[3200] flex flex-col items-center justify-center p-12 text-center bg-slate-950 overflow-y-auto">
           <div className="relative w-32 h-32 rounded-[3.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl mb-10 shrink-0">
             <i className="fa-solid fa-camera-slash text-5xl"></i>
           </div>
           <h3 className="text-3xl font-black text-white mb-6 uppercase tracking-[0.3em] leading-none shrink-0">{error.title}</h3>
           <p className="text-slate-500 text-sm mb-12 max-w-sm leading-relaxed shrink-0">{error.message}</p>
           
           <div className="w-full max-w-xs space-y-4 shrink-0">
             {(error.code === 'NotAllowedError' || error.code === 'PermissionDeniedError') && (
               <button 
                 onClick={() => setShowHelp(!showHelp)}
                 className="w-full py-6 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 <i className="fa-solid fa-circle-question text-base"></i>
                 {t('camera_help_btn')}
               </button>
             )}
             
             <button onClick={startCamera} className="w-full py-8 wizard-gradient text-white font-black uppercase text-[11px] tracking-[0.4em] rounded-[2.5rem] shadow-2xl active:scale-95 transition-all">
                {t('retry_sensor')}
             </button>

             <button onClick={() => window.location.reload()} className="w-full py-4 text-slate-600 font-black uppercase text-[9px] tracking-[0.4em] hover:text-slate-400 transition-all">
                {t('camera_reload_btn')}
             </button>
           </div>

           {/* Help Drawer */}
           {showHelp && (
             <div className="mt-12 p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] text-left space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-sm">
                <div className="flex items-center gap-4 text-amber-500">
                   <i className={`fa-brands ${isIOS ? 'fa-safari' : 'fa-chrome'} text-2xl`}></i>
                   <h4 className="text-[11px] font-black uppercase tracking-widest">{t('camera_help_title')}</h4>
                </div>
                <div className="space-y-4">
                   <p className="text-slate-300 text-xs font-bold leading-relaxed">
                     {isIOS ? t('camera_help_ios') : t('camera_help_android')}
                   </p>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Footer Controls */}
      <div className="absolute inset-x-0 bottom-12 z-[3100] px-10 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button onClick={onClose} className="w-16 h-16 rounded-[2rem] bg-black/50 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90 shadow-2xl backdrop-blur-md">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <button 
          onClick={captureShot}
          disabled={isValidating || !!validationError || !!error || isInitializing}
          className={`w-32 h-32 rounded-full border-4 border-white/20 p-3 relative z-10 transition-all active:scale-90 bg-black/40 ${isValidating || !!validationError || !!error || isInitializing ? 'opacity-20 grayscale' : 'shadow-[0_0_60px_rgba(34,211,238,0.2)]'}`}
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden group-hover:scale-95 transition-transform">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-200"></div>
             <div className="relative w-8 h-8 rounded-full border-2 border-cyan-500/20"></div>
          </div>
        </button>

        <div className="w-16 h-16 rounded-[2rem] bg-black/50 border border-white/10 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-xl">
           <div className="text-[14px] font-black text-white/90">
             {convertToArabicIndicNumerals(images.length, lang)}
             <span className="text-white/20 text-[10px] mx-0.5">/</span>
             {convertToArabicIndicNumerals(2, lang)}
           </div>
        </div>
      </div>

      {shutterEffect && <div className="absolute inset-0 z-[4000] bg-white animate-flash" />}

      <style>{`
        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-flash {
          animation: flash 0.15s ease-out forwards;
        }
        @keyframes ar-detect {
          0% { transform: scale(0.6); opacity: 0; filter: blur(10px); }
          20% { transform: scale(1.05); opacity: 1; filter: blur(0); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ar-detect {
          animation: ar-detect 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default MagicLens;
