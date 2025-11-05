'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  icon,
  disabled,
  ...props 
}: GlassButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-[#F23E2E]/90 hover:bg-[#F23E2E] text-white border border-[#F23E2E]/20 backdrop-blur-sm focus:ring-[#F23E2E]/50",
    secondary: "bg-white/80 hover:bg-white/90 text-gray-900 border border-gray-200/50 backdrop-blur-sm focus:ring-gray-300/50",
    outline: "bg-transparent hover:bg-white/20 text-gray-700 border border-gray-300/50 backdrop-blur-sm focus:ring-gray-300/50",
    ghost: "bg-transparent hover:bg-white/10 text-gray-700 border border-transparent focus:ring-gray-300/50"
  };
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
}

export default GlassButton;
