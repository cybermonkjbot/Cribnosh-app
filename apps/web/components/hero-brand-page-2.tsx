import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ContainerTextFlip } from "@/components/ui/containedtextflip";
import { cn } from "@/lib/utils";
import Head from "next/head";
import { clsx } from "clsx";

interface HeroBrandPage2Props {
  className?: string;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

// Add a simple useInView hook with proper type safety
function useInView<T extends HTMLElement = HTMLElement>(threshold = 0.1): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  
  return [ref, inView];
}

// Lazy-load iframe as a component
const SplineIframe = React.lazy(() => Promise.resolve({
  default: (props: React.IframeHTMLAttributes<HTMLIFrameElement>) => <iframe {...props} />
}));

export function HeroBrandPage2({ 
  className,
  onInteractionStart,
  onInteractionEnd 
}: HeroBrandPage2Props): React.ReactElement {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [shouldRenderIframe, setShouldRenderIframe] = useState(false);
  const iphoneRef = useRef<HTMLDivElement>(null);
  const iframeUrl = useMemo(() => 'https://my.spline.design/iphoneprocopy-pV22kwixcmjbCyehvGuZGps0/', []);
  
  // Memoize event handlers
  const handleInteractionStart = useCallback(() => {
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleInteractionEnd = useCallback(() => {
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  // Memoize checkMobile to avoid recreation
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    // Preload the iframe content with proper CORS handling
    const preloadIframe = () => {
      if (document.head.querySelector(`link[href="${iframeUrl}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'document';
      link.href = iframeUrl;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    preloadIframe();
  }, [iframeUrl]);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [checkMobile]);
  
  useEffect(() => {
    // Lazy-load iframe when in viewport
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldRenderIframe(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (iphoneRef.current) {
      observer.observe(iphoneRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Primary section movement (slower)
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  
  // Background elements movement (faster)
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  
  // Opacity and scale effects
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.02]);

  // Add refs and inView states for animated sections
  const [sectionRef, sectionInView] = useInView<HTMLDivElement>(0.1);
  const [bgRef, bgInView] = useInView<HTMLDivElement>(0.1);
  const [headlineRef, headlineInView] = useInView<HTMLDivElement>(0.1);
  const [descRef, descInView] = useInView<HTMLParagraphElement>(0.1);
  const [ctaRef, ctaInView] = useInView<HTMLDivElement>(0.1);

  return (
    <>
      <Head>
        <link 
          rel="preload" 
          href={iframeUrl}
          as="fetch"
        />
      </Head>
      <motion.section 
        ref={sectionRef}
        className={cn(
          "relative bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-white min-h-screen w-full flex items-center justify-center overflow-hidden", 
          className
        )}
        style={{ y, opacity, scale, willChange: "opacity, transform" }}
        initial={{ opacity: 0, x: 20 }}
        animate={sectionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        exit={{ opacity: 0, x: -20 }}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
      >
        {/* Background elements with independent parallax */}
        {!isMobile && (
          <motion.div 
            ref={bgRef}
            className="absolute inset-0 overflow-hidden"
            style={{ y: bgY1, willChange: "opacity, transform" }}
            initial={{ opacity: 0 }}
            animate={bgInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div 
              className="absolute -left-40 -bottom-40 w-[600px] h-[600px] rounded-full bg-[#ff7b72]/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={bgInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ y: bgY2, willChange: "opacity, transform" }}
            />
            <motion.div 
              className="absolute -right-20 top-40 w-[300px] h-[300px] rounded-full bg-[#ff2920]/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={bgInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              style={{ willChange: "opacity, transform" }}
            />
          </motion.div>
        )}

        <div className={cn(
          "container mx-auto px-4 sm:px-6 relative z-10",
          "pt-24 sm:pt-28 md:pt-36",
          "pb-24 sm:pb-28 md:pb-36"
        )}>
          <div className={cn(
            "grid gap-12 items-center",
            isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
          )}>
            {/* Left column - 3D iPhone (hidden on mobile) */}
            {!isMobile && (
              <div
                ref={iphoneRef}
                className={clsx(
                  "relative h-[600px] sm:h-[700px] lg:h-[700px] w-full overflow-hidden order-2 lg:order-1",
                  "flex items-center justify-center",
                  className
                )}
                style={{ willChange: "opacity, transform" }}
              >
                {shouldRenderIframe ? (
                  <Suspense fallback={
                    <div className="w-[90%] h-[90%] rounded-xl bg-white/10 animate-pulse" />
                  }>
                    <SplineIframe
                      src={iframeUrl}
                      className={cn(
                        "w-[120%] h-[120%] rounded-xl transform translate-y-[5%]",
                        !isIframeLoaded && "opacity-0"
                      )}
                      style={{ border: 'none', willChange: "opacity, transform" }}
                      title="CribNosh App Preview"
                      onLoad={() => setIsIframeLoaded(true)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                    {!isIframeLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 border-4 border-[#ff3b30] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </Suspense>
                ) : (
                  <div className="w-[90%] h-[90%] rounded-xl bg-white/10 animate-pulse" />
                )}
              </div>
            )}

            {/* Right column */}
            <div className={cn(
              "relative",
              isMobile ? "order-1" : "order-1 lg:order-2"
            )}>
              <motion.div 
                ref={headlineRef}
                className="mb-8 sm:mb-10 inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={headlineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-base sm:text-lg uppercase tracking-widest font-medium bg-white/10 px-5 py-2.5 rounded-full">
                  We are building
                </span>
              </motion.div>

              <motion.div 
                className="mb-8 sm:mb-10"
                initial={{ opacity: 0, y: 30 }}
                animate={headlineInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                {!isMobile && (
                  <ContainerTextFlip 
                    words={["Local", "Fresh", "Verified", "Unique"]} 
                    interval={2000}
                    className="!bg-[#ff3b30]/50 !shadow-none !text-white"
                    textClassName="font-display font-bold"
                  />
                )}
                {!isMobile && <br />}
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-tight text-white/90">Home Kitchen Magic</span>
              </motion.div>

              <motion.p 
                ref={descRef}
                className="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 sm:mb-14 max-w-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={descInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Our verified home kitchens bring you personalized menus, cultural exchange, 
                and flexible dietary options - all while maintaining the highest standards of 
                quality and hygiene. This is where <span className="text-[#00FF00] font-semibold bg-[#00FF00]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#00FF00]/80 hover:bg-[#00FF00]/30 hover:-rotate-2 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>food creators</span> and <span className="text-[#00FFFF] font-semibold bg-[#00FFFF]/10 px-2 py-1 rounded-md transition-all duration-300 hover:text-[#00FFFF]/80 hover:bg-[#00FFFF]/30 hover:rotate-3 hover:px-3 hover:py-1.5 cursor-pointer" style={{ display: 'inline-block' }}>foodies</span> unite.
              </motion.p>

              <motion.div
                ref={ctaRef}
                initial={{ opacity: 0, y: 30 }}
                animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                {isMobile ? (
                  <>
                    <Link href="/waitlist" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full sm:w-auto px-10 py-4 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors text-lg sm:text-xl"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Get Early Access
                      </motion.button>
                    </Link>
                    <Link href="/cooking/apply" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-lg sm:text-xl"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Become a Chef
                      </motion.button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/try-it" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full sm:w-auto px-10 py-4 bg-white text-[#ff3b30] rounded-lg font-medium hover:bg-white/90 transition-colors text-lg sm:text-xl"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Try CribNosh Now
                      </motion.button>
                    </Link>
                    <Link href="/cooking/apply" className="w-full sm:w-auto">
                      <motion.button
                        className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors text-lg sm:text-xl"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Become a Chef
                      </motion.button>
                    </Link>
                  </>
                )}
              </motion.div>

              {/* Mobile App Screenshot */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="mt-12 flex justify-center px-4"
                >
                  <div className="relative w-72 aspect-[9/19.5] rounded-3xl overflow-hidden shadow-2xl transform -rotate-3 hover:-rotate-4 transition-transform duration-300">
                    <img
                      src="/mobilemockstatic.png"
                      alt="CribNosh Mobile App"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 via-transparent to-transparent" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}