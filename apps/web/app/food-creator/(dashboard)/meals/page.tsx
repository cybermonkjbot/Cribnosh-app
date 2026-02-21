"use client";

import { api } from "@/convex/_generated/api";
import { useFoodCreatorAuth } from "@/lib/food-creator-auth";
import { useQuery } from "convex/react";
import { Package, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MealsPage() {
    const { foodCreator, sessionToken } = useFoodCreatorAuth();
    const [searchQuery, setSearchQuery] = useState("");

    const meals = useQuery(
        api.queries.meals.listByChef,
        foodCreator?._id && sessionToken ? { chefId: foodCreator._id, sessionToken } : "skip"
    );

    const filteredMeals = meals?.filter((meal: any) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return meal.name?.toLowerCase().includes(query) || meal.description?.toLowerCase().includes(query);
        }
        return true;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Meals</h1>
                    <p className="mt-1 text-gray-600">Manage your meal offerings</p>
                </div>
                <Link
                    href="/food-creator/meals/create"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                >
                    <Plus className="h-5 w-5" />
                    Create Meal
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search meals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition bg-white/80 backdrop-blur-sm"
                />
            </div>

            {/* Meals Grid */}
            {filteredMeals && filteredMeals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMeals.map((meal: any) => (
                        <Link
                            key={meal._id}
                            href={`/food-creator/meals/${meal._id}/edit`}
                            className="group rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20 overflow-hidden hover:shadow-lg hover:border-orange-300 transition-all"
                        >
                            {meal.image_url && (
                                <div className="aspect-video bg-gray-200 overflow-hidden">
                                    <img
                                        src={meal.image_url}
                                        alt={meal.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{meal.name}</h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{meal.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-gray-900">
                                        £{meal.price ? (meal.price / 100).toFixed(2) : "0.00"}
                                    </span>
                                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${meal.is_available ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        }`}>
                                        {meal.is_available ? "Available" : "Unavailable"}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No meals found</h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery ? "No meals match your search." : "Start by creating your first meal."}
                    </p>
                    <Link
                        href="/food-creator/meals/create"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="h-5 w-5" />
                        Create Your First Meal
                    </Link>
                </div>
            )}
        </div>
    );
}
