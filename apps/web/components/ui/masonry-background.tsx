"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MasonryBackgroundProps {
  className?: string;
}

export function MasonryBackground({ className }: MasonryBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const images = [
    {
      src: "/backgrounds/masonry-1.jpg",
      alt: "Kitchen background",
      position: { 
        top: isDesktop ? "25vh" : "15vh", 
        left: isDesktop ? undefined : "5vw",
        right: isDesktop ? "5vw" : undefined
      },
      size: { 
        width: isDesktop ? "25vw" : "30vw", 
        height: isDesktop ? "30vh" : "20vh" 
      },
      delay: 0.2,
    },
    {
      src: "/backgrounds/masonry-2.jpg",
      alt: "Cooking background",
      position: { 
        top: isDesktop ? "45vh" : "40vh", 
        left: isDesktop ? undefined : "35vw",
        right: isDesktop ? "15vw" : undefined
      },
      size: { 
        width: isDesktop ? "20vw" : "30vw", 
        height: isDesktop ? "35vh" : "20vh" 
      },
      delay: 0.3,
    },
    {
      src: "/backgrounds/masonry-3.jpg",
      alt: "Food background",
      position: { 
        top: isDesktop ? "70vh" : "70vh", 
        left: isDesktop ? undefined : "60vw",
        right: isDesktop ? "8vw" : "5vw"
      },
      size: { 
        width: isDesktop ? "22vw" : "30vw", 
        height: isDesktop ? "25vh" : "20vh" 
      },
      delay: 0.4,
    },
  ];

  useEffect(() => {
    setIsMounted(true);
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      className={`fixed top-0 right-0 md:w-[45vw] w-[60vw] h-screen ${className}`}
      style={{ 
        zIndex: 1, // Lower z-index to ensure it stays in background
        pointerEvents: "none"
      }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: isDesktop ? "preserve-3d" : "flat",
          perspective: isDesktop ? "1000px" : "none",
          pointerEvents: "none",
          opacity: isDesktop ? 1 : 0.5,
        }}
      >
        {images.map((image, index) => (
          <motion.div
            key={image.src}
            className="absolute rounded-2xl overflow-hidden shadow-2xl"
            style={{
              top: image.position.top,
              [isDesktop ? 'right' : 'left']: isDesktop ? image.position.right : image.position.left,
              width: image.size.width,
              height: image.size.height,
              pointerEvents: "none",
              rotateY: !isDesktop && index === 1 ? '15deg' : 0,
            }}
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
              sizes={`(max-width: 768px) ${image.size.width}, ${image.size.width}`}
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent"
              style={{
                opacity: 0.2,
                pointerEvents: "none"
              }}
            />
          </motion.div>
        ))}

        {/* Decorative gradient overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-l from-white/50 to-transparent"
          style={{ pointerEvents: "none" }}
        />
      </motion.div>
    </div>
  );
} 