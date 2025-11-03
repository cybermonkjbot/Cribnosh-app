"use client";

import React from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col">
      <main className="relative flex-1 flex flex-col">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#ff7b54] blur-[80px] -top-10 -right-10 opacity-30" />
          <div className="absolute w-[250px] h-[250px] rounded-full bg-[#ff3b30] blur-[60px] bottom-0 -left-10 opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 md:px-6 py-12">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 bg-[#ff3b30]/10  backdrop-blur-md rounded-full flex items-center justify-center">
                    <span className="text-6xl font-bold text-[#ff3b30]  font-asgard">!</span>
                  </div>
                  <div className="absolute -right-2 -top-2 w-8 h-8 bg-[#ff3b30]/20 rounded-full" />
                  <div className="absolute -left-4 -bottom-1 w-6 h-6 bg-[#ff3b30]/20 rounded-full" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-gray-900  mb-4 font-asgard"
              >
                Something went wrong
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg text-gray-600  mb-8 max-w-lg"
              >
                We encountered an error while processing your request. Please try again or return to the homepage.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  onClick={() => reset()}
                  className="px-6 py-2.5 bg-[#ff3b30] text-white rounded-lg font-medium hover:bg-[#ff5e54] transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </motion.button>
                <Link href="/">
                  <motion.button
                    className="px-6 py-2.5 bg-gray-100  text-gray-900  rounded-lg font-medium hover:bg-gray-200  transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Homepage
                  </motion.button>
                </Link>
              </motion.div>

              {error.digest && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-8 text-gray-500  text-sm"
                >
                  <p>Error reference: {error.digest}</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-[20%] left-[10%] w-3 h-3 bg-[#ff3b30] rounded-full opacity-20" />
          <div className="absolute top-[40%] right-[20%] w-4 h-4 bg-[#ff3b30] rounded-full opacity-30" />
          <div className="absolute bottom-[30%] left-[30%] w-2 h-2 bg-[#ff3b30] rounded-full opacity-25" />
          <div className="absolute top-[60%] right-[40%] w-3 h-3 bg-[#ff3b30] rounded-full opacity-20" />
        </div>
      </main>
    </div>
  );
} 