import React from 'react';
import { CalendarItem } from '../../db/schema';
import { parseISO } from 'date-fns';

interface EventBlockProps {
  item: CalendarItem;
  lane: number;
  totalLanes: number;
  pxPerMinute: number;
  onClick: (e: React.MouseEvent) => void;
}

export const EventBlock: React.FC<EventBlockProps> = ({ item, lane, totalLanes, pxPerMinute, onClick }) => {
  const start = parseISO(item.start);
  const end = parseISO(item.end);
  
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const durationMinutes = Math.max(15, (end.getTime() - start.getTime()) / 60000);
  
  const top = startMinutes * pxPerMinute;
  const height = durationMinutes * pxPerMinute;
  
  const width = `calc(${100 / totalLanes}% - 4px)`;
  const left = `calc(${lane * (100 / totalLanes)}% + 2px)`;

  const colors: Record<string, string> = {
    event: '#2563EB',
    task: '#6366F1',
    appointment: '#64748B'
  };
  
  const color = colors[item.type] || colors.event;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left,
        width,
        height: `${height}px`,
        backgroundColor: color,
        borderRadius: 'var(--radius-sm)',
        padding: '4px',
        color: '#FFFFFF',
        fontSize: '0.75rem',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 5,
        transition: 'transform 0.1s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {item.title || '(Untitled)'}
      </div>
      {height > 30 && (
        <div style={{ opacity: 0.8, fontSize: '0.65rem' }}>
          {start.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
        </div>
      )}
    </div>
  );
};
