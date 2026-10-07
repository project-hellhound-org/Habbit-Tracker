import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MiniCalendar = ({ value, onChange }: any) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value));

  const startDate = startOfWeek(startOfMonth(currentMonth));
  const endDate = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div style={{ width: '250px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{format(currentMonth, 'MMMM yyyy')}</span>
        <div>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><ChevronRight size={18} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
        {days.map(day => {
          const isSelected = isSameDay(day, value);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          
          return (
            <div 
              key={day.toISOString()} 
              onClick={() => onChange(day)}
              style={{
                padding: '4px',
                cursor: 'pointer',
                borderRadius: '50%',
                color: isSelected ? '#FFF' : isCurrentMonthDay ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isSelected ? 'var(--accent-secondary)' : 'transparent',
                border: isToday && !isSelected ? '1px solid var(--accent-secondary)' : '1px solid transparent',
              }}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};
