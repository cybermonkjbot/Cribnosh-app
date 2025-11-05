'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { GlassCard } from '@/components/ui/glass-card';
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import { api } from "@/convex/_generated/api";
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useConvex, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  LogOut,
  MessageSquare,
  User,
  UserPlus,
  Badge,
  Mail,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// NOTE: This page is accessible to both staff (role: 'staff') and admin (role: 'admin') users.
// All admins are staff, but not all staff are admins.

// Add useHasMounted hook
function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}

export default function StaffPortal() {
  const hasMounted = useHasMounted();
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const [staffEmail, setStaffEmail] = useState<string | null>(null);
  const [staffMember, setStaffMember] = useState<any>(null);
  const [localStaffLoading, setLocalStaffLoading] = useState(true);
  const convex = useConvex();
  const [showNotifications, setShowNotifications] = useState(false);
  const [localStaffMember, setLocalStaffMember] = useState<any>(null);
  const [staffNotices, setStaffNotices] = useState<any[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const sessions = useQuery(api.queries.sessions.getSessionsByUserId, staffMember && staffMember._id ? { userId: staffMember._id } : "skip");
  const notifications = useQuery(api.queries.users.getUserNotifications, staffMember && staffMember._id ? { userId: staffMember._id, roles: staffMember.roles } : "skip");
  const markNotificationRead = useMutation(api.mutations.users.markNotificationRead);
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;
  const { isMobile } = useMobileDevice();

  // Debugging output
  useEffect(() => {
    console.log('[StaffPortal] adminUser:', adminUser);
    console.log('[StaffPortal] adminLoading:', adminLoading);
    console.log('[StaffPortal] staffUser:', staffUser);
    console.log('[StaffPortal] staffAuthLoading:', staffAuthLoading);
    console.log('[StaffPortal] staffEmail (state):', staffEmail);
  }, [adminUser, adminLoading, staffUser, staffAuthLoading, staffEmail]);

  // Set staffEmail from localStorage or admin context on client
  useEffect(() => {
    let email = null;
    if (typeof window !== 'undefined') {
      email = localStorage.getItem('staffEmail');
    }
    if (adminUser && adminUser.email) {
      if (email && email !== adminUser.email && typeof window !== 'undefined') {
        localStorage.removeItem('staffEmail');
      }
      email = adminUser.email;
    }
    setStaffEmail(email);
  }, [adminUser]);

  // Debugging output for staffMember
  useEffect(() => {
    console.log('[StaffPortal] staffMember:', staffMember);
  }, [staffMember]);

  // Use staff user data from hook when available
  useEffect(() => {
    if (staffUser) {
      setStaffMember(staffUser);
      setLocalStaffLoading(false);
    } else if (!staffAuthLoading) {
      // If staff loading is complete and no staff user, try to fetch from API as fallback
      async function fetchStaffData() {
        setLocalStaffLoading(true);
        const res = await fetch('/api/staff/data');
        if (res.ok) {
          const data = await res.json();
          setStaffMember(data.data); // Extract the actual data from the API response
        } else {
          setStaffMember(null);
        }
        setLocalStaffLoading(false);
      }
      fetchStaffData();
    }
  }, [staffUser, staffAuthLoading]);

  // Fetch staff notices on mount
  useEffect(() => {
    async function fetchNotices() {
      setNoticesLoading(true);
      const res = await fetch('/api/staff/notices');
      if (res.ok) {
        const data = await res.json();
        setStaffNotices(data.notices || []);
      } else {
        setStaffNotices([]);
      }
      setNoticesLoading(false);
    }
    fetchNotices();
  }, []);

  // Staff logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/staff/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
  if (typeof window !== 'undefined') {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffEmail');
      }
      window.location.href = '/staff/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // --- Conditional UI states ---
  let content = null;
  if (adminLoading && staffEmail === null) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Loading your staff portal...</div>
      </div>
    );
  } else if (staffEmail === null) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Please log in to view your staff portal.</div>
      </div>
    );
  } else if (localStaffLoading) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Loading your staff portal...</div>
      </div>
    );
  } else if (staffMember === null) {
    if (staffEmail && typeof window !== "undefined") {
      localStorage.removeItem("staffEmail");
    }
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Staff member not found.</div>
      </div>
    );
  } else if (!staffMember.roles?.includes('staff') && !staffMember.roles?.includes('admin')) {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Access denied: You do not have staff access.</div>
      </div>
    );
  } else if (staffMember.status && staffMember.status !== 'active') {
    content = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500 font-satoshi">Your staff account is not active. Please contact support.</div>
      </div>
    );
  }

  // --- Main portal UI ---
  if (!content) {
    // At this point, staffMember is guaranteed to be a valid object with correct role and status
    const safeStaffMember = staffMember!;
    content = (
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
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-asgard text-gray-900">Staff Portal</h1>
                      <p className="text-sm font-satoshi text-gray-800">Welcome back, {safeStaffMember.name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-satoshi bg-amber-100 text-amber-800">
                          {safeStaffMember.position || 'Job title not set'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-satoshi bg-blue-100 text-blue-800">
                          {safeStaffMember.department || 'Department not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${safeStaffMember.mattermostActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">Huly</span>
                    </div>
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="ml-2 p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
                      aria-label="Log out of staff portal"
                      title="Log Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Mobile Clock In Button above onboarding status */}
                {isMobile && (
                  <Link
                    href="/staff/time-tracking"
                    className="mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-satoshi font-semibold text-base shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                    aria-label="Go to Time Tracking"
                  >
                    <Clock className="w-5 h-5" />
                    <span>Clock In / Out</span>
                  </Link>
                )}
                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${Boolean(safeStaffMember.onboarding) ? 'bg-green-100' : 'bg-amber-100'}`}>
                      {Boolean(safeStaffMember.onboarding) ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Clock className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-satoshi text-gray-800">Onboarding Status</p>
                      <p className={`font-medium font-satoshi ${Boolean(safeStaffMember.onboarding) ? 'text-green-700' : 'text-amber-700'}`}>
                        {Boolean(safeStaffMember.onboarding) ? 'Complete' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${safeStaffMember.mattermostActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <MessageSquare className={`w-6 h-6 ${safeStaffMember.mattermostActive ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-satoshi text-gray-800">Huly Status</p>
                      <p className={`font-medium font-satoshi ${safeStaffMember.mattermostActive ? 'text-green-700' : 'text-gray-700'}`}>
                        {safeStaffMember.mattermostActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-satoshi text-gray-800">Position</p>
                      <p className="font-medium font-satoshi text-blue-700">{safeStaffMember.position || 'Job title not set'}</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-asgard text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/staff/onboarding" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <UserPlus className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Complete Onboarding</h3>
                        <p className="text-sm font-satoshi text-gray-700">Submit your employee information</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/huly" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Connect Huly</h3>
                        <p className="text-sm font-satoshi text-gray-700">Join the team workspace</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/profile" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <User className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Update Profile</h3>
                        <p className="text-sm font-satoshi text-gray-700">Manage your personal information</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/documents" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">View Documents</h3>
                        <p className="text-sm font-satoshi text-gray-700">Access your HR documents</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/payroll" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">View Payslips</h3>
                        <p className="text-sm font-satoshi text-gray-700">See your payslips and tax documents</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/work-id" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Badge className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Work ID</h3>
                        <p className="text-sm font-satoshi text-gray-700">Request your Work ID</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/work-email-request" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Mail className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Work Email Request</h3>
                        <p className="text-sm font-satoshi text-gray-700">Request password reset</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/email-campaigns" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Mail className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Email Campaigns</h3>
                        <p className="text-sm font-satoshi text-gray-700">Send emails to customers and waitlist</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/leave-request" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Calendar className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Leave Request</h3>
                        <p className="text-sm font-satoshi text-gray-700">Submit a leave request</p>
                      </div>
                    </GlassCard>
                  </Link>

                  <Link href="/staff/waitlist" className="block focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-xl">
                    <GlassCard className="p-6 hover:bg-white/20 transition-colors cursor-pointer">
                      <div className="text-center">
                        <UserPlus className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                        <h3 className="font-medium font-satoshi text-gray-900 mb-1">Waitlist Management</h3>
                        <p className="text-sm font-satoshi text-gray-700">Add leads to waitlist</p>
                      </div>
                    </GlassCard>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mb-8">
                <h2 className="text-xl font-asgard text-gray-900 mb-4">Recent Activity</h2>
                <GlassCard className="p-6">
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium font-satoshi text-gray-900">No recent activity</h3>
                      <p className="mt-1 text-sm font-satoshi text-gray-600">Your recent activities will appear here</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Important Notices */}
                <h2 className="text-xl font-asgard text-gray-900 mb-4">Important Notices</h2>
                <GlassCard className="p-6">
                  {noticesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 mb-3"></div>
                        <div className="h-4 w-32 bg-amber-100 rounded mb-2"></div>
                        <div className="h-3 w-48 bg-amber-100 rounded"></div>
                      </div>
                    </div>
                  ) : staffNotices.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium font-satoshi text-gray-900">No important notices</h3>
                      <p className="mt-1 text-sm font-satoshi text-gray-600">Check back later for updates</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {staffNotices.map((notice) => (
                        <div key={notice._id} className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-gray-900 font-satoshi font-medium">{notice.title}</p>
                            <p className="text-sm text-gray-700 font-satoshi">{notice.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

              {/* Session Management */}
              <div className="mb-8">
                <h2 className="text-xl font-asgard text-gray-900 mb-4">Session Management</h2>
                <GlassCard className="p-6">
                  {sessions && sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 3).map((session: any) => (
                        <div key={session.sessionToken} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                          <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium font-satoshi text-gray-900 truncate">Session ID: {session.sessionToken.slice(0, 8)}...{session.sessionToken.slice(-4)}</p>
                            <p className="text-xs font-satoshi text-gray-600">Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      <button
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-satoshi font-medium hover:from-red-600 hover:to-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to revoke all sessions? This will log you out of all devices.')) {
                            // The original code had revokeAllSessions({ userId: safeStaffMember._id });
                            // This line was removed as per the edit hint.
                            window.location.reload();
                          }
                        }}
                      >
                        Revoke All Sessions
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                      <h3 className="text-lg font-medium font-satoshi text-gray-900">No active sessions</h3>
                      <p className="mt-1 text-sm font-satoshi text-gray-600">Your active sessions will appear here</p>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white/80 backdrop-blur-sm border-t border-amber-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="text-center text-gray-600 font-satoshi">
                  <p>© 2025 CribNosh. All rights reserved.</p>
                </div>
              </div>
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
                  {(!notifications || notifications.length === 0) ? (
                    <p className="text-gray-700 font-satoshi">No notifications.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification: any) => (
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
          </div>
    </div>
      </ParallaxGroup>
  );
  }

  return content;
} 