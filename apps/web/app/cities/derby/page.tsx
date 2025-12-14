"use client";

import { CitiesSection, CityHero } from "@/components/sections";
import Link from "next/link";

/**
 * Renders the Derby city page with a hero section and a list of cities.
 *
 * Displays a full-page layout featuring the Derby city hero and additional city-related content.
 *
 * @returns The Derby city page as a React element
 */
export default function DerbyPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <CityHero city="Derby" />
      <CitiesSection />
      {/* Unified Chef/Driver CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chef CTA */}
            <div className="rounded-2xl p-8 text-white bg-amber-500/90 flex flex-col items-center justify-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Your kitchen, your rules.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Share your culinary heritage and earn on your terms. Join CribNosh as a Food Creator and bring Derby's flavors to more tables.</p>
              <Link href="/cooking/apply" className="inline-block px-8 py-3 bg-white text-amber-600 rounded-lg font-medium hover:bg-white/90 transition-colors">
                Cook on Cribnosh
              </Link>
            </div>
            {/* Driver CTA */}
            <div className="rounded-2xl p-8 text-white bg-orange-400/90 flex flex-col items-center justify-center">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Drive with CribNosh.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Help us deliver joy across Derby. Flexible hours, great community, and a chance to make a difference, on your schedule.</p>
              <Link href="/driving/apply" className="inline-block px-8 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Driver
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
