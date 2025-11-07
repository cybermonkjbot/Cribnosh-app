"use client";

import { AiMetadata } from "@/components/AiMetadata";
import { JsonLd } from "@/components/JsonLd";
import { BlogPostCard } from "@/components/ui/blog-post-card";
import { ContainerScrollAnimation } from "@/components/ui/container-scroll-animation";
import { FloatingHearts } from "@/components/ui/floating-hearts";
import { MasonryBackground } from "@/components/ui/masonry-background";
import { ParallaxGroup, ParallaxLayer } from "@/components/ui/parallax";
import { PulseEffect } from "@/components/ui/pulse-effect";
import { SparkleEffect } from "@/components/ui/sparkle-effect";
import { POSTS } from "@/lib/byus/posts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

// Convert posts from posts.ts to the format needed for display
const LATEST_POSTS: Post[] = POSTS.map((post) => ({
  title: post.title,
  excerpt: post.description,
  coverImage: post.coverImage,
  slug: post.slug,
  author: post.author,
  date: post.date,
  categories: post.categories,
})).filter((post) => post.slug !== FEATURED_POST.slug); // Exclude featured post from list

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
    const currentCategories = params.get("categories") || "";
    const currentMode = params.get("mode") || "any";
    
    const newCategories = selectedCategories.length ? selectedCategories.join(",") : "";
    const newMode = filterMode;
    
    // Only update URL if it's different from current state
    if (currentCategories !== newCategories || currentMode !== newMode) {
      const newParams = new URLSearchParams();
      if (newCategories) {
        newParams.set("categories", newCategories);
      }
      newParams.set("mode", newMode);
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
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
