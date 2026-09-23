import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { ActiveTab } from '../App';
import { StreakFlameIndicator } from './StreakFlameIndicator';
import { StreakFreezeModal } from './StreakFreezeModal';
import { calculateCurrentStreak } from '../engine/streakEngine';
import { Sparkles, Calendar, PanelRightClose } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onToggleDrawer }) => {
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const allHabitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const todayHabitLogs = allHabitLogs.filter((l) => l.date === todayIso);
  const settings = useLiveQuery(() => db.settings.get('default'));

  const completedTodayCount = todayHabitLogs.filter((l) => l.status === 'completed').length;
  const totalHabitCount = habits.length || 1;
  const completionPct = habits.length > 0 ? Math.round((completedTodayCount / totalHabitCount) * 100) : 100;

  const savedEarned = settings?.streakFreezeEarned || 0;
  const { currentStreak, freezeEarned, isFreezeShieldActive } = calculateCurrentStreak(allHabitLogs, allTasks, savedEarned);

  // Auto-sync earned freeze count to settings database when reaching 5 consecutive day milestones
  const totalAvailableFreezes = Math.max(savedEarned, freezeEarned);
  if (freezeEarned > savedEarned && settings) {
    db.settings.update('default', { streakFreezeEarned: freezeEarned }).catch(() => {});
  }

  const hasFreeze = totalAvailableFreezes > 0 || isFreezeShieldActive;
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  const currentHour = new Date().getHours();
  let greeting = 'Good Morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good Afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good Evening';
  }

  const userName = settings?.userName || 'Alpha4';

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--card-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        transition: 'background 3.0s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          {greeting}, {userName}
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Consistency today, a brighter tomorrow.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'rgba(13, 34, 26, 0.6)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <Calendar size={14} />
          <span>{todayStr}</span>
        </div>

        {/* Dynamic Top Corner Flame Streak Indicator */}
        <StreakFlameIndicator
          completionPct={completionPct}
          currentStreak={currentStreak}
          hasStreakFreeze={hasFreeze}
          onOpenFreezeModal={() => setIsFreezeModalOpen(true)}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-xs" onClick={() => setActiveTab('insights')}>
            <Sparkles size={12} /> AI Analyst
          </button>
          
          {onToggleDrawer && (
            <button
              className="btn btn-secondary btn-icon"
              onClick={onToggleDrawer}
              title="Toggle Contextual Sidebar Drawer"
              style={{ borderRadius: 'var(--radius-sm)' }}
            >
              <PanelRightClose size={17} />
            </button>
          )}
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


