import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false }) => {
  return (
    <div className={`${className} relative flex flex-col items-center justify-center overflow-visible group`}>
      {/* Soft Ambient Glow */}
      <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000 animate-pulse"></div>
      
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-2xl transition-transform duration-700 group-hover:scale-105">
        <defs>
          <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
          
          <linearGradient id="hat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <filter id="orb-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Minimalist Ring */}
        <circle 
          cx="60" cy="60" r="56" 
          fill="none" 
          stroke="url(#glass-grad)" 
          strokeWidth="0.5" 
          strokeDasharray="4 4"
          className="animate-[spin_40s_linear_infinite]"
        />

        {/* The Main Glass Sphere */}
        <circle 
          cx="60" cy="60" r="44" 
          fill="white" 
          fillOpacity="0.03"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        
        {/* Core Wizard Icon - Elegant & Smooth */}
        <g transform="translate(60, 62) scale(0.9)" filter="url(#orb-glow)">
          {/* Hat Base */}
          <path
            d="M-22 10 Q0 2 22 10 L26 15 Q0 10 -26 15 Z"
            fill="url(#hat-grad)"
            className="animate-pulse"
          />
          {/* Hat Peak */}
          <path
            d="M-15 8 L0 -38 L15 8 Z"
            fill="url(#hat-grad)"
          />
          {/* Magic Spark at the top */}
          <circle cx="0" cy="-38" r="2.5" fill="white" className="animate-ping" />
        </g>

        {/* High-End Glass Highlight */}
        <path
          d="M35 35 Q60 20 85 35"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.2"
        />
      </svg>

      {showText && (
        <span className="mt-4 text-[10px] font-black tracking-[0.5em] text-white/40 uppercase">
          Logic Core
        </span>
      )}
    </div>
  );
};

export default Logo;