"use client";

import { EnhancedActivity } from '@/components/admin/enhanced-activity';
import { EnhancedStats } from '@/components/admin/enhanced-stats';
import { EnhancedSystemHealth } from '@/components/admin/enhanced-system-health';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation as useConvexMutation, useQuery as useConvexQuery } from 'convex/react';
import { motion } from 'motion/react';
import {
    Activity,
    AlertTriangle,
    Bell,
    BarChart3,
    Shield
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdminUser } from './AdminUserProvider';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/admin/skeletons';

export default function AdminDashboard() {
  // Section chips must be defined before any use
  const sectionChips = [
    { label: 'Overview', icon: BarChart3 },
    { label: 'System Health', icon: Shield },
    { label: 'Activity', icon: Activity },
  ];
  const [error, setError] = useState<string | null>(null);
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  
  // Get real notifications from Convex
  const notifications = useConvexQuery(
    api.queries.notifications.getUserNotifications,
    adminUser && adminUser._id ? { 
      userId: adminUser._id as Id<"users">, 
      roles: adminUser.role ? [adminUser.role] : [] 
    } : "skip"
  );
  const markNotificationRead = useConvexMutation(api.mutations.users.markNotificationRead);
  const [showNotifications, setShowNotifications] = useState(false);

  const [activeSection, setActiveSection] = useState<string>(sectionChips[0].label);

  // Advanced: Listen for errors from child components via custom events
  useEffect(() => {
    function handleChildError(e: CustomEvent) {
      setError(e.detail || 'Unknown error');
    }
    window.addEventListener('admin-dashboard-error', handleChildError as EventListener);
    return () => {
      window.removeEventListener('admin-dashboard-error', handleChildError as EventListener);
    };
  }, []);

  // Auth is handled by layout via session-based authentication (session token in cookies)
  // Middleware (proxy.ts) validates session token server-side, no client-side checks needed

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-6 sm:p-8 border border-gray-300 shadow-xl max-w-md w-full mx-auto"
        >
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-900 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold font-asgard text-gray-900 mb-4">Dashboard Error</h1>
            <p className="text-gray-700 mb-6 font-satoshi text-sm sm:text-base">{error}</p>
            <Button
              onClick={() => { setError(null); }}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white w-full sm:w-auto"
            >
              Retry Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (adminLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between px-2 sm:px-0 max-w-full overflow-hidden"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold font-asgard text-gray-900 mb-2 lg:mb-3 break-words">
            Admin Dashboard
          </h1>
          <p className="text-gray-700 font-satoshi text-sm sm:text-base lg:text-lg break-words">
            Welcome back! Here's what's happening with CribNosh today.
          </p>
        </div>
        
      </motion.div>

      {/* Enhanced Section Filter Chips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 sm:gap-3 overflow-x-auto py-2 mb-4 scrollbar-hide px-2 sm:px-0 pb-4 max-w-full"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {sectionChips.map(chip => {
          const Icon = chip.icon;
          return (
            <Button
              key={chip.label}
              onClick={() => setActiveSection(chip.label)}
              variant={activeSection === chip.label ? "default" : "outline"}
              size="lg"
              className={`rounded-xl px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 font-satoshi shadow-lg transition-all duration-300 whitespace-nowrap font-medium border min-w-fit touch-manipulation min-h-[44px] flex-shrink-0 text-xs sm:text-sm ${
                activeSection === chip.label
                  ? 'bg-[#F23E2E] text-white border-[#F23E2E] shadow-xl' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:bg-white hover:shadow-xl'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">{chip.label}</span>
              <span className="sm:hidden">{chip.label.split(' ')[0]}</span>
            </Button>
          );
        })}
      </motion.div>

      {/* Overview Section - Stats and Analytics */}
      {activeSection === 'Overview' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 px-2 sm:px-0"
        >
          <EnhancedStats onError={(err) => setError(err)} />
        </motion.section>
      )}

      {/* System Health */}
      {activeSection === 'System Health' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 sm:mb-8 px-2 sm:px-0"
        >
          <EnhancedSystemHealth />
        </motion.section>
      )}

      {/* Activity Feed */}
      {activeSection === 'Activity' && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-2 sm:px-0"
        >
          <EnhancedActivity />
        </motion.section>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 max-w-full overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md mx-auto p-4 sm:p-6 border border-gray-200 relative max-h-[90vh] overflow-y-auto max-w-full overflow-hidden"
          >
            <button
              onClick={() => setShowNotifications(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 min-h-[44px]"
              aria-label="Close notifications"
            >
              ×
            </button>
            <h2 className="text-xl font-bold font-asgard text-gray-900 mb-4 flex items-center gap-2 pr-8">
              <Bell className="w-6 h-6 text-primary-600" /> Notifications
            </h2>
            {(!notifications || notifications.length === 0) ? (
              <p className="text-gray-700 font-satoshi">No notifications.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border font-satoshi gap-3 ${
                      notification.type === 'success'
                        ? 'bg-[#F23E2E]/10 border-[#F23E2E]/30 text-[#F23E2E]'
                        : notification.type === 'warning'
                        ? 'bg-gray-100 border-gray-300 text-gray-800'
                        : notification.type === 'error'
                        ? 'bg-gray-100 border-gray-300 text-gray-800'
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">{notification.message}</p>
                      <p className="text-xs text-gray-700">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => await markNotificationRead({ notificationId: notification._id as any })}
                        className="text-xs min-h-[44px] w-full sm:w-auto flex-shrink-0"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
