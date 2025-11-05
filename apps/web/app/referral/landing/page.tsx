"use client";

import { useRouter } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

export default function ReferralLanding() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <header className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gray-100 mb-4">
            <Users className="w-7 h-7 text-gray-900" />
          </div>
          <h1 className="font-asgard text-3xl sm:text-5xl text-gray-900 tracking-tight">Referral Program</h1>
          <p className="font-satoshi text-sm sm:text-base text-gray-700 mt-3">Invite friends. Earn rewards. Simple.</p>
        </header>

        <GlassCard className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-asgard text-gray-900">1</div>
              <div className="font-satoshi text-sm text-gray-700 mt-1">Share your link</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-asgard text-gray-900">2</div>
              <div className="font-satoshi text-sm text-gray-700 mt-1">Friends join</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-asgard text-gray-900">3</div>
              <div className="font-satoshi text-sm text-gray-700 mt-1">You earn</div>
            </div>
          </div>
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => router.push('/referral/onboarding')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gray-900 text-white font-satoshi text-sm sm:text-base hover:bg-black focus:outline-none focus:ring-2 focus:ring-gray-900"
              aria-label="Join Referral Program"
            >
              Join Referral Program
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}