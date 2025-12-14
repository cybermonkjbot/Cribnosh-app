"use client"

import { useMobileDevice } from "@/hooks/use-mobile-device"
import { env } from "@/lib/config/env"
import { motion } from "motion/react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { MenuBar } from "./header-menu"
import { MobileMenu } from "./mobile-menu"

interface HeaderProps {
  className?: string;
}

/**
 * Renders a fixed, responsive navigation header that adapts its appearance based on scroll position, section theme, device type, and dark mode settings.
 *
 * The header dynamically adjusts its background opacity, text color, and border color as the user scrolls and as different themed sections enter the viewport. It displays a logo, navigation menu (with mobile and desktop variants), and a call-to-action area. Dark mode styling is disabled if specified by an environment variable, but section-based theming remains active.
 *
 * @param className - Optional additional CSS classes for the header element
 */
export function Header({ className = '' }: HeaderProps) {
  const { isMobile, isTablet } = useMobileDevice();
  const { theme } = useTheme();
  // When dark mode is disabled, we still want the header to use light theme
  // but keep section theming functionality
  const isDark = env.DISABLE_DARK_MODE ? false : theme === 'dark';

  const [headerStyle, setHeaderStyle] = useState({
    text: 'text-white',
    border: 'border-white/20',
    scrolled: false,
    bgOpacity: 0,
    initialized: false,
    isOverHero: true // Start with white logo for hero section
  });

  const colorMap = {
    'dark': { text: 'text-white', border: 'border-white/20' },
    'light': { text: 'text-gray-900', border: 'border-gray-900/20' },
    'brand': { text: 'text-white', border: 'border-[#ff5e54]/20' }
  };

  const handleScroll = useCallback(() => {
    let rafId: number;
    let lastScrollY = window.scrollY;
    let ticking = false;

    return () => {
      lastScrollY = window.scrollY;

      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          const sections = document.querySelectorAll<HTMLElement>('[data-section-theme]');

          // Start with dark theme until we've scrolled enough to detect sections
          let currentTheme = 'light';
          let isOverHero = false; // Default to false for initial render

          sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 50) {
              currentTheme = section.dataset.sectionTheme || currentTheme;
            }
          });

          // Determine if we're over a red background (brand theme) for logo color
          isOverHero = currentTheme === 'brand';

          // Calculate background opacity based on scroll position
          const bgOpacity = Math.min(lastScrollY / 100, 1);

          setHeaderStyle({
            ...colorMap[currentTheme as keyof typeof colorMap],
            scrolled: lastScrollY > 10,
            bgOpacity: isMobile ? (lastScrollY > 0 ? Math.min(bgOpacity + 0.1, 1) : 0) : bgOpacity, // 100% transparent on mobile before scroll
            initialized: true,
            isOverHero
          });

          ticking = false;
        });
        ticking = true;
      }
    };
  }, [isMobile]);

  useEffect(() => {
    const scrollHandler = handleScroll();
    window.addEventListener('scroll', scrollHandler, { passive: true });
    scrollHandler(); // Initial call
    return () => window.removeEventListener('scroll', scrollHandler);
  }, [handleScroll]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${headerStyle.text} ${isMobile && !headerStyle.scrolled ? '' : headerStyle.border
        } ${headerStyle.scrolled
          ? 'py-3 border-b'
          : 'py-6'
        } ${className}`}
      style={{
        backgroundColor: isMobile && !headerStyle.scrolled
          ? 'transparent'
          : isDark
            ? `rgba(0, 0, 0, ${headerStyle.bgOpacity * 0.3})`
            : `rgba(255, 255, 255, ${headerStyle.bgOpacity * 0.3})`,
        backdropFilter: headerStyle.scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: headerStyle.scrolled ? 'blur(12px)' : 'none',
        transform: `translateY(${headerStyle.scrolled ? '0' : '-2px'})`,
        boxShadow: headerStyle.scrolled ? '0 4px 30px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className={`${(!isMobile && !isTablet) ? 'hidden' : ''} mr-4`}>
            <MobileMenu navItems={[
              { label: "Home", href: "/" },
              { label: "Features", href: "/features" },
              { label: "About", href: "/about" },
              { label: "Careers", href: "/careers" },
              { label: "Contact", href: "/contact" },
              { label: "Blog", href: "/by-us" }
            ]} />
          </div>

          <div className="-ml-4 pl-4">
            <Link href="/" className="flex items-center" data-cursor-text="Back to Home">
              <div className="relative h-9 w-auto">
                {/* Logo with dynamic styling based on hero section */}
                <Image
                  src="/logo.svg"
                  alt="Cribnosh Logo"
                  width={110}
                  height={36}
                  className={`h-9 w-auto transition-all duration-500 ${headerStyle.isOverHero
                      ? 'brightness-0 invert' // White logo over red background
                      : 'brightness-100 invert-0' // Normal red logo
                    }`}
                  priority
                />
              </div>
            </Link>
          </div>

          <div className={`${(isMobile || isTablet) ? 'hidden' : ''} ml-6`}>
            <MenuBar />
          </div>

          <div className="ml-auto">
            <HeaderCTA />
          </div>
        </div>
      </div>
    </header>
  )
}

/**
 * Renders animated call-to-action buttons for joining the waitlist and partnering with Cribnosh, with styling that adapts to the current theme and dark mode settings.
 */
export function HeaderCTA() {
  const { theme } = useTheme();
  const isDarkTheme = env.DISABLE_DARK_MODE ? false : theme === "dark";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoggedIn(!!localStorage.getItem("cribnosh_user_id"));
    }
  }, []);

  return (
    <div className="flex items-center gap-4">
      <motion.div
        className="p-1.5 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className={`absolute -inset-2 bg-gradient-radial from-transparent ${isDarkTheme
              ? "via-green-400/30 via-30% via-emerald-400/30 via-60% via-teal-400/30 via-90%"
              : "via-green-400/20 via-30% via-emerald-400/20 via-60% via-teal-400/20 via-90%"
            } to-transparent rounded-3xl z-0 pointer-events-none opacity-0`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {isLoggedIn ? (
          <Link href="/referral/dashboard" className="relative z-10" data-cursor-text="See your referral rewards">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-foreground"
            >
              You are in
            </motion.button>
          </Link>
        ) : (
          <Link href="/waitlist" className="relative z-10" data-cursor-text="Get early access to CribNosh">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 sm:px-5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-foreground"
            >
              Join Waitlist
            </motion.button>
          </Link>
        )}
      </motion.div>

      <motion.div
        className="hidden sm:block p-1.5 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
      >
        <motion.div
          className={`absolute -inset-2 bg-gradient-radial from-transparent ${isDarkTheme
              ? "via-purple-400/40 via-30% via-fuchsia-400/40 via-60% via-pink-400/40 via-90%"
              : "via-purple-400/30 via-30% via-fuchsia-400/30 via-60% via-pink-400/30 via-90%"
            } to-transparent rounded-3xl z-0 pointer-events-none opacity-0`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <Link href="/work-with-cribnosh" className="relative z-10" data-cursor-text="Partner with us as a chef or driver">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-1.5 text-sm font-medium text-foreground"
          >
            Work with Cribnosh
          </motion.button>
        </Link>
      </motion.div>
    </div>
  )
} 