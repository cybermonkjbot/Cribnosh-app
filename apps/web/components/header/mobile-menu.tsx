"use client"

import { MobileMenuInput } from "@/components/try-it/mobile-menu-input"
import { useMobileMenu } from "@/context"
import { MobileDeviceInfo, useMobileDevice } from "@/hooks/use-mobile-device"
import { env } from "@/lib/config/env"
import { ArrowLeft, Menu, X } from "lucide-react"
import { AnimatePresence, motion, Variants } from "motion/react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface NavItem {
  label: string
  href: string
  cursorText?: string
}

interface MobileMenuProps {
  navItems: NavItem[]
}

/**
 * Renders an animated mobile navigation menu with theme support, swipe-to-close gesture, and conditional feature toggles.
 *
 * Displays navigation links, call-to-action buttons, and either an AI input or a waitlist link based on environment flags. The menu adapts its styling to light or dark mode, supports accessibility attributes, and prevents background scrolling when open. Swipe gestures are enabled on touch devices for closing the menu.
 *
 * @param navItems - The list of navigation items to display in the menu.
 * @returns The rendered mobile menu component.
 */
export function MobileMenu({ navItems }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [isOverHero, setIsOverHero] = useState(false)
  const { theme } = useTheme()
  // When dark mode is disabled, we still want the mobile menu to use light theme styling
  const isDark = env.DISABLE_DARK_MODE ? false : theme === "dark"
  const { setIsMobileMenuOpen } = useMobileMenu()
  const deviceInfo: MobileDeviceInfo = useMobileDevice()

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
  };

  const toggleMenu = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setIsMobileMenuOpen(newState);
  };

  // Scroll detection for logo color change using existing section theme system
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const sections = document.querySelectorAll<HTMLElement>('[data-section-theme]');

      // Start with brand theme (red background) until we've scrolled enough to detect sections
      let currentTheme = 'light';

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 50) {
          currentTheme = section.dataset.sectionTheme || currentTheme;
        }
      });

      // Determine if we're over a red background (brand theme) for logo color
      setIsOverHero(currentTheme === 'brand');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    // If swiped more than 50px to the right, close menu
    if (diff < -50) {
      toggleMenu();
      setTouchStart(null);
    }
  };

  const menuVariants: Variants = {
    hidden: {
      opacity: 0,
      x: "-100%",
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    },
    exit: {
      opacity: 0,
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren"
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }
    },
    exit: {
      x: -20,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={toggleMenu}
        className="p-2 text-current active:scale-90 transition-transform"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className={`fixed inset-0 z-50 ${isDark ? 'bg-slate-900/95' : 'bg-slate-50/95'} backdrop-blur-sm`}
            onTouchStart={deviceInfo.hasTouchScreen ? handleTouchStart : undefined}
            onTouchMove={deviceInfo.hasTouchScreen ? handleTouchMove : undefined}
          >
            {/* Header */}
            <div className={`flex items-center p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} ${isDark ? 'bg-slate-900' : 'bg-slate-50'} safe-area-top`}>
              <button
                onClick={toggleMenu}
                className={`p-2 rounded-full transition-colors active:scale-90 mr-3 ${isDark
                    ? 'text-slate-200 hover:bg-slate-800 active:bg-slate-700'
                    : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                aria-label="Close menu"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="relative h-8 w-auto">
                <Image
                  src="/logo.svg"
                  alt="Cribnosh Logo"
                  width={100}
                  height={32}
                  className={`h-8 w-auto transition-all duration-500 ${isOverHero
                      ? 'brightness-0 invert' // White logo over red background
                      : 'brightness-100 invert-0' // Normal red logo
                    }`}
                  priority
                />
              </div>
            </div>

            {/* Menu content */}
            <nav
              className={`h-[calc(100vh-73px)] ${isDark ? 'bg-slate-900' : 'bg-slate-50'} flex flex-col overflow-y-auto safe-area-bottom`}
              style={{
                height: deviceInfo.orientation === 'landscape' ? '100vh' : 'calc(100vh - 73px)',
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {navItems.map((item, index) => (
                    <motion.div key={item.href} variants={itemVariants}>
                      <Link
                        href={item.href}
                        onClick={toggleMenu}
                        className={`block px-4 py-4 text-lg font-asgard rounded-xl relative group overflow-hidden ${isDark
                            ? 'text-slate-100 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                            : 'text-slate-800 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
                          }`}
                      >
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-r from-[#ff3b30]/5 to-[#ff5e54]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'group-hover:from-[#ff3b30]/10 group-hover:to-[#ff5e54]/10' : ''
                            }`}
                          layoutId={`highlight-${item.href}`}
                        />
                        <span className="relative z-10 flex items-center">
                          <span>{item.label}</span>
                          <motion.span
                            className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                          >
                            →
                          </motion.span>
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Additional menu items */}
                <div className={`mt-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <motion.div variants={itemVariants}>
                    <Link
                      href="/waitlist"
                      onClick={toggleMenu}
                      className="block px-4 py-4 text-lg font-asgard bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] rounded-xl text-white text-center shadow-lg active:scale-98 transition-transform"
                    >
                      Join Waitlist
                    </Link>
                  </motion.div>
                  <motion.div variants={itemVariants} className="mt-2">
                    <Link
                      href="/work-with-cribnosh"
                      onClick={toggleMenu}
                      className={`block px-4 py-4 text-lg font-asgard rounded-xl text-center border-2 ${isDark
                          ? 'text-slate-100 border-slate-800 hover:bg-slate-800 active:bg-slate-700'
                          : 'text-slate-800 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                        }`}
                    >
                      Work with Cribnosh
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* AI Input at the bottom */}
              {!env.DISABLE_TRY_IT && (
                <div className="mt-auto">
                  <MobileMenuInput onSendMessage={handleSendMessage} />
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 