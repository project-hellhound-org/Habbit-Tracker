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

  // Consolidated Metric Calculations
  const completedHabitLogsCount = habitLogs.filter((l) => l.status === 'completed').length;
  const totalHabitLogsCount = habitLogs.length || 1;
  const habitOverallPct = Math.round((completedHabitLogsCount / totalHabitLogsCount) * 100);

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length || 1;
  const taskOverallPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  const criticalTasksCount = tasks.filter((t) => t.priority === 'critical' && t.status !== 'completed').length;
  const plannedTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  // Chart dimensions & Dual Line Path Calculations
  const chartHeight = 180;
  const chartWidth = 700;
  const stepX = chartWidth / Math.max(trendData.length - 1, 1);

  // Maximum task count for dual y-axis scaling
  const maxTaskCount = Math.max(...trendData.map((d) => d.taskCompletionCount), 5);

  const habitLinePoints = trendData.map((pt, idx) => {
    const x = idx * stepX;
    const y = chartHeight - (pt.habitCompletionPct / 100) * (chartHeight - 20) - 10;
    return { x, y, pt };
  });

  const taskLinePoints = trendData.map((pt, idx) => {
    const x = idx * stepX;
    const y = chartHeight - (pt.taskCompletionCount / maxTaskCount) * (chartHeight - 20) - 10;
    return { x, y, pt };
  });

  const habitPathString = habitLinePoints.map((p) => `${p.x},${p.y}`).join(' L ');
  const taskPathString = taskLinePoints.map((p) => `${p.x},${p.y}`).join(' L ');

  // Nested Pie Chart Calculations (Outer Habit Ring, Inner Task Ring)
  const outerRadius = 38;
  const outerCircumference = 2 * Math.PI * outerRadius; // ~238.76
  const habitDashArray = `${(habitOverallPct / 100) * outerCircumference} ${outerCircumference}`;

  const innerRadius = 24;
  const innerCircumference = 2 * Math.PI * innerRadius; // ~150.80
  const taskDashArray = `${(taskOverallPct / 100) * innerCircumference} ${innerCircumference}`;

  // Streak Performance Heatmap Color Coding Logic:
  // 25% (Grey), 50% (Yellow), 75% (Orange), 100% (Red)
  const getHeatmapColor = (pct: number) => {
    if (pct <= 25) return '#737373'; // 25% Grey
    if (pct <= 50) return '#F59E0B'; // 50% Yellow
    if (pct <= 75) return '#F97316'; // 75% Orange
    return '#EF4444'; // 100% Red
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          System Performance Analytics & Visual Intelligence
        </h2>
        <p className="subtitle">
          Consolidated dual-line trend charts, interactive nested donut metrics, and 4-tier streak performance heatmaps.
        </p>
      </div>

      {/* Top Stat Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>HABIT LOG COMPLETION</span>
            <Activity size={16} style={{ color: '#527653' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {completedHabitLogsCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>({habitOverallPct}%)</span>
          </div>
          <span className="subtitle">Verified habit logs</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>TASK WORKLOAD</span>
            <TrendingUp size={16} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {completedTasksCount} / {tasks.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>({taskOverallPct}%)</span>
          </div>
          <span className="subtitle">Completed workload tasks</span>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700 }}>ACTIVE ROUTINES</span>
            <BarChart2 size={16} style={{ color: '#8FAF82' }} />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{habits.length}</div>
          <span className="subtitle">Tracked habit specifications</span>
        </div>
      </div>

      {/* 1. Single Graph with Dual Lines (Habit % & Task Count) */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
              <TrendingUp size={18} style={{ color: '#527653' }} /> Consolidated 30-Day Performance Graph
            </h3>
            <p className="subtitle">Single integrated view of Habit Completion % and Task Output count.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '3px', background: '#527653', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600, color: '#C5D6B9' }}>Habit Completion %</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '12px', height: '3px', background: '#F59E0B', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600, color: '#C5D6B9' }}>Tasks Completed</span>
            </div>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', background: '#102A20', padding: '1.25rem 1rem 0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '220px', overflow: 'visible' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1="0"
                y1={(chartHeight - 20) * pct + 10}
                x2={chartWidth}
                y2={(chartHeight - 20) * pct + 10}
                stroke="var(--border-color)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Line 1: Habit Completion % (Green) */}
            <path d={`M ${habitPathString}`} fill="none" stroke="#527653" strokeWidth="3" strokeLinecap="round" />

            {/* Line 2: Task Completion Count (Yellow/Amber) */}
            <path d={`M ${taskPathString}`} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="6 3" strokeLinecap="round" />

            {/* Hover Points */}
            {habitLinePoints.map((pt, idx) => (
              <g key={idx} onMouseEnter={() => setHoveredPoint(pt.pt)} style={{ cursor: 'pointer' }}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#527653" stroke="#102A20" strokeWidth="2" />
                <circle cx={taskLinePoints[idx].x} cy={taskLinePoints[idx].y} r="4" fill="#F59E0B" stroke="#102A20" strokeWidth="2" />
              </g>
            ))}
          </svg>

          {hoveredPoint && (
            <div style={{ position: 'absolute', top: '10px', right: '20px', background: '#142F24', border: '1px solid #3A644E', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.775rem', color: '#F3F1E7', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <strong>{hoveredPoint.displayLabel}</strong>
              <div style={{ color: '#8FAF82' }}>Habit Completion: {hoveredPoint.habitCompletionPct}%</div>
              <div style={{ color: '#F59E0B' }}>Tasks Completed: {hoveredPoint.taskCompletionCount}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Nested Pie Chart & Performance Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* 2. Optimized Nested Pie Chart (Task Circle inside Habit Circle) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <PieChartIcon size={18} style={{ color: '#8FAF82' }} /> Nested Donut Analytics
            </h3>
            <p className="subtitle">Task performance circle nested within Habit consistency circle. Click ring for insights.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
            <div style={{ position: 'relative', width: '180px', height: '180px', cursor: 'pointer' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {/* Outer Ring Track: Habit */}
                <circle cx="50" cy="50" r={outerRadius} fill="none" stroke="#244737" strokeWidth="8" />
                {/* Outer Ring Active: Habit (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r={outerRadius}
                  fill="none"
                  stroke="#527653"
                  strokeWidth="8"
                  strokeDasharray={habitDashArray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  onClick={() => setActiveInsightModal('habit')}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />

                {/* Inner Ring Track: Task */}
                <circle cx="50" cy="50" r={innerRadius} fill="none" stroke="#244737" strokeWidth="8" />
                {/* Inner Ring Active: Task (Yellow) */}
                <circle
                  cx="50"
                  cy="50"
                  r={innerRadius}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="8"
                  strokeDasharray={taskDashArray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  onClick={() => setActiveInsightModal('task')}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
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
                <span style={{ fontSize: '0.7rem', color: '#8FAF82', fontWeight: 600 }}>OVERALL</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#F3F1E7' }}>
                  {Math.round((habitOverallPct + taskOverallPct) / 2)}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveInsightModal('habit')}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#527653' }} /> Outer: Habits ({habitOverallPct}%)
            </button>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveInsightModal('task')}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} /> Inner: Tasks ({taskOverallPct}%)
            </button>
          </div>
        </div>

        {/* 3. System Performance Heatmap (Streak Logic Color Coding) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Flame size={18} style={{ color: '#EF4444' }} /> System Performance Heatmap
            </h3>
            <p className="subtitle">Streak execution intensity across 30 days based on completion thresholds.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.45rem', padding: '0.5rem 0' }}>
            {trendData.map((pt, idx) => {
              const color = getHeatmapColor(pt.habitCompletionPct);
              return (
                <div
                  key={idx}
                  title={`${pt.displayLabel}: ${pt.habitCompletionPct}% Completion`}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '6px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                      justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    transition: 'transform 0.15s ease',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', color: '#C5D6B9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#737373' }} /> 25% (Grey)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }} /> 50% (Yellow)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F97316' }} /> 75% (Orange)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }} /> 100% (Red)
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Detail Modal on Ring Click */}
      {activeInsightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', background: '#142F24', border: '1px solid #3A644E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                {activeInsightModal === 'habit' ? (
                  <>
                    <CheckCircle2 size={20} style={{ color: '#527653' }} /> Habit Consistency Breakdown
                  </>
                ) : (
                  <>
                    <ListTodo size={20} style={{ color: '#F59E0B' }} /> Task Workload Breakdown
                  </>
                )}
              </h3>
              <button className="btn btn-secondary btn-icon btn-xs" onClick={() => setActiveInsightModal(null)}>
                <X size={16} />
              </button>
            </div>

            {activeInsightModal === 'habit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <p>Detailed performance breakdown of all registered routines:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {habits.map((h) => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: '#102A20', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <span><strong>{h.name}</strong> ({h.category})</span>
                      <span style={{ color: '#8FAF82', fontWeight: 700 }}>{h.frequencyMode === 'everyday' ? 'Everyday' : `${h.selectedDays?.length || 0} days/wk`}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '0.75rem', background: 'rgba(82,118,83,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid #527653', color: '#C5D6B9', fontSize: '0.775rem' }}>
                  <Info size={14} style={{ inlineSize: '14px', marginRight: '0.3rem' }} />
                  Maintain an overall habit execution rate above 75% to sustain your active flame streak.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
                <p>Task priority and workload distribution snapshot:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: '#102A20', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span>Completed Tasks</span>
                    <strong style={{ color: '#527653' }}>{completedTasksCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: '#102A20', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span>Pending Work Items</span>
                    <strong style={{ color: '#F59E0B' }}>{plannedTasksCount}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: '#102A20', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <span>Critical Urgency Tasks</span>
                    <strong style={{ color: '#EF4444' }}>{criticalTasksCount}</strong>
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
