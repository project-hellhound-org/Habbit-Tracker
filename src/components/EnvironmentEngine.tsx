import React, { useEffect, useRef } from 'react';
import { ForestTheme, AppSettings } from '../db/schema';
import rainForestBg from '../assets/backgrounds/rain-forest.jpg';
import foggyMistBg from '../assets/backgrounds/foggy-mist.jpg';

// Lightweight 2D value-noise (hash + bilinear + smoothstep). No external deps.
// Drives the foggy-mist scene's fog-bank drift so mist moves with an organic,
// low-frequency undulation instead of a fixed sinusoidal loop.
const hash2D = (x: number, y: number): number => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const valueNoise2D = (x: number, y: number): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
};

interface EnvironmentEngineProps {
  theme: ForestTheme;
  settings?: AppSettings;
}

// NOTE on architecture (read this before touching the crossfade):
// The background is two real photographs (rain-forest.jpg / foggy-mist.jpg),
// always both mounted, stacked on top of each other. Switching themes is
// nothing more than flipping which one has opacity 1 — the crossfade itself
// is a plain CSS `transition: opacity`, handled entirely by the browser's
// compositor. There is deliberately NO React state machine (no
// currentTheme/previousTheme/transitionProgress, no requestAnimationFrame
// loop) driving the dissolve. An earlier version tracked the crossfade with
// JS state, which had two compounding bugs: (1) the effect that owned the
// animation listed its own output state as a dependency, so React tore the
// animation down after a single frame, leaving the outgoing theme stuck at
// full opacity; and (2) the particle canvas effect also depended on that
// same animated progress value, so it was destroyed and recreated on every
// single animation frame during a transition, resetting rain/fog particles
// mid-flight. Letting CSS own the dissolve removes both failure modes
// entirely — there's no per-frame state update for anything to race with.
export const EnvironmentEngine: React.FC<EnvironmentEngineProps> = ({ theme, settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const animationEnabled = settings?.animationEnabled !== false;
  const ambientMotion = settings?.ambientMotionEnabled !== false;

  const rawIntensity = settings?.environmentIntensity ?? 85;
  const environmentOpacity = rawIntensity / 100;

  const rawSpeed = settings?.motionSpeed ?? 50;
  const motionSpeedScale = Math.max(0.05, rawSpeed / 50); // 50% = 1.0x

  const rawDensity = settings?.mistRainDensity ?? 60;
  const densityScale = Math.max(0.1, rawDensity / 60); // 60% = 1.0x

  // Canvas particle layer: rain streaks + forest-floor ripples for rain_forest,
  // noise-driven fog banks + floating moisture for foggy_mist. Only the active
  // theme's particles are drawn — the photo crossfade underneath carries the
  // visual transition, so there's no need to blend two particle systems too.
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

    // --- Rain Forest: heavy, elongated, slow-falling streaks ---
    const numRainDrops = Math.round(55 * densityScale);
    const rainDrops = Array.from({ length: numRainDrops }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 34 + Math.random() * 46,
      speed: (2.4 + Math.random() * 3.2) * (animationEnabled ? motionSpeedScale : 0),
      opacity: 0.06 + Math.random() * 0.15,
      angle: -0.08 + Math.random() * 0.03,
      width: 1.3 + Math.random() * 1.3,
      glinting: Math.random() < 0.22,
      glintPhase: Math.random() * Math.PI * 2,
    }));

    // Forest-floor water pools with steady, rhythmic ripple rings.
    const waterPools = Array.from({ length: 4 }, (_, i) => ({
      x: width * (0.12 + i * 0.24 + Math.random() * 0.06),
      y: height * (0.82 + Math.random() * 0.1),
      rx: 46 + Math.random() * 34,
      ry: 13 + Math.random() * 7,
      nextRippleAt: performance.now() + Math.random() * 1200,
      rippleInterval: (1000 + Math.random() * 500) / Math.max(0.3, densityScale),
      ripples: [] as { r: number; alpha: number }[],
    }));

    // --- Foggy Mist: noise-driven drifting fog banks + floating moisture ---
    const numFogBanks = Math.round(7 * densityScale);
    const fogBanks = Array.from({ length: numFogBanks }, () => ({
      baseX: Math.random() * width,
      baseY: height * (0.28 + Math.random() * 0.62),
      radius: 170 + Math.random() * 230,
      seedX: Math.random() * 1000,
      seedY: Math.random() * 1000,
      seedD: Math.random() * 1000,
      driftRange: 70 + Math.random() * 90,
    }));

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

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (theme === 'rain_forest') {
        const baseAlpha = environmentOpacity;
        const now = performance.now();

        if (animationEnabled) {
          for (let i = 0; i < rainDrops.length; i++) {
            const d = rainDrops[i];
            const tailX = d.x + Math.sin(d.angle) * d.length;
            const tailY = d.y + Math.cos(d.angle) * d.length;

            const trail = ctx.createLinearGradient(d.x, d.y, tailX, tailY);
            trail.addColorStop(0, `rgba(200, 232, 210, ${d.opacity * baseAlpha})`);
            trail.addColorStop(0.65, `rgba(200, 232, 210, ${d.opacity * baseAlpha * 0.5})`);
            trail.addColorStop(1, 'rgba(200, 232, 210, 0)');
            ctx.strokeStyle = trail;
            ctx.lineWidth = d.width;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            if (d.glinting) {
              const glintAlpha = (0.5 + 0.5 * Math.sin(now * 0.004 + d.glintPhase)) * d.opacity * baseAlpha * 1.6;
              ctx.beginPath();
              ctx.fillStyle = `rgba(236, 250, 240, ${glintAlpha})`;
              ctx.arc(d.x, d.y, d.width * 0.85, 0, Math.PI * 2);
              ctx.fill();
            }

            d.y += d.speed;
            d.x += Math.sin(d.angle) * d.speed;

            if (d.y > height + d.length + 10) {
              d.y = -d.length - 10;
              d.x = Math.random() * width;
            }
          }
        }

        for (const pool of waterPools) {
          ctx.save();
          ctx.globalAlpha = 0.32 * baseAlpha;
          ctx.fillStyle = 'rgba(4, 14, 10, 0.65)';
          ctx.beginPath();
          ctx.ellipse(pool.x, pool.y, pool.rx, pool.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (animationEnabled && now >= pool.nextRippleAt) {
            pool.ripples.push({ r: 2, alpha: 0.5 });
            pool.nextRippleAt = now + pool.rippleInterval;
          }

          for (let ri = pool.ripples.length - 1; ri >= 0; ri--) {
            const rip = pool.ripples[ri];
            ctx.strokeStyle = `rgba(210, 235, 220, ${rip.alpha * baseAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(pool.x, pool.y, rip.r, rip.r * (pool.ry / pool.rx), 0, 0, Math.PI * 2);
            ctx.stroke();

            if (animationEnabled) {
              rip.r += 0.55 * motionSpeedScale;
              rip.alpha -= 0.012 * motionSpeedScale;
            }
            if (rip.alpha <= 0 || rip.r > pool.rx * 1.5) {
              pool.ripples.splice(ri, 1);
            }
          }
        }
      }

      if (theme === 'foggy_mist') {
        if (animationEnabled) {
          const t = performance.now() * 0.00006 * motionSpeedScale;
          for (const fb of fogBanks) {
            const nx = valueNoise2D(t + fb.seedX, fb.seedX * 0.6) - 0.5;
            const ny = valueNoise2D(fb.seedY * 0.6, t + fb.seedY) - 0.5;
            const density = valueNoise2D(t * 1.4 + fb.seedD, fb.seedD * 0.4);

            const x = fb.baseX + nx * fb.driftRange * 2;
            const y = fb.baseY + ny * fb.driftRange;
            const alpha = (0.05 + density * 0.18) * environmentOpacity;

            const grad = ctx.createRadialGradient(x, y, 0, x, y, fb.radius);
            grad.addColorStop(0, `rgba(210, 222, 216, ${alpha})`);
            grad.addColorStop(1, 'rgba(210, 222, 216, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, fb.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.fillStyle = '#DCE6E1';
        for (let i = 0; i < moistureParticles.length; i++) {
          const pt = moistureParticles[i];
          ctx.globalAlpha = pt.alpha * environmentOpacity;
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
  }, [theme, animationEnabled, ambientMotion, motionSpeedScale, densityScale, environmentOpacity]);

  const crossfadeMs = 3000;

  return (
    <div
      className="environment-engine-container"
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {/* Rain Forest photograph */}
      <div
        className={`env-photo-layer ${animationEnabled && ambientMotion ? 'animate-photo-drift-a' : ''}`}
        style={{
          position: 'absolute',
          inset: '-4%',
          backgroundImage: `url(${rainForestBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: theme === 'rain_forest' ? environmentOpacity : 0,
          transition: `opacity ${crossfadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          animationDuration: `${(48 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      {/* Foggy Mist photograph */}
      <div
        className={`env-photo-layer ${animationEnabled && ambientMotion ? 'animate-photo-drift-b' : ''}`}
        style={{
          position: 'absolute',
          inset: '-4%',
          backgroundImage: `url(${foggyMistBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: theme === 'foggy_mist' ? environmentOpacity : 0,
          transition: `opacity ${crossfadeMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          animationDuration: `${(60 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      {/* Vignette so UI text/cards keep contrast against either photo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(0,0,0,0) 30%, rgba(3, 10, 7, 0.55) 100%), linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Diffused sunlight rays — rain_forest only, "moving light rays" from spec */}
      <div
        className={`env-layer ${animationEnabled && ambientMotion ? 'animate-sunlight-sweep' : ''}`}
        style={{
          position: 'absolute',
          top: '-30%',
          left: '10%',
          width: '75%',
          height: '160%',
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(210, 235, 200, 0.22) 0%, rgba(140, 200, 150, 0.06) 50%, transparent 75%)',
          transform: 'rotate(-14deg)',
          opacity: theme === 'rain_forest' ? 1 : 0,
          transition: `opacity ${crossfadeMs}ms ease`,
          animationDuration: `${(13 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      {/* Ground mist clinging to the tree bases — rain_forest only */}
      <div
        className={animationEnabled && ambientMotion ? 'animate-ground-mist-pulse' : ''}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '38%',
          background:
            'linear-gradient(to top, rgba(190, 220, 200, 0.28) 0%, rgba(170, 208, 185, 0.1) 45%, transparent 100%)',
          filter: 'blur(18px)',
          opacity: theme === 'rain_forest' ? 0.7 : 0,
          transition: `opacity ${crossfadeMs}ms ease`,
          animationDuration: `${(22 / motionSpeedScale).toFixed(1)}s`,
        }}
      />

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      <style>{`
        .env-photo-layer {
          background-repeat: no-repeat;
        }

        @keyframes photoDriftA {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.06) translate(-1%, -1.5%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        .animate-photo-drift-a {
          animation: photoDriftA 48s ease-in-out infinite;
        }

        @keyframes photoDriftB {
          0% { transform: scale(1.02) translate(0, 0); }
          50% { transform: scale(1.07) translate(1.2%, 0.5%); }
          100% { transform: scale(1.02) translate(0, 0); }
        }
        .animate-photo-drift-b {
          animation: photoDriftB 60s ease-in-out infinite;
        }

        @keyframes sunlightSweep {
          0%, 100% { opacity: 0.6; transform: rotate(-14deg) translateX(0); }
          50% { opacity: 1; transform: rotate(-14deg) translateX(3%); }
        }
        .animate-sunlight-sweep {
          animation: sunlightSweep 13s ease-in-out infinite;
        }

        @keyframes groundMistPulse {
          0%, 100% { opacity: 0.55; transform: translateY(0); }
          50% { opacity: 0.85; transform: translateY(-6px); }
        }
        .animate-ground-mist-pulse {
          animation: groundMistPulse 22s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-photo-drift-a,
          .animate-photo-drift-b,
          .animate-sunlight-sweep,
          .animate-ground-mist-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
