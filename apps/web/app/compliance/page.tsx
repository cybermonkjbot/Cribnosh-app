"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { Award, ShieldCheck, Scale, FileCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const complianceRequirements = [
  {
    icon: <Scale className="w-6 h-6 text-[#ff3b30]" />,
    title: "Legal Requirements",
    description: "Essential UK food safety regulations and legal compliance.",
    details: [
      "Food Safety Act 1990",
      "Food Hygiene Regulations",
      "HACCP principles",
      "Local authority registration"
    ]
  },
  {
    icon: <FileCheck className="w-6 h-6 text-[#ff3b30]" />,
    title: "Documentation",
    description: "Required documentation and record-keeping practices.",
    details: [
      "Food safety management system",
      "Temperature monitoring records",
      "Staff training documentation",
      "Supplier verification records"
    ]
  },
  {
    icon: <AlertCircle className="w-6 h-6 text-[#ff3b30]" />,
    title: "Risk Management",
    description: "Identifying and managing food safety risks.",
    details: [
      "Allergen control",
      "Cross-contamination prevention",
      "Pest control measures",
      "Emergency procedures"
    ]
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#ff3b30]" />,
    title: "Safety Standards",
    description: "Maintaining high food safety and hygiene standards.",
    details: [
      "Personal hygiene requirements",
      "Equipment sanitization",
      "Food storage guidelines",
      "Waste management protocols"
    ]
  }
];

const MotionLink = motion(Link);

export default function Compliance() {
  return (
    <main className="relative">
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
        <div className="relative z-10 flex-1 pt-32">
          <section 
            data-section-theme="light" 
            className="py-12 px-6 container mx-auto bg-white/90 backdrop-blur-sm text-gray-900 rounded-2xl"
          >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-12">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text"
                >
                  UK Food Safety Compliance
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-neutral-600  mt-2 text-base sm:text-lg"
                >
                  Meeting and exceeding UK food safety standards
                </motion.p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <MotionLink 
                  href="/certification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-[#ff3b30] bg-red-50 rounded-full 
                    hover:bg-red-100 transition-colors flex items-center justify-center sm:justify-start gap-2"
                >
                  View Certification Process
                  <ArrowRight className="w-4 h-4" />
                </MotionLink>
                <MotionLink 
                  href="/"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] 
                    rounded-full hover:opacity-90 transition-opacity flex items-center justify-center sm:justify-start gap-2"
                >
                  Back to Home
                  <ArrowRight className="w-4 h-4" />
                </MotionLink>
              </div>
            </div>

            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative w-full h-60 sm:h-80 rounded-2xl overflow-hidden mb-8 sm:mb-12 group"
            >
              <Image
                src="/kitchenillus.png"
                alt="Food Safety Compliance"
                fill
                className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 sm:p-8 max-w-2xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    Safety First
                  </h2>
                </div>
                <p className="text-white/90 text-sm sm:text-lg leading-relaxed drop-shadow-lg">
                  We adhere to strict UK food safety regulations and maintain the highest 
                  standards of hygiene and safety in all our certified kitchens.
                </p>
              </div>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 sm:p-6 rounded-2xl mb-8 sm:mb-12 max-w-3xl mx-auto"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#ff3b30]" />
                Food Standards Agency (FSA) Compliance
              </h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                All Cribnosh kitchens are registered with their local authority and comply with 
                Food Standards Agency guidelines. We maintain a Food Hygiene Rating of 4 or 5 
                (the highest ratings) across all our certified kitchens.
              </p>
            </motion.div>

            {/* Compliance Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {complianceRequirements.map((requirement, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="group bg-white/50 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-gray-200/50 
                    hover:bg-white/70 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 
                      flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      {requirement.icon}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1.5 sm:mb-2">
                        {requirement.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                        {requirement.description}
                      </p>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {requirement.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#ff3b30]" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-8 sm:mt-12 text-center"
            >
              <Link
                href="/certification"
                className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base text-white bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] 
                  rounded-full hover:opacity-90 transition-opacity group relative overflow-hidden"
              >
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">View Our Certification Process</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </motion.div>
          </section>
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