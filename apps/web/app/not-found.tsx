"use client";

import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <main className="relative flex-1 flex flex-col">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>

        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10 flex-1 flex items-center justify-center min-h-[80vh] pt-32">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="relative w-48 h-48 mx-auto">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center">
                    <span className="text-8xl font-display font-bold text-white">404</span>
                  </div>
                  <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/20 rounded-full" />
                  <div className="absolute -left-6 -bottom-2 w-8 h-8 bg-white/20 rounded-full" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
              >
                Page Not Found
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl text-white/80 mb-8 max-w-lg"
              >
                Oops! This experience isn't on our platform yet. We're constantly creating new dining experiences for you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col md:flex-row gap-4"
              >
                <Link href="/">
                  <motion.button
                    className="px-8 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Homepage
                  </motion.button>
                </Link>
                <Link href="/all-cities">
                  <motion.button
                    className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Explore Available Cities
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-12 text-white/60 text-sm"
              >
                <p>Did you type the URL correctly? Or maybe this experience is still being developed.</p>
                <p className="mt-2">Either way, we've got plenty of other personalized dining options waiting for you.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Decorative elements layer */}
        <ParallaxLayer speed={1.5} className="z-20 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20" />
            <div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30" />
            <div className="absolute bottom-[30%] left-[30%] w-3 h-3 bg-white rounded-full opacity-25" />
            <div className="absolute top-[60%] right-[40%] w-5 h-5 bg-white rounded-full opacity-20" />
          </div>
        </ParallaxLayer>
      </ParallaxGroup>
    </main>
  );
}