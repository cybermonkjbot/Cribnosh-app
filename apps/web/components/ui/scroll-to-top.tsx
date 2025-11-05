'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useMobileMenu } from '@/context';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { isMobileMenuOpen } = useMobileMenu();

  // Show button when page is scrolled up to given distance
  const toggleVisibility = () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollable = docHeight - winHeight;

    // Hide if page is too short to scroll (less than 2x viewport height)
    if (scrollable < winHeight) {
      setIsVisible(false);
      return;
    }
    // Show only if scrolled at least half the page
    if (scrollY > scrollable / 2) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top scroll
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && !isMobileMenuOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}