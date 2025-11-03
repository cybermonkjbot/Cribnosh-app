"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Users, CheckCircle, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

export default function ReferralOnboarding() {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const setReferralProgramActive = useMutation(api.mutations.users.setReferralProgramActive);
  const generateReferralLink = useMutation(api.mutations.users.generateReferralLink);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionToken = localStorage.getItem('cribnosh_waitlist_session');
      if (!sessionToken) setHasSession(false);
    }
  }, []);

  const handleJoin = async () => {
    setError(null);
    setIsLoading(true);
    const userId = typeof window !== 'undefined' ? localStorage.getItem('cribnosh_user_id') : null;
    if (!userId) {
      setError('You must be logged in to join the referral program.');
      setIsLoading(false);
      return;
    }
    try {
      await setReferralProgramActive({ userId: userId as any });
      await generateReferralLink({ userId: userId as any });
      setJoined(true);
      router.push('/referral/dashboard');
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const Hero = () => (
    <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gray-100 mb-4 sm:mb-6">
        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900" />
      </div>
      <h1 className="font-asgard text-3xl sm:text-5xl text-gray-900">Referral Onboarding</h1>
      <p className="font-satoshi text-sm sm:text-base text-gray-700 mt-2">Activate your dashboard and start earning.</p>
    </div>
  );

  if (!hasSession) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
        <Hero />
        <GlassCard className="text-center max-w-lg mx-auto">
          <p className="font-satoshi text-gray-700 text-sm sm:text-base mb-4">Join the waitlist to unlock referrals.</p>
          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-900 text-white font-satoshi text-sm sm:text-base hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900"
            aria-label="Join Waitlist"
          >
            Join Waitlist
            <ArrowRight className="w-4 h-4" />
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <Hero />
      <GlassCard className="text-center max-w-lg mx-auto w-full">
        {!joined ? (
          <>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center justify-center gap-2 text-gray-700 text-sm font-satoshi">
                <CheckCircle className="w-4 h-4 text-gray-900" /> Earn rewards for each referral
              </li>
              <li className="flex items-center justify-center gap-2 text-gray-700 text-sm font-satoshi">
                <CheckCircle className="w-4 h-4 text-gray-900" /> Track your progress in real-time
              </li>
              <li className="flex items-center justify-center gap-2 text-gray-700 text-sm font-satoshi">
                <CheckCircle className="w-4 h-4 text-gray-900" /> Unlock exclusive benefits
              </li>
            </ul>
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-gray-900 text-white font-satoshi text-sm sm:text-base hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-60"
              aria-label="Activate Referral Program"
            >
              {isLoading ? 'Activating…' : 'Activate Referral Program'}
            </button>
            {error && (
              <div className="p-3 border border-red-200 rounded-lg text-red-700 text-xs font-satoshi mt-3">
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-gray-900" />
              </div>
            </div>
            <h2 className="font-asgard text-xl text-gray-900 mb-2">You're In!</h2>
            <p className="font-satoshi text-gray-700 mb-4">Your referral dashboard is active. Invite friends and earn.</p>
            <Link
              href="/referral/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-900 text-white font-satoshi text-sm sm:text-base hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900"
              aria-label="Go to Dashboard"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </GlassCard>
    </main>
  );
}