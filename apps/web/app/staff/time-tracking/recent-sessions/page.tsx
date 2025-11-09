'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useSession } from '@/lib/auth/use-session';
import { useQuery } from 'convex/react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Clock12, Clock4 } from 'lucide-react';
import Link from 'next/link';

export default function RecentSessionsPage() {
  const { user } = useSession();
  
  // Fetch recent work sessions (last 30 days by default)
  const recentSessions = useQuery(
    api.queries.workSessions.getWorkSessions, 
    user?._id ? { 
      staffId: user._id as Id<"users">,
      limit: 100, // Increase limit to show more sessions
      startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    } : 'skip'
  );

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatDuration = (ms: number) => {
    if (!ms) return 'In Progress';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock12 className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-[#F23E2E]" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (recentSessions === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <Link href="/staff/time-tracking" className="flex items-center text-sm text-gray-600 hover:text-gray-900 w-fit">
          <ArrowLeft className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">Back to Time Tracking</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">Your Work Sessions</h1>
        <div className="hidden sm:block w-24"></div> {/* Spacer for desktop alignment */}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Recent Sessions</h2>
            <div className="flex items-center text-xs sm:text-sm text-gray-500">
              <Calendar className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1.5 flex-shrink-0" />
              <span>Last 30 days</span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentSessions?.length === 0 ? (
            <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
              <Clock4 className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Your work sessions will appear here.</p>
            </div>
          ) : (
            recentSessions?.map((session: any) => (
              <Link 
                key={session._id} 
                href={`/staff/time-tracking/sessions/${session._id}`}
                className="block hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center flex-1 min-w-0">
                      <div className="flex items-center justify-center h-8 sm:h-10 w-8 sm:w-10 rounded-full bg-gray-50 text-gray-700 mr-3 sm:mr-4 mt-0.5 sm:mt-0 flex-shrink-0">
                        {getStatusIcon(session.status)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#F23E2E] truncate">
                          {formatDate(session.clockInTime)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          {formatTime(session.clockInTime)} - {session.clockOutTime ? formatTime(session.clockOutTime) : 'Active'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatDuration(session.duration || 0)}
                      </div>
                      <div className={`text-xs text-gray-500 font-medium`}>
                        {session.status === 'active' ? 'In Progress' : 'Completed'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
