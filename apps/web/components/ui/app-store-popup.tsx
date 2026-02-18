"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

interface AppStorePopupProps {
  isOpen: boolean;
  onClose: () => void;
  platform: "ios" | "android";
}

const PLATFORM_DATA = {
  ios: {
    storeIcon: "/apple-icon.png",
    appIcon: "/logo.svg",
    name: "iOS",
    releaseDate: "September 15, 2026",
    description: "Experience CribNosh on your iPhone and iPad with our native iOS app",
  },
  android: {
    storeIcon: "/android-chrome-192x192.png",
    appIcon: "/logo.svg",
    name: "Android",
    releaseDate: "August 1, 2026",
    description: "Get the best of CribNosh on your Android device with our native app",
  },
};

export function AppStorePopup({ isOpen, onClose, platform }: AppStorePopupProps) {
  const platformInfo = PLATFORM_DATA[platform];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-lg z-[46] p-7 rounded-2xl bg-white/90  backdrop-blur-sm shadow-lg ring-1 ring-black/5 "
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700   hover:bg-black/5  transition-colors"
              data-cursor-text="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                {/* Base app icon */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden ring-1 ring-black/10  transform -rotate-6 hover:rotate-0 transition-transform">
                  <Image
                    src={platformInfo.appIcon}
                    alt="CribNosh App"
                    fill
                    className="object-cover"
                    sizes="96px"
                    priority
                  />
                </div>
                {/* Store icon overlapped */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-xl overflow-hidden ring-1 ring-black/10  bg-white  transform rotate-6 hover:rotate-0 transition-transform">
                  <Image
                    src={platformInfo.storeIcon}
                    alt={platformInfo.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    priority
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1.5 font-asgard text-gray-900 ">
                  Coming to Noshers on {platformInfo.name}
                </h2>
                <p className="text-gray-600  text-sm font-satoshi mb-5 truncate">
                  {platformInfo.description}
                </p>

                <div className="flex gap-3">
                  <Link
                    href="/waitlist"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#ff3b30] text-white rounded-xl font-medium hover:bg-[#ff5e54] active:bg-[#e63529] transition-colors font-satoshi text-center text-sm shadow-sm"
                    data-cursor-text="Join Waitlist"
                  >
                    Get Early Access
                  </Link>
                  <Link
                    href="/all-cities"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-100  text-gray-900  rounded-xl font-medium hover:bg-gray-200  active:bg-gray-300  transition-colors font-satoshi text-center text-sm"
                    data-cursor-text="View Cities"
                  >
                    View Cities
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 