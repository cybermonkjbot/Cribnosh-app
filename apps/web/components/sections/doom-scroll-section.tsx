"use client";

import { motion } from "motion/react";
import { useMobileDevice } from "@/hooks/use-mobile-device";


const features = [
  {
    id: "food-profile",
    title: "Your Food Profile",
    subtitle: "Track Your Culinary Journey",
    description: "Discover your unique ForkPrint score and track your food journey with personalized insights, meal statistics, and achievement progress.",
    image: "/optimized/profilescreen.png",

    color: "from-[#ff3b30] to-[#ff5e54]"
  },
  {
    id: "nosh-heaven",
    title: "Nosh Heaven",
    subtitle: "Endless Food Discovery",
    description: "Dive into an endless stream of mouthwatering food content. Watch creators showcase their culinary magic and order your favorites with a single tap.",
    image: "/optimized/noshheavenscreen.png",

    color: "from-[#ff5e54] to-[#ff7b54]"
  },
  {
    id: "on-the-stove",
    title: "On the Stove Live",
    subtitle: "Watch & Order Live",
    description: "Experience the thrill of live cooking streams where you can watch talented food creators work their magic in real-time and secure your order before the final garnish.",
    image: "/optimized/cribnoshlivescreen.png",

    color: "from-[#ff7b54] to-[#ff9f54]"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const deviceInfo = useMobileDevice();
  const isOnMobileDevice = deviceInfo.isMobile || deviceInfo.isTablet;
  const isImageLeft = index % 2 === 0; // Alternate image position

  return (
    <motion.div
      initial={{ opacity: 0, y: isOnMobileDevice ? 20 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.2,
        duration: isOnMobileDevice ? 0.3 : 0.6,
        ease: "easeOut"
      }}
      className="group relative w-full py-12 sm:py-16 md:py-20"
    >
      {/* Subtle background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-2 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Two-column layout within each card */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Content Column */}
        <div className={`order-2 ${isImageLeft ? 'lg:order-2' : 'lg:order-1'}`}>
          <h3 className="font-asgard text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {feature.title}
          </h3>
          <p className="text-[#ff3b30] font-semibold text-xl sm:text-2xl mb-5 font-satoshi">
            {feature.subtitle}
          </p>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed mb-8 font-satoshi">
            {feature.description}
          </p>
        </div>

        {/* Image Column */}
        <div className={`order-1 ${isImageLeft ? 'lg:order-1' : 'lg:order-2'}`}>
          <div className="relative w-full max-w-xs mx-auto lg:mx-0">
            <div className={`relative aspect-[9/19.5] w-full rounded-xl overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 ${isImageLeft ? 'rotate-3' : '-rotate-3'}`}>
              <picture>
                <source srcSet={feature.image.replace('.png', '.webp')} type="image/webp" />
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover object-center"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff3b30]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
};



export function DoomScrollSection() {
  const deviceInfo = useMobileDevice();
  const isOnMobileDevice = deviceInfo.isMobile || deviceInfo.isTablet;

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff3b30]/[0.08] via-transparent to-[#ff5e54]/[0.08] blur-3xl" />
      {/* Top blending gradient to transition from hero section */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff3b30]/20 via-[#ff3b30]/10 to-transparent h-32" />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/90" />

      <div className="relative z-10 container mx-auto px-2 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: isOnMobileDevice ? 20 : 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: isOnMobileDevice ? 0.4 : 0.8,
            ease: "easeOut"
          }}
          className="text-center mb-16 sm:mb-20 lg:mb-24"
        >
          <h2 className="font-asgard text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-gray-900 mb-8 sm:mb-10 leading-tight">
            Doom Scroll Your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] via-gray-900 to-[#ff5e54]">
              Meals
            </span>
          </h2>
          
          <p className="text-2xl sm:text-3xl md:text-4xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-satoshi">
            Get it on the stove. Discover, watch, and order incredible meals through immersive content that feeds your cravings and your curiosity.
          </p>
        </motion.div>

        {/* Features Grid - Single Column */}
        <div className="space-y-0 mb-16 sm:mb-20 lg:mb-24">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>




      </div>
    </section>
  );
}
