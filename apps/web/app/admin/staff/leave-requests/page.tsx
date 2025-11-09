"use client";
import { useEffect, useState } from 'react';
// Auth is handled by layout, no need for AuthWrapper
import { GlassCard } from '@/components/ui/glass-card';


import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { AdminPageSkeleton } from '@/components/admin/skeletons';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Calendar, CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function AdminStaffLeaveRequestsPage() {
  
  
  const { user: adminUser, loading: adminLoading, sessionToken } = useAdminUser();
  const requests = useQuery(
    api.queries.staff.getAllLeaveRequests,
    sessionToken ? { status: 'pending', sessionToken } : "skip"
  );
  const approveRequest = useMutation(api.mutations.staff.updateLeaveRequestStatus);
  const rejectRequest = useMutation(api.mutations.staff.updateLeaveRequestStatus);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const isAdmin = adminUser?.role === 'admin';

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await approveRequest({ requestId: id as Id<'leaveRequests'>, status: 'approved', reviewedBy: adminUser?._id as Id<'users'> });
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('Permission denied')) {
        setError('You do not have permission to approve requests. Only admins can perform this action.');
      } else {
        setError('Failed to approve request.');
      }
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      await rejectRequest({ requestId: id as Id<'leaveRequests'>, status: 'rejected', reviewedBy: adminUser?._id as Id<'users'>, reviewNotes: note });
      setRejectingId(null);
      setNote('');
    } catch (err: unknown) {
      if (err instanceof Error && err.message?.includes('Permission denied')) {
        setError('You do not have permission to reject requests. Only admins can perform this action.');
      } else {
        setError('Failed to reject request.');
      }
    }
    setActionLoading(null);
  };

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  
  if (adminLoading) {
    return (
      <div>
        <AdminPageSkeleton title="Loading Leave Requests" description="Preparing your leave requests..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
        <GlassCard className="p-8">
          <h1 className="text-2xl font-asgard text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#F23E2E]" /> Leave Requests
          </h1>
          {error && (
            <div className="text-destructive font-satoshi mb-4 bg-destructive/10 border border-destructive/20 rounded p-3">
              {error}
            </div>
          )}
          {!requests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#F23E2E]" />
              <span className="ml-2 font-satoshi text-gray-700">Loading requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No pending leave requests"
              description="All leave requests have been processed"
              variant="no-data"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-200">
                <thead>
                  <tr className="bg-primary-50">
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Leave Type</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Position</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Start</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">End</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Days</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {requests.map((req: any) => (
                    <tr key={req._id} className="bg-white/80 hover:bg-primary-50 transition-colors">
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.leaveType}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.name || req.staffName || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.department || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.position || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-700">{req.startDate}</td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-700">{req.endDate}</td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-900">{req.totalDays || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-xs">
                        <span className="inline-block px-2 py-1 rounded bg-primary-100 text-primary-800">{req.status}</span>
                      </td>
                      <td className="px-4 py-2 font-satoshi text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => isAdmin ? handleApprove(req._id) : null}
                            disabled={!isAdmin || actionLoading === req._id}
                            className={`inline-flex items-center px-3 py-1 bg-[#F23E2E] text-white rounded hover:bg-[#F23E2E]/90 focus:outline-none focus:ring-2 focus:ring-[#F23E2E] disabled:opacity-50 ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="Approve"
                            title={!isAdmin ? 'Only admins can approve requests.' : ''}
                          >
                            {actionLoading === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Approve
                          </button>
                          <button
                            onClick={() => isAdmin ? setRejectingId(req._id) : null}
                            disabled={!isAdmin}
                            className={`inline-flex items-center px-3 py-1 bg-destructive text-white rounded hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="Reject"
                            title={!isAdmin ? 'Only admins can reject requests.' : ''}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </button>
                        </div>
                        {rejectingId === req._id && (
                          <div className="mt-2 bg-destructive/10 p-2 rounded">
                            <textarea
                              className="w-full px-2 py-1 rounded border border-destructive/20 font-satoshi text-sm mb-2"
                              placeholder="Reason for rejection (optional)"
                              value={note}
                              onChange={e => setNote(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(req._id)}
                                disabled={actionLoading === req._id}
                                className="px-3 py-1 bg-destructive text-white rounded hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive disabled:opacity-50"
                              >
                                {actionLoading === req._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => { setRejectingId(null); setNote(''); }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
    </div>
  );
} 
