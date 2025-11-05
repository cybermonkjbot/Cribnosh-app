"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from 'next/link';
import { Footer } from "../footer/footer";
import { Header } from "../header/header";
import { CookieSettingsPopup } from "../ui/cookie-settings";
import { ThemeProvider } from 'next-themes';
import { MultiStepLoader } from '../ui/loader';
import { env } from '@/lib/config/env';
import { useReducedMotion, useMobileDevice } from '../../hooks/use-device-info';
import { 
  Utensils, 
  ChefHat, 
  Star, 
  MapPin, 
  Search, 
  Sparkles, 
  Car, 
  Settings, 
  HelpCircle, 
  Info, 
  MessageCircle 
} from "lucide-react";

interface ContextMenuPosition {
  x: number;
  y: number;
  show: boolean;
  isMobile?: boolean;
}

// Export getCursorTitle for use in root layout
export const getCursorTitle = (path: string) => {
  const titles: { [key: string]: string } = {
    "/": "Welcome to CribNosh",
    "/try-it": "Find Your Perfect Meal",
    "/cooking": "Join Our Chefs",
    "/cooking/apply": "Become a Chef",
    "/driving": "Deliver with Us",
    "/driving/apply": "Join Our Drivers",
    "/about": "Our Story",
    "/features": "Explore Features",
    "/careers": "Join Our Team",
    "/contact": "Get in Touch",
    "/manifesto": "Our Vision",
    "/privacy": "Privacy First",
    "/terms": "Our Terms",
    "/waitlist": "Early Access",
    "/early-access-perks": "Member Benefits",
    "/work-with-cribnosh": "Partner with Us",
    "/all-cities": "Cities We Serve",
    "/certification": "Get Certified",
    "/compliance": "Food Safety"
  };

  const normalizedPath = path.replace(/\/$/, "");
  return titles[normalizedPath] || "CribNosh";
};

/**
 * Provides the main client-side layout for the application, including responsive design, accessibility features, theme management, and a custom context menu with search and quick actions.
 *
 * Wraps page content with header, footer, and safe area insets, manages viewport and device orientation, and handles global UI state such as loading animations and cookie settings. Integrates with Next.js routing and supports both desktop and mobile interactions.
 *
 * @param children - The page content to be rendered within the layout
 * @returns The rendered layout component with all UI wrappers and interactive features
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const isStaffRoute = pathname?.startsWith('/staff') ?? false;
  const isApplicationPage = pathname === "/cooking/apply" || pathname === "/driving/apply";  const isTryItPage = pathname === "/try-it";
  const isWaitlistPage = pathname === "/waitlist";
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const [safeAreaTop, setSafeAreaTop] = useState('0px');
  const [safeAreaBottom, setSafeAreaBottom] = useState('0px');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>({ x: 0, y: 0, show: false, isMobile: false });
  const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMobileDevice();

  // Handle right click with useCallback
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (isMobile) return; // Exit early on mobile devices
    e.preventDefault();
    const isMobileDevice = window.innerWidth <= 768;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true,
      isMobile: isMobileDevice
    });
  }, [isMobile]);

  // Handle click outside with useCallback
  const handleClick = useCallback((e: MouseEvent | Event) => {
    if (contextMenu.show && e instanceof MouseEvent && !(e.target as HTMLElement).closest('.context-menu')) {
      setContextMenu(prev => ({ ...prev, show: false }));
    }
  }, [contextMenu.show]);

  // Debounced viewport height update
  const updateViewportHeight = useCallback(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight);
        setViewportHeight(`${vh}px`);
      }, 100);
    };
  }, []);

  // Debounced safe area update
  const updateSafeArea = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    setSafeAreaTop(computedStyle.getPropertyValue('--sat') || '0px');
    setSafeAreaBottom(computedStyle.getPropertyValue('--sab') || '0px');
  }, []);

  // Memoized motion preference handler
  const updateMotionPreference = useCallback((e: MediaQueryListEvent | MediaQueryList) => {
    setPrefersReducedMotion(e.matches);
    document.documentElement.style.setProperty(
      '--transition-duration',
      e.matches ? '0s' : '0.3s'
    );
  }, []);

  // Memoized orientation handler
  const updateOrientation = useCallback((e: MediaQueryListEvent | MediaQueryList) => {
    setDeviceOrientation(e.matches ? 'landscape' : 'portrait');
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear any existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Set a new timer
    const timer = setTimeout(() => {
      if (value.length >= 2) {
        setContextMenu(prev => ({ ...prev, show: false }));
        router.push(`/try-it?q=${encodeURIComponent(value)}`);
      }
    }, 500);

    setSearchDebounceTimer(timer);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.length >= 2) {
      setContextMenu(prev => ({ ...prev, show: false }));
      router.push(`/try-it?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Simulate loading time for preloader
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4800); // Total loading time: 4 states * 1200ms = 4800ms

    return () => clearTimeout(timer);
  }, []);

  // Add effect for the search input autofocus
  useEffect(() => {
    if (contextMenu.show && searchInputRef.current) {
      // Small delay to ensure the menu is rendered before focusing
      const focusTimer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(focusTimer);
    }
  }, [contextMenu.show]);

  // Add effect to listen for cookie settings event
  useEffect(() => {
    const handleOpenCookieSettings = () => setIsCookieSettingsOpen(true);
    window.addEventListener('open-cookie-settings', handleOpenCookieSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookieSettings);
  }, []);

  useEffect(() => {
    // Add document-level context menu prevention
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleClick); // Close on scroll too

    // Handle mobile viewport height issues
    const debouncedViewportUpdate = updateViewportHeight();
    window.addEventListener('resize', debouncedViewportUpdate);
    window.addEventListener('orientationchange', () => {
      setTimeout(debouncedViewportUpdate, 100);
    });

    // Handle reduced motion preference
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMediaQuery.addEventListener('change', updateMotionPreference);

    // Handle orientation changes
    const orientationMediaQuery = window.matchMedia('(orientation: landscape)');
    orientationMediaQuery.addEventListener('change', updateOrientation);

    // Initial setup
    debouncedViewportUpdate();
    updateSafeArea();
    updateMotionPreference(motionMediaQuery);
    updateOrientation(orientationMediaQuery);

    // Safe area insets
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty(
        '--sat',
        'env(safe-area-inset-top)'
      );
      document.documentElement.style.setProperty(
        '--sab',
        'env(safe-area-inset-bottom)'
      );
    }

    // Add passive listeners for wheel and touchmove
    window.addEventListener('wheel', () => {}, { passive: true });
    window.addEventListener('touchmove', () => {}, { passive: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleClick);
      window.removeEventListener('resize', debouncedViewportUpdate);
      window.removeEventListener('orientationchange', debouncedViewportUpdate);
      motionMediaQuery.removeEventListener('change', updateMotionPreference);
      orientationMediaQuery.removeEventListener('change', updateOrientation);
      window.removeEventListener('wheel', () => {});
      window.removeEventListener('touchmove', () => {});
    };
  }, [handleContextMenu, handleClick, updateViewportHeight, updateMotionPreference, updateOrientation]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        setContextMenu({ show: false, x: 0, y: 0 });
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isMobile) return; // Exit early on mobile devices
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      
      const timer = setTimeout(() => {
        const isMobileDevice = window.innerWidth <= 768;
        setContextMenu({
          show: true,
          x: touch.clientX,
          y: touch.clientY,
          isMobile: isMobileDevice
        });
      }, 500); // 500ms for long press

      setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchStartPos(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos) return;
      
      const touch = e.touches[0];
      const moveThreshold = 10; // pixels
      
      const deltaX = Math.abs(touch.clientX - touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.y);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer, touchStartPos]);

  useEffect(() => {
    setMounted(true);

    // Function to update viewport height for iOS Safari
    const updateViewportHeight = () => {
      // Get actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      setViewportHeight(`calc(var(--vh, 1vh) * 100)`);

      // Update orientation
      setDeviceOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');

      // Update safe area insets
      const top = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top');
      const bottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom');
      setSafeAreaTop(top || '0px');
      setSafeAreaBottom(bottom || '0px');
    };

    // Initial update
    updateViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Add small delay for iOS to properly update dimensions
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  if (!mounted) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <MultiStepLoader loading={loading} />
      {/* CSS Variables for responsive design */}
      <style jsx global>{`
        :root {
          --viewport-height: ${viewportHeight};
          --safe-area-top: ${safeAreaTop};
          --safe-area-bottom: ${safeAreaBottom};
          --header-height: 4rem;
          --footer-height: auto;
          --content-max-width: 90rem;
          --content-padding-x: clamp(1rem, 5vw, 2rem);
          --section-spacing: clamp(2rem, 8vh, 6rem);
          
          /* Responsive breakpoints */
          --breakpoint-sm: 640px;
          --breakpoint-md: 768px;
          --breakpoint-lg: 1024px;
          --breakpoint-xl: 1280px;
          --breakpoint-2xl: 1536px;
          
          /* Dynamic spacing units */
          --space-unit: clamp(0.25rem, 1vw, 0.5rem);
          --space-xs: calc(var(--space-unit) * 1);
          --space-sm: calc(var(--space-unit) * 2);
          --space-md: calc(var(--space-unit) * 4);
          --space-lg: calc(var(--space-unit) * 8);
          --space-xl: calc(var(--space-unit) * 16);
          
          /* Container queries breakpoints */
          --container-sm: 30rem;
          --container-md: 45rem;
          --container-lg: 60rem;
          
          /* Dynamic font sizes */
          --font-size-base: clamp(1rem, 1.5vw, 1.125rem);
          --line-height-base: 1.5;
          --font-size-heading: clamp(1.5rem, 3vw, 2.5rem);
          --line-height-heading: 1.2;
          
          /* Motion preferences */
          --transition-duration: ${prefersReducedMotion ? '0s' : '0.3s'};
          --animation-duration: ${prefersReducedMotion ? '0s' : '1s'};
          --transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Enhanced glassmorphism */
          --glass-opacity: ${isMobile ? '0.85' : '0.8'};
          --glass-blur: ${isMobile ? '8px' : '12px'};
          --glass-border: ${isMobile ? '0.5px' : '1px'};
          --glass-shadow: ${isMobile 
            ? '0 2px 15px rgba(0, 0, 0, 0.1)' 
            : '0 4px 30px rgba(0, 0, 0, 0.1)'};
          
          /* Orientation-specific variables */
          --content-width: ${deviceOrientation === 'landscape' 
            ? 'min(90vw, var(--content-max-width))' 
            : 'min(95vw, var(--content-max-width))'};
          --sidebar-width: ${deviceOrientation === 'landscape' ? '20rem' : '100%'};
          --content-padding: ${deviceOrientation === 'landscape' 
            ? 'clamp(2rem, 5vw, 4rem)' 
            : 'clamp(1rem, 3vw, 2rem)'};
          
          /* Safari-specific touch handling */
          --touch-target-size: 44px;
          --min-tap-target-height: var(--touch-target-size);
        }

        /* Base transitions - more selective than universal selector */
        .animate-layout {
          transition-duration: var(--transition-duration);
          transition-timing-function: var(--transition-timing);
        }

        /* Exclude performance-sensitive components from transitions */
        .no-transition,
        .following-pointer,
        [data-motion="no-transition"] {
          transition: none !important;
        }

        /* Glass effect utility classes */
        .glass {
          background: rgba(255, 255, 255, var(--glass-opacity));
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: var(--glass-border) solid rgba(255, 255, 255, 0.3);
          box-shadow: var(--glass-shadow);
        }

        .glass-dark {
          background: rgba(17, 25, 40, var(--glass-opacity));
          backdrop-filter: blur(var(--glass-blur));
          -webkit-backdrop-filter: blur(var(--glass-blur));
          border: var(--glass-border) solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--glass-shadow);
        }

        /* Container query classes */
        @container (min-width: var(--container-sm)) {
          .container-sm\:text-left { text-align: left; }
          .container-sm\:flex-row { flex-direction: row; }
        }

        @container (min-width: var(--container-md)) {
          .container-md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .container-md\:gap-md { gap: var(--space-md); }
        }

        @container (min-width: var(--container-lg)) {
          .container-lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .container-lg\:gap-lg { gap: var(--space-lg); }
        }

        /* Responsive typography */
        html {
          font-size: var(--font-size-base);
          line-height: var(--line-height-base);
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        /* High contrast mode support */
        @media (forced-colors: active) {
          * {
            border-color: ButtonText;
          }
        }

        /* Print styles */
        @media print {
          .no-print { display: none !important; }
          .print-break-before { break-before: page; }
          .print-break-after { break-after: page; }
          
          @page {
            margin: 2cm;
          }
          
          a[href^="http"]::after {
            content: " (" attr(href) ")";
          }
        }

        /* Orientation-specific styles */
        @media (orientation: landscape) {
          .landscape\:flex-row {
            flex-direction: row;
          }
          .landscape\:w-sidebar {
            width: var(--sidebar-width);
          }
        }

        @media (orientation: portrait) {
          .portrait\:flex-col {
            flex-direction: column;
          }
          .portrait\:w-full {
            width: 100%;
          }
        }

        /* Full screen section utilities */
        .full-screen-section {
          width: 100vw !important;
          margin-left: 50% !important;
          transform: translateX(-50%) !important;
          max-width: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          container-type: initial !important;
        }

        .full-screen-section > * {
          max-width: var(--content-max-width);
          margin-left: auto;
          margin-right: auto;
          padding-left: var(--content-padding-x);
          padding-right: var(--content-padding-x);
        }

        .full-screen-section.full-screen-content > * {
          max-width: none;
          padding-left: 0;
          padding-right: 0;
        }

        /* Maintain safe area insets for full screen sections */
        .full-screen-section {
          padding-left: max(var(--content-padding-x), env(safe-area-inset-left)) !important;
          padding-right: max(var(--content-padding-x), env(safe-area-inset-right)) !important;
        }

        /* iOS-specific touch feedback */
        @media (hover: none) {
          .touch-feedback {
            -webkit-tap-highlight-color: transparent;
            transition: opacity 0.2s ease;
          }
          .touch-feedback:active {
            opacity: 0.7;
          }
        }

        /* iOS-specific scrolling */
        .ios-scroll {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          overscroll-behavior-y: none;
        }

        /* iOS-specific safe areas */
        .safe-area-inset {
          padding-top: var(--safe-area-top);
          padding-bottom: var(--safe-area-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
      `}</style>

      {/* Main Layout Structure */}
      <div>
        <CookieSettingsPopup 
          isOpen={isCookieSettingsOpen} 
          onClose={() => setIsCookieSettingsOpen(false)} 
        />
        <div 
          className="flex min-h-[var(--viewport-height)] flex-col ios-scroll safe-area-inset"
        >
          {/* Hide header on mobile for waitlist page */}
          {!(isAdminRoute || isStaffRoute || isApplicationPage || (isWaitlistPage && isMobile)) && (
            <>
              <Header className="h-[var(--header-height)] sticky top-0 z-40" />
              {/* <Footer className="mt-auto h-[var(--footer-height)]" /> */}
            </>
          )}
          <main 
            className="flex-1 relative w-full"
            style={{
              isolation: 'isolate'
            }}
          >
            {/* Content wrapper that allows full-screen sections */}
            <div 
              className="relative"
              style={{ 
                containerType: 'inline-size',
                containerName: 'main-content'
              }}
            >
              {children}
            </div>
          </main>
          {/* Hide footer on mobile for waitlist page */}
          {!(isAdminRoute || isStaffRoute || isTryItPage || isApplicationPage || (isWaitlistPage && isMobile)) && <Footer className="mt-auto h-[var(--footer-height)]" />}
        </div>
      </div>

      {/* Portal for Context Menu to avoid stacking context issues */}
      <div className="context-menu-portal" style={{ isolation: 'auto' }}>
        {/* Custom Context Menu */}
        <AnimatePresence>
          {contextMenu.show && (
            <>
              {/* Backdrop for mobile */}
              {contextMenu.isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setContextMenu(prev => ({ ...prev, show: false }))}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
                  style={{ pointerEvents: 'auto' }}
                />
              )}
              
              {/* Context Menu / Bottom Sheet */}
              <motion.div
                initial={contextMenu.isMobile ? 
                  { y: "100%" } : 
                  { opacity: 0, scale: 0.95 }
                }
                animate={contextMenu.isMobile ? 
                  { y: 0 } : 
                  { opacity: 1, scale: 1 }
                }
                exit={contextMenu.isMobile ? 
                  { y: "100%" } : 
                  { opacity: 0, scale: 0.95 }
                }
                transition={{ 
                  type: "spring",
                  damping: 25,
                  stiffness: 300
                }}
                className={`fixed z-[99999] bg-white/90  backdrop-blur-sm shadow-lg border border-gray-200  context-menu pointer-events-auto mix-blend-normal
                  ${contextMenu.isMobile ? 
                    'bottom-0 left-0 right-0 rounded-t-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto' : 
                    'rounded-lg p-4 min-w-[300px] max-h-[500px] overflow-auto'
                  }`}
                style={{
                  ...(
                    !contextMenu.isMobile 
                      ? {
                          top: `${contextMenu.y}px`,
                          left: `${contextMenu.x}px`,
                          transform: 'translate(0, 0)'
                        } 
                      : {}
                  ),
                  pointerEvents: 'auto'
                }}
              >
                {/* Drag Handle for Mobile */}
                {contextMenu.isMobile && (
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-1 bg-gray-300  rounded-full" />
                  </div>
                )}

                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search for dishes, chefs..."
                      className="w-full px-4 py-2 bg-gray-100  rounded-lg border-0 focus:ring-2 focus:ring-[#ff3b30]  placeholder-gray-400 "
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 ">
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200  bg-gray-100  px-1.5 font-mono text-[10px] font-medium opacity-100">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500  mb-2">Quick Actions</h3>
                  <div className={`grid ${contextMenu.isMobile ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} gap-2`}>
                    <button className="flex items-center gap-2 p-2 hover:bg-gray-100  rounded-md transition-colors text-sm">
                      <Utensils className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Order Food</span>
                    </button>
                    <button className="flex items-center gap-2 p-2 hover:bg-gray-100  rounded-md transition-colors text-sm">
                      <ChefHat className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Find Chefs</span>
                    </button>
                    <button className="flex items-center gap-2 p-2 hover:bg-gray-100  rounded-md transition-colors text-sm">
                      <Star className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Featured Meals</span>
                    </button>
                    <button className="flex items-center gap-2 p-2 hover:bg-gray-100  rounded-md transition-colors text-sm">
                      <MapPin className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Nearby</span>
                    </button>
                  </div>
                </div>

                {/* Main Menu */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500  mb-2">Menu</h3>
                  <div className={contextMenu.isMobile ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-1'}>
                    {!env.DISABLE_TRY_IT && (
                      <Link href="/try-it" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100  rounded-md transition-colors">
                        <Search className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                        <span className="truncate">Try CribNosh</span>
                      </Link>
                    )}
                    {env.DISABLE_TRY_IT && (
                      <Link href="/waitlist" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100  rounded-md transition-colors">
                        <Sparkles className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                        <span className="truncate">Get Early Access</span>
                      </Link>
                    )}
                    <Link href="/cooking/apply" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100  rounded-md transition-colors">
                      <ChefHat className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Become a Chef</span>
                      </Link>
                    <Link href="/driving/apply" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100  rounded-md transition-colors">
                      <Car className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Deliver with Us</span>
                    </Link>
                    <Link href="/waitlist" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100  rounded-md transition-colors">
                      <Sparkles className="w-4 h-4 text-[#ff3b30] flex-shrink-0" />
                      <span className="truncate">Join Waitlist</span>
                    </Link>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-gray-200 ">
                  <div className={`${contextMenu.isMobile ? 'grid grid-cols-2 sm:grid-cols-4' : 'flex'} items-center justify-between text-sm text-gray-500  gap-2`}>
                    <button className="flex items-center gap-2 hover:text-[#ff3b30]  transition-colors">
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Settings</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#ff3b30]  transition-colors">
                      <HelpCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Help Center</span>
                    </button>
                    {contextMenu.isMobile && (
                      <>
                        <button className="flex items-center gap-2 hover:text-[#ff3b30]  transition-colors">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">About Us</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-[#ff3b30]  transition-colors">
                          <MessageCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Contact</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

// Export the state setter for use in other components
export const openCookieSettings = () => {
  // This will be implemented by the footer
  window.dispatchEvent(new CustomEvent('open-cookie-settings'));
};