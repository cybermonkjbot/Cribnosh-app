"use client";

import { motion } from "motion/react";

export default function SearchLoadingState() {
  return (
    <section 
      data-section-theme="light" 
      className="min-h-screen pt-32 pb-24"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl text-left"
        >
          {/* Skeleton loading state */}
          <div className="animate-pulse">
            <div className="h-16 w-3/4 bg-slate-200  rounded-lg mb-6" />
            <div className="h-6 w-1/2 bg-slate-200  rounded-lg mb-12" />
            
            {/* Search box skeleton */}
            <div className="h-14 w-full bg-slate-200  rounded-lg mb-4" />
            
            {/* Diet filters skeleton */}
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-24 bg-slate-200  rounded-full" />
              ))}
            </div>
            
            {/* Content skeleton */}
            <div className="mt-12 space-y-8">
              {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-4">
                  <div className="h-8 w-48 bg-slate-200  rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-32 bg-slate-200  rounded-lg" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 