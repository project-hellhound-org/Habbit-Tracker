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

  const completedHabitLogsCount = habitLogs.filter((l) => l.status === 'completed').length;
  const totalHabitLogsCount = habitLogs.length || 1;
  const habitOverallPct = Math.round((completedHabitLogsCount / totalHabitLogsCount) * 100);
  const missedHabitLogsCount = totalHabitLogsCount - completedHabitLogsCount;

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const totalTasksCount = tasks.length || 1;
  const taskOverallPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  const plannedTasksCount = tasks.filter((t) => t.status === 'planned' || t.status === 'todo' || t.status === 'in_progress').length;
  const criticalTasksCount = tasks.filter((t) => t.priority === 'critical' && t.status !== 'completed').length;
  const overdueTasksCount = tasks.filter((t) => (t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== 'completed')).length;

  const chartHeight = 180;
  const chartWidth = 720;
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

  // SVG Pie chart helper calculation
  const calculatePieSlice = (pct: number, radius: number = 40) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    return { circumference, strokeDasharray };
  };

  const habitPie = calculatePieSlice(habitOverallPct);
  const taskPie = calculatePieSlice(taskOverallPct);

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
          <h1 className="view-header-title">Decoupled Performance Analytics</h1>
          <p className="view-header-subtitle">
            Dedicated independent charts for Habit Routine consistency and Task Workload delivery.
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
            Verified routine check-ins
          </span>
        </div>

        <div className="liquid-panel flip-card-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TASK WORKLOAD DELIVERY</span>
            <TrendingUp size={18} />
          </div>
          <div className="hero-stat-number">
            {completedTasksCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {tasks.length} ({taskOverallPct}%)</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
            Completed task objectives
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

      {/* 1. DECOUPLED HABIT ANALYTICS SECTION */}
      <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-secondary)', margin: 0 }}>
          <Activity size={22} /> 1. Dedicated Habit Analytics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'center' }}>
          {/* Habit 30-Day Trend Bar / Line Chart */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              30-Day Habit Completion Rate (%)
            </h4>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '200px', overflow: 'visible' }}>
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

              {habitLinePoints.map((pt, idx) => (
                <g key={idx} onMouseEnter={() => setHoveredPoint(pt.pt)} style={{ cursor: 'pointer' }}>
                  <circle cx={pt.x} cy={pt.y} r="5.5" fill="var(--accent-secondary)" stroke="var(--bg-primary)" strokeWidth="2" />
                </g>
              ))}
            </svg>
          </div>

          {/* Dedicated Habit Pie Chart */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Habit Logs Breakdown
            </h4>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--accent-secondary)"
                  strokeWidth="12"
                  strokeDasharray={habitPie.strokeDasharray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>{habitOverallPct}%</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Success</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completed Logs:</span>
                <strong style={{ color: 'var(--accent-secondary)' }}>{completedHabitLogsCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Missed Logs:</span>
                <strong style={{ color: 'var(--text-muted)' }}>{missedHabitLogsCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DECOUPLED TASK ANALYTICS SECTION */}
      <div className="liquid-panel flip-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', margin: 0 }}>
          <TrendingUp size={22} /> 2. Dedicated Task Analytics
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'center' }}>
          {/* Task 30-Day Trend Bar / Line Chart */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              30-Day Completed Task Output (Count)
            </h4>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '200px', overflow: 'visible' }}>
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

              <path d={`M ${taskPathString}`} fill="none" stroke="var(--warning)" strokeWidth="3.5" strokeLinecap="round" />

              {taskLinePoints.map((pt, idx) => (
                <g key={idx} onMouseEnter={() => setHoveredPoint(pt.pt)} style={{ cursor: 'pointer' }}>
                  <circle cx={pt.x} cy={pt.y} r="5.5" fill="var(--warning)" stroke="var(--bg-primary)" strokeWidth="2" />
                </g>
              ))}
            </svg>
          </div>

          {/* Dedicated Task Pie Chart */}
          <div style={{ background: 'rgba(13, 34, 26, 0.65)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Task Workload Status
            </h4>
            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--warning)"
                  strokeWidth="12"
                  strokeDasharray={taskPie.strokeDasharray}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>{taskOverallPct}%</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completed Tasks:</span>
                <strong style={{ color: 'var(--warning)' }}>{completedTasksCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending Tasks:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{plannedTasksCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Critical Priority:</span>
                <strong style={{ color: 'var(--danger)' }}>{criticalTasksCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

