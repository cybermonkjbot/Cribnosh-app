'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Users, Crown, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'converted' | 'inactive';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: {
      icon: CheckCircle,
      classes: "bg-green-100/80 text-green-800 border-green-200/50",
      text: "Active"
    },
    converted: {
      icon: Users,
      classes: "bg-blue-100/80 text-blue-800 border-blue-200/50",
      text: "Converted"
    },
    inactive: {
      icon: XCircle,
      classes: "bg-gray-100/80 text-gray-600 border-gray-200/50",
      text: "Inactive"
    }
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm",
      variant.classes,
      className
    )}>
      <Icon className="w-3 h-3" />
      {variant.text}
    </span>
  );
}

interface PriorityBadgeProps {
  priority?: 'low' | 'medium' | 'high' | 'vip' | 'normal';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variants = {
    vip: {
      icon: Crown,
      classes: "bg-gradient-to-r from-yellow-100/80 to-amber-100/80 text-yellow-800 border-yellow-200/50",
      text: "VIP"
    },
    high: {
      icon: AlertTriangle,
      classes: "bg-orange-100/80 text-orange-800 border-orange-200/50",
      text: "High"
    },
    medium: {
      icon: Clock,
      classes: "bg-blue-100/80 text-blue-800 border-blue-200/50",
      text: "Medium"
    },
    normal: {
      icon: Clock,
      classes: "bg-blue-100/80 text-blue-800 border-blue-200/50",
      text: "Normal"
    },
    low: {
      icon: Clock,
      classes: "bg-gray-100/80 text-gray-600 border-gray-200/50",
      text: "Low"
    }
  };

  // Default to 'normal' if priority is undefined or invalid
  const safePriority = priority || 'normal';
  const variant = variants[safePriority] || variants.normal;
  const Icon = variant.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm",
      variant.classes,
      className
    )}>
      <Icon className="w-3 h-3" />
      {variant.text}
    </span>
  );
}

export default { StatusBadge, PriorityBadge };
