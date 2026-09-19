import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { generate30DayAnalyticsTrend, DailyTrendPoint } from '../engine/chartAnalyticsService';
import {
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Flame,
  X,
  CheckCircle2,
  ListTodo,
  Info
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const trendData = generate30DayAnalyticsTrend(habitLogs, tasks);
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrendPoint | null>(null);
  const [activeInsightModal, setActiveInsightModal] = useState<'habit' | 'task' | null>(null);

  const completedHabitLogsCount = habitLogs.filter((l) => l.status === 'completed').length;
  const totalHabitLogsCount = habitLogs.length || 1;
  const habitOverallPct = Math.round((completedHabitLogsCount / totalHabitLogsCount) * 100);

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length || 1;
  const taskOverallPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  const criticalTasksCount = tasks.filter((t) => t.priority === 'critical' && t.status !== 'completed').length;
  const plannedTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const chartHeight = 200;
  const chartWidth = 760;
  const stepX = chartWidth / Math.max(trendData.length - 1, 1);

  const maxTaskCount = Math.max(...trendData.map((d) => d.taskCompletionCount), 5);

  const habitLinePoints = trendData.map((pt, idx) => {
    const x = idx * stepX;
    const y = chartHeight - (pt.habitCompletionPct / 100) * (chartHeight - 30) - 15;
    return { x, y, pt };
  });

  const taskLinePoints = trendData.map((pt, idx) => {
    const x = idx * stepX;
    const y = chartHeight - (pt.taskCompletionCount / maxTaskCount) * (chartHeight - 30) - 15;
    return { x, y, pt };
  });

  const habitPathString = habitLinePoints.map((p) => `${p.x},${p.y}`).join(' L ');
  const taskPathString = taskLinePoints.map((p) => `${p.x},${p.y}`).join(' L ');

  const outerRadius = 42;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const habitDashArray = `${(habitOverallPct / 100) * outerCircumference} ${outerCircumference}`;

  const innerRadius = 26;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const taskDashArray = `${(taskOverallPct / 100) * innerCircumference} ${innerCircumference}`;

  const getHeatmapColor = (pct: number) => {
    if (pct <= 25) return '#556B60';
    if (pct <= 50) return '#E6A817';
    if (pct <= 75) return '#E86A33';
    return '#429867';
  };

  return (
    <div className="view-container">
      {/* Header Bar */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">System Performance Analytics</h1>
          <p className="view-header-subtitle">
            Consolidated dual-line trend graphs, donut metrics, and 30-day performance heatmaps.
          </p>
        </div>
      </div>

      {/* Top Stat Overview Cards */}
      <div className="stat-badge-grid">
        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>HABIT LOG COMPLETION</span>
            <Activity size={18} />
          </div>
          <div className="hero-stat-number">
            {completedHabitLogsCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>({habitOverallPct}%)</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Verified habit logs
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TASK WORKLOAD</span>
            <TrendingUp size={18} />
          </div>
          <div className="hero-stat-number">
            {completedTasksCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {tasks.length} ({taskOverallPct}%)</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Completed workload tasks
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ACTIVE ROUTINES</span>
            <BarChart2 size={18} />
          </div>
          <div className="hero-stat-number">{habits.length}</div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Tracked habit specifications
          </span>
        </div>
      </div>

      {/* 1. Single Graph with Dual Lines */}
      <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-secondary)' }} /> Consolidated 30-Day Performance Graph
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Single integrated view of Habit Completion % and Task Output count.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '14px', height: '4px', background: 'var(--accent-secondary)', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Habit Completion %</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '14px', height: '4px', background: 'var(--warning)', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tasks Completed</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', background: 'rgba(13, 34, 26, 0.65)', padding: '1.5rem 1rem 0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '240px', overflow: 'visible' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1="0"
                y1={(chartHeight - 30) * pct + 15}
                x2={chartWidth}
                y2={(chartHeight - 30) * pct + 15}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            <path d={`M ${habitPathString}`} fill="none" stroke="var(--accent-secondary)" strokeWidth="3.5" strokeLinecap="round" />
            <path d={`M ${taskPathString}`} fill="none" stroke="var(--warning)" strokeWidth="3" strokeDasharray="6 3" strokeLinecap="round" />

            {habitLinePoints.map((pt, idx) => (
              <g key={idx} onMouseEnter={() => setHoveredPoint(pt.pt)} style={{ cursor: 'pointer' }}>
                <circle cx={pt.x} cy={pt.y} r="5.5" fill="var(--accent-secondary)" stroke="var(--bg-primary)" strokeWidth="2" />
                <circle cx={taskLinePoints[idx].x} cy={taskLinePoints[idx].y} r="4.5" fill="var(--warning)" stroke="var(--bg-primary)" strokeWidth="2" />
              </g>
            ))}
          </svg>

          {hoveredPoint && (
            <div style={{ position: 'absolute', top: '15px', right: '25px', background: 'rgba(20, 47, 36, 0.95)', border: '1px solid var(--border-glow)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <strong>{hoveredPoint.displayLabel}</strong>
              <div style={{ color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>Habit Completion: {hoveredPoint.habitCompletionPct}%</div>
              <div style={{ color: 'var(--warning)', marginTop: '0.1rem' }}>Tasks Completed: {hoveredPoint.taskCompletionCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Nested Pie Chart & Performance Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* 2. Nested Pie Chart */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              <PieChartIcon size={20} style={{ color: 'var(--accent-secondary)' }} /> Nested Donut Analytics
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Task performance circle nested within Habit consistency circle.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem 0' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', cursor: 'pointer' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r={outerRadius} fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r={outerRadius}
                  fill="none"
                  stroke="var(--accent-secondary)"
                  strokeWidth="8"
                  strokeDasharray={habitDashArray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  onClick={() => setActiveInsightModal('habit')}
                />

                <circle cx="50" cy="50" r={innerRadius} fill="none" stroke="var(--border-color)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r={innerRadius}
                  fill="none"
                  stroke="var(--warning)"
                  strokeWidth="8"
                  strokeDasharray={taskDashArray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  onClick={() => setActiveInsightModal('task')}
                />
              </svg>

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.round((habitOverallPct + taskOverallPct) / 2)}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveInsightModal('habit')}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-secondary)' }} /> Outer: Habits ({habitOverallPct}%)
            </button>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveInsightModal('task')}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} /> Inner: Tasks ({taskOverallPct}%)
            </button>
          </div>
        </div>

        {/* 3. System Performance Heatmap */}
        <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              <Flame size={20} style={{ color: 'var(--warning)' }} /> System Performance Heatmap
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Streak execution intensity across 30 days based on completion thresholds.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.55rem', padding: '0.5rem 0' }}>
            {trendData.map((pt, idx) => {
              const color = getHeatmapColor(pt.habitCompletionPct);
              return (
                <div
                  key={idx}
                  title={`${pt.displayLabel}: ${pt.habitCompletionPct}% Completion`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
                    transition: 'transform 200ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {pt.displayLabel.split(' ')[1]}
                </div>
              );
            })}
          </div>

          {/* Color Coding Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#556B60' }} /> 25% (Grey)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E6A817' }} /> 50% (Yellow)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#E86A33' }} /> 75% (Orange)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#429867' }} /> 100% (Green)
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Detail Modal on Ring Click */}
      {activeInsightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="liquid-panel" style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                {activeInsightModal === 'habit' ? (
                  <>
                    <CheckCircle2 size={22} style={{ color: 'var(--accent-secondary)' }} /> Habit Consistency Breakdown
                  </>
                ) : (
                  <>
                    <ListTodo size={22} style={{ color: 'var(--warning)' }} /> Task Workload Breakdown
                  </>
                )}
              </h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setActiveInsightModal(null)}>
                <X size={18} />
              </button>
            </div>

            {activeInsightModal === 'habit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Detailed performance breakdown of all registered routines:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {habits.map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-primary)' }}><strong>{h.name}</strong> ({h.category})</span>
                      <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{h.frequencyMode === 'everyday' ? 'Everyday' : `${h.selectedDays?.length || 0} days/wk`}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Task priority and workload distribution snapshot:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Completed Tasks</span>
                    <strong style={{ color: 'var(--accent-secondary)' }}>{completedTasksCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Pending Work Items</span>
                    <strong style={{ color: 'var(--warning)' }}>{plannedTasksCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(13, 34, 26, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Critical Urgency Tasks</span>
                    <strong style={{ color: 'var(--danger)' }}>{criticalTasksCount}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

