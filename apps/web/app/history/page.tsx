"use client";

import HeroGeometric from "@/components/hero-geometric";
import { ContainerScrollAnimation } from "@/components/ui/container-scroll-animation";
import { CustomScrollbar } from "@/components/ui/custom-scrollbar";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { SparkleEffect } from "@/components/ui/sparkle-effect";
import { ThoughtBubble } from "@/components/ui/thought-bubble";
import { Timeline } from "@/components/ui/timeline";
import { motion } from "motion/react";

// Memoized timeline item component to prevent unnecessary re-renders
const TimelineItemContent = ({ title, items }: { title: string; items: string[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "0px 0px -100px 0px" }} // Reduced intersection margin
    className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:shadow-xl transition-all duration-300 group hover:bg-black/50"
  >
    <SparkleEffect>
      <h3 className="text-2xl font-asgard font-bold text-[#ff3b30] mb-4 group-hover:scale-105 transition-transform">{title}</h3>
    </SparkleEffect>
    <ul className="space-y-4 text-white/70 font-satoshi">
      {items.map((item, index) => (
        <motion.li
          key={index}
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true, margin: "0px 0px -50px 0px" }} // Reduced intersection margin
          className="flex items-center gap-2 group-hover:text-white/90 transition-colors"
        >
          <span className="text-[#ff3b30]">•</span> {item}
        </motion.li>
      ))}
    </ul>
  </motion.div>
);

const timelineData = [
  {
    title: "2026",
    items: [
      "Launched early access program with 50 certified Food Creators",
      "Introduced AI-powered personalized meal recommendations",
      "Established partnerships with local food suppliers",
      "Implemented blockchain-based kitchen certification system"
    ]
  },
  {
    title: "2023",
    items: [
      "CribNosh concept developed by a team of food enthusiasts and tech innovators",
      "Conducted extensive research on home kitchen safety standards",
      "Developed proprietary kitchen certification process",
      "Built initial platform prototype and conducted user testing"
    ]
  },
  {
    title: "2022",
    items: [
      "Identified gap in market for authentic home-cooked meals",
      "Initial team formation and vision development",
      "First round of funding secured",
      "Started development of food safety standards"
    ]
  },
];

export default function HistoryPage() {
  return (
    <main className="relative">
      <CustomScrollbar />
      <ScrollToTop />

      <ParallaxGroup>
        {/* Simplified background layers */}
        <ParallaxLayer asBackground speed={0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>

        {/* Reduced blur effects */}
        <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[80px] -top-20 -right-20 opacity-50" />
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[60px] bottom-0 -left-20 opacity-40" />
          </div>
        </ParallaxLayer>

        {/* Content layer */}
        <div className="relative z-10 flex-1">
          {/* Hero Section */}
          <section
            data-section-theme="dark"
            className="w-full"
          >
            <HeroGeometric
              badge="Our Journey"
              title1="The CribNosh"
              title2="Story"
              fullScreen
            />

            <ContainerScrollAnimation>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto text-center -mt-32"
              >
                <p className="text-xl text-gray-300 font-satoshi leading-relaxed">
                  From a simple idea to revolutionize home dining, to a vibrant community of passionate chefs and food lovers. Here's how CribNosh has grown and evolved.
                </p>

                <div className="mt-4 flex justify-center">
                  <ThoughtBubble className="transform hover:scale-105 transition-transform" />
                </div>
              </motion.div>
            </ContainerScrollAnimation>
          </section>

          {/* Timeline Section */}
          <section
            data-section-theme="light"
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black/90 backdrop-blur-sm" />

            <div className="relative">
              <Timeline
                data={timelineData.map(item => ({
                  title: item.title,
                  content: <TimelineItemContent title={item.title} items={item.items} />
                }))}
                className="pt-20 pb-40"
              />
            </div>

            {/* Simplified gradient overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
            </div>
          </section>
        </div>

        {/* Reduced decorative elements */}
        <ParallaxLayer speed={1.5} className="z-20 pointer-events-none">
          <div className="fixed inset-0">
            <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20" />
            <div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30" />
          </div>
        </ParallaxLayer>
      </ParallaxGroup>
    </main>
  );
} 