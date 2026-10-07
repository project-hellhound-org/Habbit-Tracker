import React from 'react';
import { generateRRuleOptions } from '../../engine/calendarUtils';

export const RecurrenceSelect = ({ selectedDate, value, onChange }: any) => {
  const options = generateRRuleOptions(selectedDate);
  return (
    <select 
      className="form-select" 
      value={value} 
      onChange={e => onChange(e.target.value)}
      style={{ padding: '0.4rem 0.5rem', width: '100%' }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
};
