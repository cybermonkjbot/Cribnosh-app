"use client";

import React from "react";
import { CityHero } from "@/components/sections";
import { CitiesSection } from "@/components/sections";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * Renders the Leicester city page with themed sections highlighting local culinary diversity, testimonials, and a call to action.
 *
 * The page includes animated feature cards, a testimonial from a local foodie, and a waitlist signup section, all styled with Tailwind CSS and Framer Motion for smooth entrance animations.
 *
 * @returns The complete Leicester city page as a React element.
 */
export default function LeicesterPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <CityHero city="Leicester" />
      
      {/* City-specific feature section */}
      <section className="py-24 bg-gradient-to-b from-[#3b82f6]/10 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              Leicester's Culinary Diversity
            </h2>
            <p className="text-lg text-gray-200">
              Leicester's rich multicultural heritage has created one of the UK's most diverse food scenes, which CribNosh is proud to celebrate through our Food Creators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-[#3b82f6] rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Global Flavors</h3>
              <p className="text-gray-700">
                Leicester's renowned South Asian cuisine scene provides CribNosh with authentic Food Creators creating dishes from across the Indian subcontinent.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-[#3b82f6] rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Local Traditions</h3>
              <p className="text-gray-700">
                From Leicester's famous Melton Mowbray pork pies to regional specialties, we're preserving local food traditions through our platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-8 shadow-lg"
            >
              <div className="w-12 h-12 bg-[#3b82f6] rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Community Focus</h3>
              <p className="text-gray-700">
                Leicester's strong community bonds are reflected in our network of Food Creators from Highfields, Clarendon Park, and beyond.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* City-specific testimonial */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg relative overflow-hidden"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa]"></div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-full bg-[#3b82f6]/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#3b82f6]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <div>
                <blockquote className="text-lg italic text-gray-800 mb-4">
                  "Leicester's food scene has always been diverse, but CribNosh is bringing something completely new by connecting us directly with Food Creators who understand our preferences. I can't wait for it to launch here!"
                </blockquote>
                <p className="font-bold text-gray-900">Priya M., Leicester Foodie</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* City-specific CTA */}
      <section className="py-16 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Experience Leicester's Flavors Like Never Before
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            Join our Leicester waitlist today and be the first to experience personalized home-cooked meals that understand your cravings.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link href="/waitlist" className="inline-block px-8 py-3 bg-white text-[#3b82f6] rounded-lg font-medium hover:bg-white/90 transition-colors">
              Join Leicester Waitlist
            </Link>
          </motion.div>
        </div>
      </section>
      
      {/* Unified Chef/Driver CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chef CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#3b82f6]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Your kitchen, your rules.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Share your culinary heritage and earn on your terms. Join CribNosh as a Food Creator and bring Leicester's flavors to more tables.</p>
              <Link href="/cooking/apply" className="inline-block px-8 py-3 bg-white text-[#3b82f6] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Chef
              </Link>
            </motion.div>
            {/* Driver CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#60a5fa]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Drive with CribNosh.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Help us deliver joy across Leicester. Flexible hours, great community, and a chance to make a difference, on your schedule.</p>
              <Link href="/driving/apply" className="inline-block px-8 py-3 bg-white text-[#60a5fa] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Driver
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      <CitiesSection />
    </main>
  );
}
