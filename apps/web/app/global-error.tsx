"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import localFont from "next/font/local";
import Link from "next/link";
import React from "react";
// import * as Sentry from "@sentry/nextjs";

const satoshiFont = localFont({
  variable: "--font-satoshi",
  src: [
    {
      path: "../public/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

const asgardFont = localFont({
  variable: "--font-asgard",
  src: "../public/fonts/Asgard-K7enX.otf",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to Sentry
    /*
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global-error',
        errorDigest: error.digest,
      },
      extra: {
        errorMessage: error.message,
        errorStack: error.stack,
      },
      level: 'fatal',
    });
    */
  }, [error]);

  return (
    <html lang="en-GB" className="light">
      <head>
        <title>Error - CribNosh</title>
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] bg-fixed font-satoshi">
        <main className="relative flex-1 flex flex-col">
          {/* Background elements */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 flex items-center justify-center min-h-screen">
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
                      <span className="text-8xl font-bold text-white font-asgard">500</span>
                    </div>
                    <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/20 rounded-full" />
                    <div className="absolute -left-6 -bottom-2 w-8 h-8 bg-white/20 rounded-full" />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold text-white mb-4 font-asgard"
                >
                  Critical Error
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xl text-white/80 mb-8 max-w-lg"
                >
                  We apologize for the interruption. Our team has been notified and is working to restore your dining experience.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col md:flex-row gap-4"
                >
                  <motion.button
                    onClick={() => reset()}
                    className="px-8 py-3 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>
                  <Link href="/">
                    <motion.button
                      className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Homepage
                    </motion.button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="mt-12 text-white/60 text-sm"
                >
                  <p>Error reference: {error.digest}</p>
                  <p className="mt-2">If the problem persists, please contact our support team.</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="fixed inset-0 pointer-events-none z-20">
            <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20" />
            <div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30" />
            <div className="absolute bottom-[30%] left-[30%] w-3 h-3 bg-white rounded-full opacity-25" />
            <div className="absolute top-[60%] right-[40%] w-5 h-5 bg-white rounded-full opacity-20" />
          </div>
        </main>
      </body>
    </html>
  );
} 