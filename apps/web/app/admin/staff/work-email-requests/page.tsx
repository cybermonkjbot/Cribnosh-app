"use client";
import { AuthWrapper } from '@/components/layout/AuthWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { useState, useEffect } from 'react';


import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { CheckCircle, Loader2, Mail, XCircle } from 'lucide-react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminPageSkeleton, RequestListSkeleton } from '@/components/admin/skeletons';

export default function AdminStaffWorkEmailRequestsPage() {
  
  
  interface WorkEmailRequest {
    _id: string;
    requestedEmail?: string;
    name?: string;
    staffName?: string;
    department?: string;
    position?: string;
    submittedAt?: number;
    status?: string;
    [key: string]: unknown;
  }

  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const requests = useQuery(api.queries.staff.getAllWorkEmailRequests, { status: 'pending' }) as WorkEmailRequest[] | undefined;
  const approveRequest = useMutation(api.mutations.staff.updateWorkEmailRequestStatus);
  const rejectRequest = useMutation(api.mutations.staff.updateWorkEmailRequestStatus);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const isAdmin = adminUser?.role === 'admin';

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    setError('');
    try {
      if (!adminUser?._id) throw new Error('Missing admin user ID');
      await approveRequest({ requestId: id as Id<'workEmailRequests'>, status: 'approved', reviewedBy: adminUser._id as Id<'users'> });
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
      if (!adminUser?._id) throw new Error('Missing admin user ID');
      await rejectRequest({ requestId: id as Id<'workEmailRequests'>, status: 'rejected', reviewedBy: adminUser._id as Id<'users'>, reviewNotes: note });
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
      <AuthWrapper role="admin">
        <AdminPageSkeleton title="Loading Work Email Requests" description="Preparing your work email requests..." />
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper role="admin">
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <GlassCard className="p-8">
          <h1 className="text-2xl font-asgard text-gray-900 mb-6 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#F23E2E]" /> Work Email Requests
          </h1>
          {error && (
            <div className="text-destructive font-satoshi mb-4 bg-destructive/10 border border-destructive/20 rounded p-3">
              {error}
            </div>
          )}
          {!requests ? (
            <RequestListSkeleton rowCount={5} />
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-600 font-satoshi py-8">No pending work email requests.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-primary-200">
                <thead>
                  <tr className="bg-primary-50">
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Requested Email</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Position</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Submitted</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {requests?.map((req: WorkEmailRequest) => (
                    <tr key={req._id} className="bg-white/80 hover:bg-primary-50 transition-colors">
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.requestedEmail}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{req.name || req.staffName || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.department || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{req.position || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-700">{req.submittedAt ? new Date(req.submittedAt).toLocaleString() : '-'}</td>
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
    </div>
    </AuthWrapper>
  );
} 
