'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export function CustomScrollbar() {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Custom scrollbar track */}
      <div 
        className="fixed right-0 top-0 h-full w-1.5 md:w-2 bg-black/5  backdrop-blur-sm z-[200]"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
        }}
      />
      
      {/* Animated scrollbar thumb */}
      <motion.div
        className="fixed right-0 top-0 z-[201] w-1.5 md:w-2"
        style={{
          height: '100%',
          scaleY,
          transformOrigin: 'top',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full rounded-full"
          style={{
            background: 'linear-gradient(to bottom, #ff3b30, #ff5e54)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          }}
        >
          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </motion.div>
      </motion.div>

      {/* Hide default scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        * {
          scrollbar-width: none;
        }
      `}} />
    </>
  );
} 