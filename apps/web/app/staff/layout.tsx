"use client";

import { GlassNavbar } from "@/components/admin/glass-navbar";
import { api } from '@/convex/_generated/api';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { staffFetch } from '@/lib/api/staff-api-helper';
import { useMutation, useQuery } from 'convex/react';
import { Bell } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { StaffAuthProvider, useStaffAuthContext } from './staff-auth-context';

function StaffLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/staff/login";
  const [showNotifications, setShowNotifications] = useState(false);
  const { staff: staffUser, loading: staffAuthLoading, sessionToken } = useStaffAuthContext();
  const userId = staffUser?._id;
  const userRoles = staffUser?.roles;
  
  const queryArgs = staffUser && staffUser._id && sessionToken
    ? { userId: staffUser._id, roles: staffUser.roles, sessionToken }
    : "skip";
  const queryFn = api.queries.users.getUserNotifications as any;
  const staffNotifications = useQuery(queryFn, queryArgs as any);
  const markNotificationRead = useMutation(api.mutations.users.markNotificationRead);
  
  // Helper to mark notification as read with session token
  const handleMarkNotificationRead = async (notificationId: any) => {
    if (!sessionToken) return;
    await markNotificationRead({ 
      notificationId, 
      sessionToken 
    });
  };
  const unreadCount = staffNotifications?.filter((n: any) => !n.read).length || 0;
  const { isMobile } = useMobileDevice();

  // All hooks must be called before any conditional returns (Rules of Hooks)
  // If user data is not available after loading, redirect to login
  // This handles edge cases where middleware might have missed something
  useEffect(() => {
    if (!isLoginPage && !staffAuthLoading && !staffUser) {
      router.replace('/staff/login');
    }
  }, [isLoginPage, staffAuthLoading, staffUser, router]);

  // If account is inactive, redirect to login
  useEffect(() => {
    if (!isLoginPage && staffUser && staffUser.status && staffUser.status !== 'active') {
      router.replace('/staff/login');
    }
  }, [isLoginPage, staffUser, router]);

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

  // Early return for login page (after all hooks are called)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Authentication is handled server-side by middleware (proxy.ts)
  // Middleware validates session token and redirects unauthenticated users to login
  // If we reach this point, the user is authenticated (middleware verified)
  // We only need to wait for user data to load, then redirect if account is inactive
  
  // Show loading state while fetching user data
  if (staffAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white/95 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F23E2E] mx-auto mb-4"></div>
          <p className="text-gray-600 font-satoshi">Loading...</p>
        </div>
      </div>
    );
  }

  // If user data is not available, don't render (redirect is in progress)
  if (!staffUser) {
    return null;
  }

  // If account is inactive, don't render (redirect is in progress)
  if (staffUser.status && staffUser.status !== 'active') {
    return null;
  }

  return (
    <div className="min-h-screen bg-white/95 backdrop-blur-sm">
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200/60 relative">
            <button
              onClick={() => setShowNotifications(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              aria-label="Close notifications"
            >
              ×
            </button>
            <h2 className="text-xl font-bold font-asgard text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#F23E2E]" /> Notifications
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
                        ? 'bg-[#F23E2E]/10 border-[#F23E2E]/30 text-[#F23E2E]'
                        : notification.type === 'warning'
                        ? 'bg-gray-100 border-gray-300 text-gray-800'
                        : notification.type === 'error'
                        ? 'bg-gray-100 border-gray-300 text-gray-800'
                        : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{notification.message}</p>
                      <p className="text-xs text-gray-700">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={async () => await handleMarkNotificationRead(notification._id)}
                        className="ml-4 text-xs text-[#F23E2E] hover:text-[#ed1d12] underline"
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
    </div>
  );
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffAuthProvider>
      <StaffLayoutContent>{children}</StaffLayoutContent>
    </StaffAuthProvider>
  );
} 