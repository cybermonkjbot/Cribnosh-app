"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
// Auth is handled by layout, no need for AuthWrapper
import { EmptyState } from '@/components/admin/empty-state';
import { AdminPageSkeleton, StaffActivitySkeleton, StaffStatsSkeleton } from '@/components/admin/skeletons';
import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Calendar, FileText, Mail, Shield, Users } from 'lucide-react';
import dynamic from 'next/dynamic';

const ClientDate = dynamic(() => import('@/components/ui/client-date'), { ssr: false });

export default function AdminStaffOverviewPage() {
  const { user: adminUser, loading: adminLoading, sessionToken } = useAdminUser();
  
  const stats = useQuery(
    api.queries.staff.getStaffOverviewStats,
    sessionToken ? { sessionToken } : 'skip'
  );
  const dashboard = useQuery(
    api.queries.staff.getAdminStaffDashboard,
    sessionToken ? { sessionToken } : 'skip'
  );

  if (!stats || !dashboard) {
    return (
      <div>
        <AdminPageSkeleton title="Loading Staff Overview" description="Preparing your staff overview..." />
      </div>
    );
  }

  // Find current user's staff assignment (if any)
  let currentAssignment: any = null;
  if (adminUser && dashboard.staff) {
    currentAssignment = dashboard.staff.find((s: any) => s._id === adminUser._id || s.email === adminUser.email);
  }

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
          <GlassCard className="p-8 mb-8">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-asgard text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#F23E2E]" /> Staff Overview
              </h1>
              {adminUser && (
                <div className="text-right">
                  <div className="font-satoshi text-lg text-gray-900 font-semibold">{adminUser.name}</div>
                  <div className="font-satoshi text-gray-700 text-sm">{adminUser.email}</div>
                  {currentAssignment && (currentAssignment.department || currentAssignment.position) ? (
                    <div className="font-satoshi text-gray-600 text-sm">
                      {currentAssignment.department && <span>{currentAssignment.department}</span>}
                      {currentAssignment.department && currentAssignment.position && <span> &middot; </span>}
                      {currentAssignment.position && <span>{currentAssignment.position}</span>}
                    </div>
                  ) : (
                    <div className="font-satoshi text-gray-700 text-sm">{adminUser.role === 'admin' ? 'Admin' : 'Staff'}</div>
                  )}
                </div>
              )}
            </div>
            {/* Staff Table */}
            <div className="overflow-x-auto mb-8">
              <table className="min-w-full divide-y divide-primary-100">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50">
                  {dashboard.staff && dashboard.staff.length > 0 ? (
                    dashboard.staff.map((user: any) => (
                      <tr key={user._id} className="hover:bg-primary-50 transition-colors">
                        <td className="px-4 py-3 font-satoshi font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 font-satoshi text-gray-700">
                          <a href={`mailto:${user.email}`} className="text-primary-600 hover:underline">{user.email}</a>
                        </td>
                        <td className="px-4 py-3 font-satoshi text-gray-700">{user.department || <span className="text-gray-500">N/A</span>}</td>
                        <td className="px-4 py-3 font-satoshi text-gray-700 capitalize">{user.role}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <EmptyState
                          icon={Users}
                          title="No staff found"
                          description="No staff members have been added yet"
                          variant="compact"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* End Staff Table */}
            {!stats ? (
              <StaffStatsSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
                  <Users className="w-8 h-8 text-[#F23E2E] mb-2" />
                  <div className="text-2xl font-asgard text-gray-900">{stats.totalStaff}</div>
                  <div className="text-sm font-satoshi text-gray-700">Total Staff</div>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
                  <Mail className="w-8 h-8 text-[#F23E2E] mb-2" />
                  <div className="text-2xl font-asgard text-gray-900">{stats.pendingWorkEmailRequests}</div>
                  <div className="text-sm font-satoshi text-gray-700">Pending Work Email Requests</div>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
                  <Calendar className="w-8 h-8 text-[#F23E2E] mb-2" />
                  <div className="text-2xl font-asgard text-gray-900">{stats.pendingLeaveRequests}</div>
                  <div className="text-sm font-satoshi text-gray-700">Pending Leave Requests</div>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
                  <Shield className="w-8 h-8 text-[#F23E2E] mb-2" />
                  <div className="text-2xl font-asgard text-gray-900">{stats.activeWorkIds}</div>
                  <div className="text-sm font-satoshi text-gray-700">Active Work IDs</div>
                </div>
                <div className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
                  <FileText className="w-8 h-8 text-[#F23E2E] mb-2" />
                  <div className="text-2xl font-asgard text-gray-900">{stats.expiredWorkIds}</div>
                  <div className="text-sm font-satoshi text-gray-700">Expired Work IDs</div>
                </div>
              </div>
            )}
          </GlassCard>
          <GlassCard className="p-8">
            <h2 className="text-xl font-asgard text-gray-900 mb-4">Recent Activity</h2>
            {!dashboard ? (
              <StaffActivitySkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-asgard text-lg text-gray-900 mb-2">Recent Work Email Requests</h3>
                  <ul className="divide-y divide-primary-100">
                    {dashboard.pendingWorkEmailRequests.map((req: any) => (
                      <li key={req._id} className="py-2">
                        <span className="font-satoshi text-gray-900">{req.requestedEmail}</span>
                        <ClientDate date={req.submittedAt} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-asgard text-lg text-gray-900 mb-2">Recent Leave Requests</h3>
                  <ul className="divide-y divide-primary-100">
                    {dashboard.pendingLeaveRequests.map((req: any) => (
                      <li key={req._id} className="py-2">
                        <span className="font-satoshi text-gray-900">{req.leaveType}</span>
                        <ClientDate date={req.submittedAt} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-asgard text-lg text-gray-900 mb-2">Recent Work IDs</h3>
                  <ul className="divide-y divide-primary-100">
                    {dashboard.recentWorkIds.map((id: any) => (
                      <li key={id._id} className="py-2">
                        <span className="font-satoshi text-gray-900">{id.name}</span>
                        <ClientDate date={id.issuedAt} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
} 
