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
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-3xl font-bold">
        {value}{suffix && <span className="text-lg text-gray-500 ml-1">{suffix}</span>}
      </p>
      {change !== undefined && (
        <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </p>
      )}
    </div>
  );
};
