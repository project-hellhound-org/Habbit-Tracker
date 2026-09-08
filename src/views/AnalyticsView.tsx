import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { generate30DayAnalyticsTrend } from '../engine/chartAnalyticsService';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Activity, Flame, Layers, Info } from 'lucide-react';
import { format, subDays } from 'date-fns';

export const AnalyticsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const trendData = generate30DayAnalyticsTrend(habitLogs, tasks);
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [hoveredPieSegment, setHoveredPieSegment] = useState<string | null>(null);

  // Habit Category Breakdown (Outer Ring)
  const fitnessHabits = habits.filter((h) => h.category === 'Fitness & Health').length;
  const learningHabits = habits.filter((h) => h.category === 'Learning & Growth').length;
  const workHabits = habits.filter((h) => h.category === 'Work & Projects' || !h.category).length;
  const totalHabits = habits.length || 1;

  const fitnessPct = Math.round((fitnessHabits / totalHabits) * 100);
  const learningPct = Math.round((learningHabits / totalHabits) * 100);
  const workPct = Math.round((workHabits / totalHabits) * 100);

  // Task Priority Breakdown (Inner Ring)
  const criticalTasks = tasks.filter((t) => t.priority === 'critical').length;
  const highTasks = tasks.filter((t) => t.priority === 'high').length;
  const mediumTasks = tasks.filter((t) => t.priority === 'medium').length;
  const lowTasks = tasks.filter((t) => t.priority === 'low').length;
  const totalTaskCount = tasks.length || 1;

  const criticalPct = Math.round((criticalTasks / totalTaskCount) * 100);
  const highPct = Math.round((highTasks / totalTaskCount) * 100);
  const mediumPct = Math.round((mediumTasks / totalTaskCount) * 100);
  const lowPct = Math.round((lowTasks / totalTaskCount) * 100);

  // Consolidated Dual-Line Graph Coordinates
  const chartHeight = 180;
  const chartWidth = 720;
  const stepX = chartWidth / Math.max(trendData.length - 1, 1);

  const habitPointsPath = trendData
    .map((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.habitCompletionPct / 100) * (chartHeight - 20);
      return `${x},${y}`;
    })
    .join(' L ');

  const maxTasks = Math.max(...trendData.map((pt) => pt.taskCompletionCount), 5);
  const taskPointsPath = trendData
    .map((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.taskCompletionCount / maxTasks) * (chartHeight - 20);
      return `${x},${y}`;
    })
    .join(' L ');

  // Performance Streak Heatmap Colors (25% Grey, 50% Yellow, 75% Orange, 100% Red)
  const getHeatmapColor = (pct: number) => {
    if (pct >= 90) return '#EF4444'; // 100% Deep Red Flame
    if (pct >= 60) return '#F97316'; // 75% Active Orange
    if (pct >= 30) return '#EAB308'; // 50% Active Yellow
    return '#242936';                // 25% Grey Ember
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>System Performance Analytics & Interactive Visualizations</h2>
        <p className="subtitle">Consolidated dual-line trend graph, nested interactive pie chart, and 30-day streak performance heatmap.</p>
      </div>

      {/* Top Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>30-DAY HABIT LOGS</span>
            <BarChart2 size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{habitLogs.filter((l) => l.status === 'completed').length}</div>
          <span className="subtitle">Verified completions</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TASK WORKLOAD</span>
            <TrendingUp size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{tasks.filter((t) => t.status === 'completed').length} / {tasks.length}</div>
          <span className="subtitle">Completed work items</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE ROUTINES</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{habits.length}</div>
          <span className="subtitle">Habit specifications</span>
        </div>
      </div>

      {/* 1. Consolidated Interactive Dual-Line Trend Graph */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><TrendingUp size={16} /> Consolidated Performance Trend Graph</h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: '#22C55E', borderRadius: '2px' }}></span> Habit Completion %
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--cyan)', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--cyan)', borderRadius: '2px' }}></span> Task Completions
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', overflowX: 'auto', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '200px', overflow: 'visible' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1="0"
                y1={chartHeight * pct}
                x2={chartWidth}
                y2={chartHeight * pct}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Task Completion Line (Dashed Cyan) */}
            <path
              d={`M ${taskPointsPath}`}
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="2"
              strokeDasharray="5 5"
            />

            {/* Habit Completion Line (Solid Emerald) */}
            <path
              d={`M ${habitPointsPath}`}
              fill="none"
              stroke="#22C55E"
              strokeWidth="3"
            />

            {/* Data Points */}
            {trendData.map((pt, idx) => {
              const x = idx * stepX;
              const yHabit = chartHeight - (pt.habitCompletionPct / 100) * (chartHeight - 20);
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={yHabit}
                  r={hoveredPoint?.dateStr === pt.dateStr ? 6 : 3}
                  fill="#22C55E"
                  style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--cyan)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', zIndex: 10 }}>
              <strong>{hoveredPoint.displayLabel} ({hoveredPoint.dateStr})</strong>
              <div>Habit Completion: <strong style={{ color: '#22C55E' }}>{hoveredPoint.habitCompletionPct}%</strong></div>
              <div>Tasks Completed: <strong style={{ color: 'var(--cyan)' }}>{hoveredPoint.taskCompletionCount}</strong></div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Nested Interactive Concentric Pie Chart & 3. Streak Performance Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        
        {/* Nested Interactive Pie Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3><PieChartIcon size={16} /> Nested Concentric Distribution Pie Chart</h3>
          <p className="subtitle">Outer Ring: Habit Categories | Inner Ring: Task Priorities</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', position: 'relative' }}>
            <svg viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', width: '180px', height: '180px' }}>
              {/* Outer Ring: Habit Categories */}
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3.2" />
              <circle
                cx="21" cy="21" r="15.915" fill="none" stroke="#22C55E" strokeWidth="3.2"
                strokeDasharray={`${fitnessPct} ${100 - fitnessPct}`} strokeDashoffset="0"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`Fitness & Health (${fitnessPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />
              <circle
                cx="21" cy="21" r="15.915" fill="none" stroke="#3B82F6" strokeWidth="3.2"
                strokeDasharray={`${learningPct} ${100 - learningPct}`} strokeDashoffset={`-${fitnessPct}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`Learning & Growth (${learningPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />
              <circle
                cx="21" cy="21" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="3.2"
                strokeDasharray={`${workPct} ${100 - workPct}`} strokeDashoffset={`-${fitnessPct + learningPct}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`Work & Projects (${workPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />

              {/* Inner Ring: Task Priorities */}
              <circle cx="21" cy="21" r="10.5" fill="none" stroke="var(--border-color)" strokeWidth="3.2" />
              <circle
                cx="21" cy="21" r="10.5" fill="none" stroke="#EF4444" strokeWidth="3.2"
                strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`Critical Priority Tasks (${criticalPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />
              <circle
                cx="21" cy="21" r="10.5" fill="none" stroke="#F97316" strokeWidth="3.2"
                strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset={`-${criticalPct}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`High Priority Tasks (${highPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />
              <circle
                cx="21" cy="21" r="10.5" fill="none" stroke="#EAB308" strokeWidth="3.2"
                strokeDasharray={`${mediumPct} ${100 - mediumPct}`} strokeDashoffset={`-${criticalPct + highPct}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPieSegment(`Medium Priority Tasks (${mediumPct}%)`)}
                onMouseLeave={() => setHoveredPieSegment(null)}
              />
            </svg>
          </div>

          <div style={{ textAlign: 'center', minHeight: '24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan)' }}>
            {hoveredPieSegment || 'Hover outer or inner rings for segment breakdown'}
          </div>
        </div>

        {/* 3. Performance Streak Heatmap */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3><Flame size={16} /> 30-Day Performance Streak Heatmap</h3>
          <p className="subtitle">Streak intensity grid: 25% (Grey), 50% (Yellow), 75% (Orange), 100% (Red Flame)</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
            {trendData.slice(-30).map((pt, idx) => {
              const bg = getHeatmapColor(pt.habitCompletionPct);
              return (
                <div
                  key={idx}
                  style={{
                    height: '38px',
                    background: bg,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.675rem',
                    fontWeight: 700,
                    transition: 'transform 0.15s ease',
                  }}
                  title={`${pt.displayLabel}: ${pt.habitCompletionPct}% Completion`}
                >
                  <span>{pt.displayLabel}</span>
                  <span style={{ opacity: 0.85 }}>{pt.habitCompletionPct}%</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#242936', borderRadius: '2px' }}></span> 25% Grey</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#EAB308', borderRadius: '2px' }}></span> 50% Yellow</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#F97316', borderRadius: '2px' }}></span> 75% Orange</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '2px' }}></span> 100% Flame Red</span>
          </div>
        </div>

      </div>
    </div>
  );
};
