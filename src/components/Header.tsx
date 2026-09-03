import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ActiveTab } from '../App';
import { StreakFlameIndicator } from './StreakFlameIndicator';
import { StreakFreezeModal } from './StreakFreezeModal';
import { Sparkles, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.where('date').equals(todayIso).toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get('default'));

  const completedTodayCount = habitLogs.filter((l) => l.status === 'completed').length;
  const totalHabitCount = habits.length || 1;
  const completionPct = habits.length > 0 ? Math.round((completedTodayCount / totalHabitCount) * 100) : 100;

  const currentStreak = completedTodayCount > 0 ? 5 : 0;
  const hasFreeze = (settings?.streakFreezeEarned || 0) > 0;

  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  return (
    <header style={{ height: 'var(--header-height)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Calendar size={14} />
          <span>{todayStr}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Dynamic Top Corner Flame Streak Indicator */}
        <StreakFlameIndicator
          completionPct={completionPct}
          currentStreak={currentStreak}
          hasStreakFreeze={hasFreeze}
          onOpenFreezeModal={() => setIsFreezeModalOpen(true)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('focus')}>
            <Clock size={12} /> Start Focus
          </button>
          <button className="btn btn-primary btn-xs" onClick={() => setActiveTab('insights')}>
            <Sparkles size={12} /> AI Analyst
          </button>
        </div>
      </div>

      <StreakFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        earnedCount={settings?.streakFreezeEarned || 1}
        activeUntil={settings?.streakFreezeActiveUntil}
      />
    </header>
  );
};
