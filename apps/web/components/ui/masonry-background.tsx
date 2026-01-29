"use client";

import { motion } from "motion/react";
import Image from "next/image";

interface MasonryBackgroundProps {
  className?: string;
}

export function MasonryBackground({ className }: MasonryBackgroundProps) {
  const images = [
    {
      src: "/backgrounds/masonry-1.jpg",
      alt: "Kitchen background",
      className: "top-[15vh] md:top-[25vh] left-[5vw] md:left-auto md:right-[5vw] w-[30vw] md:w-[25vw] h-[20vh] md:h-[30vh]",
      delay: 0.2,
    },
    {
      src: "/backgrounds/masonry-2.jpg",
      alt: "Cooking background",
      className: "top-[40vh] md:top-[45vh] left-[35vw] md:left-auto md:right-[15vw] w-[30vw] md:w-[20vw] h-[20vh] md:h-[35vh] [transform:rotateY(15deg)] md:[transform:none]",
      delay: 0.3,
    },
    {
      src: "/backgrounds/masonry-3.jpg",
      alt: "Food background",
      className: "top-[70vh] left-[60vw] md:left-auto md:right-[8vw] w-[30vw] md:w-[22vw] h-[20vh] md:h-[25vh]",
      delay: 0.4,
    },
  ];

  return (
    <div
      className={`fixed top-0 right-0 md:w-[45vw] w-[60vw] h-screen ${className}`}
      style={{
        zIndex: 1, // Lower z-index to ensure it stays in background
        pointerEvents: "none"
      }}
    >
      <motion.div
        className="relative w-full h-full opacity-50 md:opacity-100 [perspective:none] md:[perspective:1000px] [transform-style:flat] md:[transform-style:preserve-3d]"
        style={{
          pointerEvents: "none",
        }}
      >
        {images.map((image, index) => (
          <motion.div
            key={image.src}
            className={`absolute rounded-2xl overflow-hidden shadow-2xl pointer-events-none ${image.className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 0.9 - (index * 0.05),
              y: 0,
            }}
            transition={{
              duration: 0.4,
              delay: image.delay,
            }}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 30vw, 25vw"
              className="object-cover"
              priority={index === 0}
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none opacity-20"
            />
          </motion.div>
        ))}

        {/* Decorative gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-l from-white/50 to-transparent pointer-events-none"
        />
      </motion.div>
    </div>
  );
}