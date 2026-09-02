import React from 'react';
import { ActiveTab } from '../App';
import { Sparkles, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header style={{ height: 'var(--header-height)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <Calendar size={14} />
        <span>{todayStr}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('focus')}>
          <Clock size={12} /> Start Focus
        </button>
        <button className="btn btn-primary btn-xs" onClick={() => setActiveTab('insights')}>
          <Sparkles size={12} /> AI Analyst
        </button>
      </div>
    </header>
  );
};
