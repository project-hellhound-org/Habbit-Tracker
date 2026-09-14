import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Calendar, CheckSquare, Sparkles, BookOpen, Flame, Leaf } from 'lucide-react';
import { ActiveTab } from '../App';

interface BottomDrawerProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({ setActiveTab }) => {
  const [drawerState, setDrawerState] = useState<'collapsed' | 'peek' | 'expanded'>('peek');

  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const allLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const todayLogs = allLogs.filter((l) => l.date === todayIso && l.status === 'completed');
  const totalHabits = habits.length || 1;
  const progressPct = Math.min(Math.round((todayLogs.length / totalHabits) * 100), 100);

  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const completedTasksToday = tasks.filter((t) => t.status === 'completed' && t.completedAt?.startsWith(todayIso)).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerState === 'expanded') {
        setDrawerState('peek');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerState]);

  const cycleState = () => {
    if (drawerState === 'collapsed') setDrawerState('peek');
    else if (drawerState === 'peek') setDrawerState('expanded');
    else setDrawerState('peek');
  };

  return (
    <div className={`bottom-drawer ${drawerState}`}>
      {/* Drag Handle Bar */}
      <div
        onClick={cycleState}
        style={{
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderBottom: drawerState !== 'collapsed' ? '1px solid rgba(160, 190, 160, 0.15)' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ width: '42px', height: '4px', borderRadius: '2px', background: '#8FAF82', opacity: 0.8 }} />
      </div>

      {/* Peek State Content Bar */}
      <div
        onClick={cycleState}
        style={{
          padding: '0.65rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F3F1E7', fontSize: '0.85rem', fontWeight: 700 }}>
            <Leaf size={16} style={{ color: '#8FAF82' }} />
            <span>Today's Execution Snapshot</span>
          </div>
          <span style={{ fontSize: '0.775rem', color: '#C5D6B9' }}>
            {todayLogs.length} of {totalHabits} habits completed ({progressPct}%) • {completedTasksToday} tasks done
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="subtitle" style={{ fontSize: '0.75rem', color: '#8FAF82' }}>
            {drawerState === 'expanded' ? 'Collapse' : 'Swipe / Tap to Expand'}
          </span>
          {drawerState === 'expanded' ? <ChevronDown size={16} style={{ color: '#8FAF82' }} /> : <ChevronUp size={16} style={{ color: '#8FAF82' }} />}
        </div>
      </div>

      {/* Expanded State Full View */}
      {drawerState === 'expanded' && (
        <div style={{ padding: '1.25rem 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <button
              className="glass-card"
              onClick={() => {
                setActiveTab('habits');
                setDrawerState('peek');
              }}
              style={{ textAlign: 'left', cursor: 'pointer', background: 'rgba(16, 42, 32, 0.7)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8FAF82', marginBottom: '0.3rem' }}>
                <Calendar size={16} />
                <strong style={{ fontSize: '0.85rem', color: '#F3F1E7' }}>Habit Consistency</strong>
              </div>
              <p className="subtitle" style={{ fontSize: '0.75rem' }}>
                Track daily routines, streaks, and completion rates.
              </p>
            </button>

            <button
              className="glass-card"
              onClick={() => {
                setActiveTab('tasks');
                setDrawerState('peek');
              }}
              style={{ textAlign: 'left', cursor: 'pointer', background: 'rgba(16, 42, 32, 0.7)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', marginBottom: '0.3rem' }}>
                <CheckSquare size={16} />
                <strong style={{ fontSize: '0.85rem', color: '#F3F1E7' }}>Task & Subtasks</strong>
              </div>
              <p className="subtitle" style={{ fontSize: '0.75rem' }}>
                Manage incremental subtasks and workload execution.
              </p>
            </button>

            <button
              className="glass-card"
              onClick={() => {
                setActiveTab('journal');
                setDrawerState('peek');
              }}
              style={{ textAlign: 'left', cursor: 'pointer', background: 'rgba(16, 42, 32, 0.7)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#C5D6B9', marginBottom: '0.3rem' }}>
                <BookOpen size={16} />
                <strong style={{ fontSize: '0.85rem', color: '#F3F1E7' }}>Daily Review</strong>
              </div>
              <p className="subtitle" style={{ fontSize: '0.75rem' }}>
                Record end-of-day reflections and performance scores.
              </p>
            </button>

            <button
              className="glass-card"
              onClick={() => {
                setActiveTab('insights');
                setDrawerState('peek');
              }}
              style={{ textAlign: 'left', cursor: 'pointer', background: 'rgba(16, 42, 32, 0.7)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#315D43', marginBottom: '0.3rem' }}>
                <Sparkles size={16} />
                <strong style={{ fontSize: '0.85rem', color: '#F3F1E7' }}>AI Analyst</strong>
              </div>
              <p className="subtitle" style={{ fontSize: '0.75rem' }}>
                Ask AI copilot for productivity insights.
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
