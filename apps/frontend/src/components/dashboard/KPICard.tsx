import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  suffix?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, loading, suffix }) => {
  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-4 bg-surface-700 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-surface-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-surface-700 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="stat-card card-hover">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-surface-400">{title}</h3>
          {icon && <span className="text-surface-500">{icon}</span>}
        </div>
        <p className="text-3xl font-bold dark:text-white text-surface-900">
          {value}{suffix && <span className="text-lg text-surface-500 ml-1">{suffix}</span>}
        </p>
        {change !== undefined && (
          <p className={`text-sm mt-2 flex items-center gap-1 ${change >= 0 ? 'text-brand-400' : 'text-coral-400'}`}>
            {change >= 0 ? '↑' : '↓'} {change.toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
};
