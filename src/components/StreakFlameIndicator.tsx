import React, { useState, useEffect } from 'react';
import { Flame, Shield } from 'lucide-react';

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
  const [isBursting, setIsBursting] = useState(false);

  useEffect(() => {
    if (completionPct === 0) {
      setIsBursting(true);
      const timer = setTimeout(() => setIsBursting(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [completionPct]);

  let flameColor = '#64748b'; // Dim white/grey for 0-10%
  let glowClass = 'flame-dim';

  if (completionPct >= 100) {
    flameColor = '#ef4444'; // Red glow for 100%
    glowClass = 'flame-red';
  } else if (completionPct >= 50) {
    flameColor = '#f97316'; // Orange glow for 50%
    glowClass = 'flame-orange';
  } else if (completionPct >= 25) {
    flameColor = '#eab308'; // Yellow glow for 25%
    glowClass = 'flame-yellow';
  } else if (completionPct >= 10) {
    flameColor = '#f8fafc'; // White glow for 10%
    glowClass = 'flame-white';
  }

  return (
    <div className="flame-streak-container">
      <div
        className={`flame-badge ${glowClass} ${isBursting ? 'flame-burst' : ''}`}
        title={`Streak: ${currentStreak} Days (${completionPct}% Today)`}
      >
        <Flame size={18} color={flameColor} className="flame-icon" />
        <span className="streak-count" style={{ color: flameColor }}>{currentStreak}d</span>
      </div>

      {hasStreakFreeze && (
        <button
          type="button"
          className="freeze-pill-btn"
          onClick={onOpenFreezeModal}
          title="Streak Freeze Protection Active"
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
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-full);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .flame-red {
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
          border-color: rgba(239, 68, 68, 0.4);
        }

        .flame-orange {
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
          border-color: rgba(249, 115, 22, 0.4);
        }

        .flame-yellow {
          box-shadow: 0 0 8px rgba(234, 179, 8, 0.4);
          border-color: rgba(234, 179, 8, 0.4);
        }

        .flame-white {
          box-shadow: 0 0 6px rgba(248, 250, 252, 0.3);
        }

        .flame-dim {
          box-shadow: none;
          opacity: 0.7;
        }

        .flame-icon {
          animation: flamePulse 2s infinite ease-in-out;
        }

        @keyframes flamePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .flame-burst {
          animation: burstTick 0.5s infinite alternate ease-in-out;
        }

        @keyframes burstTick {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.12); filter: brightness(1.4); }
        }

        .freeze-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #38bdf8;
          font-size: 0.725rem;
          font-weight: 600;
          cursor: pointer;
        }

        .freeze-icon {
          color: #38bdf8;
        }
      `}</style>
    </div>
  );
};
