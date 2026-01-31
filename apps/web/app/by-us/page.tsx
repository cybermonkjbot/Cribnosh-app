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
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

type Post = {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  author: { name: string; avatar: string };
  date: string;
  categories: string[];
};

const CATEGORIES = [
  "Family Traditions",
  "Cultural Heritage",
  "Modern Fusion",
  "Sustainable Cooking",
  "Kitchen Stories",
  "Recipe Collections"
];

function ByUsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"any" | "all">("any");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [visiblePostsCount, setVisiblePostsCount] = useState<number>(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch blog posts from Convex
  const blogPosts = useQuery(api.queries.blog.getBlogPosts, {
    status: "published",
  }) as any;
  const featuredPost = useQuery(api.queries.blog.getFeaturedBlogPost) as any;

  // Transform blog posts to display format
  const transformedPosts: Post[] = useMemo(() => {
    if (!blogPosts || !Array.isArray(blogPosts)) return [];
    return blogPosts.map((post: any) => {
      const excerpt = post.excerpt || (post.content ? String(post.content).substring(0, 160) + '...' : '') || '';
      const date = post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '');
      return {
        title: String(post.title || ''),
        excerpt,
        coverImage: String(post.coverImage || post.featuredImage || '/backgrounds/masonry-1.jpg'),
        slug: String(post.slug || ''),
        author: post.author || { name: 'CribNosh Editorial', avatar: '/card-images/IMG_2262.png' },
        date,
        categories: Array.isArray(post.categories) ? post.categories : [],
      };
    });
  }, [blogPosts]);

  // Get featured post
  const featuredPostData: Post | null = useMemo(() => {
    if (!featuredPost) return null;
    const excerpt = featuredPost.excerpt || (featuredPost.content ? String(featuredPost.content).substring(0, 160) + '...' : '') || '';
    const date = featuredPost.date || (featuredPost.createdAt ? new Date(featuredPost.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '');
    return {
      title: String(featuredPost.title || ''),
      excerpt,
      coverImage: String(featuredPost.coverImage || featuredPost.featuredImage || '/backgrounds/masonry-1.jpg'),
      slug: String(featuredPost.slug || ''),
      author: featuredPost.author || { name: 'CribNosh Editorial', avatar: '/card-images/IMG_2262.png' },
      date,
      categories: Array.isArray(featuredPost.categories) ? featuredPost.categories : [],
    };
  }, [featuredPost]);

  // Get all unique categories from posts
  const dynamicCategories = useMemo(() => {
    const allCategories = new Set<string>();
    transformedPosts.forEach((post) => {
      post.categories.forEach((cat) => allCategories.add(cat));
    });
    // Merge with static categories
    CATEGORIES.forEach((cat) => allCategories.add(cat));
    return Array.from(allCategories).sort();
  }, [transformedPosts]);

  // Get latest posts (excluding featured)
  const LATEST_POSTS = useMemo(() => {
    if (!featuredPostData) return transformedPosts;
    return transformedPosts.filter((post) => post.slug !== featuredPostData.slug);
  }, [transformedPosts, featuredPostData]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setVisiblePostsCount(10); // Reset to initial count when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize from URL on mount
  useEffect(() => {
    const initialCategories = (searchParams.get("categories") || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const initialMode = searchParams.get("mode") === "all" ? "all" : "any";
    const initialSearch = searchParams.get("search") || "";

    if (initialCategories.length) setSelectedCategories(initialCategories);
    setFilterMode(initialMode);
    if (initialSearch) {
      setSearchQuery(initialSearch);
      setDebouncedSearchQuery(initialSearch);
    }
  }, []); // Run once on mount

  // Reset visible posts count when filters change
  useEffect(() => {
    setVisiblePostsCount(10);
  }, [selectedCategories, filterMode, debouncedSearchQuery]);

  // Handle URL updates simply (one-way sync from state to URL) or remove if causing issues.
  // For now, simpler is better as requested. We'll skip complex URL syncing loops.


  const filteredPosts = useMemo(() => {
    let posts = LATEST_POSTS;

    // Apply search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      posts = posts.filter((post: Post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.categories.some((cat) => cat.toLowerCase().includes(query)) ||
        post.author.name.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    if (selectedCategories.length) {
      if (filterMode === "any") {
        posts = posts.filter((post: Post) =>
          post.categories.some((c: string) => selectedCategories.includes(c))
        );
      } else {
        // all
        posts = posts.filter((post: Post) =>
          post.categories.every((c: string) => selectedCategories.includes(c))
        );
      }
    }

    return posts;
  }, [selectedCategories, filterMode, LATEST_POSTS, debouncedSearchQuery]);

  // Get visible posts (for infinite scroll)
  const visiblePosts = useMemo(() => {
    return filteredPosts.slice(0, visiblePostsCount);
  }, [filteredPosts, visiblePostsCount]);

  // Infinite scroll with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && visiblePostsCount < filteredPosts.length) {
          setVisiblePostsCount((prev) => Math.min(prev + 10, filteredPosts.length));
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [visiblePostsCount, filteredPosts.length]);

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

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white font-satoshi placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="relative max-w-5xl mx-auto px-2 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-2 px-2 sm:px-4 mx-auto whitespace-nowrap">
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setSelectedCategories([])}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 backdrop-blur-lg border border-white/40 text-white font-satoshi text-xs sm:text-sm transition-all duration-300 flex-none"
                        aria-label="Clear filters"
                      >
                        × Clear
                      </button>
                    )}
                    {dynamicCategories.map((category) => {
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
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-satoshi border backdrop-blur-lg transition-all ${filterMode === 'any' ? 'bg-white/25 border-white/50 text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                          }`}
                      >
                        Any
                      </button>
                      <button
                        onClick={() => setFilterMode("all")}
                        aria-pressed={filterMode === "all"}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-satoshi border backdrop-blur-lg transition-all ${filterMode === 'all' ? 'bg-white/25 border-white/50 text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
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
                    {featuredPostData ? (
                      <BlogPostCard {...featuredPostData} isFeatured={true} />
                    ) : (
                      <div className="text-neutral-300 font-satoshi text-sm">Loading featured post...</div>
                    )}
                  </div>
                </div>
              </ContainerScrollAnimation>

              {/* Latest Posts Grid */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
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
                  {visiblePosts.map((post: Post) => (
                    <BlogPostCard key={post.slug} {...post} />
                  ))}
                </div>
                {filteredPosts.length === 0 && (
                  <p className="text-neutral-300 font-satoshi text-sm mt-6">
                    {debouncedSearchQuery ? `No stories found matching "${debouncedSearchQuery}".` : "No stories yet in this category."}
                  </p>
                )}
                {/* Infinite scroll trigger */}
                {visiblePostsCount < filteredPosts.length && (
                  <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                    <div className="text-neutral-400 font-satoshi text-sm">Loading more stories...</div>
                  </div>
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

export default function ByUsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ByUsContent />
    </Suspense>
  );
}
