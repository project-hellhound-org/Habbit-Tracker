import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DailySnapshotData } from '../db/schema';
import { BookOpen, Save, Star, Camera, CheckSquare, Activity, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';
import { format } from 'date-fns';

export const JournalView: React.FC = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const existingReview = useLiveQuery(() => db.dailyReviews.get(todayStr));

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [accomplished, setAccomplished] = useState<string>(existingReview?.accomplished || '');
  const [missed, setMissed] = useState<string>(existingReview?.missed || '');
  const [carryForward, setCarryForward] = useState<string>(existingReview?.carryForwardNotes || '');

  // End-of-Day Snapshot Reporting Data State (Default or loaded snapshot)
  const defaultSnapshot: DailySnapshotData = existingReview?.snapshotData || {
    productivityScore: '82/100',
    habitCompletion: '8/10',
    taskCompletion: '7/9',
    timeLogged: '5h 24m',
    focusEfficiency: '87%',
    goalsProgress: '3/4',
    overdueTasks: 2,
    currentStreak: '14 days',
    dailyCompletionRate: '80%',
    taskReviewStats: {
      planned: 9,
      completed: 7,
      remaining: 2,
      overdue: 1,
      cancelled: 0,
      deferred: 1,
    },
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.dailyReviews.put({
      id: todayStr,
      date: todayStr,
      rating,
      accomplished,
      missed,
      carryForwardNotes: carryForward,
      snapshotData: defaultSnapshot,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    alert('Daily Review & End-of-Day Snapshot saved to IndexedDB.');
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Daily Review & End-of-Day Snapshots ({todayStr})</h2>
          <p className="subtitle">Structured end-of-day performance audits, accomplishments, and metrics reporting.</p>
        </div>
      </div>

      {/* End-of-Day Snapshot Report Showcase Card */}
      <div className="glass-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={18} /> End-of-Day Performance Snapshot Report
          </h3>
          <span className="subtitle" style={{ fontWeight: 700 }}>Score: {defaultSnapshot.productivityScore}</span>
        </div>

        {/* Snapshot Metric Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>PRODUCTIVITY SCORE</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.productivityScore}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>HABIT COMPLETION</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.habitCompletion}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>TASK COMPLETION</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.taskCompletion}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>TIME LOGGED</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.timeLogged}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>FOCUS EFFICIENCY</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.focusEfficiency}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>GOALS PROGRESS</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.goalsProgress}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>OVERDUE TASKS</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem', color: 'var(--danger)' }}>{defaultSnapshot.overdueTasks}</strong>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span className="subtitle" style={{ fontSize: '0.7rem' }}>CURRENT STREAK</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', marginTop: '0.2rem' }}>{defaultSnapshot.currentStreak}</strong>
          </div>
        </div>

        {/* Task & Work Review Statistics Table */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>Task & Work Review Statistics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>PLANNED</span>
              <strong>{defaultSnapshot.taskReviewStats.planned}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>COMPLETED</span>
              <strong>{defaultSnapshot.taskReviewStats.completed}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>REMAINING</span>
              <strong>{defaultSnapshot.taskReviewStats.remaining}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>OVERDUE</span>
              <strong style={{ color: 'var(--danger)' }}>{defaultSnapshot.taskReviewStats.overdue}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>CANCELLED</span>
              <strong>{defaultSnapshot.taskReviewStats.cancelled}</strong>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
              <span className="subtitle" style={{ display: 'block', fontSize: '0.675rem' }}>DEFERRED</span>
              <strong>{defaultSnapshot.taskReviewStats.deferred}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Review Input Form */}
      <form onSubmit={handleSaveReview} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label">Overall Daily Execution Score (1 to 5 Stars)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`btn btn-xs ${rating >= star ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRating(star)}
              >
                <Star size={14} fill={rating >= star ? 'currentColor' : 'none'} /> {star}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Key Accomplishments & Completed Milestones</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={accomplished}
            onChange={(e) => setAccomplished(e.target.value)}
            placeholder="What went well today?"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Blockers, Friction & Missed Targets</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={missed}
            onChange={(e) => setMissed(e.target.value)}
            placeholder="What delayed execution or caused friction?"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Carry-Forward Actions for Tomorrow</label>
          <textarea
            className="form-textarea"
            rows={2}
            value={carryForward}
            onChange={(e) => setCarryForward(e.target.value)}
            placeholder="Key priorities to tackle first tomorrow..."
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          <Save size={14} /> Save Reflection & Snapshot
        </button>
      </form>
    </div>
  );
};
