"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { AppStorePopup } from "../ui/app-store-popup";
import { ImageCarousel } from "../ui/image-carousel";

/**
 * Renders a call-to-action section for downloading the CribNosh mobile app, featuring animated content, platform selection buttons, and an app store popup.
 *
 * Displays promotional text, animated buttons for the App Store and Play Store, and an app image with visual effects. When a platform button is clicked, a popup appears to guide users to the appropriate app store.
 */
export function AppStoreCTA() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  return (
    <div className="py-24 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Get Ready for the
                <span className="block text-white/90">Future of Dining</span>
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Download the CribNosh app to discover authentic home-cooked meals, connect with talented chefs, and experience dining like never before.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  onClick={() => setPlatform("ios")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image src="/apple-app-store-svgrepo-com.svg" alt="App Store" className="w-6 h-6 mr-2" width={24} height={24} />
                  App Store
                </motion.button>
                <motion.button
                  onClick={() => setPlatform("android")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Image src="/google-play.svg" alt="Play Store" className="w-6 h-6 mr-2" width={24} height={24} />
                  Play Store
                </motion.button>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10"
            >
              <ImageCarousel
                images={[
                  "/optimized/Noshcarousel1.png",
                  "/optimized/Noshcarousel2.png"
                ]}
                alt="CribNosh Mobile App Screenshots"
                interval={4000}
                className="w-full h-auto shadow-2xl"
              />
            </motion.div>
            
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-white/20 to-transparent rounded-2xl blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* App Store Popup */}
      <AppStorePopup
        isOpen={platform !== null}
        onClose={() => setPlatform(null)}
        platform={platform || "ios"}
      />
    </div>
  );
} 