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
          className={`px-4 py-2 rounded ${
            selected === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};
