"use client";
import {
  motion,
  useScroll,
  useTransform
} from "motion/react";
import React, { useLayoutEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({
  data,
  className
}: {
  data: TimelineEntry[];
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className={`w-full font-sans ${className}`}
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-20 md:pt-32 md:gap-10 group"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white/80  backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg transition-all duration-300 group-hover:scale-110 [will-change:transform]">
                <div className="h-4 w-4 rounded-full bg-[#ff3b30]  transition-all duration-300 group-hover:scale-110 [will-change:transform]" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-6xl font-asgard font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-asgard font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#ff3b30] to-[#ff5e54]">
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
            opacity: height > 0 ? 1 : 0,
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-white/20  to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] transition-opacity duration-500"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-[#ff3b30] via-[#ff5e54] to-transparent from-[0%] via-[10%] rounded-full [will-change:height,opacity]"
          />
        </div>
      </div>
    </div>
  );
};
