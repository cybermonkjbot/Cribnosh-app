"use client";

import { GlassNavbar } from "@/components/admin/glass-navbar";
import { api } from '@/convex/_generated/api';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { staffFetch } from '@/lib/api/staff-api-helper';
import { useMutation, useQuery } from 'convex/react';
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// Add useHasMounted hook
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/staff/login";
  const [showNotifications, setShowNotifications] = useState(false);
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const userId = staffUser?._id;
  const userRoles = staffUser?.roles;
  const queryArgs = staffUser && staffUser._id 
    ? { userId: staffUser._id, roles: staffUser.roles }
    : "skip";
  const queryFn = api.queries.users.getUserNotifications as any;
  const staffNotifications = useQuery(queryFn, queryArgs as any);
  const markNotificationRead = useMutation(api.mutations.users.markNotificationRead);
  const unreadCount = staffNotifications?.filter((n: any) => !n.read).length || 0;
  const { isMobile } = useMobileDevice();
  const hasMounted = useHasMounted();

  if (!hasMounted) return null;

  const handleLogout = async () => {
    try {
      await staffFetch('/api/staff/auth/logout', {
        method: 'POST',
      });
      router.push('/staff/login');
    } catch (error) {
      // Silently handle logout errors
      router.push('/staff/login');
    }
  };

  // Determine environment for indicator
  const isProduction = process.env.NODE_ENV === 'production';
  const envLabel = isProduction ? 'Production' : 'Development';
  const envColor = isProduction ? 'bg-green-500' : 'bg-yellow-400';
  const envText = isProduction ? 'text-green-700' : 'text-yellow-700';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Enhanced Navbar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <GlassNavbar 
          onMenuClick={() => {}} // No sidebar for staff
          notifications={unreadCount}
          onNotificationClick={() => setShowNotifications(true)}
          staffUser={staffUser}
          staffLoading={staffAuthLoading}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex">
        <main className="flex-1 p-4 lg:p-8 mt-16 lg:mt-20 transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-amber-200 relative">
            <button
              onClick={() => setShowNotifications(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              aria-label="Close notifications"
            >
              ×
            </button>
            <h2 className="text-xl font-bold font-asgard text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-amber-600" /> Notifications
            </h2>
            {(!staffNotifications || staffNotifications.length === 0) ? (
              <p className="text-gray-700 font-satoshi">No notifications.</p>
            ) : (
              <div className="space-y-3">
                {staffNotifications.map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`flex items-center justify-between p-4 rounded-xl border font-satoshi ${
                      notification.type === 'success'
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : notification.type === 'warning'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : notification.type === 'error'
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-blue-100 border-blue-300 text-blue-800'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-700">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={async () => await markNotificationRead({ notificationId: notification._id })}
                        className="ml-4 text-xs text-amber-700 hover:text-amber-900 underline"
                        aria-label="Mark as read"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Status Indicator - Glassmorphism for key component */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="fixed top-20 right-4 z-40"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-xl p-3 border border-white/20 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${envColor}`}></div>
              <span className={`text-xs font-medium font-satoshi ${envText}`}>{envLabel} Mode</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 