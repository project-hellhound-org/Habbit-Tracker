import React, { useState, useEffect, useRef } from 'react';
import { generateTimeSlots, parseTimeString } from '../../engine/calendarUtils';

export const TimeCombobox = ({ value, onChange, startTime }: any) => {
  const [text, setText] = useState(value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  const [isOpen, setIsOpen] = useState(false);
  const slots = generateTimeSlots();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  }, [value]);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleBlur = () => {
    const parsed = parseTimeString(text);
    if (parsed) {
      const d = new Date(value);
      d.setHours(parsed.hours, parsed.minutes);
      onChange(d);
    } else {
      setText(value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input 
        className="form-input" 
        style={{ width: '110px', padding: '0.4rem 0.5rem' }}
        value={text}
        onChange={e => setText(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
      />
      {isOpen && (
        <div className="liquid-panel" style={{ position: 'absolute', top: '100%', left: 0, width: '160px', maxHeight: '200px', overflowY: 'auto', zIndex: 1001, padding: 0 }}>
          {slots.map(slot => {
            const isSelected = text === slot.label;
            
            let durationText = '';
            if (startTime) {
              const slotTime = new Date(value);
              const [h, m] = slot.value.split(':').map(Number);
              slotTime.setHours(h, m);
              const diffMin = (slotTime.getTime() - startTime.getTime()) / 60000;
              if (diffMin > 0) {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                durationText = ` (${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''})`;
              }
            }

            return (
              <div 
                key={slot.value} 
                style={{ padding: '0.5rem', cursor: 'pointer', background: isSelected ? 'rgba(87, 185, 120, 0.2)' : 'transparent', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                onMouseDown={() => {
                  const [h, m] = slot.value.split(':').map(Number);
                  const d = new Date(value);
                  d.setHours(h, m);
                  onChange(d);
                  setIsOpen(false);
                }}
              >
                {slot.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{durationText}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
