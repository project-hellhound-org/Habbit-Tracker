import React, { useState } from 'react';
import { RecurrenceSelect } from './RecurrenceSelect';
import { TimeCombobox } from './TimeCombobox';
import { X, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

export const QuickCreatePopover = ({ initialDate, onClose, onSave }: any) => {
  const [type, setType] = useState('event');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState(initialDate);
  const [end, setEnd] = useState(new Date(initialDate.getTime() + 60 * 60 * 1000));
  const [rrule, setRrule] = useState('');
  const [desc, setDesc] = useState('');
  const [showDesc, setShowDesc] = useState(false);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="liquid-panel" style={{ width: '400px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'absolute', zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['event', 'task', 'appointment'].map(t => (
            <button key={t} onClick={() => setType(t)} style={{ background: type === t ? 'var(--accent-secondary)' : 'transparent', color: type === t ? '#FFF' : 'var(--text-secondary)', border: type === t ? '1px solid var(--accent-secondary)' : '1px solid transparent', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
      </div>

      <input 
        autoFocus
        placeholder="Add title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ fontSize: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" value={format(start, 'yyyy-MM-dd')} onChange={e => {
          const d = new Date(e.target.value);
          d.setHours(start.getHours(), start.getMinutes());
          setStart(d);
        }} className="form-input" style={{ padding: '0.4rem' }} />
        <TimeCombobox value={start} onChange={setStart} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <TimeCombobox value={end} onChange={setEnd} startTime={start} />
      </div>

      <RecurrenceSelect selectedDate={start} value={rrule} onChange={setRrule} />

      {!showDesc ? (
        <button onClick={() => setShowDesc(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
          <AlignLeft size={16} /> Add description
        </button>
      ) : (
        <textarea 
          placeholder="Description" 
          value={desc} 
          onChange={e => setDesc(e.target.value)}
          className="form-textarea"
          style={{ minHeight: '80px' }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer' }}>More options</button>
        <button className="btn btn-primary" onClick={() => onSave({ type, title, start: start.toISOString(), end: end.toISOString(), rrule, description: desc })}>Save</button>
      </div>
    </div>
  );
};
