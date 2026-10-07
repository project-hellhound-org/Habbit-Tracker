import React, { useRef, useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { CalendarItem } from '../../db/schema';
import { layoutOverlaps } from '../../engine/calendarUtils';
import { EventBlock } from './EventBlock';

interface WeekGridProps {
  items: CalendarItem[];
  currentDate: Date;
  weekStartDay: number;
  onCreateDraft: (date: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
  onUpdateItem: (item: CalendarItem) => void;
}

export const WeekGrid: React.FC<WeekGridProps> = ({ items, currentDate, weekStartDay, onCreateDraft, onSelectItem, onUpdateItem }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: weekStartDay as any });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 6 * 60 * 1.5;
    }
  }, []);

  const pxPerMinute = 1.5;

  return (
    <div className="liquid-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: '60px', borderRight: '1px solid var(--border-color)', padding: '0.5rem' }}></div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map((day) => (
            <div key={day.toISOString()} style={{ textAlign: 'center', padding: '0.5rem', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(day, 'EEE')}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isSameDay(day, new Date()) ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', position: 'relative', height: `${24 * 60 * pxPerMinute}px` }}>
          <div style={{ width: '60px', borderRight: '1px solid var(--border-color)', position: 'relative' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} style={{ position: 'absolute', fontSize: '0.75rem', color: 'var(--text-muted)', width: '100%', textAlign: 'right', paddingRight: '0.5rem', top: `${i * 60 * pxPerMinute}px`, transform: 'translateY(-50%)' }}>
                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', position: 'relative' }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={`grid-${i}`} style={{ position: 'absolute', width: '100%', borderBottom: '1px solid var(--border-color)', opacity: 0.3, top: `${i * 60 * pxPerMinute}px` }}></div>
            ))}
            
            {days.map((day) => {
              const dayItems = items.filter(item => {
                const itemDate = parseISO(item.start);
                return itemDate.getFullYear() === day.getFullYear() && itemDate.getMonth() === day.getMonth() && itemDate.getDate() === day.getDate();
              });
              const layouts = layoutOverlaps(dayItems.map(item => ({ start: parseISO(item.start), end: parseISO(item.end), id: item.id })));
              
              const isToday = day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth() && day.getDate() === now.getDate();

              return (
                <div 
                  key={day.toISOString()} 
                  style={{ position: 'relative', borderRight: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const minutes = Math.floor(y / pxPerMinute);
                    const clickedTime = new Date(day);
                    clickedTime.setHours(Math.floor(minutes / 60), Math.floor(minutes % 60));
                    onCreateDraft(clickedTime);
                  }}
                >
                  {isToday && (
                    <div style={{ position: 'absolute', width: '100%', height: '2px', background: '#EF4444', zIndex: 10, top: `${(now.getHours() * 60 + now.getMinutes()) * pxPerMinute}px`, pointerEvents: 'none' }} />
                  )}
                  {dayItems.map((item) => {
                    const layout = layouts.get(item.id) || { lane: 0, totalLanes: 1 };
                    return (
                      <EventBlock 
                        key={item.id} 
                        item={item} 
                        lane={layout.lane} 
                        totalLanes={layout.totalLanes} 
                        pxPerMinute={pxPerMinute} 
                        onClick={(e) => { e.stopPropagation(); onSelectItem(item); }} 
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
