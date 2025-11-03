"use client";

import React from "react";
import { CityHero } from "@/components/sections";
import { CitiesSection } from "@/components/sections";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * Renders the Nottingham city page featuring local food culture, CribNosh platform highlights, and animated statistics.
 *
 * Displays a hero section, a feature overview with imagery and descriptions of Nottingham's culinary scene, animated city-specific statistics, and a section for exploring other cities. Includes a call-to-action for joining the Nottingham waitlist.
 */
export default function NottinghamPage() {
  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <CityHero city="Nottingham" />
      
      {/* City-specific feature section with image */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="rounded-2xl overflow-hidden h-[500px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] to-[#34d399] opacity-90 mix-blend-multiply"></div>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(https://images.unsplash.com/photo-1464983953574-0892a716854b)`,
                    filter: 'grayscale(30%)'
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h3 className="text-3xl md:text-4xl font-display font-bold mb-4">Nottingham</h3>
                    <p className="text-xl">Home of Robin Hood & Culinary Innovation</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-display font-bold mb-6">
                Nottingham's Vibrant Food Culture
              </h2>
              <p className="text-lg text-white mb-8">
                From traditional English fare to innovative fusion cuisine, Nottingham's food scene is as diverse as its population. CribNosh is bringing this culinary excellence directly to your doorstep.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">University Influence</h3>
                    <p className="text-white">
                      With two major universities, Nottingham's food scene is constantly evolving with fresh ideas and international influences.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Local Specialties</h3>
                    <p className="text-white">
                      From Bramley apple products to Stilton cheese, Nottingham's local specialties are celebrated by our Food Creators.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#10b981] flex items-center justify-center flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Neighborhood Diversity</h3>
                    <p className="text-white">
                      From West Bridgford to Lenton, each Nottingham neighborhood brings unique culinary perspectives to our platform.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <Link href="/waitlist" className="inline-flex items-center px-6 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#0d9668] transition-colors">
                  <span>Join Nottingham Waitlist</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* City-specific stats */}
      <section className="py-16 bg-[#10b981]/10">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl md:text-4xl font-display font-bold mb-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            CribNosh in Nottingham
          </motion.h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-[#10b981] mb-2">30+</div>
              <p className="text-white">Food Creators</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-[#10b981] mb-2">15+</div>
              <p className="text-white">Cuisines</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-[#10b981] mb-2">100%</div>
              <p className="text-white">Certified Kitchens</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl md:text-5xl font-bold text-[#10b981] mb-2">500+</div>
              <p className="text-white">Waitlist Signups</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      <CitiesSection />

      {/* Unified Chef/Driver CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chef CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#10b981]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Your kitchen, your rules.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Share your culinary heritage and earn on your terms. Join CribNosh as a Food Creator and bring Nottingham's flavors to more tables.</p>
              <Link href="/cooking/apply" className="inline-block px-8 py-3 bg-white text-[#10b981] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Chef
              </Link>
            </motion.div>
            {/* Driver CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-[#34d399]/90 flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Drive with CribNosh.</h2>
              <p className="text-lg mb-6 max-w-xl mx-auto">Help us deliver joy across Nottingham. Flexible hours, great community, and a chance to make a difference, on your schedule.</p>
              <Link href="/driving/apply" className="inline-block px-8 py-3 bg-white text-[#34d399] rounded-lg font-medium hover:bg-white/90 transition-colors">
                Become a Driver
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
