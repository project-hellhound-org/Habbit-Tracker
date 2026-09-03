import React from 'react';
import { Shield, X, AlertTriangle, Snowflake } from 'lucide-react';

interface StreakFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedCount: number;
  activeUntil?: string | null;
}

export const StreakFreezeModal: React.FC<StreakFreezeModalProps> = ({
  isOpen,
  onClose,
  earnedCount,
  activeUntil,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Snowflake size={18} color="#38bdf8" /> Streak Freeze Shield
          </h3>
          <button className="btn btn-secondary btn-icon btn-xs" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="ice-shield-animation-box" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
          <div className="melting-ice-icon">
            <Shield size={48} color="#38bdf8" />
          </div>
          <h4 style={{ color: '#38bdf8', marginTop: '0.75rem' }}>24-Hour Streak Protection</h4>
          <p className="subtitle" style={{ marginTop: '0.25rem' }}>
            You earn 1 Streak Freeze after 5 consecutive days of 100% activity completion. If a day is missed, your streak will be protected for 24 hours.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
          <span>Freeze Items Available:</span>
          <strong>{earnedCount} Available</strong>
        </div>

        {activeUntil && (
          <div style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
            <AlertTriangle size={14} /> Active Protection Until: {new Date(activeUntil).toLocaleString()}
          </div>
        )}

        <button className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>

      <style>{`
        .melting-ice-icon {
          animation: icePulse 3s infinite ease-in-out;
        }

        @keyframes icePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.6)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 16px rgba(56, 189, 248, 0.9)); }
        }
      `}</style>
    </div>
  );
};
