"use client";

import { ArrowRight, Sparkles, Utensils } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

interface Cuisine {
    _id?: string;
    name: string;
    description: string;
    image?: string;
}

export default function CuisinesClientPage({ cuisines }: { cuisines: Cuisine[] }) {
    return (
        <div className="min-h-screen bg-[#FAFFFA] pt-24 pb-20">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary-500/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header Section */}
                <div className="max-w-3xl mb-16">
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
                        <p className="font-satoshi text-xl text-gray-600 leading-relaxed">
                            From family secrets to regional specialties, explore the diverse range of authentic homemade meals available on Cribnosh. Each dish is cooked with love by local creators.
                        </p>
                    </motion.div>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cuisines.map((cuisine, index) => (
                        <motion.div
                            key={cuisine._id || cuisine.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Link
                                href={`/locations/all/${cuisine.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="group block relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500"
                            >
                                {/* Image or Placeholder */}
                                <div className="absolute inset-0 bg-gray-200">
                                    {cuisine.image ? (
                                        <Image
                                            src={cuisine.image}
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

                                {/* Glassmorphic Badge */}
                                <div className="absolute top-6 right-6 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {Math.floor(Math.random() * 20 + 5)}+ Creators
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 p-12 rounded-[3rem] bg-brand-primary text-white text-center relative overflow-hidden"
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
