"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { AppStorePopup } from "../ui/app-store-popup";
import { useMediaQuery } from "@/hooks/use-media-query";

export function AppDownloadCTA() {
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div className="mb-6 md:mb-8 px-3 md:px-0">
      <div className="bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] rounded-lg md:rounded-xl p-4 md:p-6 shadow-lg">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg md:text-xl font-asgard font-bold text-white mb-2">
            Get the Complete CribNosh Experience
          </h3>
          <p className="text-sm md:text-base text-white/90 font-satoshi mb-4">
            Download the CribNosh app to discover authentic home-cooked meals, connect with talented foodCreators, and experience dining like never before.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={() => setPlatform("ios")}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-[#ff3b30] rounded-lg font-satoshi font-medium hover:bg-white/90 transition-colors shadow-md"
              whileHover={isDesktop ? { scale: 1.03 } : {}}
              whileTap={{ scale: 0.98 }}
            >
              <Image 
                src="/apple-app-store-svgrepo-com.svg" 
                alt="App Store" 
                className="w-5 h-5 mr-2" 
                width={20} 
                height={20} 
              />
              <span>App Store</span>
            </motion.button>
            <motion.button
              onClick={() => setPlatform("android")}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-[#ff3b30] rounded-lg font-satoshi font-medium hover:bg-white/90 transition-colors shadow-md"
              whileHover={isDesktop ? { scale: 1.03 } : {}}
              whileTap={{ scale: 0.98 }}
            >
              <Image 
                src="/google-play.svg" 
                alt="Play Store" 
                className="w-5 h-5 mr-2" 
                width={20} 
                height={20} 
              />
              <span>Play Store</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* App Store Popup */}
      {platform && (
        <AppStorePopup
          isOpen={!!platform}
          onClose={() => setPlatform(null)}
          platform={platform}
        />
      )}
    </div>
  );
}

