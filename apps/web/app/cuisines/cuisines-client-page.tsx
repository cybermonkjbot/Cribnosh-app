"use client";

import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { ArrowRight, Loader2, Search, Sparkles, Utensils } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface Cuisine {
    _id?: string;
    name: string;
    description: string;
    image?: string;
}

export default function CuisinesClientPage({ cuisines: initialCuisines }: { cuisines: Cuisine[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { results, status, loadMore } = usePaginatedQuery(
        api.queries.cuisines.listPaginated,
        { search: debouncedSearch || undefined },
        { initialNumItems: 12 }
    );

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && status === "CanLoadMore") {
            loadMore(12);
        }
    }, [inView, status, loadMore]);

    // Use results from query if we have them, otherwise fallback to initialCuisines (for SEO/initial load)
    // But once searching starts, we strictly use results.
    const displayCuisines = debouncedSearch || results.length > 0 ? results : initialCuisines;

    return (
        <div className="min-h-screen bg-[#FAFFFA] pt-24 pb-20">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary-500/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header Section */}
                <div className="max-w-3xl mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>Discover the World on Your Plate</span>
                        </div>
                        <h1 className="font-asgard text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Explore <span className="text-primary-500">Cuisines</span>
                        </h1>
                        <p className="font-satoshi text-xl text-gray-600 leading-relaxed mb-8">
                            From family secrets to regional specialties, explore the diverse range of authentic homemade meals available on Cribnosh.
                        </p>

                        {/* Search Bar */}
                        <div className="relative group max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by cuisine (e.g. Nigerian, Vegan, Italian...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl font-satoshi text-lg focus:outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm group-hover:shadow-md"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayCuisines.map((cuisine, index) => (
                        <motion.div
                            key={cuisine._id || cuisine.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.5) }}
                            viewport={{ once: true }}
                        >
                            <Link
                                href={`/locations/all/${cuisine.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="group block relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Image or Placeholder */}
                                <div className="absolute inset-0 bg-gray-200">
                                    {(cuisine as any).image ? (
                                        <Image
                                            src={(cuisine as any).image}
                                            alt={cuisine.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-primary-500/20">
                                            <Utensils className="w-16 h-16 text-brand-primary/40" />
                                        </div>
                                    )}
                                </div>

                                {/* Overlays */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 group-hover:via-black/40 transition-all duration-500" />

                                {/* Content */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <h3 className="font-asgard text-3xl font-bold text-white mb-2 transform group-hover:-translate-y-2 transition-transform duration-500">
                                        {cuisine.name}
                                    </h3>
                                    <p className="font-satoshi text-white/80 text-sm line-clamp-2 mb-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                        {cuisine.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-primary-500 font-bold transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
                                        <span>Explore</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Loading State & Observer */}
                <div ref={ref} className="mt-16 flex justify-center min-h-[100px]">
                    {status === "LoadingMore" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                            <p className="font-satoshi text-gray-500">Discovering more cuisines...</p>
                        </div>
                    )}
                    {status === "Exhausted" && results.length > 0 && !debouncedSearch && (
                        <p className="font-satoshi text-gray-400">You've explored all our current cuisines.</p>
                    )}
                    {results.length === 0 && status === "Exhausted" && debouncedSearch && (
                        <div className="text-center py-20">
                            <h3 className="font-asgard text-2xl font-bold text-gray-900 mb-2">No cuisines found</h3>
                            <p className="font-satoshi text-gray-600">Try searching for something else, or join our waitlist.</p>
                        </div>
                    )}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-16 p-12 rounded-[3.5rem] bg-brand-primary text-white text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="font-asgard text-4xl md:text-5xl font-bold mb-6">
                            Missing your favorite taste?
                        </h2>
                        <p className="font-satoshi text-xl text-white/80 mb-10">
                            We're constantly expanding our community. Join our waitlist to be notified when new creators arrive in your area.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/waitlist"
                                className="w-full sm:w-auto px-10 py-5 bg-white text-brand-primary font-bold rounded-full hover:bg-gray-100 transition-all shadow-xl"
                            >
                                Join Waitlist
                            </Link>
                            <Link
                                href="/cooking/apply"
                                className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/30 hover:border-white text-white font-bold rounded-full transition-all"
                            >
                                Become a Food Creator
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
