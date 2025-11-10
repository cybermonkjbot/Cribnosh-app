'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, ShieldCheck, Home, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useMobileDevice } from '@/hooks/use-mobile-device';

const CertifiedKitchensFloat = () => {
  if (process.env.NEXT_PUBLIC_DISABLE_CERTIFIED_KITCHENS_FLOAT === 'true') {
    return null;
  }

  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useMobileDevice();
  const [themeStyle, setThemeStyle] = useState({
    text: 'text-white',
    border: 'border-white/30',
    background: 'bg-white/20',
    iconColor: 'text-[#ff3b30]'
  });

  const colorMap = {
    'dark': { 
      text: 'text-white', 
      border: 'border-white/30',
      background: 'bg-white/20',
      iconColor: 'text-[#ff3b30]'
    },
    'light': { 
      text: 'text-gray-900', 
      border: 'border-gray-900/30',
      background: 'bg-gray-900/10',
      iconColor: 'text-[#ff3b30]'
    },
    'brand': { 
      text: 'text-white', 
      border: 'border-[#ff5e54]/30',
      background: 'bg-white/20',
      iconColor: 'text-white'
    }
  };

  useEffect(() => {
    // Delay the appearance for smooth animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll<HTMLElement>('[data-section-theme]');
      
      let currentTheme = 'dark'; // Default fallback
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Check if the floating button's position intersects with the section
        const buttonPosition = window.innerHeight - 100; // Approximate button position from bottom
        if (rect.top <= buttonPosition && rect.bottom >= buttonPosition) {
          currentTheme = section.dataset.sectionTheme || currentTheme;
        }
      });

      setThemeStyle(colorMap[currentTheme as keyof typeof colorMap]);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    } else {
      router.push('/certification');
    }
  };

  return (
    <div
      className={`fixed z-[100] transition-all duration-500 ease-in-out transform
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        ${isMobile ? 'bottom-4 left-4' : 'bottom-6 left-6 sm:bottom-8 sm:left-8 md:bottom-10 md:left-10'}
        w-auto`}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      <AnimatePresence>
        {(isHovered || isExpanded) && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 w-80 max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden
              bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]
              border border-white/20 before:absolute before:inset-0 
              before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none"
          >
            {/* Image Section */}
            <div className="relative h-32 w-full overflow-hidden">
              <Image
                src="/kitchenillus.png"
                alt="Certified Kitchen Illustration"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-white drop-shadow-lg" />
                  <h4 className="font-semibold text-white text-lg drop-shadow-lg">
                    Certified Home Kitchens
                  </h4>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="relative p-4 space-y-4">
              <p className="text-gray-700 text-sm leading-relaxed">
                Every Cribnosh kitchen is thoroughly vetted and regularly inspected to ensure the highest standards of food safety and quality.
              </p>
              
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Home className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Regular on-site hygiene inspections</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Food safety certification required</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-50 to-amber-100/50 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <span>Quality compliance monitoring</span>
                </div>
              </div>

              <Link
                href="/certification"
                className="block w-full bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white text-center py-2 rounded-xl text-sm font-medium 
                  hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl
                  relative overflow-hidden group"
              >
                <span className="relative z-10">Learn More About Certification</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            {/* Enhanced Tooltip arrow with glass effect */}
            <div className="absolute bottom-[-8px] left-6 w-4 h-4 rotate-45 
              bg-white/95 backdrop-blur-xl border border-white/20 border-t-0 border-l-0
              before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleClick}
        className={`group flex items-center gap-2 px-4 py-3 
          ${themeStyle.background} hover:bg-white/30 
          backdrop-blur-xl
          ${themeStyle.border}
          rounded-2xl
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          ${themeStyle.text} text-sm font-semibold
          ${isMobile ? 'py-4' : 'md:px-6'}
          ${isExpanded ? (isMobile ? 'w-[calc(100vw-2rem)]' : 'w-auto') : 'w-auto'}
          hover:scale-[1.02] active:scale-[0.98]
          relative overflow-hidden
          before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none
          after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/5 after:to-transparent after:pointer-events-none`}
      >
        <Award 
          className={`w-5 h-5 ${themeStyle.iconColor} transition-colors relative z-10`}
          strokeWidth={2.5}
        />
        <span className={`whitespace-nowrap relative z-10`}>
          Certified Kitchens
        </span>
      </button>

      {isExpanded && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <AnimatePresence>
        {isExpanded && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 rounded-2xl overflow-hidden
              bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]
              border border-white/20 z-[95]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award 
                className="w-6 h-6 text-[#ff3b30]" 
                strokeWidth={2.5}
              />
              <h3 className="text-lg font-semibold text-gray-900">Food Hygiene Rating</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50/80 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center">
                  <Home className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Regular Inspections</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50/80 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Safety Certified</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50/80 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm text-gray-700">Quality Monitored</span>
              </div>
            </div>

            <Link
              href="/certification"
              className="block w-full bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white text-center py-3 rounded-xl font-medium 
                hover:opacity-90 active:opacity-80 transition-opacity shadow-lg
                relative overflow-hidden"
            >
              <span className="relative z-10">View Certification Details</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-3 block w-full text-gray-500 text-center py-2 active:opacity-60"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CertifiedKitchensFloat;