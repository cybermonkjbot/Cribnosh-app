import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { Users, BookOpen, Lightbulb, LifeBuoy } from "lucide-react";

export default function AffiliateGuidePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-2 py-6 sm:py-8">
      <GlassCard className="max-w-2xl w-full p-4 sm:p-8 bg-white border border-gray-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col items-center mb-1 sm:mb-2">
          <Users className="w-10 h-10 sm:w-16 sm:h-16 text-gray-900 bg-gray-100 rounded-xl p-2 sm:p-3 mb-1 sm:mb-2" />
          <h1 className="font-asgard text-2xl sm:text-3xl text-gray-900">Affiliate Program Guide</h1>
        </div>
        <section className="flex gap-2 sm:gap-3 items-start">
          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h2 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Welcome to the CribNosh Affiliate Family!</h2>
            <p className="font-satoshi text-gray-800 text-sm">Our program is designed to empower you to share the joy of home-cooked meals and earn rewards. Here's everything you need to get started and thrive as a CribNosh affiliate.</p>
          </div>
        </section>
        <section className="flex gap-2 sm:gap-3 items-start">
          <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h3 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">How to Get Started</h3>
            <ul className="list-disc pl-4 sm:pl-5 text-gray-800 font-satoshi space-y-1 text-sm">
              <li>Share your unique referral link with friends, family, and your community.</li>
              <li>
                Track your progress and rewards in your <Link href="/referral/dashboard" className="underline underline-offset-2 decoration-gray-400 hover:text-black">Referral Dashboard</Link>.
              </li>
              <li>Earn rewards for every successful referral who joins and completes their first meal.</li>
            </ul>
          </div>
        </section>
        <section className="flex gap-2 sm:gap-3 items-start">
          <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h3 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Best Practices</h3>
            <ul className="list-disc pl-4 sm:pl-5 text-gray-800 font-satoshi space-y-1 text-sm">
              <li>Be authentic, share your real experiences with CribNosh.</li>
              <li>Use social media, group chats, and community boards to reach more people.</li>
              <li>Highlight the cultural diversity and warmth of our platform.</li>
              <li>Respect privacy and avoid spamming.</li>
            </ul>
          </div>
        </section>
        <section className="flex gap-2 sm:gap-3 items-start">
          <LifeBuoy className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h3 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Need Help?</h3>
            <p className="font-satoshi text-gray-800 text-sm">Our team is here to support you. <Link href="/contact" className="underline underline-offset-2 decoration-gray-400 hover:text-black">Contact us</Link> anytime for tips, resources, or questions about your affiliate journey.</p>
          </div>
        </section>
      </GlassCard>
    </main>
  );
}
