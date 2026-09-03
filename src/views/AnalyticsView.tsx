import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { generate30DayAnalyticsTrend } from '../engine/chartAnalyticsService';
import { BarChart2, PieChart as PieChartIcon, TrendingUp, ShieldCheck, Activity } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const habits = useLiveQuery(() => db.habits.where('archived').equals(0).toArray()) || [];
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray()) || [];
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const focusSessions = useLiveQuery(() => db.focusSessions.toArray()) || [];

  const trendData = generate30DayAnalyticsTrend(habitLogs, tasks, focusSessions);

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

  // SVG Trend Line Path calculations
  const maxFocusMins = Math.max(...trendData.map((d) => d.focusMinutes), 60);
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

  const focusPointsPath = trendData
    .map((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.focusMinutes / maxFocusMins) * chartHeight;
      return `${x},${y}`;
    })
    .join(' L ');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>System Performance Analytics & Visual Charts</h2>
        <p className="subtitle">High-precision 30-day multi-line trend graphs, task priority pie charts, and focus bar analytics.</p>
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>VERIFIED DEEP WORK</span>
            <ShieldCheck size={16} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{Math.round(focusSessions.reduce((sum, s) => sum + (s.verifiedSeconds || 0), 0) / 3600)} hrs</div>
          <span className="subtitle">Anti-gaming verified focus</span>
        </div>
      </div>

      {/* Interactive 30-Day Multi-Line Trend Chart */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><TrendingUp size={16} /> 30-Day Consistency Multi-Line Trend Graph</h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--text-primary)', display: 'inline-block' }}></span> Habit Completion %
            </span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '12px', height: '3px', background: '#ef4444', display: 'inline-block' }}></span> Focus Minutes
            </span>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '180px', overflow: 'visible' }}>
            {/* Grid lines */}
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

            {/* Habit Completion Line (White / Primary Text) */}
            <path
              d={`M ${habitPointsPath}`}
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="2.5"
            />

            {/* Focus Minutes Line (Red) */}
            <path
              d={`M ${focusPointsPath}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
          </svg>
        </div>
      </div>

      {/* Grid: Task Priority Distribution Pie Chart & Focus Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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

        {/* Focus vs. Interruption Bar Chart */}
        <div className="glass-card">
          <h3><BarChart2 size={16} /> 7-Day Focus Minutes Breakdown</h3>
          <p className="subtitle" style={{ marginBottom: '1rem' }}>Daily verified deep work minutes.</p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '120px', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            {trendData.slice(-7).map((pt, idx) => {
              const barHeightPct = Math.min(100, Math.round((pt.focusMinutes / 120) * 100));
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '24px',
                      height: `${Math.max(barHeightPct, 5)}%`,
                      background: pt.focusMinutes > 0 ? 'var(--text-primary)' : 'var(--border-color)',
                      borderRadius: '2px',
                      transition: 'height 0.3s ease',
                    }}
                    title={`${pt.displayLabel}: ${pt.focusMinutes} mins`}
                  />
                  <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{pt.displayLabel.split(' ')[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
