"use client";

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
  interactive?: boolean;
}

export function GlassCard({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  icon,
  variant = 'default',
  onClick,
  interactive = false
}: GlassCardProps) {
  const baseClasses = "bg-white/90 backdrop-blur-lg border border-gray-200/40 rounded-2xl shadow-lg";
  const interactiveClasses = interactive ? "cursor-pointer hover:bg-white/95 hover:shadow-xl transition-all duration-200" : "";
  
  const variantClasses = {
    default: "",
    primary: "border-primary-300/50 bg-primary-50/60",
    success: "border-green-300/50 bg-green-50/60", 
    warning: "border-amber-300/50 bg-amber-50/60",
    error: "border-red-300/50 bg-red-50/60"
  };

  const CardComponent = interactive ? motion.button : motion.div;

  return (
    <CardComponent
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className} p-3 sm:p-4 md:p-6 max-w-full overflow-hidden`}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || icon) && (
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 pb-2 sm:pb-4 md:pb-4 min-w-0">
          {icon && (
            <div className="p-2 rounded-lg bg-[#F23E2E]/10 text-[#F23E2E] flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-sm sm:text-base md:text-lg font-bold font-asgard text-gray-900 mb-1 break-words">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-700 font-satoshi break-words">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className={title || icon ? "px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6" : "p-3 sm:p-4 md:p-6"}>
        {children}
      </div>
    </CardComponent>
  );
}

interface GlassCardGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function GlassCardGrid({ children, className = '', cols = 2 }: GlassCardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  };

  return (
    <div className={`grid gap-3 sm:gap-4 md:gap-6 ${gridCols[cols]} ${className} max-w-full overflow-hidden`}>
      {children}
    </div>
  );
}

interface GlassCardSectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function GlassCardSection({ children, title, subtitle, className = '' }: GlassCardSectionProps) {
  return (
    <section className={`space-y-4 sm:space-y-6 ${className} max-w-full`}>
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-xl sm:text-2xl font-bold font-asgard text-gray-900 break-words">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-gray-700 font-satoshi text-sm sm:text-base break-words">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
} 