"use client";

import React from "react";
import { motion } from "motion/react";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Recycle, Leaf, PackageCheck, Truck, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SustainablePracticesPage() {
  const features = [
    {
      icon: <Recycle className="w-6 h-6" />,
      title: "Zero Waste",
      description: "Minimizing food waste through smart portioning and composting practices.",
      color: "from-teal-400/20 to-emerald-400/20"
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Eco-Friendly",
      description: "Using sustainable packaging and environmentally conscious practices.",
      color: "from-green-400/20 to-teal-400/20"
    },
    {
      icon: <PackageCheck className="w-6 h-6" />,
      title: "Local Sourcing",
      description: "Supporting local farmers and reducing transportation emissions.",
      color: "from-emerald-400/20 to-green-400/20"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Smart Delivery",
      description: "Optimized routes and eco-friendly delivery options to reduce carbon footprint.",
      color: "from-lime-400/20 to-green-400/20"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#059669] to-[#047857]">
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#059669] to-[#047857] opacity-90" />
        </ParallaxLayer>
        
        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#34d399] blur-[120px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#059669] blur-[100px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10 min-h-screen">
          {/* Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg z-50 mt-[calc(1.5rem+40px)] sm:mt-0"
          >
            <div className="container mx-auto px-6 py-4">
            </div>
          </motion.div>

          <div className="container mx-auto px-6 pt-32 sm:pt-24 pb-16">
            {/* Header */}
            <div className="text-center mb-16 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-full blur-2xl"
              />
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-7xl font-display font-bold text-white mb-6 relative"
              >
                Sustainable Practices
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl text-white/80 max-w-2xl mx-auto"
              >
                Building a more sustainable food ecosystem through environmentally conscious choices and practices.
              </motion.p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${feature.color}, transparent 70%)` }}
                  />
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 relative">
                    <div className="bg-gradient-to-br from-white/20 to-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 group-hover:text-white/70 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center"
            >
              <div className="max-w-3xl mx-auto">
                <p className="text-2xl text-white/90 italic mb-6">
                  "I love how CribNosh prioritizes sustainability in every aspect of their service, from packaging to delivery."
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm" />
                  <div className="text-left">
                    <p className="text-white font-medium">Alex Green</p>
                    <p className="text-white/60 text-sm">Environmental Advocate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </ParallaxGroup>
    </main>
  );
} 