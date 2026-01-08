"use client";

import { HeroBrand } from '@/components/hero-brand';
import HeroGeometric from '@/components/hero-geometric';
import { AppStoreCTA, CitiesSection, CommunitySpotlightSection, DoomScrollSection, FeaturesSwapSection, HowItWorksSection, SustainabilityCommitmentSection } from '@/components/sections';
import { ParallaxGroup, ParallaxLayer } from '@/components/ui/parallax';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
// import CertifiedKitchensFloat from '@/components/ui/certified-kitchens-float';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useScroll, useTransform } from 'motion/react';

/**
 * Renders the homepage with parallax scrolling, layered backgrounds, and multiple full-screen sections.
 *
 * The component adapts its layout and visual effects for mobile and desktop devices, displaying animated backgrounds, decorative elements, and various content sections such as features, how it works, cities, sustainability, community spotlight, and an app store call-to-action. Rendering occurs only on the client to prevent hydration mismatches.
 *
 * @returns The homepage React element, or `null` during server-side rendering.
 */
export default function Home() {
  const { scrollYProgress } = useScroll();
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMobileDevice();

  // Fetch feature flags
  const featureFlags = useQuery(api.featureFlags.get, { group: 'web_home' });

  // Helper to check if a feature is enabled
  // Default to true if flags aren't loaded yet to prevent layout shift or empty screen
  const isFeatureEnabled = (key: string) => {
    if (!featureFlags) return true;
    const flag = featureFlags.find((f: any) => f.key === key);
    return flag ? flag.value : true; // Default to true if flag missing
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const y = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -5 : -150]);
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -2 : -50]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? -3 : -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, isMobile ? 0.99 : 0.9]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, isMobile ? 1 : 1.02]);

  if (!isClient) return null;

  return (
    <main className="relative">
      {/* <CertifiedKitchensFloat /> */}
      <ParallaxGroup>
        {/* Background layers */}
        <ParallaxLayer asBackground speed={isMobile ? 0.02 : 0.2} className="z-0">
          <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] opacity-90" />
        </ParallaxLayer>

        {!isMobile && (
          <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
            <div className="fixed inset-0">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-50" />
              <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-40" />
            </div>
          </ParallaxLayer>
        )}

        {/* Content layer */}
        <div className="relative z-10 flex-1">
          <div className="space-y-0">
            {isFeatureEnabled('home_hero_brand') && <HeroBrand className="!mb-0" />}
            {isFeatureEnabled('home_hero_geometric') && (
              <HeroGeometric
                title1="Every Meal"
                title2="Tells Your Story"
                subtitle="Where food meets its lovers"
                className="!mt-0"
              />
            )}
          </div>

          {/* Content section */}
          <div className="relative">
            <section
              data-section-theme="dark"
              className={`bg-gray-900/${isMobile ? '95' : '80'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-white full-screen-section`}
            >
              {/* Hero section */}
            </section>

            {isFeatureEnabled('home_features') && (
              <section
                id="features"
                data-section-theme="light"
                className={`bg-white/${isMobile ? '95' : '90'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-gray-900 full-screen-section`}
              >
                <FeaturesSwapSection />
                <DoomScrollSection />
              </section>
            )}

            {isFeatureEnabled('home_how_it_works') && (
              <section
                id="how-it-works"
                data-section-theme="light"
                className={`bg-white/${isMobile ? '95' : '90'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-gray-900 full-screen-section`}
              >
                <HowItWorksSection />
              </section>
            )}

            {isFeatureEnabled('home_cities') && (
              <section
                id="cities"
                data-section-theme="light"
                className={`bg-white/${isMobile ? '95' : '90'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-gray-900 full-screen-section`}
              >
                <CitiesSection isHome />
              </section>
            )}

            {isFeatureEnabled('home_sustainability') && (
              <section
                id="sustainability"
                data-section-theme="light"
                className="w-screen relative -mx-[calc((100vw-100%)/2)] px-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50   " />
                <SustainabilityCommitmentSection />
              </section>
            )}

            {isFeatureEnabled('home_community') && (
              <section
                id="community"
                data-section-theme="light"
                className={`bg-white/${isMobile ? '95' : '90'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-gray-900 full-screen-section`}
              >
                <CommunitySpotlightSection />
              </section>
            )}

            {isFeatureEnabled('home_app_store') && (
              <section
                data-section-theme="brand"
                className={`bg-[#ff3b30]/${isMobile ? '95' : '90'} ${!isMobile ? 'backdrop-blur-sm' : ''} text-white full-screen-section`}
              >
                <AppStoreCTA />
              </section>
            )}
          </div>
        </div>

        {/* Decorative elements layer - only show on desktop */}
        {!isMobile && (
          <ParallaxLayer speed={1.5} className="z-20 pointer-events-none">
            <div className="fixed inset-0">
              <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20" />
              <div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30" />
              <div className="absolute bottom-[30%] left-[30%] w-3 h-3 bg-white rounded-full opacity-25" />
              <div className="absolute top-[60%] right-[40%] w-5 h-5 bg-white rounded-full opacity-20" />
            </div>
          </ParallaxLayer>
        )}
      </ParallaxGroup>
    </main>
  );
}
