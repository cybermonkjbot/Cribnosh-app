"use client";

import React from "react";
import { CityHero } from "@/components/sections";
import { CitiesSection } from "@/components/sections";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * Renders the Coventry city landing page, featuring animated sections that highlight Coventry's food culture, CribNosh's milestones in the city, and calls to action for users and Food Creators.
 *
 * The page includes a hero section, a feature grid showcasing Coventry's culinary diversity, a timeline of CribNosh's journey in Coventry, a city-specific call-to-action, and a section listing other cities.
 *
 * @returns The complete React component for the Coventry city page.
 */
export default function CoventryPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <CityHero city="Coventry" />
      
      {/* City-specific feature grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              Coventry's Food Revolution
            </h2>
            <p className="text-lg text-gray-200">
              From its medieval roots to its modern rebirth, Coventry has always been a city of innovation. CribNosh is proud to continue this tradition by revolutionizing how Coventry eats.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1 - Large */}
            <motion.div 
              className="md:col-span-8 bg-[#8b5cf6]/10 rounded-2xl p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8b5cf6]"></div>
              <h3 className="text-2xl font-display font-bold mb-4 flex items-center text-white">
                <span className="w-10 h-10 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </span>
                Cultural Fusion
              </h3>
              <p className="text-white mb-6">
                Coventry's diverse population has created a melting pot of culinary traditions. From South Asian to Eastern European, Caribbean to Mediterranean, our Food Creators represent the city's multicultural heritage.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 p-4 rounded-lg">
                  <h4 className="font-bold text-sm text-gray-900">25+ Cuisines</h4>
                  <p className="text-sm text-gray-700">Available through our platform</p>
                </div>
                <div className="bg-white/80 p-4 rounded-lg">
                  <h4 className="font-bold text-sm text-gray-900">40+ Languages</h4>
                  <p className="text-sm text-gray-700">Spoken by our Food Creators</p>
                </div>
              </div>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              className="md:col-span-4 bg-[#8b5cf6]/10 rounded-2xl p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8b5cf6]"></div>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center text-white">
                <span className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </span>
                University Influence
              </h3>
              <p className="text-white">
                With Coventry University and the University of Warwick nearby, our platform features innovative dishes that appeal to a diverse student population with global tastes.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              className="md:col-span-4 bg-[#8b5cf6]/10 rounded-2xl p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8b5cf6]"></div>
              <h3 className="text-xl font-display font-bold mb-4 flex items-center text-white">
                <span className="w-8 h-8 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                </span>
                Local Specialties
              </h3>
              <p className="text-white">
                From Coventry Godcakes to modern interpretations of traditional Midlands fare, our chefs celebrate local culinary heritage.
              </p>
            </motion.div>
            
            {/* Feature 4 */}
            <motion.div 
              className="md:col-span-8 bg-[#8b5cf6]/10 rounded-2xl p-8 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#8b5cf6]"></div>
              <h3 className="text-2xl font-display font-bold mb-4 flex items-center text-white">
                <span className="w-10 h-10 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </span>
                Neighborhood Highlights
              </h3>
              <p className="text-white mb-6">
                Each Coventry neighborhood brings its own unique flavors to our platform. From Earlsdon's artisanal offerings to Tile Hill's home-style comfort food, we're mapping the city's culinary landscape.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Earlsdon", "City Centre", "Tile Hill", "Canley", "Foleshill", "Holbrooks"].map((area, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-white/80 rounded-full text-sm text-gray-900"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Timeline section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-12 text-center text-gray-900"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            CribNosh in Coventry: Our Journey
          </motion.h2>
          <div className="relative max-w-3xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-[#8b5cf6] transform md:translate-x-[-50%]"></div>
            {/* Timeline items */}
            <div className="space-y-12">
              {/* Item 1 */}
              <motion.div 
                className="relative flex flex-col md:flex-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="md:w-1/2 md:pr-8 md:text-right mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-[#8b5cf6]">2023</h3>
                  <h4 className="text-lg font-bold text-gray-900">First Chefs Onboarded</h4>
                  <p className="text-gray-800">
                    We began recruiting our first Food Creators in Coventry, focusing on authentic, diverse cuisines.
                  </p>
                </div>
                <div className="absolute left-[-8px] md:left-1/2 w-4 h-4 bg-white border-2 border-[#8b5cf6] rounded-full transform md:translate-x-[-50%] top-0 md:top-6"></div>
                <div className="md:w-1/2 md:pl-8">
                </div>
              </motion.div>
              {/* Item 2 */}
              <motion.div 
                className="relative flex flex-col md:flex-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="md:w-1/2 md:pr-8 md:text-right"></div>
                <div className="absolute left-[-8px] md:left-1/2 w-4 h-4 bg-white border-2 border-[#8b5cf6] rounded-full transform md:translate-x-[-50%] top-0 md:top-6"></div>
                <div className="md:w-1/2 md:pl-8">
                  <h3 className="text-xl font-bold text-[#8b5cf6]">Early 2025</h3>
                  <h4 className="text-lg font-bold text-gray-900">Kitchen Certification Program</h4>
                  <p className="text-gray-800">
                    We launched our rigorous kitchen certification program to ensure all home kitchens meet our high standards.
                  </p>
                </div>
              </motion.div>
              {/* Item 3 */}
              <motion.div 
                className="relative flex flex-col md:flex-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="md:w-1/2 md:pr-8 md:text-right">
                  <h3 className="text-xl font-bold text-[#8b5cf6]">Mid 2025</h3>
                  <h4 className="text-lg font-bold text-gray-900">Waitlist Opens</h4>
                  <p className="text-gray-800">
                    We opened our waitlist to Coventry residents, with overwhelming interest from the community.
                  </p>
                </div>
                <div className="absolute left-[-8px] md:left-1/2 w-4 h-4 bg-white border-2 border-[#8b5cf6] rounded-full transform md:translate-x-[-50%] top-0 md:top-6"></div>
                <div className="md:w-1/2 md:pl-8"></div>
              </motion.div>
              {/* Item 4 */}
              <motion.div 
                className="relative flex flex-col md:flex-row"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="md:w-1/2 md:pr-8 md:text-right"></div>
                <div className="absolute left-[-8px] md:left-1/2 w-4 h-4 bg-white border-2 border-[#8b5cf6] rounded-full transform md:translate-x-[-50%] top-0 md:top-6"></div>
                <div className="md:w-1/2 md:pl-8">
                  <h3 className="text-xl font-bold text-[#8b5cf6]">Coming Soon</h3>
                  <h4 className="text-lg font-bold text-gray-900">Official Launch</h4>
                  <p className="text-gray-800">
                    We're preparing to officially launch in Coventry, bringing personalized home-cooked meals to your doorstep.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* City-specific CTA */}
      <section className="py-16 bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Join the Coventry Food Revolution
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            Be among the first in Coventry to experience CribNosh's personalized home-cooked meals that understand your cravings.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/waitlist" className="inline-block px-8 py-3 bg-white text-[#8b5cf6] rounded-lg font-medium hover:bg-white/90 transition-colors">
              Join Coventry Waitlist
            </Link>
            <Link href="/cooking/apply" className="inline-block px-8 py-3 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium hover:bg-white/30 transition-colors">
              Become a Food Creator
            </Link>
          </motion.div>
        </div>
      </section>
      
      <CitiesSection />
      {/* Unified Chef/Driver CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chef CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#8b5cf6]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Your kitchen, your rules.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Share your culinary heritage and earn on your terms. Join CribNosh as a Food Creator and bring Coventry's flavors to more tables.</p>
              <Link href="/cooking/apply" className="inline-block px-8 py-3 bg-white text-[#8b5cf6] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Chef
              </Link>
            </motion.div>
            {/* Driver CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#a78bfa]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Drive with CribNosh.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Help us deliver joy across Coventry. Flexible hours, great community, and a chance to make a difference, on your schedule.</p>
              <Link href="/driving/apply" className="inline-block px-8 py-3 bg-white text-[#a78bfa] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Driver
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
