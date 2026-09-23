import React, { useState, useEffect } from 'react';
import { ForestTheme, AppSettings } from '../db/schema';

interface EnvironmentalBackgroundProps {
  theme: ForestTheme;
  settings?: AppSettings;
}

export const EnvironmentalBackground: React.FC<EnvironmentalBackgroundProps> = ({ theme, settings }) => {
  // State for fluid environmental crossfade transitions between themes
  const [activeTheme, setActiveTheme] = useState<ForestTheme>(theme);
  const [prevTheme, setPrevTheme] = useState<ForestTheme | null>(null);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);

  useEffect(() => {
    if (theme !== activeTheme) {
      setPrevTheme(activeTheme);
      setActiveTheme(theme);
      setIsCrossfading(true);

      const timer = setTimeout(() => {
        setIsCrossfading(false);
        setPrevTheme(null);
      }, 3000); // 3.0s environmental crossfade duration matching cubic-bezier(0.22, 1, 0.36, 1)

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [theme, activeTheme]);

  const animationEnabled = settings?.animationEnabled !== false;
  const ambientMotion = settings?.ambientMotionEnabled !== false;

  const envIntensity = (settings?.environmentIntensity ?? 85) / 100;
  const motionSpeedScale = Math.max(0.1, (settings?.motionSpeed ?? 50) / 50);
  const densityScale = (settings?.mistRainDensity ?? 60) / 100;

  // Rain Forest Droplet Generator with unsynchronized speeds (2.1s, 3.7s, 5.2s, 4.3s)
  const rainDrops = Array.from({ length: Math.round(32 * densityScale) }, (_, i) => {
    const baseDurations = [2.1, 3.7, 5.2, 4.3, 2.9, 4.8];
    const durationSec = baseDurations[i % baseDurations.length] / (ambientMotion ? motionSpeedScale : 1);
    return {
      id: i,
      left: `${(i * 3.1 + (i * 7) % 19) % 100}%`,
      duration: `${durationSec.toFixed(2)}s`,
      delay: `${((i * 0.35) % 3.0).toFixed(2)}s`,
      opacity: 0.04 + (i % 5) * 0.02, // Opacity strictly bounded within 0.03–0.12 range
      height: `${14 + (i % 3) * 8}px`,
      driftX: `${(i % 2 === 0 ? 1 : -1) * (2 + (i % 3))}px`,
    };
  });

  // Foggy Mist Moisture Particles Generator (1-3px size, 0.03-0.12 opacity)
  const moistureParticles = Array.from({ length: Math.round(24 * densityScale) }, (_, i) => ({
    id: i,
    left: `${(i * 4.3 + 2) % 96}%`,
    top: `${(i * 6.7 + 8) % 88}%`,
    size: `${1.5 + (i % 3) * 0.75}px`,
    duration: `${((9 + (i % 5) * 3.5) / (ambientMotion ? motionSpeedScale : 1)).toFixed(2)}s`,
    delay: `${((i * 0.5) % 4.5).toFixed(2)}s`,
    opacity: 0.03 + (i % 4) * 0.025,
  }));

  // Render Sub-Component for Rain Forest Environment
  const renderRainForest = () => (
    <div className="rain-forest-scene" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* LAYER 1: Base Forest Foundation (#071A13) with tonal depth */}
      <div
        className="env-layer layer-base-rain"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, #09231A 0%, #071A13 60%, #04100C 100%)',
        }}
      />

      {/* LAYER 2: Distant Foliage (blur: 25-50px, opacity: 0.20-0.40, low contrast) */}
      <div
        className={`env-layer layer-foliage-distant ${animationEnabled && ambientMotion ? 'animate-foliage-drift' : ''}`}
        style={{
          position: 'absolute',
          inset: '-6%',
          filter: 'blur(35px)',
          opacity: 0.32,
          animationDuration: `${(45 / motionSpeedScale).toFixed(1)}s`,
        }}
      >
        <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 700 L0 320 Q200 180 400 290 T800 230 T1200 340 L1200 700 Z"
            fill="#0F3827"
          />
          <path
            d="M-50 700 L-50 400 Q250 260 550 360 T1050 310 L1250 700 Z"
            fill="#0B2C1F"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* LAYER 3: Canopy Silhouettes (top, left, upper-right with irregular organic shapes) */}
      <div
        className="env-layer layer-canopy-top"
        style={{
          position: 'absolute',
          top: '-5%',
          left: '-5%',
          right: '-5%',
          height: '65%',
          filter: 'blur(10px)',
          opacity: 0.38,
        }}
      >
        <svg viewBox="0 0 1200 500" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M-50 -20 Q150 160 350 40 T750 130 T1150 20 L1250 -50 L-50 -50 Z"
            fill="#12402C"
          />
          <path
            d="M-20 -30 Q220 110 480 30 T920 90 L1220 -30 L-20 -30 Z"
            fill="#164A34"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* LAYER 4: Diffused Sunlight (opacity: 0.04 -> 0.10, 8-15s duration, cubic-bezier(0.22, 1, 0.36, 1)) */}
      <div
        className={`env-layer layer-sunlight ${animationEnabled && ambientMotion ? 'animate-sunlight-drift' : ''}`}
        style={{
          position: 'absolute',
          top: '-25%',
          left: '15%',
          width: '70%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 20%, rgba(141, 217, 160, 0.10) 0%, rgba(87, 185, 120, 0.03) 45%, transparent 70%)',
          transform: 'rotate(-14deg)',
          pointerEvents: 'none',
          animationDuration: `${(12 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      {/* LAYER 5: Rain Particles (1-2px size, opacity: 0.03-0.12, unsynchronized varied durations) */}
      <div className="env-layer layer-rain-container" style={{ position: 'absolute', inset: 0 }}>
        {rainDrops.map((drop) => (
          <div
            key={drop.id}
            className={`rain-droplet ${animationEnabled ? 'animate-rain-drop' : ''}`}
            style={{
              position: 'absolute',
              left: drop.left,
              top: '-30px',
              width: '1.5px',
              height: drop.height,
              background: 'linear-gradient(180deg, transparent 0%, rgba(141, 217, 160, 0.28) 100%)',
              opacity: drop.opacity,
              animationDuration: drop.duration,
              animationDelay: drop.delay,
              transform: `translateX(${drop.driftX})`,
            }}
          />
        ))}
      </div>

      {/* LAYER 6: Foreground Foliage Silhouettes (bottom-left, bottom-right, blur: 3-8px, opacity: 0.25-0.55) */}
      <div
        className={`env-layer layer-foreground-leaves ${animationEnabled && ambientMotion ? 'animate-leaf-spring' : ''}`}
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(4.5px)',
          opacity: 0.35,
          animationDuration: `${(16 / motionSpeedScale).toFixed(1)}s`,
        }}
      >
        <svg viewBox="0 0 1200 700" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 0 C180 90 260 220 140 320 Q-30 220 0 0 Z M1200 700 C1020 600 920 480 1050 360 Q1220 450 1200 700 Z"
            fill="#09261B"
          />
        </svg>
      </div>
    </div>
  );

  // Render Sub-Component for Foggy Mist Forest Environment
  const renderFoggyMist = () => (
    <div className="foggy-mist-scene" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* LAYER 1: Dark Gray-Green Base Foundation (#111A18) */}
      <div
        className="env-layer layer-base-mist"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #15221F 0%, #111A18 65%, #0B1210 100%)',
        }}
      />

      {/* LAYER 2: Distant Tree Silhouettes (opacity: 0.15-0.30, blur: 10-25px, low saturation/contrast) */}
      <div
        className="env-layer layer-trees-distant"
        style={{
          position: 'absolute',
          inset: '-4%',
          filter: 'blur(16px) grayscale(65%)',
          opacity: 0.22,
        }}
      >
        <svg viewBox="0 0 1200 650" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 650 L0 260 Q220 140 440 240 T880 190 T1200 280 L1200 650 Z"
            fill="#182723"
          />
        </svg>
      </div>

      {/* LAYER 3: Deep Fog Background Layer */}
      <div
        className="env-layer layer-fog-deep"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 35%, rgba(168, 184, 177, 0.14) 0%, rgba(83, 111, 97, 0.05) 55%, transparent 80%)',
          filter: 'blur(20px)',
          opacity: 0.35,
        }}
      />

      {/* LAYER 4: Middle-Distance Trees (opacity: 0.30-0.55, blur: 4-10px) */}
      <div
        className="env-layer layer-trees-mid"
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(7px) grayscale(40%)',
          opacity: 0.42,
        }}
      >
        <svg viewBox="0 0 1200 650" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M-30 650 L-30 330 Q280 230 580 320 T1180 270 L1230 650 Z"
            fill="#202F2A"
          />
        </svg>
      </div>

      {/* LAYER 5: Moving Mist (3 Unsynchronized Fog Slices: Fog A L->R 38s, Fog B R->L 52s, Fog C Vertical 78s) */}
      <div className="env-layer layer-mist-slices" style={{ position: 'absolute', inset: 0 }}>
        {/* Fog Slice A */}
        <div
          className={`fog-slice slice-a ${animationEnabled && ambientMotion ? 'animate-fog-a' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 25% 45%, rgba(168, 184, 177, 0.15) 0%, transparent 60%)',
            filter: 'blur(24px)',
            animationDuration: `${(38 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
        {/* Fog Slice B */}
        <div
          className={`fog-slice slice-b ${animationEnabled && ambientMotion ? 'animate-fog-b' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 75% 55%, rgba(195, 209, 202, 0.11) 0%, transparent 58%)',
            filter: 'blur(28px)',
            animationDuration: `${(52 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
        {/* Fog Slice C */}
        <div
          className={`fog-slice slice-c ${animationEnabled && ambientMotion ? 'animate-fog-c' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(168, 184, 177, 0.09) 0%, transparent 65%)',
            filter: 'blur(20px)',
            animationDuration: `${(78 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
      </div>

      {/* LAYER 6: Foreground Branches & Moisture Particles (opacity: 0.40-0.70, blur: 2-5px) */}
      <div
        className="env-layer layer-foreground-branches"
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(3.5px)',
          opacity: 0.48,
        }}
      >
        <svg viewBox="0 0 1200 650" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 0 L220 0 C170 140 110 230 0 280 Z M1200 450 Q1050 520 980 650 L1200 650 Z"
            fill="#15231F"
          />
        </svg>
      </div>

      {/* Moisture Particles (1-3px size, opacity: 0.03-0.12) */}
      <div className="env-layer layer-moisture-particles" style={{ position: 'absolute', inset: 0 }}>
        {moistureParticles.map((pt) => (
          <div
            key={pt.id}
            className={`moisture-particle ${animationEnabled && ambientMotion ? 'animate-moisture-pulse' : ''}`}
            style={{
              position: 'absolute',
              left: pt.left,
              top: pt.top,
              width: pt.size,
              height: pt.size,
              borderRadius: '50%',
              background: '#C3D1CA',
              opacity: pt.opacity,
              animationDuration: pt.duration,
              animationDelay: pt.delay,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="environment-engine-root"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        opacity: envIntensity,
        transition: 'opacity 3.0s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Primary Active Environment Scene */}
      <div
        className={`environment-scene active-theme-${activeTheme}`}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isCrossfading ? 1 : 1,
          transition: 'opacity 3.0s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {activeTheme === 'rain_forest' ? renderRainForest() : renderFoggyMist()}
      </div>

      {/* Previous Scene for Smooth 3.0s Crossfade Transition */}
      {isCrossfading && prevTheme && (
        <div
          className={`environment-scene prev-theme-${prevTheme}`}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            transition: 'opacity 3.0s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {prevTheme === 'rain_forest' ? renderRainForest() : renderFoggyMist()}
        </div>
      )}

      {/* Global CSS Keyframes for Environmental Animations */}
      <style>{`
        /* Rain Fall Keyframes */
        @keyframes fallRainDrop {
          0% { transform: translateY(-30px) translateX(0); }
          100% { transform: translateY(105vh) translateX(-12px); }
        }

        .animate-rain-drop {
          animation: fallRainDrop linear infinite;
        }

        /* Sunlight Ray Motion */
        @keyframes moveSunlight {
          0%, 100% { opacity: 0.04; transform: rotate(-14deg) translateY(0); }
          50% { opacity: 0.10; transform: rotate(-11deg) translateY(-18px); }
        }

        .animate-sunlight-drift {
          animation: moveSunlight 13s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        /* Spring-Like Leaf Motion */
        @keyframes leafSpringMotion {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(10px); }
          50% { transform: translateX(-6px); }
          75% { transform: translateX(8px); }
        }

        .animate-leaf-spring {
          animation: leafSpringMotion 18s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
        }

        /* Distant Foliage Drift */
        @keyframes foliageDriftMotion {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.02) translate(-8px, 6px); }
        }

        .animate-foliage-drift {
          animation: foliageDriftMotion 30s ease-in-out infinite;
        }

        /* Organic Fog Motions (Unsynchronized) */
        @keyframes fogMoveSliceA {
          0% { transform: translateX(-6%); }
          50% { transform: translateX(6%); }
          100% { transform: translateX(-6%); }
        }

        @keyframes fogMoveSliceB {
          0% { transform: translateX(6%); }
          50% { transform: translateX(-6%); }
          100% { transform: translateX(6%); }
        }

        @keyframes fogMoveSliceC {
          0%, 100% { transform: translateY(0%); }
          50% { transform: translateY(-4%); }
        }

        .animate-fog-a { animation: fogMoveSliceA 40s ease-in-out infinite; }
        .animate-fog-b { animation: fogMoveSliceB 54s ease-in-out infinite; }
        .animate-fog-c { animation: fogMoveSliceC 80s ease-in-out infinite; }

        /* Moisture Particle Fade Pulse */
        @keyframes moistureParticlePulse {
          0%, 100% { opacity: 0.03; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.35); }
        }

        .animate-moisture-pulse {
          animation: moistureParticlePulse 11s ease-in-out infinite;
        }

        /* Accessibility: Support prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-rain-drop, .animate-sunlight-drift, .animate-leaf-spring,
          .animate-foliage-drift, .animate-fog-a, .animate-fog-b, .animate-fog-c,
          .animate-moisture-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
