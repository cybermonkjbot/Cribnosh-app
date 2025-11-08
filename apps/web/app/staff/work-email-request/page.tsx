"use client";
import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { RequestStatus } from '@/components/ui/request-status';
import { RequestHistory } from '@/components/ui/request-history';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { Id } from '@/convex/_generated/dataModel';

export default function WorkEmailRequestPage() {
  const { staff: staffUser, loading: staffAuthLoading } = useStaffAuth();
  const profile = useQuery(api.queries.users.getById, staffUser?._id ? { userId: staffUser._id } : 'skip');
  const userId = profile?._id as Id<'users'> | undefined;
  const [form, setForm] = useState({
    requestedEmail: profile?.email || '',
    reason: 'Password reset',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const createRequest = useMutation(api.mutations.staff.createWorkEmailRequest);
  const requests = useQuery(api.queries.staff.getWorkEmailRequestsByUser, userId ? { userId } : 'skip');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Only allow changes to requestedEmail if needed, but keep it readOnly
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requestedEmail || !form.reason) {
      setError('All fields are required.');
      return;
    }
    try {
      if (!userId) {
        setError('User not found. Please log in again.');
        return;
      }
      await createRequest({
        userId,
        requestedEmail: form.requestedEmail,
        reason: form.reason,
        department: profile?.department || '',
        position: profile?.position || '',
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit request.');
    }
  };

  // Auth is handled at layout level, no page-level checks needed
  // Wait for data to load
  if (!staffUser && staffAuthLoading) {
    return null; // Layout handles loading state
  }

  if (!staffUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-700 font-satoshi mb-6">You need to be signed in to request a password reset.</p>
            <div className="space-y-3">
              <Link href="/staff/login">
                <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi font-medium transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                  Return to Portal
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Loading Profile</h2>
            <p className="text-gray-700 font-satoshi">Please wait while we retrieve your profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        {/* Back Button */}
        <div className="w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-700 font-satoshi mb-6">We couldn't find your profile information. This might be due to a system error or your account may need to be set up.</p>
            <div className="space-y-3">
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-satoshi font-medium transition-colors">
                  Return to Portal
                </button>
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                Contact HR
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/staff/portal" className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-asgard text-gray-900">Request Work Email Password Reset</h1>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="requestedEmail" className="block text-sm font-satoshi text-gray-700 mb-1">Work Email</label>
              <input
                id="requestedEmail"
                name="requestedEmail"
                type="email"
                value={profile?.email || ''}
                readOnly
                className="w-full px-4 py-2 rounded-lg border border-amber-200 bg-gray-100 font-satoshi"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-satoshi text-gray-700 mb-1">Reason</label>
              <input
                id="reason"
                name="reason"
                type="text"
                value="Password reset"
                readOnly
                className="w-full px-4 py-2 rounded-lg border border-amber-200 bg-gray-100 font-satoshi"
                required
              />
            </div>
            {error && <div className="text-red-600 font-satoshi text-sm">{error}</div>}
            {success && <div className="text-green-600 font-satoshi text-sm">Request submitted successfully!</div>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-amber-600 text-white font-asgard text-lg shadow hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Submit work email password reset request"
            >
              Request Password Reset
            </button>
          </form>
        </GlassCard>
        <div className="mt-8">
          <h2 className="text-lg font-asgard text-gray-900 mb-2">Your Previous Requests</h2>
          <RequestHistory type="workEmail" requests={requests || []} />
        </div>
      </div>
    </div>
  );
} 