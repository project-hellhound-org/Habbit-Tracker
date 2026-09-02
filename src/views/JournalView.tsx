import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { BookOpen, Save, Star } from 'lucide-react';
import { format } from 'date-fns';

export const JournalView: React.FC = () => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const existingReview = useLiveQuery(() => db.dailyReviews.get(todayStr));

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [accomplished, setAccomplished] = useState<string>(existingReview?.accomplished || '');
  const [missed, setMissed] = useState<string>(existingReview?.missed || '');
  const [carryForward, setCarryForward] = useState<string>(existingReview?.carryForwardNotes || '');

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.dailyReviews.put({
      id: todayStr,
      date: todayStr,
      rating,
      accomplished,
      missed,
      carryForwardNotes: carryForward,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    alert('Daily Review & Journal Reflection saved to IndexedDB.');
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2>Daily Review & Reflection Journal ({todayStr})</h2>
        <p className="subtitle">Structured end-of-day performance audits, accomplishments, and blockers.</p>
      </div>

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
          <Save size={14} /> Save Reflection
        </button>
      </form>
    </div>
  );
};
