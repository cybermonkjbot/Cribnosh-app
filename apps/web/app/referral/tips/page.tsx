import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { Lightbulb, Users, BookOpen } from "lucide-react";

export default function ReferralTipsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-2 py-6 sm:py-8">
      <GlassCard className="max-w-2xl w-full p-4 sm:p-8 bg-white border border-gray-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col items-center mb-1 sm:mb-2">
          <Lightbulb className="w-10 h-10 sm:w-16 sm:h-16 text-gray-900 bg-gray-100 rounded-xl p-2 sm:p-3 mb-1 sm:mb-2" />
          <h1 className="font-asgard text-2xl sm:text-3xl text-gray-900">Top Referral Tips</h1>
        </div>
        <section className="flex gap-2 sm:gap-3 items-start">
          <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h2 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Grow Your Impact, Grow Your Rewards</h2>
            <ul className="list-disc pl-4 sm:pl-5 text-gray-800 font-satoshi space-y-1 text-sm">
              <li>Share your story, people connect with real experiences.</li>
              <li>Use visuals: photos, videos, and testimonials boost engagement.</li>
              <li>Personalize your message for different audiences.</li>
              <li>Follow up with your referrals and answer their questions.</li>
              <li>Celebrate every milestone and thank your community.</li>
            </ul>
          </div>
        </section>
        <section className="flex gap-2 sm:gap-3 items-start">
          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h3 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Advanced Strategies</h3>
            <ul className="list-disc pl-4 sm:pl-5 text-gray-800 font-satoshi space-y-1 text-sm">
              <li>Host a virtual meal or Q&A to introduce CribNosh to your network.</li>
              <li>Collaborate with local influencers or community leaders.</li>
              <li>Share cultural stories and recipes to spark curiosity.</li>
              <li>Track your results and adjust your approach for better outcomes.</li>
            </ul>
          </div>
        </section>
        <div className="flex flex-col gap-1 sm:gap-2 mt-2 sm:mt-4">
          <Link href="/referral/guide" className="underline underline-offset-2 decoration-gray-400 hover:text-black font-satoshi text-xs sm:text-sm">Read the full Affiliate Guide</Link>
          <Link href="/contact" className="underline underline-offset-2 decoration-gray-400 hover:text-black font-satoshi text-xs sm:text-sm">Contact Support</Link>
        </div>
      </GlassCard>
    </main>
  );
}
