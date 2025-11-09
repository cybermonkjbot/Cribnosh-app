"use client";

import { useState } from 'react';
import { ActivityWatchSetupGuide } from '@/components/staff/ActivityWatchSetupGuide';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function ActivityWatchSetupPage() {
  const [setupCompleted, setSetupCompleted] = useState(false);

  const handleSetupComplete = () => {
    setSetupCompleted(true);
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 py-4 sm:py-8">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8 relative"
      >
        {/* Back Button */}
        <Link
          href="/staff/time-tracking"
          className="absolute left-2 sm:left-0 top-2 sm:top-1/2 sm:transform sm:-translate-y-1/2 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-xs sm:text-sm font-medium shadow-sm"
          aria-label="Back to Time Tracking"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Back</span>
        </Link>
        
        <h1 className="text-2xl sm:text-3xl font-asgard text-gray-900 mb-1 sm:mb-2">ActivityWatch Setup</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Set up automatic time tracking with ActivityWatch integration
        </p>
      </motion.div>

      {/* Setup Guide Component */}
      <div className="w-full">
        <ActivityWatchSetupGuide 
          staffEmail="staff@cribnosh.com"
          onComplete={handleSetupComplete}
        />
      </div>

      {/* Completion Message */}
      {setupCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 text-center w-full"
        >
          <h3 className="text-base sm:text-lg font-asgard text-[#F23E2E] mb-1 sm:mb-2">Setup Complete!</h3>
          <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base">
            ActivityWatch is now configured. You can return to time tracking to see your automatic data.
          </p>
          <Link
            href="/staff/time-tracking"
            className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 bg-[#F23E2E] text-white rounded-lg hover:bg-[#ed1d12] transition-colors text-sm sm:text-base"
          >
            <span>Go to Time Tracking</span>
          </Link>
        </motion.div>
      )}
    </div>
  );
} 