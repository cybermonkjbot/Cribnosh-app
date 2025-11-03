"use client";

import { EnhancedActivity } from '@/components/admin/enhanced-activity';
import { EnhancedStats } from '@/components/admin/enhanced-stats';
import { EnhancedSystemHealth } from '@/components/admin/enhanced-system-health';
import { GlassNavbar } from "@/components/admin/glass-navbar";
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation as useConvexMutation, useQuery as useConvexQuery } from 'convex/react';
import { motion } from 'motion/react';
import {
    Activity,
    AlertTriangle,
    Bell,
    CheckCircle,
    Clock,
    Users,
    BarChart3,
    Shield,
    ShoppingCart
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAdminUser } from './AdminUserProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/admin/skeletons';

export default function AdminDashboard() {
  // Section chips must be defined before any use
  const sectionChips = [
    { label: 'Overview', icon: BarChart3 },
    { label: 'System Health', icon: Shield },
    { label: 'Activity', icon: Activity },
  ];
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  
  const dashboardStats = useConvexQuery(api.queries.dashboardStats.getDashboardFooterStats);
  
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
  const unreadCount = notifications?.filter((n: { read: boolean }) => !n.read).length || 0;

  const [activeSection, setActiveSection] = useState<string>(sectionChips[0].label);

  // Section refs for scroll
  const overviewRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);

  // Advanced: Listen for errors from child components via custom events
  useEffect(() => {
    function handleChildError(e: CustomEvent) {
      setError(e.detail || 'Unknown error');
      setLoading(false);
    }
    window.addEventListener('admin-dashboard-error', handleChildError as EventListener);
    setLoading(false); // Assume children handle their own loading, but clear after mount
    return () => {
      window.removeEventListener('admin-dashboard-error', handleChildError as EventListener);
    };
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth is handled by middleware, no client-side checks needed

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-6 sm:p-8 border border-red-300 shadow-xl max-w-md w-full mx-auto"
        >
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold font-asgard text-red-700 mb-4">Dashboard Error</h1>
            <p className="text-gray-700 mb-6 font-satoshi text-sm sm:text-base">{error}</p>
            <Button
              onClick={() => { setError(null); setLoading(false); }}
              className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
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
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0 mobile-viewport-constraint" style={{ minWidth: 0, maxWidth: '100vw' }}>
      {/* Mobile Touch Hint */}
      <div className="sm:hidden bg-gray-50/90 backdrop-blur-sm rounded-xl p-3 border border-gray-200/70 mx-2">
        <div className="flex items-center gap-2 text-gray-700 text-sm font-satoshi">
          <span className="text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span>Swipe left from the left edge or tap the menu button to open navigation</span>
        </div>
      </div>

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
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-700 font-satoshi bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200 min-w-0">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Last updated: {new Date().toLocaleString()}</span>
            <span className="sm:hidden truncate">{new Date().toLocaleString()}</span>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowNotifications(true)}
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white relative w-full sm:w-auto min-h-[44px] flex-shrink-0"
          >
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
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
          ref={overviewRef}
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
          ref={healthRef}
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
          ref={activityRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-2 sm:px-0"
        >
          <EnhancedActivity />
        </motion.section>
      )}

      {/* Enhanced Footer Stats - Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl mx-2 sm:mx-0 max-w-full overflow-hidden"
      >
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 text-center max-w-full overflow-hidden">
          {[
            { 
              label: 'System Status', 
              value: dashboardStats?.systemStatus?.status === 'operational' ? 'Operational' : 'Issues', 
              icon: CheckCircle, 
              color: dashboardStats?.systemStatus?.status === 'operational' ? 'text-green-600' : 'text-red-600', 
              bgColor: dashboardStats?.systemStatus?.status === 'operational' ? 'bg-green-100' : 'bg-red-100' 
            },
            { 
              label: 'Active Users', 
              value: dashboardStats?.activeUsers?.count?.toLocaleString() || '0', 
              icon: Users, 
              color: 'text-blue-600', 
              bgColor: 'bg-blue-100' 
            },
            { 
              label: 'Live Streams', 
              value: dashboardStats?.liveStreams?.count?.toString() || '0', 
              icon: Activity, 
              color: 'text-purple-600', 
              bgColor: 'bg-purple-100' 
            },
            { 
              label: 'Pending Orders', 
              value: dashboardStats?.pendingOrders?.count?.toLocaleString() || '0', 
              icon: ShoppingCart, 
              color: 'text-amber-600', 
              bgColor: 'bg-amber-100' 
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="space-y-3 p-2">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <p className="text-sm text-gray-700 font-satoshi">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold font-asgard text-gray-900 break-words">{stat.value}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

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
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : notification.type === 'warning'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : notification.type === 'error'
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-blue-100 border-blue-300 text-blue-800'
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

      <GlassNavbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        notifications={unreadCount}
        onNotificationClick={() => setShowNotifications(true)}
      />
    </div>
  );
}
