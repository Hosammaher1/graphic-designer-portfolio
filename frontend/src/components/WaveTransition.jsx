import React from 'react';

export const WaveTransition = ({
  className = '',
  variant = 'hero-to-work',
}) => {
  return (
    <div className={`relative w-full overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-24 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent blur-3xl opacity-75" />

      {/* Luminous Wave SVG Line */}
      <svg
        className="w-full h-24 sm:h-32 md:h-40 text-rose-300 drop-shadow-[0_0_12px_rgba(244,164,150,0.5)]"
        viewBox="0 0 1440 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f4a496" stopOpacity="0.05" />
            <stop offset="25%" stopColor="#e2827e" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#fcdcd4" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#c85a6e" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#421a28" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="waveFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(200,90,110,0.06)" />
            <stop offset="50%" stopColor="rgba(244,164,150,0.03)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Soft filled underbelly of the wave */}
        <path
          d={
            variant === 'inverted'
              ? 'M0,120 C360,40 720,160 1080,60 C1260,10 1380,80 1440,100 L1440,180 L0,180 Z'
              : 'M0,80 C320,160 640,20 960,140 C1200,210 1380,70 1440,90 L1440,180 L0,180 Z'
          }
          fill="url(#waveFill)"
        />

        {/* Crisp illuminated neon crest line */}
        <path
          d={
            variant === 'inverted'
              ? 'M0,120 C360,40 720,160 1080,60 C1260,10 1380,80 1440,100'
              : 'M0,80 C320,160 640,20 960,140 C1200,210 1380,70 1440,90'
          }
          stroke="url(#waveGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Secondary softer halo wave */}
        <path
          d={
            variant === 'inverted'
              ? 'M0,125 C360,45 720,165 1080,65 C1260,15 1380,85 1440,105'
              : 'M0,85 C320,165 640,25 960,145 C1200,215 1380,75 1440,95'
          }
          stroke="url(#waveGlow)"
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default WaveTransition;
