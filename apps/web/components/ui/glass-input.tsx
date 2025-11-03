'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export function GlassInput({ 
  children, 
  className, 
  label,
  error,
  icon,
  helperText,
  ...props 
}: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 font-satoshi">
          {label}
          {props.required && <span className="text-[#F23E2E] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full px-3 py-2.5 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl",
            "text-gray-900 placeholder-gray-500 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/20 focus:border-[#F23E2E]/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-300 focus:ring-red-200 focus:border-red-400",
            icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 font-satoshi">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 font-satoshi">{helperText}</p>
      )}
    </div>
  );
}

export default GlassInput;
