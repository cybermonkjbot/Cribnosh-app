'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/70 backdrop-blur-lg rounded-2xl border border-primary-100 shadow-lg transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard; 