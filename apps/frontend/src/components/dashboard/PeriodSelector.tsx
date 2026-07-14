import React from 'react';

interface PeriodSelectorProps {
  selected: string;
  onChange: (period: string) => void;
}

const periods = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selected, onChange }) => {
  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border ${
            selected === p.value
              ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
              : 'bg-surface-800/50 border-white/5 text-surface-400 hover:bg-surface-700/50 hover:text-surface-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
