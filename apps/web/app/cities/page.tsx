"use client";

import { MobileBackButton } from "@/components/ui/mobile-back-button";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import Link from "next/link";
import React from "react";

// Simple GlassCard component to avoid import issues
const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`bg-white/95 backdrop-blur-lg rounded-2xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Define the primary launch cities
const launchCities = [
  {
    name: "Edinburgh",
    image: "/images/cities/optimized/edinburgh.jpeg",
    description: "Our first launch city - the capital of Scotland and a global culinary hub.",
    launchInfo: "Launching Now",
    status: "Active",
    region: "Scotland",
    isPrimary: true
  }
];

// Define the Midland cities with enhanced data and local images
const midlandCities = [
  {
    name: "Birmingham",
    image: "/images/cities/optimized/birmingham-city.jpg",
    description: "The UK's second largest city and the heart of the Midlands.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Leicester",
    image: "/images/cities/optimized/leicester-city.jpg",
    description: "A diverse and historic Midlands city with rich cultural heritage.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Nottingham",
    image: "/images/cities/optimized/nottingham-city.jpg",
    description: "Home of Robin Hood and a vibrant student city.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Coventry",
    image: "/images/cities/optimized/coventry-city.jpg",
    description: "Historic city with a modern outlook and automotive heritage.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Stoke-on-Trent",
    image: "/images/cities/optimized/stoke-on-trent-city.jpg",
    description: "The Potteries capital of the UK with ceramic heritage.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Derby",
    image: "/images/cities/optimized/derby-city.jpg",
    description: "A city at the forefront of the Industrial Revolution.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Wolverhampton",
    image: "/images/cities/optimized/wolverhampton-city.jpg",
    description: "A city with a rich industrial heritage and football culture.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
  {
    name: "Northampton",
    image: "/images/cities/optimized/northampton-city.jpg",
    description: "A historic market town in the East Midlands.",
    launchInfo: "Coming Soon 2026",
    status: "Future Expansion"
  },
];

const allCities = [...launchCities, ...midlandCities];

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "CribNosh Cities - Authentic Home-Cooked Meals in Edinburgh and Beyond",
  "description": "Discover CribNosh's first launch city, Edinburgh, and our planned expansion across the UK. Join the waitlist for personalized home-cooked meals.",
  "url": "https://cribnosh.co.uk/cities",
  "mainEntity": {
    "@type": "ItemList",
    "name": "CribNosh Service Cities",
    "description": "Cities where CribNosh offers or plans to offer personalized home-cooked meal delivery",
    "numberOfItems": allCities.length,
    "itemListElement": allCities.map((city, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Place",
        "name": city.name,
        "description": city.description,
        "url": `https://cribnosh.co.uk/cities/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": city.name === 'Edinburgh' ? "Scotland" : "Midlands",
          "addressCountry": "GB"
        },
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Status",
            "value": city.status
          },
          {
            "@type": "PropertyValue",
            "name": "Launch Info",
            "value": city.launchInfo
          }
        ]
      }
    }))
  },
  "provider": {
    "@type": "Organization",
    "name": "CribNosh",
    "description": "Personalized home-cooked meal delivery platform",
    "url": "https://cribnosh.co.uk",
    "logo": "https://cribnosh.co.uk/logo.png",
    "sameAs": [
      "https://twitter.com/cribnosh",
      "https://instagram.com/cribnosh"
    ]
  },
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://cribnosh.co.uk"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Cities",
        "item": "https://cribnosh.co.uk/cities"
      }
    ]
  }
};

/**
 * Renders an enhanced, SEO-optimized page showcasing CribNosh's expansion across Midlands cities.
 *
 * Features improved animations, interactive city cards, better visual hierarchy, and enhanced user engagement elements while maintaining the CribNosh brand identity.
 */
export default function CitiesIndexPage() {
  // Enhanced emotional copy for better engagement
  const emotionalCopy = [
    "We're crafting the taste OS that knows your mood before you do.",
    "Your cravings aren't random, we're decoding them in real time.",
    "Not just food, we serve feelings, memories, and comfort.",
    "An emotional compass for your next meal.",
    "Feeding you what your soul actually asked for.",
    "We turn your hunger into a story worth eating.",
    "A dining engine powered by your vibes.",
    "We're building food tech that feels you. Literally.",
    "Your tastebuds deserve a therapist, we're building it.",
    "An engine that doesn't just feed you. It gets you.",
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <ParallaxGroup>
          {/* Mobile Back Button - only on mobile, fixed top left */}
          <MobileBackButton />

          {/* Background layers */}
          <ParallaxLayer asBackground speed={0.2} className="z-0">
            <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30]/80 to-[#ff5e54]/80" />
          </ParallaxLayer>

          <ParallaxLayer
            asBackground
            speed={0.4}
            className="z-0 pointer-events-none"
          >
            <div className="fixed inset-0">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b54] blur-[120px] -top-20 -right-20 opacity-30 animate-pulse" />
              <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff3b30] blur-[100px] bottom-0 -left-20 opacity-20 animate-pulse delay-100" />
            </div>
          </ParallaxLayer>

          {/* Content layer */}
          <div className="relative z-10 flex-1 pt-20 sm:pt-32">
            {/* Enhanced Hero Section */}
            <section className="py-6 sm:py-12 px-3 sm:px-6 container mx-auto bg-white/95 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl mb-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="mb-6 inline-block">
                  <span className="text-sm uppercase tracking-widest font-medium bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white px-4 py-2 rounded-full shadow-sm">
                    First Launch City: Edinburgh
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-display font-bold mb-6 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text">
                  CribNosh Cities
                </h1>

                <div className="mb-8">
                  <p className="text-lg sm:text-xl font-satoshi text-gray-800 font-medium">
                    Edinburgh represents our first step in bringing authentic home-cooked meals to the UK.
                  </p>
                </div>

                <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                  We are starting in the heart of Scotland, with plans to expand across the UK soon. Join the waitlist for your city today.
                </p>

                <div>
                  <Link href="/cities/edinburgh">
                    <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                      <span>Explore Edinburgh Launch</span>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Primary Launch Section */}
            <section className="py-8 px-3 sm:px-6 container mx-auto bg-white/95 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl mb-8 border-2 border-[#ff3b30]/20">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-4xl font-display font-bold mb-4 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text">
                  Featured City
                </h2>
                <p className="text-lg max-w-2xl mx-auto text-gray-700 leading-relaxed">
                  CribNosh is officially launching in Edinburgh. Discover local Food Creators in the Scottish capital.
                </p>
              </div>

              <div className="max-w-md mx-auto">
                {launchCities.map((city) => (
                  <div
                    key={city.name}
                    className="hover:-translate-y-2 transition-transform duration-300"
                  >
                    <Link href={`/cities/${city.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      <GlassCard className="h-full group cursor-pointer overflow-hidden ring-4 ring-[#ff3b30]/10">
                        <div className="relative">
                          <div className="h-64 w-full overflow-hidden">
                            <img
                              src={city.image}
                              alt={`${city.name} cityscape`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-3xl font-display font-bold text-gray-900 group-hover:text-[#ff3b30] transition-colors">{city.name}</h3>
                              <span className="text-sm bg-[#ff3b30] text-white px-4 py-1 rounded-full font-bold shadow-sm">
                                {city.status}
                              </span>
                            </div>
                            <p className="mb-4 text-gray-700 text-base leading-relaxed">
                              {city.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm font-bold text-[#ff3b30]">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{city.launchInfo}</span>
                              </div>
                              <div className="flex items-center text-[#ff3b30] font-bold">
                                <span>Enter Store</span>
                                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* Future Expansion Section */}
            <section className="py-8 px-3 sm:px-6 container mx-auto bg-white/95 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl mb-8 opacity-90">
              <div className="text-center mb-12">
                <h2 className="text-xl sm:text-2xl font-display font-bold mb-4 text-gray-600">
                  Future Expansion Areas
                </h2>
                <p className="text-base max-w-2xl mx-auto text-gray-600 leading-relaxed">
                  We're bringing the CribNosh experience to these cities soon. Join the waitlist to be first in line.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {midlandCities.map((city) => (
                  <div
                    key={city.name}
                    className="hover:-translate-y-1 transition-transform duration-300 opacity-80 hover:opacity-100 filter grayscale-[0.2] hover:grayscale-0"
                  >
                    <Link href="/waitlist">
                      <GlassCard className="h-full group cursor-pointer overflow-hidden">
                        <div className="relative">
                          <div className="h-32 w-full overflow-hidden">
                            <img
                              src={city.image}
                              alt={`${city.name} cityscape`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-display font-bold text-gray-900 group-hover:text-[#ff3b30] transition-colors">{city.name}</h3>
                            </div>
                            <p className="mb-3 text-gray-600 text-xs leading-relaxed">
                              {city.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                {city.status}
                              </span>
                              <div className="text-[#ff3b30] text-xs font-bold">
                                Join Waitlist
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="py-8 px-3 sm:px-6 container mx-auto bg-gradient-to-r from-[#ff3b30]/10 to-[#ff5e54]/10 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6 text-gray-800">
                  Don't See Your City?
                </h2>
                <p className="text-lg mb-8 text-gray-700 leading-relaxed">
                  We're expanding rapidly across the UK. Join our waitlist to be notified when CribNosh launches in your area and get early access to our personalized dining experience.
                </p>
                <Link href="/waitlist">
                  <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    <span>Request Your City</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </Link>
              </div>
            </section>
          </div>

          {/* Decorative elements layer */}
          <ParallaxLayer speed={1.5} className="z-20 pointer-events-none">
            <div className="fixed inset-0">
              <div className="absolute top-[20%] left-[10%] w-4 h-4 bg-white rounded-full opacity-20 animate-pulse" />
              <div className="absolute top-[40%] right-[20%] w-6 h-6 bg-white rounded-full opacity-30 animate-pulse delay-100" />
              <div className="absolute bottom-[30%] left-[30%] w-3 h-3 bg-white rounded-full opacity-25 animate-pulse delay-200" />
              <div className="absolute top-[60%] right-[40%] w-5 h-5 bg-white rounded-full opacity-20 animate-pulse delay-300" />
            </div>
          </ParallaxLayer>
        </ParallaxGroup>
      </main>
    </>
  );
} 
