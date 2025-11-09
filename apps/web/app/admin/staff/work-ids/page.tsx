"use client";
import { AuthWrapper } from '@/components/layout/AuthWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { useState } from 'react';

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Badge, Loader2, RefreshCw, XCircle } from 'lucide-react';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { WorkIdListSkeleton } from '@/components/admin/skeletons';
import { useMutation, useQuery } from 'convex/react';
import { EmptyState } from '@/components/admin/empty-state';
import { useSessionToken } from '@/hooks/useSessionToken';

export default function AdminStaffWorkIdsPage() {
  const sessionToken = useSessionToken();
  const workIds = useQuery(api.queries.staff.getAllWorkIds, sessionToken ? { sessionToken } : "skip");
  const revokeWorkId = useMutation(api.mutations.staff.revokeWorkId);
  const renewWorkId = useMutation(api.mutations.staff.renewWorkId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [renewDays, setRenewDays] = useState(365);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { user: adminUser, loading: adminLoading } = useAdminUser();
  const isAdmin = adminUser?.role === 'admin';

  const handleRevoke = async (id: any) => {
    if (!adminUser?._id || !id?._id) {
      setError('Missing admin or work ID.');
      return;
    }
    setActionLoading(id._id);
    setError('');
    try {
      await revokeWorkId({workId: id._id, revokedBy: adminUser._id as Id<'users'>, revocationReason,
    sessionToken: sessionToken || undefined
  });
      setRevokingId(null);
      setRevocationReason('');
    } catch (err: any) {
      if (err?.message?.includes('Permission denied')) {
        setError('You do not have permission to revoke Work IDs. Only admins can perform this action.');
      } else {
        setError('Failed to revoke Work ID.');
      }
    }
    setActionLoading(null);
  };

  const handleRenew = async (id: any) => {
    if (!adminUser?._id || !id?._id) {
      setError('Missing admin or work ID.');
      return;
    }
    setActionLoading(id._id);
    setError('');
    try {
      await renewWorkId({workId: id._id, renewedBy: adminUser._id as Id<'users'>, expiresInDays: renewDays,
    sessionToken: sessionToken || undefined
  });
      setRenewingId(null);
      setRenewDays(365);
    } catch (err: any) {
      if (err?.message?.includes('Permission denied')) {
        setError('You do not have permission to renew Work IDs. Only admins can perform this action.');
      } else {
        setError('Failed to renew Work ID.');
      }
    }
    setActionLoading(null);
  };

  
  return (
    <AuthWrapper role="admin">
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <GlassCard className="p-8">
          <h1 className="text-2xl font-asgard text-gray-900 mb-6 flex items-center gap-2">
            <Badge className="w-6 h-6 text-amber-600" /> Staff Work IDs
          </h1>
          {error && <div className="text-red-600 font-satoshi mb-4">{error}</div>}
          {!workIds ? (
            <WorkIdListSkeleton rowCount={5} />
          ) : workIds.length === 0 ? (
            <EmptyState
              icon={Badge}
              title="No Work IDs found"
              description="No work IDs have been issued yet"
              variant="no-data"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-amber-200">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Work ID</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Position</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Issued</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Expires</th>
                    <th className="px-4 py-2 text-left font-satoshi text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {workIds.map((id: any) => (
                    <tr key={id._id} className="bg-white/80 hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{id.workIdNumber}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-900">{id.name || '-'}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{id.department}</td>
                      <td className="px-4 py-2 font-satoshi text-sm text-gray-700">{id.position}</td>
                      <td className="px-4 py-2 font-satoshi text-xs">
                        <span className={`inline-block px-2 py-1 rounded ${id.status === 'active' ? 'bg-green-100 text-green-700' : id.status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>{id.status.charAt(0).toUpperCase() + id.status.slice(1)}</span>
                      </td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-700">{new Date(id.issuedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-satoshi text-xs text-gray-700">{new Date(id.expiresAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 font-satoshi text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => isAdmin ? setRenewingId(id._id) : null}
                            disabled={!isAdmin}
                            className={`inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="Renew"
                            title={!isAdmin ? 'Only admins can renew Work IDs.' : ''}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" /> Renew
                          </button>
                          <button
                            onClick={() => isAdmin ? setRevokingId(id._id) : null}
                            disabled={!isAdmin}
                            className={`inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                            aria-label="Revoke"
                            title={!isAdmin ? 'Only admins can revoke Work IDs.' : ''}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Revoke
                          </button>
                        </div>
                        {renewingId === id._id && (
                          <div className="mt-2 bg-blue-50 p-2 rounded">
                            <label className="block text-xs font-satoshi text-gray-700 mb-1">Renew for (days):</label>
                            <input
                              type="number"
                              min={1}
                              value={renewDays}
                              onChange={e => setRenewDays(Number(e.target.value))}
                              className="w-24 px-2 py-1 rounded border border-blue-200 font-satoshi text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRenew(id)}
                                disabled={!adminUser?._id || !id._id || actionLoading === id._id}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                              >
                                {actionLoading === id._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => { setRenewingId(null); setRenewDays(365); }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {revokingId === id._id && (
                          <div className="mt-2 bg-red-50 p-2 rounded">
                            <label className="block text-xs font-satoshi text-gray-700 mb-1">Reason for revocation:</label>
                            <input
                              type="text"
                              value={revocationReason}
                              onChange={e => setRevocationReason(e.target.value)}
                              className="w-full px-2 py-1 rounded border border-red-200 font-satoshi text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRevoke(id)}
                                disabled={!adminUser?._id || !id._id || actionLoading === id._id}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                              >
                                {actionLoading === id._id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                              </button>
                              <button
                                onClick={() => { setRevokingId(null); setRevocationReason(''); }}
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
