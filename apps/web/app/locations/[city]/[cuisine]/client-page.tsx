"use client";

import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { ArrowRight, ChefHat, Loader2, MapPin, Search, Star, Utensils } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface Creator {
    _id: string;
    name: string;
    username?: string;
    userId: string;
    bio: string;
    profileImage?: string;
    rating: number;
    specialties: string[];
}

interface Props {
    city: string;
    cuisine: string;
    foodCreators: Creator[];
    cityParam: string;
    cuisineParam: string;
}

export default function LocationCuisineClientPage({ city, cuisine, foodCreators: initialCreators, cityParam, cuisineParam }: Props) {
    const isAllCities = cityParam === 'all';
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { results, status, loadMore } = usePaginatedQuery(
        api.queries.chefs.listPaginated,
        {
            city: isAllCities ? undefined : cityParam,
            cuisine: cuisineParam === 'all' ? undefined : cuisineParam,
            search: debouncedSearch || undefined
        },
        { initialNumItems: 12 }
    );

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && status === "CanLoadMore") {
            loadMore(12);
        }
    }, [inView, status, loadMore]);

    const displayCreators = (debouncedSearch || results.length > 0) ? results : initialCreators;

    return (
        <div className="min-h-screen bg-[#FAFFFA] pt-24 pb-20">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                            <Link href="/" className="hover:text-primary-500 transition-colors">Home</Link>
                            <span>/</span>
                            <Link href="/cuisines" className="hover:text-primary-500 transition-colors">Cuisines</Link>
                            <span>/</span>
                            <span className="text-brand-primary font-medium">{cuisine}</span>
                        </nav>

                        <h1 className="font-asgard text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            {cuisine} Food {isAllCities ? 'Everywhere' : `in ${city}`}
                        </h1>
                        <p className="font-satoshi text-xl text-gray-600 max-w-3xl leading-relaxed mb-8">
                            Discover the finest {cuisine.toLowerCase()} creators {isAllCities ? 'across our platform' : `bringing authentic flavors to the streets of ${city}`}.
                        </p>

                        {/* Search Bar */}
                        <div className="relative group max-w-xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                            <input
                                type="text"
                                placeholder={`Search ${cuisine.toLowerCase()} in ${city}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl font-satoshi text-lg focus:outline-none focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm group-hover:shadow-md"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Results Section */}
                {displayCreators.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayCreators.map((creator, index) => (
                            <motion.div
                                key={creator._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.5) }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    href={`/food-creator/${creator.username || creator.userId}`}
                                    className="group block bg-white rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col"
                                >
                                    <div className="relative h-64">
                                        <Image
                                            src={creator.profileImage || "/placeholder-chef.jpg"}
                                            alt={creator.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20">
                                            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                                            <span className="text-sm font-bold text-gray-900">{creator.rating}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-asgard text-2xl font-bold text-gray-900 group-hover:text-primary-500 transition-colors">
                                                    {creator.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                                    <MapPin className="w-4 h-4 text-primary-500" />
                                                    <span>{(creator as any).location?.city || city}</span>
                                                </div>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-brand-primary/5 text-brand-primary">
                                                <ChefHat className="w-6 h-6" />
                                            </div>
                                        </div>

                                        <p className="font-satoshi text-gray-600 text-sm line-clamp-2 mb-6 flex-1">
                                            {creator.bio}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mb-8">
                                            {(creator as any).specialties?.slice(0, 3).map((specialty: string) => (
                                                <span key={specialty} className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-xs font-medium uppercase tracking-wider">
                                                    {specialty}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                                            <span className="text-sm font-bold text-gray-900">View Kitchen</span>
                                            <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center transform group-hover:translate-x-2 transition-transform duration-300">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-20 rounded-[3rem] bg-white border-2 border-dashed border-gray-100 text-center"
                    >
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Utensils className="w-10 h-10 text-gray-300" />
                        </div>
                        <h2 className="font-asgard text-2xl font-bold text-gray-900 mb-4">No {cuisine.toLowerCase()} creators found{debouncedSearch ? ' matching your search' : ''}.</h2>
                        <p className="font-satoshi text-gray-500 mb-8 max-w-sm mx-auto">
                            We're growing fast! Be the first to know when a {cuisine.toLowerCase()} creator launches near you.
                        </p>
                        <Link
                            href="/waitlist"
                            className="inline-flex items-center px-8 py-4 bg-brand-primary text-white font-bold rounded-full hover:bg-gray-100 hover:text-brand-primary transition-all shadow-lg"
                        >
                            Join the Waitlist
                        </Link>
                    </motion.div>
                )}

                {/* Loading State & Observer */}
                <div ref={ref} className="mt-16 flex justify-center min-h-[100px]">
                    {status === "LoadingMore" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                            <p className="font-satoshi text-gray-500">Bringing you more flavors...</p>
                        </div>
                    )}
                    {status === "Exhausted" && results.length > 0 && !debouncedSearch && (
                        <p className="font-satoshi text-gray-400">You've reached the end of results for {cuisine} in {city}.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
