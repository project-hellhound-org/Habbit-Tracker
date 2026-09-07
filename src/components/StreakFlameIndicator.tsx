import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface StreakFlameIndicatorProps {
  completionPct: number; // 0 to 100
  currentStreak: number;
  hasStreakFreeze: boolean;
  onOpenFreezeModal?: () => void;
}

export const StreakFlameIndicator: React.FC<StreakFlameIndicatorProps> = ({
  completionPct,
  currentStreak,
  hasStreakFreeze,
  onOpenFreezeModal,
}) => {
  const normalizedIntensity = Math.min(100, Math.max(0, completionPct)) / 100;

  // Continuous Color Interpolation
  let primaryColor = '#6F6F69'; // 0-25%: Cool Gray Ember
  let secondaryColor = '#92928C';
  let glowColor = 'rgba(111, 111, 105, 0.2)';
  let flameHeight = 16 + normalizedIntensity * 12; // 16px to 28px
  let bloomRadius = 4 + normalizedIntensity * 16; // 4px to 20px

  if (completionPct >= 100) {
    primaryColor = '#EF4444'; // Deep Red High-Fidelity Flame
    secondaryColor = '#F97316';
    glowColor = 'rgba(239, 68, 68, 0.7)';
  } else if (completionPct >= 75) {
    primaryColor = '#F97316'; // Orange Flame
    secondaryColor = '#EAB308';
    glowColor = 'rgba(249, 115, 22, 0.55)';
  } else if (completionPct >= 50) {
    primaryColor = '#EAB308'; // Yellow Active Ember
    secondaryColor = '#F59E0B';
    glowColor = 'rgba(234, 179, 8, 0.45)';
  } else if (completionPct >= 25) {
    primaryColor = '#A6A6A0'; // Visible Gray Ember
    secondaryColor = '#EFEFED';
    glowColor = 'rgba(166, 166, 160, 0.3)';
  }

  const is100Percent = completionPct >= 100;

  return (
    <div className="flame-streak-container">
      <div
        className="flame-badge"
        style={{
          boxShadow: `0 0 ${bloomRadius}px ${glowColor}`,
          borderColor: primaryColor,
        }}
        title={`Streak: ${currentStreak} Days (${completionPct}% Completion)`}
      >
        {/* Layered Organic Flame SVG */}
        <div className="flame-graphic-wrapper" style={{ height: `${flameHeight}px`, width: '18px' }}>
          <svg viewBox="0 0 24 32" className={`flame-svg ${is100Percent ? 'flame-svg-intense' : ''}`} style={{ width: '100%', height: '100%' }}>
            {/* Outer Flame Layer */}
            <path
              d="M12 2C12 2 4 10 4 18C4 23.5 7.5 28 12 28C16.5 28 20 23.5 20 18C20 10 12 2 12 2Z"
              fill={primaryColor}
              className="flame-layer-outer"
            />
            {/* Inner High Energy Center */}
            <path
              d="M12 8C12 8 7 14 7 20C7 23.5 9.2 26 12 26C14.8 26 17 23.5 17 20C17 14 12 8 12 8Z"
              fill={secondaryColor}
              className="flame-layer-inner"
            />
            {/* Core Bright Spark */}
            <circle cx="12" cy="21" r="2.5" fill="#FFFFFF" opacity={0.9} />
          </svg>

          {/* Micro Particles for 100% state */}
          {is100Percent && (
            <div className="ember-particles">
              <span className="particle p1" style={{ background: primaryColor }} />
              <span className="particle p2" style={{ background: secondaryColor }} />
              <span className="particle p3" style={{ background: '#FFFFFF' }} />
            </div>
          )}
        </div>

        <span className="streak-count" style={{ color: primaryColor }}>
          {currentStreak}d
        </span>
      </div>

      {hasStreakFreeze && (
        <button
          type="button"
          className="freeze-pill-btn"
          onClick={onOpenFreezeModal}
          title="Streak Freeze Active"
        >
          <Shield size={12} className="freeze-icon" /> Freeze Active
        </button>
      )}

      <style>{`
        .flame-streak-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .flame-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--motion-medium) var(--ease-standard);
        }

        .flame-graphic-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .flame-svg {
          transform-origin: bottom center;
          animation: organicFlicker 2.4s infinite ease-in-out;
        }

        .flame-svg-intense {
          animation: intenseFlamePulse 1.2s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);
        }

        @keyframes organicFlicker {
          0%, 100% { transform: scale(1) rotate(0deg); }
          33% { transform: scale(1.05, 0.96) rotate(-2deg); }
          66% { transform: scale(0.97, 1.04) rotate(2deg); }
        }

        @keyframes intenseFlamePulse {
          0% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.8)); }
          100% { transform: scale(1.12, 1.05) translateY(-1px); filter: drop-shadow(0 0 10px rgba(239, 68, 68, 1)); }
        }

        .ember-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          animation: riseAndFade 1.6s infinite ease-out;
        }

        .p1 { left: 4px; bottom: 4px; animation-delay: 0s; }
        .p2 { right: 4px; bottom: 6px; animation-delay: 0.5s; }
        .p3 { left: 8px; bottom: 8px; animation-delay: 1s; }

        @keyframes riseAndFade {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-14px) scale(0.2); opacity: 0; }
        }

        .freeze-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-full);
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid rgba(6, 182, 212, 0.4);
          color: var(--cyan);
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
        }

        .freeze-icon {
          color: var(--cyan);
        }
      `}</style>
    </div>
  );
};
