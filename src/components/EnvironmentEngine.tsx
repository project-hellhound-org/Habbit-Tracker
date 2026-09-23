import React, { useEffect, useRef, useState } from 'react';
import { ForestTheme, AppSettings } from '../db/schema';

interface EnvironmentEngineProps {
  theme: ForestTheme;
  settings?: AppSettings;
}

export const EnvironmentEngine: React.FC<EnvironmentEngineProps> = ({ theme, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active theme and transition crossfade state
  const [currentTheme, setCurrentTheme] = useState<ForestTheme>(theme);
  const [previousTheme, setPreviousTheme] = useState<ForestTheme | null>(null);
  const [transitionProgress, setTransitionProgress] = useState<number>(1); // 1 = full currentTheme, 0 = previousTheme

  useEffect(() => {
    if (theme !== currentTheme) {
      setPreviousTheme(currentTheme);
      setCurrentTheme(theme);
      setTransitionProgress(0);

      const startTime = performance.now();
      const transitionDuration = 3000; // 3.0s cubic-bezier(0.22, 1, 0.36, 1) transition

      let animationFrameId: number;

      const animateTransition = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / transitionDuration);
        
        // Apply cubic-bezier(0.22, 1, 0.36, 1) easing
        const t = progress;
        const easeProgress = t < 1 ? 1 - Math.pow(1 - t, 3) : 1; // Smooth cubic ease out approximation
        
        setTransitionProgress(easeProgress);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animateTransition);
        } else {
          setPreviousTheme(null);
        }
      };

      animationFrameId = requestAnimationFrame(animateTransition);

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
    return undefined;
  }, [theme, currentTheme]);

  // Extract settings values with robust fallbacks
  const animationEnabled = settings?.animationEnabled !== false;
  const ambientMotion = settings?.ambientMotionEnabled !== false;

  const rawIntensity = settings?.environmentIntensity ?? 85;
  const environmentOpacity = rawIntensity / 100;

  const rawSpeed = settings?.motionSpeed ?? 50;
  const motionSpeedScale = Math.max(0.05, rawSpeed / 50); // 0% = paused/near static, 50% = 1.0x, 100% = 2.0x

  const rawDensity = settings?.mistRainDensity ?? 60;
  const densityScale = Math.max(0.1, rawDensity / 60);

  // Canvas Animation Engine for Particles (Rain Droplets & Foggy Moisture)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Rain Particles Data Structure (Rain Forest)
    const numRainDrops = Math.round(75 * densityScale);
    const rainDrops = Array.from({ length: numRainDrops }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 22,
      speed: (6 + Math.random() * 8) * (animationEnabled ? motionSpeedScale : 0),
      opacity: 0.03 + Math.random() * 0.09, // Strict 0.03-0.12 opacity
      angle: -0.15 + Math.random() * 0.05,
    }));

    // Moisture Particles Data Structure (Foggy Mist Forest)
    const numMoistureParticles = Math.round(50 * densityScale);
    const moistureParticles = Array.from({ length: numMoistureParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1 + Math.random() * 2.5,
      alpha: 0.03 + Math.random() * 0.09,
      pulseSpeed: (0.005 + Math.random() * 0.015) * (animationEnabled ? motionSpeedScale : 0),
      driftX: (-0.2 + Math.random() * 0.4) * (animationEnabled && ambientMotion ? motionSpeedScale : 0),
      driftY: (-0.1 + Math.random() * 0.2) * (animationEnabled && ambientMotion ? motionSpeedScale : 0),
    }));

    // Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Rain Particles if active theme or previous theme is rain_forest
      const isRainActive = currentTheme === 'rain_forest' || previousTheme === 'rain_forest';
      if (isRainActive && animationEnabled) {
        const rainWeight = currentTheme === 'rain_forest' ? transitionProgress : 1 - transitionProgress;
        ctx.strokeStyle = `rgba(141, 217, 160, ${0.4 * rainWeight * environmentOpacity})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < rainDrops.length; i++) {
          const d = rainDrops[i];
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + Math.sin(d.angle) * d.length, d.y + Math.cos(d.angle) * d.length);
          ctx.stroke();

          d.y += d.speed;
          d.x += Math.sin(d.angle) * d.speed;

          if (d.y > height + 30) {
            d.y = -30;
            d.x = Math.random() * width;
          }
        }
      }

      // Render Moisture Particles if active theme or previous theme is foggy_mist
      const isMistActive = currentTheme === 'foggy_mist' || previousTheme === 'foggy_mist';
      if (isMistActive) {
        const mistWeight = currentTheme === 'foggy_mist' ? transitionProgress : 1 - transitionProgress;
        ctx.fillStyle = '#C3D1CA';

        for (let i = 0; i < moistureParticles.length; i++) {
          const pt = moistureParticles[i];
          ctx.globalAlpha = pt.alpha * mistWeight * environmentOpacity;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fill();

          if (animationEnabled && ambientMotion) {
            pt.x += pt.driftX;
            pt.y += pt.driftY;
            pt.alpha += Math.sin(Date.now() * pt.pulseSpeed) * 0.001;
            pt.alpha = Math.max(0.02, Math.min(0.12, pt.alpha));

            if (pt.x < 0) pt.x = width;
            if (pt.x > width) pt.x = 0;
            if (pt.y < 0) pt.y = height;
            if (pt.y > height) pt.y = 0;
          }
        }
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentTheme, previousTheme, transitionProgress, animationEnabled, ambientMotion, motionSpeedScale, densityScale, environmentOpacity]);

  // Helper renderers for Layered SVG / CSS Environmental Depth
  const renderRainForestLayers = (opacityWeight: number) => (
    <div
      className="rain-forest-layered-scene"
      style={{
        position: 'absolute',
        inset: 0,
        opacity: opacityWeight * environmentOpacity,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease-out',
      }}
    >
      {/* LAYER 1: Deep Forest Base (#071A13) */}
      <div
        className="env-layer layer-1-base"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 30%, #09231A 0%, #071A13 65%, #04100C 100%)',
        }}
      />

      {/* LAYER 2: Large Distant Foliage Silhouettes (Blur 35px, Opacity 0.25) */}
      <div
        className={`env-layer layer-2-distant-foliage ${animationEnabled && ambientMotion ? 'animate-foliage-slow-drift' : ''}`}
        style={{
          position: 'absolute',
          inset: '-8%',
          filter: 'blur(35px)',
          opacity: 0.28,
          animationDuration: `${(45 / motionSpeedScale).toFixed(1)}s`,
        }}
      >
        <svg viewBox="0 0 1400 800" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0 800 L0 340 Q250 180 500 310 T1000 240 T1400 360 L1400 800 Z" fill="#0F3827" />
          <path d="M-50 800 L-50 420 Q300 270 650 380 T1250 320 L1450 800 Z" fill="#0B2C1F" opacity="0.75" />
        </svg>
      </div>

      {/* LAYER 3: Midground Tropical Foliage (Recognizable leaf shapes, blur 10px) */}
      <div
        className="env-layer layer-3-midground-foliage"
        style={{
          position: 'absolute',
          inset: '-4%',
          filter: 'blur(10px)',
          opacity: 0.42,
        }}
      >
        <svg viewBox="0 0 1400 800" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0 800 Q180 520 380 620 T880 540 T1400 700 L1400 800 Z" fill="#102F22" />
          <path d="M-20 800 Q220 580 480 660 T980 590 L1420 800 Z" fill="#163A29" opacity="0.65" />
        </svg>
      </div>

      {/* LAYER 4: Upper Canopy (Top-Left, Top-Right Silhouettes framing UI) */}
      <div
        className="env-layer layer-4-canopy"
        style={{
          position: 'absolute',
          top: '-8%',
          left: '-5%',
          right: '-5%',
          height: '65%',
          filter: 'blur(12px)',
          opacity: 0.45,
        }}
      >
        <svg viewBox="0 0 1400 600" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M-50 -20 Q180 180 420 50 T900 150 T1350 20 L1450 -50 L-50 -50 Z" fill="#12402C" />
          <path d="M-20 -30 Q280 130 580 40 T1100 110 L1420 -30 L-20 -30 Z" fill="#164A34" opacity="0.7" />
        </svg>
      </div>

      {/* LAYER 5: Diffused Sunlight Rays (opacity: 0.04 -> 0.10, 8-15s duration) */}
      <div
        className={`env-layer layer-5-sunlight ${animationEnabled && ambientMotion ? 'animate-sunlight-sweep' : ''}`}
        style={{
          position: 'absolute',
          top: '-30%',
          left: '10%',
          width: '75%',
          height: '160%',
          background: 'radial-gradient(ellipse at 50% 20%, rgba(141, 217, 160, 0.10) 0%, rgba(87, 185, 120, 0.03) 50%, transparent 75%)',
          transform: 'rotate(-14deg)',
          pointerEvents: 'none',
          animationDuration: `${(13 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      {/* LAYER 7: Foreground Foliage (Blurred leaves around screen edges, blur 5px) */}
      <div
        className={`env-layer layer-7-foreground-leaves ${animationEnabled && ambientMotion ? 'animate-leaf-spring-oscillation' : ''}`}
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(5px)',
          opacity: 0.38,
          animationDuration: `${(18 / motionSpeedScale).toFixed(1)}s`,
        }}
      >
        <svg viewBox="0 0 1400 800" width="100%" height="100%" preserveAspectRatio="none">
          {/* Bottom-Left & Top-Right Leaf Silhouettes */}
          <path d="M0 0 C220 110 320 260 170 380 Q-40 260 0 0 Z M1400 800 C1180 680 1060 540 1220 400 Q1420 520 1400 800 Z" fill="#09261B" />
        </svg>
      </div>
    </div>
  );

  const renderFoggyMistLayers = (opacityWeight: number) => (
    <div
      className="foggy-mist-layered-scene"
      style={{
        position: 'absolute',
        inset: 0,
        opacity: opacityWeight * environmentOpacity,
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease-out',
      }}
    >
      {/* LAYER 1: Dark Gray-Green Base (#111A18) */}
      <div
        className="env-layer layer-1-mist-base"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, #15221F 0%, #111A18 70%, #0B1210 100%)',
        }}
      />

      {/* LAYER 2: Distant Tree Silhouettes (Blur 22px, Opacity 0.22, Low Saturation) */}
      <div
        className="env-layer layer-2-distant-trees"
        style={{
          position: 'absolute',
          inset: '-5%',
          filter: 'blur(22px) grayscale(65%)',
          opacity: 0.24,
        }}
      >
        <svg viewBox="0 0 1400 750" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0 750 L0 300 Q260 160 520 280 T1040 220 T1400 320 L1400 750 Z" fill="#182723" />
        </svg>
      </div>

      {/* LAYER 3: Deep Background Fog Layer */}
      <div
        className="env-layer layer-3-deep-fog"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 35%, rgba(168, 184, 177, 0.16) 0%, rgba(83, 111, 97, 0.05) 60%, transparent 85%)',
          filter: 'blur(25px)',
          opacity: 0.40,
        }}
      />

      {/* LAYER 4: Mid-Distance Trees (Blur 8px, Opacity 0.45) */}
      <div
        className="env-layer layer-4-mid-trees"
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(8px) grayscale(45%)',
          opacity: 0.45,
        }}
      >
        <svg viewBox="0 0 1400 750" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M-40 750 L-40 380 Q320 260 680 370 T1380 310 L1440 750 Z" fill="#202F2A" />
        </svg>
      </div>

      {/* LAYER 5: 3 Independent Unsynchronized Moving Fog Slices */}
      <div className="env-layer layer-5-fog-slices" style={{ position: 'absolute', inset: 0 }}>
        {/* Fog A: Left to Right (38s) */}
        <div
          className={`fog-slice slice-fog-a ${animationEnabled && ambientMotion ? 'animate-fog-slice-a' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 25% 45%, rgba(168, 184, 177, 0.16) 0%, transparent 60%)',
            filter: 'blur(28px)',
            animationDuration: `${(38 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
        {/* Fog B: Right to Left (52s) */}
        <div
          className={`fog-slice slice-fog-b ${animationEnabled && ambientMotion ? 'animate-fog-slice-b' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 75% 55%, rgba(195, 209, 202, 0.12) 0%, transparent 58%)',
            filter: 'blur(30px)',
            animationDuration: `${(52 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
        {/* Fog C: Vertical Movement (78s) */}
        <div
          className={`fog-slice slice-fog-c ${animationEnabled && ambientMotion ? 'animate-fog-slice-c' : ''}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 30%, rgba(168, 184, 177, 0.10) 0%, transparent 65%)',
            filter: 'blur(24px)',
            animationDuration: `${(78 / motionSpeedScale).toFixed(1)}s`,
          }}
        />
      </div>

      {/* LAYER 6: Foreground Branches (Blur 4px, Opacity 0.52) */}
      <div
        className="env-layer layer-6-foreground-branches"
        style={{
          position: 'absolute',
          inset: '-2%',
          filter: 'blur(4px)',
          opacity: 0.52,
        }}
      >
        <svg viewBox="0 0 1400 750" width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0 0 L260 0 C200 160 130 260 0 320 Z M1400 520 Q1220 600 1140 750 L1400 750 Z" fill="#15231F" />
        </svg>
      </div>
    </div>
  );

  return (
    <div
      className="environment-engine-container"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Current Theme Render Layer */}
      {currentTheme === 'rain_forest'
        ? renderRainForestLayers(transitionProgress)
        : renderFoggyMistLayers(transitionProgress)}

      {/* Previous Theme Render Layer during 3.0s Crossfade */}
      {previousTheme &&
        (previousTheme === 'rain_forest'
          ? renderRainForestLayers(1 - transitionProgress)
          : renderFoggyMistLayers(1 - transitionProgress))}

      {/* HTML5 Canvas Engine for Rain Droplets & Moisture Particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Animation Keyframe Definitions */}
      <style>{`
        @keyframes foliageSlowDrift {
          0%, 100% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.025) translate(-10px, 8px); }
        }

        .animate-foliage-slow-drift {
          animation: foliageSlowDrift 36s ease-in-out infinite;
        }

        @keyframes sunlightSweep {
          0%, 100% { opacity: 0.04; transform: rotate(-14deg) translateY(0); }
          50% { opacity: 0.10; transform: rotate(-11deg) translateY(-20px); }
        }

        .animate-sunlight-sweep {
          animation: sunlightSweep 14s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        @keyframes leafSpringOscillation {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(12px); }
          50% { transform: translateX(-8px); }
          75% { transform: translateX(9px); }
        }

        .animate-leaf-spring-oscillation {
          animation: leafSpringOscillation 20s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite;
        }

        @keyframes fogSliceA {
          0% { transform: translateX(-7%); }
          50% { transform: translateX(7%); }
          100% { transform: translateX(-7%); }
        }

        @keyframes fogSliceB {
          0% { transform: translateX(7%); }
          50% { transform: translateX(-7%); }
          100% { transform: translateX(7%); }
        }

        @keyframes fogSliceC {
          0%, 100% { transform: translateY(0%); }
          50% { transform: translateY(-5%); }
        }

        .animate-fog-slice-a { animation: fogSliceA 38s ease-in-out infinite; }
        .animate-fog-slice-b { animation: fogSliceB 52s ease-in-out infinite; }
        .animate-fog-slice-c { animation: fogSliceC 78s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .animate-foliage-slow-drift,
          .animate-sunlight-sweep,
          .animate-leaf-spring-oscillation,
          .animate-fog-slice-a,
          .animate-fog-slice-b,
          .animate-fog-slice-c {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
