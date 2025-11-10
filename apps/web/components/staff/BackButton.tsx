'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ href = '/staff/portal', onClick, label = 'Back', className = '' }: BackButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm";
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        aria-label={label}
      >
        <ArrowLeft className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}

