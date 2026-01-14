"use client";

import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Activity, BarChart3, Calendar, Clock, Target } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

interface WorkSession {
  _id: string;
  staffId: string;
  clockInTime: number;
  clockOutTime?: number;
  duration?: number;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  location?: string;
  createdBy: string;
  updatedBy?: string;
  updatedAt?: number;
  _creationTime: number;
}

interface WeeklyHoursCardProps {
  staffId: Id<"users">;
  sessionToken: string | null;
}

export function WeeklyHoursCard({ staffId, sessionToken }: WeeklyHoursCardProps) {
  // Get this week's sessions
  const thisWeekSessions = useQuery(
    api.queries.workSessions.getThisWeekSessions,
    staffId && sessionToken
      ? { staffId, sessionToken }
      : 'skip'
  ) as WorkSession[] | undefined;

  // Calculate weekly hours
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklyHours = useQuery(
    api.queries.workSessions.getWeeklyHours,
    staffId && sessionToken
      ? {
        staffId,
        weekStart: startOfWeek.getTime(),
        weekEnd: endOfWeek.getTime(),
        sessionToken,
      }
      : 'skip'
  );

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Filter out any undefined sessions and sort by clockInTime (newest first)
  const sortedSessions = (thisWeekSessions || [])
    .filter((session): session is WorkSession => Boolean(session))
    .sort((a, b) => b.clockInTime - a.clockInTime);

  const getDaySessions = (dayIndex: number) => {
    if (!sortedSessions) return [];

    const dayStart = new Date(startOfWeek);
    dayStart.setDate(startOfWeek.getDate() + dayIndex);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return sortedSessions.filter((session: { clockInTime: string | number | Date }) => {
      const sessionDate = new Date(session.clockInTime);
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    });
  };

  const getDayTotalHours = (dayIndex: number) => {
    const daySessions = getDaySessions(dayIndex);
    const totalMs = daySessions.reduce((total: number, session: { duration?: number }) => {
      return total + (session.duration || 0);
    }, 0);
    return totalMs / (1000 * 60 * 60); // Convert to hours
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate max hours for chart scaling
  const maxDayHours = Math.max(...weekDays.map((_, index) => getDayTotalHours(index)), 1);

  if (!weeklyHours || !sortedSessions) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading weekly data...</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50/40 via-transparent to-purple-50/40 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-asgard text-gray-900 mb-1">This Week&apos;s Hours</h2>
            <p className="text-sm text-gray-600">
              {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-white/20">
          <Calendar className="w-6 h-6 text-gray-600" />
        </div>
      </div>

      {/* Weekly Summary Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-sm border border-blue-200/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total</div>
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {weeklyHours.totalHours.toFixed(1)}h
          </div>
          <div className="text-sm text-blue-700">This week</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-linear-to-br from-green-50 to-green-100 rounded-2xl p-6 shadow-sm border border-green-200/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Sessions</div>
          </div>
          <div className="text-3xl font-bold text-green-900 mb-1">
            {weeklyHours.sessions}
          </div>
          <div className="text-sm text-green-700">Work sessions</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-linear-to-br from-amber-50 to-amber-100 rounded-2xl p-6 shadow-sm border border-amber-200/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="text-xs text-amber-600 font-medium uppercase tracking-wide">Average</div>
          </div>
          <div className="text-3xl font-bold text-amber-900 mb-1">
            {(weeklyHours.totalHours / 7).toFixed(1)}h
          </div>
          <div className="text-sm text-amber-700">Per day</div>
        </motion.div>
      </div>

      {/* Daily Breakdown with Visual Chart */}
      <div className="relative z-10 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Daily Breakdown</h3>
          <div className="flex-1 h-px bg-linear-to-r from-gray-200 to-transparent"></div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {weekDays.map((day, index) => {
            const dayHours = getDayTotalHours(index);
            const daySessions = getDaySessions(index);
            const isToday = index === today.getDay();
            const barWidth = maxDayHours > 0 ? (dayHours / maxDayHours) * 100 : 0;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${isToday
                    ? 'bg-linear-to-r from-amber-50 to-orange-50 border-amber-200 shadow-md'
                    : 'bg-white/50 border-gray-200 hover:border-gray-300'
                  }`}
              >
                {/* Progress bar background */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <motion.div
                    className={`h-full ${isToday
                        ? 'bg-linear-to-r from-amber-100/60 to-orange-100/60'
                        : 'bg-linear-to-r from-blue-50/60 to-indigo-50/60'
                      }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.8, delay: 0.1 * index }}
                  />
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm ${isToday
                        ? 'bg-linear-to-br from-amber-500 to-orange-500 text-white'
                        : 'bg-linear-to-br from-gray-100 to-gray-200 text-gray-700'
                      }`}>
                      {day}
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-gray-900">
                        {dayHours > 0 ? `${dayHours.toFixed(1)}h` : '0h'}
                      </div>
                      {daySessions.length > 0 && (
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center space-x-1">
                          <span>{daySessions.length} session{daySessions.length !== 1 ? 's' : ''}</span>
                          {dayHours > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-gray-400">
                                {((dayHours / weeklyHours.totalHours) * 100).toFixed(0)}% of week
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {daySessions.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-medium text-gray-700">
                        {formatTime(daySessions[0].clockInTime)}
                      </div>
                      {daySessions[0].clockOutTime && (
                        <div className="text-sm text-gray-500">
                          - {formatTime(daySessions[0].clockOutTime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions */}
      {sortedSessions.length > 0 && (
        <div className="relative z-10 mt-8">
          <div className="flex items-center space-x-2 mb-6">
            <Link
              href="/staff/time-tracking/recent-sessions"
              className="flex items-center justify-between group"
            >
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                Recent Sessions
              </h3>
              <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                View all
              </span>
            </Link>
            <div className="flex-1 h-px bg-linear-to-r from-gray-200 to-transparent"></div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {sortedSessions.slice(0, 5).map((session, index) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={`/staff/time-tracking/sessions/${session._id}`}
                  className="block p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                        {formatDate(session.clockInTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(session.clockInTime)} - {session.clockOutTime ? formatTime(session.clockOutTime) : 'Active'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(session.duration || 0)}
                      </div>
                      <div className={`text-xs ${session.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}