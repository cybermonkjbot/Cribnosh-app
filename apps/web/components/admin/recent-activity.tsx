"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "motion/react";
import { Clock, User, Settings, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  _id: string;
  type: string;
  description: string;
  timestamp: number;
  userId?: string;
  metadata?: {
    entityId?: string;
    entityType?: string;
    details?: any;
  };
}

const activityIcons: Record<string, any> = {
  user_action: User,
  system_event: Settings,
  security_alert: Shield,
  new_user: User,
  new_chef: User,
  content_created: Settings,
  order_created: User,
  payment_processed: User,
};

export function RecentActivity() {
  // Get recent activities from Convex
  const activities = useQuery(api.queries.admin.getRecentActivity, { limit: 10 }) || [];

  return (
    <div className="bg-white/50  backdrop-blur-sm rounded-xl p-6 border border-gray-200/20 shadow-sm">
      <h2 className="text-xl font-bold font-Asgard mb-6 text-gray-900 ">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity: ActivityItem) => {
          const Icon = activityIcons[activity.type] || Settings;
          const isSecurityAlert = activity.type.includes('security') || activity.type.includes('alert');
          const isSystemEvent = activity.type.includes('system') || activity.type.includes('event');
          return (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 rounded-lg hover:bg-gray-100/50 transition-colors min-h-[64px]"
            >
              <div className={`p-2 rounded-lg flex-shrink-0 w-10 h-10 flex items-center justify-center ${isSecurityAlert ? 'bg-red-100/50' : isSystemEvent ? 'bg-blue-100/50' : 'bg-green-100/50'}`}> 
                <Icon className={`w-6 h-6 ${isSecurityAlert ? 'text-red-600' : isSystemEvent ? 'text-blue-600' : 'text-green-600'}`} /> 
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                  <p className="text-base sm:text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                  {activity.userId && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">User ID: {activity.userId}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })
        )}
      </div>
    </div>
  );
}