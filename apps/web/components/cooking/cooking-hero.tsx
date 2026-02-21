"use client";

import { ContainerTextFlip } from "@/components/ui/containedtextflip";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function FoodCreatorHero() {
  const router = useRouter();

  const handleApplyClick = () => {
    router.push('/become-a-food-creator/apply');
  };

  return (
    <motion.section
      data-section-theme="brand"
      className="relative overflow-hidden bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-white min-h-[90vh] w-full flex items-center full-screen-section full-screen-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-40 -bottom-40 w-[600px] h-[600px] rounded-full bg-[#ff7b72]/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute -left-20 top-40 w-[300px] h-[300px] rounded-full bg-[#ff2920]/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              className="mb-6 inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sm uppercase tracking-widest font-medium bg-white/10 px-4 py-2 rounded-full">
                Join Our Food Creator Community
              </span>
            </motion.div>

            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <ContainerTextFlip
                words={["Share", "Create", "Earn", "Connect"]}
                interval={2000}
                className="!bg-white/10 !shadow-none !text-white"
                textClassName="font-display font-bold"
              />
              <br />
              <span className="text-5xl md:text-7xl font-display font-bold leading-tight">
                Your Kitchen, Your Rules
              </span>
            </motion.div>

            <motion.p
              className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              We provide the platform, certification, and customers. You provide the magic that makes food lovers fall in love with your creations.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <motion.button
                onClick={handleApplyClick}
                className="px-8 py-4 bg-white text-[#ff3b30] rounded-full font-bold text-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Become a Food Creator
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div
              className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Image
                src="/kitchenillus.png"
                alt="Cribnosh Home Kitchen"
                width={600}
                height={400}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                  <div className="bg-white rounded-full p-2">
                    <svg className="w-5 h-5 text-[#ff3b30]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-white">Certified Home Kitchen</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#ff2920]/10 rounded-full blur-xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}