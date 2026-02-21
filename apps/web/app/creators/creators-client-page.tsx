"use client";

import { ChefHat, Filter, MapPin, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

interface Creator {
    _id: string;
    name: string;
    username?: string;
    userId: string;
    bio: string;
    profileImage?: string;
    rating: number;
    specialties: string[];
    location: {
        city: string;
    };
}

export default function CreatorsClientPage({ creators }: { creators: Creator[] }) {
    return (
        <div className="min-h-screen bg-[#FAFFFA] pt-24 pb-20">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            <span>The Hearts Behind the Kitchen</span>
                        </div>
                        <h1 className="font-asgard text-5xl md:text-7xl font-bold text-gray-900 mb-6">
                            Our <span className="text-primary-500">Food Creators</span>
                        </h1>
                        <p className="font-satoshi text-xl text-gray-600 leading-relaxed">
                            Meet the artisans, grandmothers, and passionate cooks who bring authentic cultural flavors to your neighborhood. Every creator is certified and every meal is made with passion.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-4"
                    >
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-gray-900 hover:border-brand-primary transition-all">
                            <Filter className="w-5 h-5" />
                            <span>Filter</span>
                        </button>
                        <div className="text-gray-500 font-medium">
                            Showing <span className="text-gray-900 font-bold">{creators.length}</span> Creators
                        </div>
                    </motion.div>
                </div>

                {/* Creators Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {creators.map((creator, index) => (
                        <motion.div
                            key={creator._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Link
                                href={`/food-creator/${creator.username || creator.userId}`}
                                className="group block bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col"
                            >
                                {/* Profile Image & Rating */}
                                <div className="relative aspect-square">
                                    <Image
                                        src={creator.profileImage || "/placeholder-chef.jpg"}
                                        alt={creator.name}
                                        fill
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20">
                                        <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                                        <span className="text-sm font-bold text-gray-900">{creator.rating}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                {/* Content */}
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-asgard text-2xl font-bold text-gray-900 group-hover:text-primary-500 transition-colors">
                                            {creator.name}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                                        <MapPin className="w-4 h-4 text-primary-500" />
                                        <span>{creator.location.city}</span>
                                    </div>

                                    <p className="font-satoshi text-gray-600 text-sm line-clamp-2 mb-6 flex-1">
                                        {creator.bio}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                                        {creator.specialties.slice(0, 2).map(specialty => (
                                            <span key={specialty} className="px-3 py-1 rounded-full bg-brand-primary/5 text-brand-primary text-[10px] font-bold uppercase tracking-wider">
                                                {specialty}
                                            </span>
                                        ))}
                                        {creator.specialties.length > 2 && (
                                            <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-400 text-[10px] font-bold">
                                                +{creator.specialties.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* New Creator Card Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: creators.length * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/cooking/apply"
                            className="group block h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-3xl hover:border-brand-primary transition-all duration-300 p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-brand-primary/5"
                        >
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform">
                                <ChefHat className="w-10 h-10 text-brand-primary" />
                            </div>
                            <h3 className="font-asgard text-2xl font-bold text-gray-900 mb-4">
                                You could be<br />next on the list.
                            </h3>
                            <p className="font-satoshi text-gray-500 text-sm mb-8">
                                Share your culinary heritage with your community. Join hundreds of creators making a difference.
                            </p>
                            <div className="text-brand-primary font-bold flex items-center gap-2">
                                <span>Start Application</span>
                                <Sparkles className="w-4 h-4" />
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
