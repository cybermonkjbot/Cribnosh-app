"use client";

import React from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";
import { Leaf, Utensils, Recycle, ArrowRight } from "lucide-react";
import Link from "next/link";

const initiatives = [
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Reduced Food Waste",
    description: "85% less waste than traditional restaurants through precise portion control and on-demand cooking.",
    stats: "85% reduction",
    color: "group-hover:bg-[#22c55e]",
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
    href: "/values/sustainable-practices#food-waste"
  },
  {
    icon: <Utensils className="w-8 h-8" />,
    title: "Local Sourcing",
    description: "Supporting local farmers and reducing transportation emissions with locally sourced ingredients.",
    stats: "30 mile radius",
    color: "group-hover:bg-[#f59e0b]",
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)",
    href: "/values/sustainable-practices#local-sourcing"
  },
  {
    icon: <Recycle className="w-8 h-8" />,
    title: "Eco-Packaging",
    description: "100% biodegradable packaging made from sustainable materials, reducing environmental impact.",
    stats: "100% eco-friendly",
    color: "group-hover:bg-[#3b82f6]",
    bgPattern: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
    href: "/values/sustainable-practices#eco-packaging"
  }
];

function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

// Memoize the initiative card component for better performance
const InitiativeCard = React.memo(({ initiative, index, isMobile }: { initiative: typeof initiatives[0], index: number, isMobile: boolean }) => (
  <motion.div
    key={initiative.title}
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: isMobile ? "-50px" : "0px" }}
    transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? index * 0.1 : index * 0.2 }}
    className="group relative"
  >
    {/* Card Background Pattern - Only render on desktop */}
    {!isMobile && (
      <div 
        className="absolute inset-0 rounded-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{ background: initiative.bgPattern }}
      />
    )}
    
    <div className="relative p-8 rounded-3xl bg-white/90 backdrop-blur-sm shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_8px_32px_-8px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:translate-y-[-4px]">
      {/* Icon with Modern Treatment */}
      <div className={`w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 mb-8 transition-all duration-300 ${initiative.color}`}>
        {initiative.icon}
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h3 className="text-2xl font-bold font-['Asgard'] text-gray-900">
            {initiative.title}
          </h3>
          <div className="flex items-center px-4 py-1 rounded-full bg-gray-100">
            <span className="text-sm font-['Satoshi'] font-medium text-gray-900">
              {initiative.stats}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 font-['Satoshi'] leading-relaxed">
          {initiative.description}
        </p>

        <Link href={initiative.href} className="group/btn inline-flex items-center text-[#ff3b30] font-['Satoshi'] font-medium">
          <span className="relative">
            Learn more
            {!isMobile && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-current transform origin-left scale-x-0 transition-transform duration-300 group-hover/btn:scale-x-100" />
            )}
          </span>
          <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  </motion.div>
));

InitiativeCard.displayName = 'InitiativeCard';

// Memoize the header section
const SectionHeader = React.memo(({ isMobile }: { isMobile: boolean }) => (
  <div className="max-w-5xl mx-auto text-center mb-24 px-4">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: isMobile ? "-50px" : "0px" }}
      className="inline-flex items-center justify-center space-x-2 mb-8"
    >
      <div className="h-[2px] w-8 bg-[#ff3b30]" />
      <span className="text-[#ff3b30] font-['Satoshi'] text-lg font-medium tracking-wider uppercase">
        Environmental Impact
      </span>
      <div className="h-[2px] w-8 bg-[#ff3b30]" />
    </motion.div>
    
    <motion.h2 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: isMobile ? "-50px" : "0px" }}
      transition={{ delay: 0.2 }}
      id="sustainability-title"
      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 font-['Asgard'] tracking-tight relative"
    >
      <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] via-[#ff2d30] to-[#ff3b30] relative z-10">
        Sustainability
      </span>
      <br />
      <span className="text-gray-900 relative z-10">Commitment</span>
    </motion.h2>
    
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: isMobile ? "-50px" : "0px" }}
      transition={{ delay: 0.3 }}
      className="text-lg sm:text-xl md:text-2xl text-gray-600 font-['Satoshi'] leading-relaxed max-w-3xl mx-auto relative z-10"
    >
      Pioneering sustainable food practices through innovation and mindful operations, 
      creating a future where tradition meets environmental responsibility.
    </motion.p>
  </div>
));

SectionHeader.displayName = 'SectionHeader';

// Optimize the background stains with useMemo
export function SustainabilityCommitmentSection() {
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => setIsHydrated(true), []);
  if (!isHydrated) return null;
  return <SustainabilityCommitmentSectionInner />;
}

function SustainabilityCommitmentSectionInner() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useParallax(scrollYProgress, isMobile ? 50 : 100);
  const stainY1 = useParallax(scrollYProgress, isMobile ? 75 : 150);
  const stainY2 = useParallax(scrollYProgress, isMobile ? -50 : -100);
  const stainY3 = useParallax(scrollYProgress, isMobile ? 40 : 80);

  const backgroundStains = React.useMemo(() => (
    !isMobile && (
      <>
        <motion.div 
          style={{ y: stainY1 }}
          className="absolute top-0 -right-20 w-[600px] h-[600px] opacity-[0.07]"
        >
          <div className="absolute inset-0 bg-[#ff3b30] rounded-full blur-[100px] mix-blend-multiply" />
        </motion.div>

        <motion.div 
          style={{ y: stainY2 }}
          className="absolute -bottom-32 -left-20 w-[500px] h-[500px] opacity-[0.05]"
        >
          <div className="absolute inset-0 bg-[#ff3b30] rounded-full blur-[120px] mix-blend-multiply" />
        </motion.div>

        <motion.div 
          style={{ y: stainY3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]"
        >
          <div className="absolute inset-0 bg-[#ff3b30] rounded-full blur-[150px] mix-blend-multiply" />
        </motion.div>
      </>
    )
  ), [stainY1, stainY2, stainY3, isMobile]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen w-full flex items-center justify-center py-32 overflow-hidden"
      aria-labelledby="sustainability-title"
    >
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-[linear-gradient(120deg,#00000008_1px,transparent_1px),linear-gradient(90deg,#00000008_1px,transparent_1px)] ${isMobile ? 'bg-[size:16px_16px]' : 'bg-[size:24px_24px]'}`} />
      </div>

      {backgroundStains}

      <div className="relative w-full">
        <SectionHeader isMobile={isMobile} />
        
        <motion.div 
          style={{ y }}
          className="grid gap-6 md:gap-8 lg:gap-12 grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto mb-24 px-2 lg:px-8 relative z-10"
        >
          {initiatives.map((initiative, index) => (
            <InitiativeCard 
              key={initiative.title} 
              initiative={initiative} 
              index={index}
              isMobile={isMobile} 
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: isMobile ? "-50px" : "0px" }}
          className="text-center px-4 relative z-10"
        >
          <Link 
            href="/values/sustainable-practices" 
            className="inline-flex items-center px-8 sm:px-12 py-4 sm:py-6 rounded-2xl text-white 
            relative overflow-hidden group bg-gray-900 
            shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)] transition-all duration-300
            hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#ff3b30] via-[#ff2d30] to-[#ff3b30] 
              opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center font-['Satoshi'] font-medium text-base sm:text-lg">
              Explore Our Sustainable Practices
              <ArrowRight className="ml-3 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}