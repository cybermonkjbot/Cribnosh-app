"use client";

import { CitiesSection, CityHero } from "@/components/sections";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "motion/react";
import Link from "next/link";

/**
 * Renders an enhanced Birmingham city page with themed sections highlighting local food culture, 
 * neighborhoods, and a call to action to join the waitlist.
 *
 * Features improved animations, interactive elements, better visual hierarchy, and enhanced user engagement.
 */
export default function BirminghamPage() {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      title: "Cultural Diversity",
      description: "Birmingham's multicultural community brings together flavors from around the world, which CribNosh Food Creators authentically recreate.",
      stats: "187+ Nationalities"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
        </svg>
      ),
      title: "Local Specialties",
      description: "From classic British roasts to spicy curries, Birmingham's food scene is a true melting pot of authentic flavors.",
      stats: "500+ Restaurants"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      title: "Key Neighborhoods",
      description: "From Jewellery Quarter to Digbeth, we're connecting with Food Creators across Birmingham's vibrant neighborhoods.",
      stats: "40+ Areas"
    }
  ];

  const neighborhoods = [
    {
      name: "Jewellery Quarter",
      description: "Historic district known for its jewelry trade and artisan workshops",
      specialty: "Artisan Bakeries",
      color: "from-amber-500 to-orange-500"
    },
    {
      name: "Digbeth",
      description: "Creative quarter with street art, music venues, and independent businesses",
      specialty: "Street Food",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Brindleyplace",
      description: "Modern canal-side development with restaurants and entertainment",
      specialty: "Fine Dining",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Moseley",
      description: "Vibrant suburb known for its independent shops and diverse community",
      specialty: "International Cuisine",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <CityHero city="Birmingham" />

      {/* Enhanced City-specific feature section */}
      <section className="py-24 bg-gradient-to-b from-[#ff3b30]/10 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Birmingham's Unique Food Scene
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              As the heart of the Midlands, Birmingham offers a diverse culinary landscape that CribNosh is excited to enhance with personalized home-cooked meals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <GlassCard className="h-full p-8 group cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-700 mb-4">
                    {feature.description}
                  </p>
                  <div className="text-sm font-semibold text-[#ff3b30]">
                    {feature.stats}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Neighborhoods Section */}
      <section className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Explore Birmingham's Neighborhoods
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Each area of Birmingham has its own unique character and culinary traditions. Discover where CribNosh will be connecting with local Food Creators.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {neighborhoods.map((neighborhood, index) => (
              <motion.div
                key={neighborhood.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <GlassCard className="h-full p-6 group cursor-pointer">
                  <div className={`w-full h-2 bg-gradient-to-r ${neighborhood.color} rounded-full mb-4`}></div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{neighborhood.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{neighborhood.description}</p>
                  <div className="text-xs font-medium text-[#ff3b30]">{neighborhood.specialty}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced City-specific CTA */}
      <section className="py-16 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <motion.div
          className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2
            className="text-3xl md:text-4xl font-display font-bold mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Be Among the First in Birmingham
          </motion.h2>
          <motion.p
            className="text-lg mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            Join our Birmingham waitlist today and be the first to experience personalized home-cooked meals that understand your cravings.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link href="/waitlist">
              <motion.button
                className="inline-flex items-center px-8 py-4 bg-white text-[#ff3b30] rounded-xl font-medium hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Join Birmingham Waitlist</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Chef/Driver CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Join the CribNosh Community
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Whether you're a passionate Food Creator or want to help deliver joy across Birmingham, we have opportunities for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chef CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] flex flex-col items-center justify-center relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Your kitchen, your rules.</h3>
                <p className="text-lg mb-6 max-w-xl mx-auto text-white/90">Share your culinary heritage and earn on your terms. Join CribNosh as a Food Creator and bring Birmingham's flavors to more tables.</p>
                <Link href="/cooking/apply">
                  <motion.button
                    className="inline-flex items-center px-8 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Cook on Cribnosh</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Driver CTA */}
            <motion.div
              className="rounded-2xl p-8 text-white bg-gradient-to-br from-[#ff5e54] to-[#ff7a6e] flex flex-col items-center justify-center relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4 text-white">Drive with CribNosh.</h3>
                <p className="text-lg mb-6 max-w-xl mx-auto text-white/90">Help us deliver joy across Birmingham. Flexible hours, great community, and a chance to make a difference, on your schedule.</p>
                <Link href="/driving/apply">
                  <motion.button
                    className="inline-flex items-center px-8 py-3 bg-white text-[#ff5e54] rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Become a Driver</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <CitiesSection />
    </main>
  );
}
