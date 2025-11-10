"use client";
import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { BackButton } from '@/components/staff/BackButton';
import { PageContainer } from '@/components/staff/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { RequestHistory } from '@/components/ui/request-history';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function WorkEmailRequestPage() {
  const { staff: staffUser, loading: staffAuthLoading, sessionToken } = useStaffAuthContext();
  
  const profile = useQuery(
    api.queries.users.getById,
    staffUser?._id && sessionToken
      ? { userId: staffUser._id, sessionToken }
      : 'skip'
  );
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
      <div className="min-h-screen bg-white/95 backdrop-blur-sm">
        <PageContainer>
          <BackButton href="/staff/portal" className="mb-4" />

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-700 font-satoshi mb-6">You need to be signed in to request a password reset.</p>
            <div className="space-y-3">
              <Link href="/staff/login">
                <button className="w-full px-4 py-2 bg-[#F23E2E] hover:bg-[#ed1d12] text-white rounded-lg font-satoshi font-medium transition-colors">
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
        </PageContainer>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white/95 backdrop-blur-sm">
        <PageContainer>
          <BackButton href="/staff/portal" className="mb-4" />
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
              <div className="w-16 h-16 bg-[#F23E2E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F23E2E]"></div>
              </div>
              <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Loading Profile</h2>
              <p className="text-gray-700 font-satoshi">Please wait while we retrieve your profile information...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen bg-white/95 backdrop-blur-sm">
        <PageContainer>
          <BackButton href="/staff/portal" className="mb-4" />
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-700 font-satoshi mb-6">We couldn't find your profile information. This might be due to a system error or your account may need to be set up.</p>
            <div className="space-y-3">
              <Link href="/staff/portal">
                <button className="w-full px-4 py-2 bg-[#F23E2E] hover:bg-[#ed1d12] text-white rounded-lg font-satoshi font-medium transition-colors">
                  Return to Portal
                </button>
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-satoshi font-medium hover:bg-gray-50 transition-colors">
                Contact HR
              </button>
            </div>
          </div>
        </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/95 backdrop-blur-sm">
      <PageContainer maxWidth="2xl">
        <BackButton href="/staff/portal" className="mb-4" />
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
                className="w-full px-4 py-2 rounded-lg border border-gray-200/60 bg-gray-100 font-satoshi"
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
                className="w-full px-4 py-2 rounded-lg border border-gray-200/60 bg-gray-100 font-satoshi"
                required
              />
            </div>
            {error && <div className="text-red-600 font-satoshi text-sm">{error}</div>}
            {success && <div className="text-green-600 font-satoshi text-sm">Request submitted successfully!</div>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#F23E2E] text-white font-asgard text-lg shadow hover:bg-[#ed1d12] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E]"
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
      </PageContainer>
    </div>
  );
} 