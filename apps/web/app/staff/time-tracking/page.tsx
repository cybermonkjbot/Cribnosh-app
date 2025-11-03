"use client";

import { ActivityWatchSetupStatus } from '@/components/staff/ActivityWatchSetupStatus';
import { ClockInCard } from '@/components/staff/ClockInCard';
import { WeeklyHoursCard } from '@/components/staff/WeeklyHoursCard';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TimeTrackingPage() {
  // All hooks at the top!
  const router = useRouter();
  const [staffEmail, setStaffEmail] = useState<string | null | undefined>(undefined);
  const [isActivityWatchSetup, setIsActivityWatchSetup] = useState<boolean>(false);
  const [awError, setAwError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStaffEmail(localStorage.getItem("staffEmail"));
      setIsActivityWatchSetup(localStorage.getItem('activityWatchSetupComplete') === 'true');
      // Only check ActivityWatch connection if setup is complete
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (localStorage.getItem('activityWatchSetupComplete') === 'true') {
        if (isMobile) {
          setAwError('Could not connect to ActivityWatch service. This session is not being accurately counted as work');
        } else {
          // Try to fetch ActivityWatch web UI
          fetch('http://localhost:5600', { method: 'GET', mode: 'no-cors' })
            .then(() => {
              setAwError(null);
            })
            .catch(() => {
              setAwError('Could not connect to ActivityWatch service. This session is not being accurately counted as work');
            });
        }
      }
    }
  }, []);

  const handleMarkSetupComplete = () => {
    // This bypass is disabled in production
    if (process.env.NODE_ENV === 'development') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('activityWatchSetupComplete', 'true');
        window.location.reload();
      }
    }
  };

  // Always call useQuery, even if staffEmail is null/undefined
  const profile = useQuery(api.queries.users.getUserByEmail, staffEmail ? { email: staffEmail } : 'skip');

  // Loading states for staffEmail
  if (staffEmail === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Loading...</div>
      </div>
    );
  }
  
  if (staffEmail === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Please log in to access time tracking.</div>
      </div>
    );
  }

  // Enforce ActivityWatch setup
  if (!isActivityWatchSetup) {
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col justify-center items-center space-y-8 p-4">
        <ActivityWatchSetupStatus isSetup={false} />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-asgard text-amber-900 mb-2">ActivityWatch Setup Required</h2>
          <p className="text-amber-800 mb-4 font-satoshi">
            You must complete ActivityWatch setup before you can use time tracking features. This is required for all employees to ensure accurate and secure work hour logging.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleMarkSetupComplete}
              className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-satoshi text-base font-medium"
            >
              [DEV ONLY] Bypass ActivityWatch Setup
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Loading your profile...</div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 relative"
      >
        {/* Back Button */}
        <Link
          href="/staff/portal"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm"
          aria-label="Back to Staff Portal"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        
        <h1 className="text-3xl font-asgard text-gray-900 mb-2">Time Tracking</h1>
        <p className="text-gray-600">
          Track your work hours and view your weekly summary
        </p>
      </motion.div>

      {/* ActivityWatch Setup Status */}
      <ActivityWatchSetupStatus isSetup={true} errorMessage={awError || undefined} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clock In/Out Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ClockInCard 
            staffId={profile._id} 
            staffName={profile.name || profile.email || 'Staff Member'} 
          />
        </motion.div>

        {/* Weekly Hours Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WeeklyHoursCard staffId={profile._id} />
        </motion.div>
      </div>

      {/* Removed Time Tracking Guidelines section */}
    </div>
  );
} 