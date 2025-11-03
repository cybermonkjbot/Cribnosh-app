'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge, PriorityBadge } from '@/components/ui/glass-badges';
import { Mail, Phone, MapPin, Calendar, User, Tag } from 'lucide-react';

interface WaitlistEntryCardProps {
  entry: {
    _id: string;
    email: string;
    name?: string;
    phone?: string;
    location?: string;
    source: string;
    status: 'active' | 'converted' | 'inactive';
    priority?: 'low' | 'medium' | 'high' | 'vip' | 'normal';
    joinedAt: number;
    notes?: string;
    addedBy?: string;
    addedByName?: string;
  };
  className?: string;
}

export function WaitlistEntryCard({ entry, className }: WaitlistEntryCardProps) {
  const formatDate = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Safely handle potentially undefined fields
  const safeEntry = {
    _id: entry._id || 'unknown',
    email: entry.email || 'no-email@example.com',
    name: entry.name || undefined,
    phone: entry.phone || undefined,
    location: entry.location || undefined,
    source: entry.source || 'unknown',
    status: entry.status || 'active',
    priority: entry.priority || 'normal',
    joinedAt: entry.joinedAt || Date.now(),
    notes: entry.notes || undefined,
    addedBy: entry.addedBy || undefined,
    addedByName: entry.addedByName || undefined,
  };

  return (
    <GlassCard className={cn("p-4 hover:shadow-lg transition-all duration-200", className)}>
      <div className="space-y-3">
        {/* Header with email and badges */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <h3 className="font-semibold text-gray-900 font-asgard truncate">
                {safeEntry.email}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={safeEntry.status} />
              <PriorityBadge priority={safeEntry.priority} />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          {safeEntry.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-satoshi">{safeEntry.name}</span>
            </div>
          )}
          
          {safeEntry.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-satoshi">{safeEntry.phone}</span>
            </div>
          )}
          
          {safeEntry.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-satoshi">{safeEntry.location}</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t border-gray-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span className="font-satoshi">{safeEntry.source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className="font-satoshi">{formatDate(safeEntry.joinedAt)}</span>
              </div>
            </div>
            
            {safeEntry.addedByName && (
              <div className="text-blue-600 font-satoshi">
                Added by: {safeEntry.addedByName}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {safeEntry.notes && (
          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-sm text-gray-600 italic font-satoshi">
              &ldquo;{safeEntry.notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default WaitlistEntryCard;
