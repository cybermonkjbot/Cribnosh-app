import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { HelpCircle, BookOpen } from "lucide-react";

export default function AffiliateFAQPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-2 py-6 sm:py-8">
      <GlassCard className="max-w-2xl w-full p-4 sm:p-8 bg-white border border-gray-200 shadow-sm flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col items-center mb-1 sm:mb-2">
          <HelpCircle className="w-10 h-10 sm:w-16 sm:h-16 text-gray-900 bg-gray-100 rounded-xl p-2 sm:p-3 mb-1 sm:mb-2" />
          <h1 className="font-asgard text-2xl sm:text-3xl text-gray-900">Affiliate FAQ</h1>
        </div>
        <section className="flex gap-2 sm:gap-3 items-start">
          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-900 bg-gray-100 rounded-lg p-2" />
          <div>
            <h2 className="font-satoshi text-base sm:text-lg text-gray-900 mb-1">Frequently Asked Questions</h2>
            <ul className="space-y-2 sm:space-y-4">
              <li>
                <div className="font-satoshi font-bold text-gray-900 text-sm sm:text-base">How do I join the affiliate program?</div>
                <div className="font-satoshi text-gray-800 text-sm">Simply sign up and start sharing your referral link! You'll find everything you need in your dashboard.</div>
              </li>
              <li>
                <div className="font-satoshi font-bold text-gray-900 text-sm sm:text-base">How are rewards calculated?</div>
                <div className="font-satoshi text-gray-800 text-sm">You earn rewards for every successful referral who joins and completes their first meal. Check your dashboard for details.</div>
              </li>
              <li>
                <div className="font-satoshi font-bold text-gray-900 text-sm sm:text-base">When do I get paid?</div>
                <div className="font-satoshi text-gray-800 text-sm">Payouts are processed monthly. You'll receive an email with details when your rewards are ready.</div>
              </li>
              <li>
                <div className="font-satoshi font-bold text-gray-900 text-sm sm:text-base">Can I refer people outside my city?</div>
                <div className="font-satoshi text-gray-800 text-sm">Absolutely! CribNosh is growing, and we welcome referrals from all over.</div>
              </li>
              <li>
                <div className="font-satoshi font-bold text-gray-900 text-sm sm:text-base">Where can I get more help?</div>
                <div className="font-satoshi text-gray-800 text-sm">Our team is here for you. <Link href="/contact" className="underline underline-offset-2 decoration-gray-400 hover:text-black">Contact support</Link> for any questions or assistance.</div>
              </li>
            </ul>
          </div>
        </section>
      </GlassCard>
    </main>
  );
}