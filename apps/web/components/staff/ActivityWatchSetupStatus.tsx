"use client";

import { GlassCard } from '@/components/ui/glass-card';
import { AlertCircle, CheckCircle, Monitor } from 'lucide-react';
import Link from 'next/link';

interface ActivityWatchSetupStatusProps {
  isSetup: boolean;
  setupLink?: string;
  errorMessage?: string;
}

export function ActivityWatchSetupStatus({ isSetup, setupLink = '/staff/activitywatch-setup', errorMessage }: ActivityWatchSetupStatusProps) {
  return (
    <GlassCard className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 sm:p-6">
      <div className="flex-shrink-0 mb-2 sm:mb-0">
        {isSetup ? (
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        ) : (
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`text-base sm:text-lg font-asgard mb-1 ${isSetup ? 'text-green-900' : 'text-amber-900'}`}>{isSetup ? 'ActivityWatch is Set Up' : 'ActivityWatch Not Set Up'}</h3>
        <p className="text-gray-700 font-satoshi text-sm sm:text-base">
          {isSetup
            ? 'Automatic time tracking is enabled and syncing.'
            : 'You need to set up ActivityWatch to enable automatic time tracking.'}
        </p>
        {errorMessage && (
          <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 font-satoshi text-sm">
            {errorMessage}
            <br />
            <span className="block mt-1 text-red-700">Please switch to your work computer to clear this error.</span>
          </div>
        )}
      </div>
      {!isSetup && (
        <Link
          href={setupLink}
          className="inline-flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-satoshi text-sm font-medium"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Setup Now
        </Link>
      )}
    </GlassCard>
  );
}

export default ActivityWatchSetupStatus; 