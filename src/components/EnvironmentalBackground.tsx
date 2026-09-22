import React from 'react';
import { ForestTheme, AppSettings } from '../db/schema';

interface EnvironmentalBackgroundProps {
  theme: ForestTheme;
  settings?: AppSettings;
}

export const EnvironmentalBackground: React.FC<EnvironmentalBackgroundProps> = ({ theme, settings }) => {
  const isRain = theme === 'rain_forest';
  const animationEnabled = settings?.animationEnabled !== false;
  const ambientMotion = settings?.ambientMotionEnabled !== false;

  const envIntensity = ((settings?.environmentIntensity ?? 85) / 100);
  const motionSpeedScale = ((settings?.motionSpeed ?? 50) / 50);
  const densityScale = ((settings?.mistRainDensity ?? 60) / 100);

  // Generate rain droplets with varied speed, left offset, and height
  const rainDrops = Array.from({ length: Math.round(28 * densityScale) }, (_, i) => ({
    id: i,
    left: `${(i * 3.5 + (i * 7) % 17) % 100}%`,
    duration: `${(1.8 + (i % 5) * 0.4) / (ambientMotion ? motionSpeedScale || 1 : 1)}s`,
    delay: `${(i * 0.25) % 2.5}s`,
    opacity: 0.15 + (i % 4) * 0.08,
    height: `${14 + (i % 3) * 10}px`,
  }));

  // Generate mist particles for Foggy Mist Forest
  const mistParticles = Array.from({ length: Math.round(20 * densityScale) }, (_, i) => ({
    id: i,
    left: `${(i * 5 + 3) % 95}%`,
    top: `${(i * 7 + 10) % 85}%`,
    size: `${1.5 + (i % 3)}px`,
    duration: `${(8 + (i % 6) * 4) / (ambientMotion ? motionSpeedScale || 1 : 1)}s`,
    delay: `${(i * 0.4) % 4}s`,
  }));

  return (
    <div
      className={`env-background-root theme-${theme}`}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        transition: 'background-color 3s cubic-bezier(0.22, 1, 0.36, 1), opacity 3s cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: envIntensity,
      }}
    >
      {/* LAYER 1: Base Forest Color Foundation */}
      <div
        className="env-layer layer-base"
        style={{
          position: 'absolute',
          inset: 0,
          background: isRain
            ? 'linear-gradient(180deg, #071A13 0%, #05140F 100%)'
            : 'linear-gradient(180deg, #111A18 0%, #0D1412 100%)',
          transition: 'background 3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {/* LAYER 2: Large Heavily Blurred Background Foliage / Distant Tree Silhouettes */}
      <div
        className="env-layer layer-foliage-bg"
        style={{
          position: 'absolute',
          inset: '-5%',
          filter: isRain ? 'blur(18px)' : 'blur(22px) grayscale(60%)',
          opacity: isRain ? 0.45 : 0.25,
          transition: 'all 3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <svg viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="none">
          {isRain ? (
            <path
              d="M0 600 L0 300 Q150 180 300 280 T600 240 T900 320 T1000 220 L1000 600 Z"
              fill="#0F3827"
            />
          ) : (
            <path
              d="M0 600 L0 250 Q200 120 400 220 T800 180 T1000 260 L1000 600 Z"
              fill="#182723"
            />
          )}
        </svg>
      </div>

      {/* LAYER 3: Subtle Canopy Shapes / Thick Fog Base */}
      <div
        className="env-layer layer-canopy-mid"
        style={{
          position: 'absolute',
          inset: 0,
          filter: isRain ? 'blur(8px)' : 'blur(12px)',
          opacity: isRain ? 0.35 : 0.4,
          transition: 'all 3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {isRain ? (
          <svg viewBox="0 0 1000 400" width="100%" height="70%" preserveAspectRatio="none">
            <path
              d="M-50 -20 Q120 140 280 40 Q450 160 650 30 Q820 130 1050 -10 L1050 -50 L-50 -50 Z"
              fill="#14422E"
            />
          </svg>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% 40%, rgba(168, 184, 177, 0.12) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* LAYER 4: Diffused Moving Light Rays / Fog Layers */}
      {isRain ? (
        <div
          className={`env-layer layer-sunlight ${animationEnabled && ambientMotion ? 'animate-light' : ''}`}
          style={{
            position: 'absolute',
            top: '-20%',
            left: '20%',
            width: '60%',
            height: '140%',
            background: 'radial-gradient(ellipse at 50% 20%, rgba(141, 217, 160, 0.12) 0%, transparent 65%)',
            transform: 'rotate(-15deg)',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div className="env-layer layer-mist-container" style={{ position: 'absolute', inset: 0 }}>
          {/* Fog Layer A (Left to Right 35s) */}
          <div
            className={`fog-slice fog-a ${animationEnabled && ambientMotion ? 'animate-fog-a' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(168, 184, 177, 0.14) 0%, transparent 60%)',
            }}
          />
          {/* Fog Layer B (Right to Left 50s) */}
          <div
            className={`fog-slice fog-b ${animationEnabled && ambientMotion ? 'animate-fog-b' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 70% 60%, rgba(195, 209, 202, 0.10) 0%, transparent 55%)',
            }}
          />
          {/* Fog Layer C (Vertical Slow Motion 75s) */}
          <div
            className={`fog-slice fog-c ${animationEnabled && ambientMotion ? 'animate-fog-c' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 30%, rgba(168, 184, 177, 0.08) 0%, transparent 65%)',
            }}
          />
        </div>
      )}

      {/* LAYER 5: Rain Droplets (Rain Forest) OR Atmospheric Moisture Particles (Foggy Mist) */}
      {isRain ? (
        <div className="env-layer layer-rain" style={{ position: 'absolute', inset: 0 }}>
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className={`rain-drop ${animationEnabled ? 'animate-rain' : ''}`}
              style={{
                position: 'absolute',
                left: drop.left,
                top: '-30px',
                width: '1.5px',
                height: drop.height,
                background: 'linear-gradient(180deg, transparent 0%, rgba(141, 217, 160, 0.35) 100%)',
                opacity: drop.opacity,
                animationDuration: drop.duration,
                animationDelay: drop.delay,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="env-layer layer-particles" style={{ position: 'absolute', inset: 0 }}>
          {mistParticles.map((pt) => (
            <div
              key={pt.id}
              className={`mist-particle ${animationEnabled && ambientMotion ? 'animate-particle' : ''}`}
              style={{
                position: 'absolute',
                left: pt.left,
                top: pt.top,
                width: pt.size,
                height: pt.size,
                borderRadius: '50%',
                background: '#C3D1CA',
                opacity: 0.06,
                animationDuration: pt.duration,
                animationDelay: pt.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* LAYER 6: Slightly Blurred Foreground Leaf / Branch Silhouettes */}
      <div
        className={`env-layer layer-foreground ${isRain && animationEnabled && ambientMotion ? 'animate-leaf-oscillate' : ''}`}
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: isRain ? 'blur(2.5px)' : 'blur(3.5px) grayscale(50%)',
          opacity: isRain ? 0.3 : 0.2,
          transition: 'all 3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <svg viewBox="0 0 1000 600" width="100%" height="100%" preserveAspectRatio="none">
          {isRain ? (
            <path
              d="M0 0 C150 80 220 180 120 280 Q-20 200 0 0 Z M1000 600 C850 520 780 420 880 320 Q1020 400 1000 600 Z"
              fill="#09281C"
            />
          ) : (
            <path
              d="M0 0 L180 0 C140 120 90 200 0 240 Z M1000 400 Q880 480 820 600 L1000 600 Z"
              fill="#15231F"
            />
          )}
        </svg>
      </div>

      <style>{`
        /* Rain Animation */
        @keyframes fallRain {
          0% { transform: translateY(-30px); }
          100% { transform: translateY(105vh); }
        }

        .animate-rain {
          animation: fallRain linear infinite;
        }

        /* Light Ray Motion */
        @keyframes moveLight {
          0%, 100% { opacity: 0.04; transform: rotate(-15deg) translateY(0); }
          50% { opacity: 0.10; transform: rotate(-12deg) translateY(-15px); }
        }

        .animate-light {
          animation: moveLight 12s ease-in-out infinite;
        }

        /* Spring-like Leaf Oscillation */
        @keyframes leafOscillate {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(8px); }
          50% { transform: translateX(-4px); }
          75% { transform: translateX(6px); }
        }

        .animate-leaf-oscillate {
          animation: leafOscillate 16s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
        }

        /* Organic Fog Animations */
        @keyframes fogMoveA {
          0% { transform: translateX(-5%); }
          50% { transform: translateX(5%); }
          100% { transform: translateX(-5%); }
        }
        @keyframes fogMoveB {
          0% { transform: translateX(5%); }
          50% { transform: translateX(-5%); }
          100% { transform: translateX(5%); }
        }
        @keyframes fogMoveC {
          0%, 100% { transform: translateY(0%); }
          50% { transform: translateY(-3%); }
        }

        .animate-fog-a { animation: fogMoveA 38s ease-in-out infinite; }
        .animate-fog-b { animation: fogMoveB 52s ease-in-out infinite; }
        .animate-fog-c { animation: fogMoveC 78s ease-in-out infinite; }

        /* Particle Fading */
        @keyframes particlePulse {
          0%, 100% { opacity: 0.03; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.4); }
        }

        .animate-particle {
          animation: particlePulse 10s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-rain, .animate-light, .animate-leaf-oscillate,
          .animate-fog-a, .animate-fog-b, .animate-fog-c, .animate-particle {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
