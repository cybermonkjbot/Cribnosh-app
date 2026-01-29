"use client";

import { CopyButtonWithFeedback } from "@/components/ui/copy-button";
import { GlassCard } from "@/components/ui/glass-card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Gift,

  Link2,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

// Simple, clean bar chart
function SimpleBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  return (
    <div className="flex items-end justify-between h-16 gap-1 mt-6">
      {data.map((value, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="relative w-full">
            <motion.div
              className="bg-gray-900 rounded-t-sm shadow-sm"
              style={{ height: `${(value / max) * 100}%`, minHeight: 4 }}
              initial={{ height: 0 }}
              animate={{ height: `${(value / max) * 100}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            />
          </div>
          <div className="text-2xs text-gray-700 font-satoshi font-semibold mt-2">
            {months[index]}
          </div>
        </div>
      ))}
    </div>
  );
}

// Clean stat card
function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard className="p-6 bg-white border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-100">
            <Icon className="w-6 h-6 text-gray-900" />
          </div>
          <div className="flex-1">
            <div className="font-asgard text-2xl text-gray-900 mb-1">
              {value}
            </div>
            <div className="font-satoshi text-sm text-gray-700 mb-1">
              {title}
            </div>
            {/* trend removed for minimalism */}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Clean referral link component
function ReferralLinkSection({ referralLink }: { referralLink: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <GlassCard className="p-6 bg-white border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-gray-900" />
          <h3 className="font-asgard text-lg text-gray-900">Your referral link</h3>
        </div>
        <div className="relative">
          <input
            type="text"
            readOnly
            value={referralLink}
            onFocus={(e) => e.target.select()}
            className="w-full px-4 py-3 text-sm font-mono bg-gray-100 border border-gray-200 text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-12"
            aria-label="Your referral link"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CopyButtonWithFeedback link={referralLink} />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Clean history section
function HistorySection({ referralHistory }: { referralHistory: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <GlassCard className="bg-white border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-gray-900" />
            <h3 className="font-asgard text-lg text-gray-900">Recent referrals</h3>
          </div>
          <span className="font-satoshi text-sm text-gray-900 font-medium">
            {referralHistory.length} total
          </span>
        </div>

        <div className="divide-y divide-primary-100">
          {referralHistory.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-700 font-satoshi text-sm mb-1">No referrals yet</p>
              <p className="text-gray-600 font-satoshi text-xs">
                Share your link to start earning
              </p>
            </div>
          ) : (
            referralHistory.slice(0, 5).map((item: any, index: number) => (
              <div key={item._id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  {item.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <div className="font-satoshi text-sm text-gray-900 font-medium">
                      Referral #{item._id.slice(-6)}
                    </div>
                    <div className="font-satoshi text-xs text-gray-600">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 text-xs font-satoshi rounded-full ${item.status === 'completed'
                    ? 'text-white bg-gray-900'
                    : 'text-gray-900 bg-gray-100'
                    }`}>
                    {item.status}
                  </div>
                  {/* Removed currency display to avoid hardcoding values */}
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Paginated loader
function LoadMoreHistory({ userId, sessionToken }: { userId: Id<'users'>, sessionToken: string | null }) {
  const [cursor, setCursor] = useState<string | null>(null);

  const page = useQuery(api.queries.users.getUserReferralHistoryPaginated,
    sessionToken
      ? {
        userId,
        paginationOpts: { numItems: 5, cursor },
        sessionToken,
      }
      : "skip"
  );

  if (!page) return null;

  const { page: items, isDone, continueCursor } = page as unknown as {
    page: any[]; isDone: boolean; continueCursor: string | null;
  };

  return (
    <div className="mt-4">
      <div className="space-y-0 divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
        {items.map((item) => (
          <div key={item._id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              {item.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-gray-900" />
              ) : (
                <Clock className="w-5 h-5 text-gray-600" />
              )}
              <div>
                <div className="font-satoshi text-sm text-gray-900 font-medium">
                  Referral #{String(item._id).slice(-6)}
                </div>
                <div className="font-satoshi text-xs text-gray-600">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            <div>
              <span className={`px-2 py-1 text-xs font-satoshi rounded-full ${item.status === 'completed' ? 'text-white bg-gray-900' : 'text-gray-900 bg-gray-100'
                }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!isDone && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setCursor(continueCursor)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white font-satoshi text-sm hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

// Resources section


export default function ReferralDashboard() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("cribnosh_user_id");
      const storedSessionToken = localStorage.getItem("cribnosh_waitlist_session");
      if (storedUserId) setUserId(storedUserId as Id<"users">);
      if (storedSessionToken) setSessionToken(storedSessionToken);
    }
  }, []);

  const userStats = useQuery(
    api.queries.users.getUserReferralStats,
    userId && sessionToken ? { userId, sessionToken } : "skip"
  );
  const referralHistory = useQuery(
    api.queries.users.getUserReferralHistory,
    userId && sessionToken ? { userId, sessionToken } : "skip"
  );
  const paged = useQuery(
    api.queries.users.getUserReferralHistoryPaginated,
    userId && sessionToken
      ? { userId, paginationOpts: { numItems: 5, cursor: null }, sessionToken }
      : "skip"
  );

  // Loading state
  if (!userStats || !referralHistory || !paged) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary-700 animate-pulse" />
          </div>
          <p className="font-satoshi text-gray-700">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  // Calculate stats
  const completedReferrals = referralHistory.filter((r: any) => r.status === "completed");
  const weeklySignups = Math.round(completedReferrals.length / 4);

  // Bar chart data
  const dealsPerMonth = Array(6).fill(0);
  completedReferrals.forEach((r: any) => {
    const timestamp = r.completedAt || r.createdAt;
    if (!timestamp) return; // Skip if no timestamp
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return; // Skip if invalid date
    const now = new Date();
    const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (monthDiff >= 0 && monthDiff < 6) {
      dealsPerMonth[5 - monthDiff]++;
    }
  });

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-asgard text-4xl sm:text-5xl text-gray-900 mb-3">
            Referral Dashboard
          </h1>
          <p className="font-satoshi text-gray-700 max-w-2xl mx-auto">
            Track your earnings and manage your referrals
          </p>
        </motion.div>

        {/* Overview card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <GlassCard className="p-8 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-asgard text-xl text-gray-900 font-bold">Referrals overview</h2>
            </div>

            <div className="mb-6">
              <div className="font-asgard text-5xl sm:text-6xl text-gray-900 font-bold mb-2">
                {completedReferrals.length}
              </div>
              <p className="font-satoshi text-gray-700 font-medium text-base">
                Completed referrals (last 6 months)
              </p>
            </div>

            <SimpleBarChart data={dealsPerMonth} />
          </GlassCard>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Weekly Signups"
            value={weeklySignups}
            subtitle="Average new referrals per week"
          />
          <StatCard
            icon={Calendar}
            title="Total Referrals"
            value={referralHistory.length}
            subtitle="All time referrals"
          />
        </div>

        {/* Main layout */}
        <div className="space-y-6">
          <ReferralLinkSection referralLink={userStats.referralLink || ""} />
          <HistorySection referralHistory={referralHistory} />
          {userId && <LoadMoreHistory userId={userId as Id<'users'>} sessionToken={sessionToken} />}
        </div>
      </div>
    </main>
  );
}