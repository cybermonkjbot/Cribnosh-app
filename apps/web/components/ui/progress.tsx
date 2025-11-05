import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

export function Progress({ value, max = 100, className = '', color = 'default' }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    default: 'bg-[#ff3b30]',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
} 