"use client";

import React from "react";
import Link from "next/link";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { MobileBackButton } from "@/components/ui/mobile-back-button";

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

// Define the Midland cities with enhanced data and local images
const midlandCities = [
  { 
    name: "Birmingham", 
    image: "/images/cities/optimized/birmingham-city.jpg",
    description: "The UK's second largest city and the heart of the Midlands.",
    launchInfo: "Launching Q2 2025",
    status: "Coming Soon"
  },
  { 
    name: "Leicester", 
    image: "/images/cities/optimized/leicester-city.jpg",
    description: "A diverse and historic Midlands city with rich cultural heritage.",
    launchInfo: "Launching Q3 2025",
    status: "Coming Soon"
  },
  { 
    name: "Nottingham", 
    image: "/images/cities/optimized/nottingham-city.jpg",
    description: "Home of Robin Hood and a vibrant student city.",
    launchInfo: "Launching Q3 2025",
    status: "Coming Soon"
  },
  { 
    name: "Coventry", 
    image: "/images/cities/optimized/coventry-city.jpg",
    description: "Historic city with a modern outlook and automotive heritage.",
    launchInfo: "Launching Q4 2025",
    status: "Coming Soon"
  },
  { 
    name: "Stoke-on-Trent", 
    image: "/images/cities/optimized/stoke-on-trent-city.jpg",
    description: "The Potteries capital of the UK with ceramic heritage.",
    launchInfo: "Launching Q4 2025",
    status: "Coming Soon"
  },
  { 
    name: "Derby", 
    image: "/images/cities/optimized/derby-city.jpg",
    description: "A city at the forefront of the Industrial Revolution.",
    launchInfo: "Launching Q1 2025",
    status: "Coming Soon"
  },
  { 
    name: "Wolverhampton", 
    image: "/images/cities/optimized/wolverhampton-city.jpg",
    description: "A city with a rich industrial heritage and football culture.",
    launchInfo: "Launching Q1 2025",
    status: "Coming Soon"
  },
  { 
    name: "Northampton", 
    image: "/images/cities/optimized/northampton-city.jpg",
    description: "A historic market town in the East Midlands.",
    launchInfo: "Launching Q2 2025",
    status: "Coming Soon"
  },
];

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "CribNosh Cities - Personalized Home-Cooked Meals Across the Midlands",
  "description": "Discover CribNosh's expansion across the Midlands. Join thousands on our waitlist for personalized home-cooked meals in Birmingham, Leicester, Nottingham, Coventry, Stoke-on-Trent, Derby, Wolverhampton, and Northampton.",
  "url": "https://cribnosh.com/cities",
  "mainEntity": {
    "@type": "ItemList",
    "name": "CribNosh Service Cities",
    "description": "Cities where CribNosh offers personalized home-cooked meal delivery",
    "numberOfItems": midlandCities.length,
    "itemListElement": midlandCities.map((city, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Place",
        "name": city.name,
        "description": city.description,
        "url": `https://cribnosh.com/cities/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Midlands",
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
    "url": "https://cribnosh.com",
    "logo": "https://cribnosh.com/logo.png",
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
        "item": "https://cribnosh.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Cities",
        "item": "https://cribnosh.com/cities"
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
                     Expanding Across the Midlands
                   </span>
                 </div>
                 
                 <h1 className="text-3xl sm:text-5xl font-display font-bold mb-6 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text">
                   CribNosh Cities
                 </h1>
                 
                 <div className="mb-8">
                   <p className="text-lg sm:text-xl font-satoshi text-gray-800 font-medium">
                     {emotionalCopy[0]}
                   </p>
                 </div>
                 
                 <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed">
                   We are expanding across the Midlands, bringing personalized home-cooked meals to your city. Join thousands already on our waitlist.
                 </p>
                 
                 <div>
                   <Link href="/waitlist">
                     <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white rounded-xl font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                       <span>Join the Waitlist</span>
                       <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                       </svg>
                     </button>
                   </Link>
                 </div>
               </div>
             </section>
            
            
            
                         {/* Enhanced Cities Grid Section */}
             <section className="py-8 px-3 sm:px-6 container mx-auto bg-white/95 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl mb-8">
               <div className="text-center mb-12">
                 <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4 bg-gradient-to-br from-[#ff3b30] to-[#ff5e54] text-transparent bg-clip-text">
                   Explore Our Cities
                 </h2>
                 <p className="text-lg max-w-2xl mx-auto text-gray-700 leading-relaxed">
                   Select a city to learn more about how CribNosh is bringing personalized dining experiences to each unique location.
                 </p>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {midlandCities.map((city, index) => (
                  <div 
                    key={city.name}
                    className="hover:-translate-y-2 transition-transform duration-300"
                  >
                    <Link href={`/cities/${city.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      <GlassCard className="h-full group cursor-pointer overflow-hidden">
                        <div className="relative">
                                                     {/* City Image */}
                           <div className="h-48 w-full overflow-hidden">
                             <img 
                               src={city.image} 
                               alt={`${city.name} cityscape`}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                             />
                           </div>
                          
                                                     {/* Content */}
                           <div className="p-6">
                             <div className="flex items-center justify-between mb-3">
                               <h3 className="text-2xl font-display font-bold text-gray-900 group-hover:text-[#ff3b30] transition-colors">{city.name}</h3>
                               <span className="text-xs bg-gradient-to-r from-[#ff3b30] to-[#ff5e54] text-white px-3 py-1 rounded-full font-medium shadow-sm">
                                 {city.status}
                               </span>
                             </div>
                             
                             <p className="mb-4 text-gray-700 text-sm leading-relaxed">
                               {city.description}
                             </p>
                             
                             <div className="flex items-center justify-between">
                               <div className="flex items-center text-sm font-medium text-[#ff3b30] group-hover:text-[#ff5e54] transition-colors">
                                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                                 <span className="font-medium">{city.launchInfo}</span>
                               </div>
                               
                               <div className="flex items-center text-sm font-medium text-gray-600 group-hover:text-[#ff3b30] transition-colors">
                                 {/* <span>Explore</span> */}
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
            
                         {/* Enhanced CTA Section */}
             <section className="py-8 px-3 sm:px-6 container mx-auto bg-gradient-to-r from-[#ff3b30]/10 to-[#ff5e54]/10 backdrop-blur-sm text-gray-900 rounded-xl sm:rounded-2xl shadow-xl">
               <div className="max-w-3xl mx-auto text-center">
                                   <h2 className="text-2xl sm:text-3xl font-display font-bold mb-6 text-white">
                    Don't See Your City?
                  </h2>
                                   <p className="text-lg mb-8 text-white/80 leading-relaxed">
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
