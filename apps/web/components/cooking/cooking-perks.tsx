"use client";

import {
  Calendar,
  ChefHat,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

const perks = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Access",
    description: "Join a supportive network of Food Creators sharing tips, recipes, and inspiration.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Growth Opportunity",
    description: "Build your brand and reputation with customer reviews and ratings.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Flexible Schedule",
    description: "Set your own hours and availability. Cook when it works for you.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Liability Coverage",
    description: "Our platform provides insurance coverage for certified Food Creators.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Competitive Earnings",
    description: "Keep up to 85% of your sales with transparent pricing and weekly payouts.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Marketing Support",
    description: "We promote your kitchen and dishes to local customers in your area.",
    color: "bg-gray-100",
    iconColor: "text-gray-900",
  },
];

export function CookingPerks() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50" id="perks" data-section-theme="light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-2 lg:order-1"
          >
            <span className="text-xs sm:text-sm uppercase tracking-widest font-medium text-[#ff3b30]">
              Food Creator Benefits
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-gray-900 mt-2 mb-4 sm:mb-6">
              Why Cook With Cribnosh?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Turn your kitchen into a thriving business and share your culinary heritage with food lovers in your community. Cribnosh provides everything you need to succeed.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {perks.map((perk, index) => (
                <motion.div
                  key={index}
                  className={`p-4 sm:p-6 rounded-xl ${perk.color} border border-gray-100`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center mb-3 sm:mb-4 ${perk.iconColor}`}>
                    {perk.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{perk.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{perk.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative order-1 lg:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-[4/5] sm:aspect-[4/5] relative">
                <Image
                  src="/early-access-perks/3.png"
                  alt="Cribnosh Food Creator"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ff3b30] flex items-center justify-center text-white flex-shrink-0">
                      <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg sm:text-xl font-bold text-white">Food Creator Success Story</h4>
                      <p className="text-sm sm:text-base text-white/80">Maria's Kitchen</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-white/90 italic">
                    "Joining Cribnosh allowed me to share my grandmother's recipes with my community while earning extra income. The certification process was straightforward, and now I have regular customers who love my authentic cooking."
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-[#ff3b30]/10 blur-3xl -z-10"></div>
            <div className="absolute -top-4 sm:-top-6 -left-4 sm:-left-6 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-blue-500/10 blur-3xl -z-10"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 