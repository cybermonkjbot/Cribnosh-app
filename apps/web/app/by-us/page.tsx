"use client";

import { AiMetadata } from "@/components/AiMetadata";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostCard } from "@/components/ui/blog-post-card";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { SparkleEffect } from "@/components/ui/sparkle-effect";
import { FloatingHearts } from "@/components/ui/floating-hearts";
import { ContainerScrollAnimation } from "@/components/ui/container-scroll-animation";
import { PulseEffect } from "@/components/ui/pulse-effect";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// SEO-focused content for discoverability and utility
const FEATURED_POST = {
  title: "CribNosh vs Uber Eats: Why Home–Cooked Wins in 2025",
  excerpt: "Compare delivery fees, food freshness, and cultural flavor. See how CribNosh's home–cooked meals stack up against traditional delivery apps and when to choose each.",
  coverImage: "/backgrounds/masonry-1.jpg",
  slug: "cribnosh-vs-uber-eats-2025",
  author: {
    name: "CribNosh Editorial",
    avatar: "/card-images/IMG_2262.png"
  },
  date: "August 2025"
};

type Post = {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  author: { name: string; avatar: string };
  date: string;
  categories: string[];
};

const LATEST_POSTS: Post[] = [
  {
    title: "What Is CribNosh? How Our Home–Cooked Delivery Works",
    excerpt: "From order to doorstep, here's how CribNosh connects you with verified Food Creators for fresh, flavorful meals.",
    coverImage: "/backgrounds/masonry-2.jpg",
    slug: "what-is-cribnosh",
    author: {
      name: "CribNosh Team",
      avatar: "/delivery-/IMG_2270.png"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Birmingham Food Delivery: Best Home–Cooked Dishes Near You",
    excerpt: "A local guide to Birmingham's top home–cooked meals on CribNosh, hearty stews, baked favorites, and weeknight staples.",
    coverImage: "/images/cities/optimized/birmingham-new.jpg",
    slug: "birmingham-best-dishes",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Leicester Food Delivery: Home–Cooked Options You'll Love",
    excerpt: "From family curries to baked treats, discover Leicester's most loved community–made meals.",
    coverImage: "/images/cities/optimized/leicester.jpg",
    slug: "leicester-home-cooked-delivery",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Nottingham Food Delivery Guide: From Family Kitchens to Your Door",
    excerpt: "Top Nottingham picks for comforting, chef–made meals, perfect for study nights and cozy weekends.",
    coverImage: "/images/cities/optimized/nottingham.jpg",
    slug: "nottingham-delivery-guide",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Healthy Meal Delivery at Home: Tips from CribNosh Chefs",
    excerpt: "Smart swaps, balanced portions, and how to filter for nutrition on CribNosh.",
    coverImage: "/backgrounds/driver-background.png",
    slug: "healthy-meal-delivery-tips",
    author: {
      name: "CribNosh Editorial",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "August 2025",
    categories: ["Sustainable Cooking"]
  },
  {
    title: "CribNosh Pricing Explained: Fees, Value, and Savings",
    excerpt: "A transparent look at delivery fees, service charges, and how family–style portions can save you more.",
    coverImage: "/backgrounds/masonry-3.jpg",
    slug: "cribnosh-pricing",
    author: {
      name: "CribNosh Team",
      avatar: "/delivery-/IMG_2270.png"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Support Local Chefs: Why Community Kitchens Matter",
    excerpt: "Every order helps a verified Food Creator grow. Here's how that strengthens neighborhoods and preserves food traditions.",
    coverImage: "/backgrounds/masonry-2.jpg",
    slug: "support-local-chefs",
    author: {
      name: "Community Spotlight",
      avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
    },
    date: "July 2025",
    categories: ["Cultural Heritage"]
  },
  {
    title: "Allergen–Friendly Home Meals: Ordering Safely on CribNosh",
    excerpt: "Label reading, chef notes, and how to message your cook for extra clarity before you order.",
    coverImage: "/backgrounds/masonry-1.jpg",
    slug: "allergen-friendly-home-meals",
    author: {
      name: "CribNosh Editorial",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "July 2025",
    categories: ["Sustainable Cooking"]
  },
  {
    title: "Weekend Specials: Family Platters for Game Night",
    excerpt: "Big flavor, shareable portions, and cozy night–in picks that won't break the bank.",
    coverImage: "/backgrounds/masonry-3.jpg",
    slug: "weekend-family-platters",
    author: {
      name: "CribNosh Team",
      avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg"
    },
    date: "July 2025",
    categories: ["Recipe Collections"]
  },
  {
    title: "Coventry Comforts: Classic Home Dishes Delivered",
    excerpt: "From stews to bakes, the Coventry lineup that locals keep re–ordering.",
    coverImage: "/images/cities/optimized/coventry.jpg",
    slug: "coventry-comforts",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "July 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Wolverhampton Eats: Hearty Home Favorites Near You",
    excerpt: "From slow–cooked classics to fresh bakes, discover Wolverhampton's best community–made dishes.",
    coverImage: "/images/cities/optimized/wolverhampton.jpg",
    slug: "wolverhampton-home-favorites",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg"
    },
    date: "July 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Stoke–on–Trent Comforts: Pottery City Plates to Try",
    excerpt: "Local comfort dishes and weeknight winners from Stoke's talented Food Creators.",
    coverImage: "/images/cities/optimized/stoke-on-trent.jpg",
    slug: "stoke-on-trent-comforts",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
    },
    date: "July 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Northampton Bakes & More: From Home Ovens to Your Door",
    excerpt: "Top pastries, pies, and homestyle mains loved by Northampton regulars.",
    coverImage: "/images/cities/optimized/northampton.jpg",
    slug: "northampton-bakes-and-mains",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "July 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Derby Family Favorites: Real Home Food, Real Fast",
    excerpt: "Classic roast–style plates, stews, and shareables that make dinner easy in Derby.",
    coverImage: "/images/cities/optimized/derby.jpg",
    slug: "derby-family-favorites",
    author: {
      name: "Local Guides • CribNosh",
      avatar: "/delivery-/IMG_2270.png"
    },
    date: "July 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Student Eats: Budget–Friendly Home Meals in Nottingham",
    excerpt: "Affordable, filling plates from local Food Creators, perfect for study nights and societies.",
    coverImage: "/backgrounds/masonry-2.jpg",
    slug: "student-meals-nottingham",
    author: {
      name: "Campus Guide • CribNosh",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Halal Home–Cooked Delivery: A Quick Ordering Guide",
    excerpt: "How to find halal meals, read chef labels, and message for prep details on CribNosh.",
    coverImage: "/backgrounds/masonry-1.jpg",
    slug: "halal-home-cooked-guide",
    author: {
      name: "CribNosh Editorial",
      avatar: "/delivery-/8580cf51-dc5a-4803-b3fa-4124eb93f29c.jpeg"
    },
    date: "August 2025",
    categories: ["Cultural Heritage"]
  },
  {
    title: "Vegan & Vegetarian on CribNosh: Flavor–First Picks",
    excerpt: "Plant–forward dishes from our verified Food Creators, plus tips for customizing orders.",
    coverImage: "/backgrounds/masonry-3.jpg",
    slug: "vegan-vegetarian-on-cribnosh",
    author: {
      name: "CribNosh Editorial",
      avatar: "/delivery-/IMG_2270.png"
    },
    date: "August 2025",
    categories: ["Sustainable Cooking", "Modern Fusion"]
  },
  {
    title: "Late–Night Home Delivery: What's Hot After 9pm",
    excerpt: "Night–owl favorites and best practices for warm, on–time deliveries.",
    coverImage: "/backgrounds/driver-background.png",
    slug: "late-night-home-delivery",
    author: {
      name: "CribNosh Team",
      avatar: "/card-images/IMG_2262.png"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Reheat Like a Pro: Keeping Home Meals Fresh Next Day",
    excerpt: "Chef–approved reheating tips for curries, stews, bakes, and rice dishes.",
    coverImage: "/backgrounds/masonry-2.jpg",
    slug: "reheat-home-meals-tips",
    author: {
      name: "CribNosh Editorial",
      avatar: "/card-images/c846b65e-1de1-4595-9079-b2cfe134f414.jpeg"
    },
    date: "August 2025",
    categories: ["Kitchen Stories"]
  },
  {
    title: "Office Lunch & Small Events: Easy Group Orders",
    excerpt: "How to order family–style trays, coordinate delivery windows, and please every palate.",
    coverImage: "/backgrounds/masonry-1.jpg",
    slug: "office-lunch-group-orders",
    author: {
      name: "CribNosh Team",
      avatar: "/delivery-/IMG_2270.png"
    },
    date: "August 2025",
    categories: ["Recipe Collections"]
  }
];

const CATEGORIES = [
  "Family Traditions",
  "Cultural Heritage",
  "Modern Fusion",
  "Sustainable Cooking",
  "Kitchen Stories",
  "Recipe Collections"
];

export default function ByUsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"any" | "all">("any");

  // Initialize from URL on mount
  useEffect(() => {
    const initialCategories = (searchParams.get("categories") || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c) => CATEGORIES.includes(c));
    const initialMode = searchParams.get("mode") === "all" ? "all" : "any";
    if (initialCategories.length) setSelectedCategories(initialCategories);
    setFilterMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategories.length) {
      params.set("categories", selectedCategories.join(","));
    } else {
      params.delete("categories");
    }
    params.set("mode", filterMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [selectedCategories, filterMode, router, pathname, searchParams]);

  const filteredPosts = useMemo(() => {
    if (!selectedCategories.length) return LATEST_POSTS;
    if (filterMode === "any") {
      return LATEST_POSTS.filter((post) =>
        post.categories.some((c) => selectedCategories.includes(c))
      );
    }
    // all
    return LATEST_POSTS.filter((post) =>
      selectedCategories.every((c) => post.categories.includes(c))
    );
  }, [selectedCategories, filterMode]);
  return (
    <>
      <AiMetadata />
      <JsonLd />
      
      <main className="relative -mt-[var(--header-height)]">
        <ParallaxGroup>
          {/* Background layers */}
          <ParallaxLayer asBackground speed={0.2} className="z-0">
            <div className="fixed inset-0 bg-gradient-to-br from-[#ff3b30]/[0.05] via-transparent to-[#ff5e54]/[0.05] opacity-90" />
          </ParallaxLayer>
          
          <ParallaxLayer asBackground speed={0.4} className="z-0 pointer-events-none">
            <div className="fixed inset-0">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-[#ff7b72]/20 blur-[120px] -top-20 -right-20 opacity-30" />
              <div className="absolute w-[400px] h-[400px] rounded-full bg-[#ff2920]/20 blur-[100px] bottom-0 -left-20 opacity-20" />
            </div>
          </ParallaxLayer>

          {/* Content layer */}
          <div className="relative z-10">
            <section 
              data-section-theme="dark" 
              className="min-h-[calc(100vh+var(--header-height))] pt-[calc(var(--header-height)+2rem)] pb-24 full-screen-section full-screen-content"
            >
              <MasonryBackground className="fixed inset-0 opacity-30" />
              <div className="fixed inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent pointer-events-none" />
              
              {/* Hero Content */}
              <div className="relative z-10 text-center mb-16 md:mb-32 px-4">
                <SparkleEffect>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-asgard font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/80">
                    By Us, For You
                  </h1>
                </SparkleEffect>
                <p className="text-lg sm:text-xl md:text-2xl text-neutral-200 font-satoshi max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                  Discover stories of passion, tradition, and innovation from our community of Food Creators and food enthusiasts.
                </p>
                
                {/* Category Pills */}
                <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2 px-2 sm:px-4 mx-auto whitespace-nowrap">
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 text-white font-satoshi text-xs sm:text-sm transition-all duration-300 flex-none"
                        aria-label="Clear filters"
                      >
                        âœ• Clear
                      </button>
                    )}
                    {CATEGORIES.map((category) => {
                      const isActive = selectedCategories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() =>
                            setSelectedCategories((prev) =>
                              prev.includes(category)
                                ? prev.filter((c) => c !== category)
                                : [...prev, category]
                            )
                          }
                          aria-pressed={isActive}
                          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-lg border text-white font-satoshi text-xs sm:text-sm transition-all duration-300 flex-none
                          ${isActive ? 'bg-white/25 border-white/50' : 'bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/5'}`}
                        >
                          {category}
                        </button>
                      );
                    })}

                    {/* Filter mode toggle */}
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => setFilterMode("any")}
                        aria-pressed={filterMode === "any"}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-satoshi border backdrop-blur-lg transition-all ${
                          filterMode === 'any' ? 'bg-white/25 border-white/50 text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        Any
                      </button>
                      <button
                        onClick={() => setFilterMode("all")}
                        aria-pressed={filterMode === "all"}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-satoshi border backdrop-blur-lg transition-all ${
                          filterMode === 'all' ? 'bg-white/25 border-white/50 text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Featured Post */}
              <ContainerScrollAnimation>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-16">
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-asgard font-bold text-white">
                      Featured Story
                    </h2>
                    <PulseEffect className="w-2 h-2 sm:w-3 sm:h-3 bg-[#ff3b30] rounded-full" />
                  </div>
                  <div className="w-full max-w-4xl mx-auto">
                    <BlogPostCard {...FEATURED_POST} isFeatured={true} />
                  </div>
                </div>
              </ContainerScrollAnimation>

              {/* Latest Posts Grid */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-[20%] sm:-mt-[40%]">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl font-asgard font-bold text-white">
                    Latest Stories
                  </h2>
                  <button className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-[#ff3b30]/20 backdrop-blur-lg
                                   text-white font-satoshi text-xs sm:text-sm hover:bg-[#ff3b30]/30
                                   hover:scale-105 transition-all duration-300
                                   border border-[#ff3b30]/30">
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                  {filteredPosts.map((post) => (
                    <BlogPostCard key={post.slug} {...post} />
                  ))}
                </div>
                {filteredPosts.length === 0 && (
                  <p className="text-neutral-300 font-satoshi text-sm mt-6">No stories yet in this category.</p>
                )}
              </div>

              {/* Floating Hearts Animation */}
              <FloatingHearts className="fixed inset-0 pointer-events-none" />
            </section>
          </div>
        </ParallaxGroup>
      </main>
    </>
  );
} 
