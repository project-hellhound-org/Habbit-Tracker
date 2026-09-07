import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { generate30DayAnalyticsTrend } from '../engine/chartAnalyticsService';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const trendData = generate30DayAnalyticsTrend(habitLogs, tasks);

  // Task Priority Pie Chart Data
  const criticalTasks = tasks.filter((t) => t.priority === 'critical').length;
  const highTasks = tasks.filter((t) => t.priority === 'high').length;
  const mediumTasks = tasks.filter((t) => t.priority === 'medium').length;
  const lowTasks = tasks.filter((t) => t.priority === 'low').length;
  const totalTaskCount = tasks.length || 1;

  const criticalPct = Math.round((criticalTasks / totalTaskCount) * 100);
  const highPct = Math.round((highTasks / totalTaskCount) * 100);
  const mediumPct = Math.round((mediumTasks / totalTaskCount) * 100);
  const lowPct = Math.round((lowTasks / totalTaskCount) * 100);

  const chartHeight = 160;
  const chartWidth = 650;
  const stepX = chartWidth / Math.max(trendData.length - 1, 1);

  const habitPointsPath = trendData
    .map((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.habitCompletionPct / 100) * chartHeight;
      return `${x},${y}`;
    })
    .join(' L ');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>System Performance Analytics & Visual Charts</h2>
        <p className="subtitle">High-precision 30-day consistency trend graphs and task priority distribution charts.</p>
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE HABITS</span>
            <Activity size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{habits.length}</div>
          <span className="subtitle">Tracked routines</span>
        </div>
      </div>

      {/* Interactive 30-Day Multi-Line Trend Chart */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><TrendingUp size={16} /> 30-Day Habit Completion Consistency Trend</h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Habit Completion % Curve
          </span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
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

            <path
              d={`M ${habitPointsPath}`}
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* Task Priority Distribution Donut/Pie Chart */}
      <div className="glass-card">
        <h3><PieChartIcon size={16} /> Task Priority Distribution</h3>
        <p className="subtitle" style={{ marginBottom: '1rem' }}>Task breakdown by priority urgency level.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3.8" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.8" strokeDasharray={`${criticalPct} ${100 - criticalPct}`} strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="3.8" strokeDasharray={`${highPct} ${100 - highPct}`} strokeDashoffset={`-${criticalPct}`} />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308" strokeWidth="3.8" strokeDasharray={`${mediumPct} ${100 - mediumPct}`} strokeDashoffset={`-${criticalPct + highPct}`} />
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span>
              <span>Critical: <strong>{criticalTasks}</strong> ({criticalPct}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#f97316', borderRadius: '2px' }}></span>
              <span>High: <strong>{highTasks}</strong> ({highPct}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#eab308', borderRadius: '2px' }}></span>
              <span>Medium: <strong>{mediumTasks}</strong> ({mediumPct}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', background: 'var(--text-muted)', borderRadius: '2px' }}></span>
              <span>Low: <strong>{lowTasks}</strong> ({lowPct}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
