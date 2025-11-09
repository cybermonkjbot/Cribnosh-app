"use client";

import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { ActivityWatchSetupStatus } from '@/components/staff/ActivityWatchSetupStatus';
import { ClockInCard } from '@/components/staff/ClockInCard';
import { WeeklyHoursCard } from '@/components/staff/WeeklyHoursCard';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TimeTrackingPage() {
  // Auth is handled by layout via session-based authentication (session token in cookies)
  // Middleware validates session token server-side, no client-side checks needed
  const router = useRouter();
  const { staff: staffUser, sessionToken } = useStaffAuthContext();
  const [isActivityWatchSetup, setIsActivityWatchSetup] = useState<boolean>(false);
  const [awError, setAwError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
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
        router.refresh();
      }
    }
  };

  // Fetch full profile data using user ID
  // Auth is handled at layout level, no page-level checks needed
  // @ts-ignore - Type instantiation is excessively deep (TypeScript limitation with complex Convex types)
  const profile = useQuery(
    api.queries.users.getById,
    staffUser?._id && sessionToken
      ? { userId: staffUser._id, sessionToken }
      : 'skip'
  );

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
    <div className="max-w-6xl mx-auto space-y-6 px-4 pt-8">
      {/* Back Button */}
      <Link
        href="/staff/portal"
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors inline-block mb-8"
        aria-label="Back to Staff Portal"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

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
            sessionToken={sessionToken}
          />
        </motion.div>

        {/* Weekly Hours Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <WeeklyHoursCard staffId={profile._id} sessionToken={sessionToken} />
        </motion.div>
      </div>

      {/* Removed Time Tracking Guidelines section */}
    </div>
  );
} 