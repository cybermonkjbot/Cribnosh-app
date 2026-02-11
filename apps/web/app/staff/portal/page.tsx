'use client';

import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { GlassCard } from '@/components/ui/glass-card';
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import { api } from "@/convex/_generated/api";
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Badge,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Mail,
  User,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.

export default function StaffPortal() {
  const { staff: staffUser, loading: staffAuthLoading, sessionToken } = useStaffAuthContext();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch assignment data (department, position) via Convex
  const assignment = useQuery(
    api.queries.staff.getStaffAssignmentByUser,
    staffUser?._id && sessionToken
      ? { userId: staffUser._id, sessionToken }
      : "skip"
  );

  // Fetch active notices via Convex
  const staffNoticesData = useQuery(
    api.queries.staff.getActiveStaffNotices,
    sessionToken
      ? {
        sessionToken,
        department: assignment?.department,
        position: assignment?.position
      }
      : "skip"
  );
  const staffNotices = staffNoticesData || [];
  const noticesLoading = staffNoticesData === undefined;

  const notifications = useQuery(
    api.queries.users.getUserNotifications,
    staffUser?._id && sessionToken
      ? { userId: staffUser._id, roles: staffUser.roles, sessionToken } as any
      : "skip"
  );
  const markNotificationRead = useMutation(api.mutations.users.markNotificationRead);

  // Helper to mark notification as read with session token
  const handleMarkNotificationRead = async (notificationId: any) => {
    if (!sessionToken) return;
    await markNotificationRead({
      notificationId,
      sessionToken
    });
  };
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;
  const { isMobile } = useMobileDevice();

  // --- Conditional UI states ---
  // Auth is handled at layout level via session-based authentication (session token in cookies)
  // No page-level auth checks needed - layout validates session token server-side
  // Wait for staff member data to load
  if (staffAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F23E2E] mx-auto mb-4"></div>
          <p className="text-gray-600 font-satoshi">Loading...</p>
        </div>
      </div>
    );
  }

  // If we still don't have staff data after loading completes, show loading
  if (!staffUser) {
    return null; // Wait for staff data to be available
  }

  // Merge assignment data into staff user for UI
  const displayPosition = assignment?.position || staffUser.position || 'Job title not set';
  const displayDepartment = assignment?.department || staffUser.department || 'Department not set';

  // --- Main portal UI ---
  return (
    <ParallaxGroup>
      {/* Red accent blob (stain) */}
      <ParallaxLayer asBackground speed={0.2} className="z-0 pointer-events-none">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#ff3b30] opacity-30 blur-[120px] rounded-full" />
      </ParallaxLayer>
      {/* Blurred brand blobs (desktop only) */}
      <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none hidden md:block">
        <div className="fixed inset-0">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
        </div>
      </ParallaxLayer>
      {/* Main content wrapper */}
      <div className="relative z-10">
        <div className="min-h-screen bg-white/95 backdrop-blur-sm">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-[#F23E2E] rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-asgard text-gray-900">Staff Portal</h1>
                    <p className="text-sm font-satoshi text-gray-800">Welcome back, {staffUser.name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-satoshi bg-[#F23E2E]/10 text-[#F23E2E]">
                        {displayPosition}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-satoshi bg-gray-100 text-gray-800">
                        {displayDepartment}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Mobile Clock In Button above onboarding status */}
              {isMobile && (
                <Link
                  href="/staff/time-tracking"
                  className="mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white font-satoshi font-semibold text-base shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50"
                  aria-label="Go to Time Tracking"
                >
                  <Clock className="w-5 h-5" />
                  <span>Clock In / Out</span>
                </Link>
              )}
              <GlassCard className="p-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${staffUser.onboarding ? 'bg-[#F23E2E]/10' : 'bg-gray-100'}`}>
                    {staffUser.onboarding ? (
                      <CheckCircle className="w-6 h-6 text-[#F23E2E]" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-900" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-satoshi text-gray-800">Onboarding Status</p>
                    <p className={`font-medium font-satoshi ${staffUser.onboarding ? 'text-[#F23E2E]' : 'text-gray-900'}`}>
                      {staffUser.onboarding ? 'Complete' : 'In Progress'}
                    </p>
                  </div>
                </div>
              </GlassCard>


            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-asgard text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/staff/onboarding" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <UserPlus className="w-8 h-8 text-[#F23E2E] mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Complete Onboarding</h3>
                      <p className="text-sm font-satoshi text-gray-700">Submit your employee information</p>
                    </div>
                  </GlassCard>
                </Link>



                <Link href="/staff/documents" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">View Documents</h3>
                      <p className="text-sm font-satoshi text-gray-700">Access your HR documents</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/payroll" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">View Payslips</h3>
                      <p className="text-sm font-satoshi text-gray-700">See your payslips and tax documents</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/work-id" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Badge className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Work ID</h3>
                      <p className="text-sm font-satoshi text-gray-700">Request your Work ID</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/work-email-request" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Mail className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Work Email Request</h3>
                      <p className="text-sm font-satoshi text-gray-700">Request password reset</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/email-campaigns" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Mail className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Email Campaigns</h3>
                      <p className="text-sm font-satoshi text-gray-700">Send emails to customers and waitlist</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/blog" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Blog Posts</h3>
                      <p className="text-sm font-satoshi text-gray-700">Create and manage blog posts</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/leave-request" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <Calendar className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Leave Request</h3>
                      <p className="text-sm font-satoshi text-gray-700">Submit a leave request</p>
                    </div>
                  </GlassCard>
                </Link>

                <Link href="/staff/waitlist" className="block focus:outline-none focus:ring-2 focus:ring-[#F23E2E] rounded-xl">
                  <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                    <div className="text-center">
                      <UserPlus className="w-8 h-8 text-gray-900 mx-auto mb-3" />
                      <h3 className="font-medium font-satoshi text-gray-900 mb-1">Waitlist Management</h3>
                      <p className="text-sm font-satoshi text-gray-700">Add leads to waitlist</p>
                    </div>
                  </GlassCard>
                </Link>
              </div>
            </div>

            {/* Important Notices */}
            <h2 className="text-xl font-asgard text-gray-900 mb-4">Important Notices</h2>
            <GlassCard className="p-6">
              {noticesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#F23E2E]/10 mb-3"></div>
                    <div className="h-4 w-32 bg-[#F23E2E]/10 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-[#F23E2E]/10 rounded"></div>
                  </div>
                </div>
              ) : staffNotices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium font-satoshi text-gray-900">No important notices</h3>
                  <p className="mt-1 text-sm font-satoshi text-gray-600">Check back later for updates</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staffNotices.map((notice: any) => (
                    <div key={notice._id} className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-[#F23E2E] mt-0.5" />
                      <div>
                        <p className="text-gray-900 font-satoshi font-medium">{notice.title}</p>
                        <p className="text-sm text-gray-700 font-satoshi">{notice.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
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
                {(!notifications || notifications.length === 0) ? (
                  <p className="text-gray-700 font-satoshi">No notifications.</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification: any) => (
                      <div
                        key={notification._id}
                        className={`flex items-center justify-between p-4 rounded-xl border font-satoshi ${notification.type === 'success'
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
                          <p className="text-xs text-gray-700">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}</p>
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
      </div>
    </ParallaxGroup>
  );
} 