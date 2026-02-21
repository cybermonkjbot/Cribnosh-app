"use client";

import { BookOpen, FileText, Plus, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContentPage() {
    const [filter, setFilter] = useState<"all" | "recipes" | "stories" | "videos">("all");

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
                    <p className="mt-1 text-gray-600">Manage your recipes, stories, and videos</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/food-creator/content/recipes/create"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="h-5 w-5" />
                        Create Content
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "all"
                        ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md"
                        : "bg-white/80 text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter("recipes")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "recipes"
                        ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md"
                        : "bg-white/80 text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    Recipes
                </button>
                <button
                    onClick={() => setFilter("stories")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "stories"
                        ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md"
                        : "bg-white/80 text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    Stories
                </button>
                <button
                    onClick={() => setFilter("videos")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === "videos"
                        ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md"
                        : "bg-white/80 text-gray-700 hover:bg-gray-100"
                        }`}
                >
                    Videos
                </button>
            </div>

            {/* Empty State */}
            <div className="text-center py-16 rounded-xl bg-white/80 backdrop-blur-sm shadow-md border border-white/20">
                <div className="flex justify-center gap-4 mb-6">
                    <BookOpen className="h-12 w-12 text-orange-400" />
                    <FileText className="h-12 w-12 text-red-400" />
                    <Video className="h-12 w-12 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600 mb-6">Start creating recipes, stories, and videos to engage your customers</p>
                <div className="flex justify-center gap-3">
                    <Link
                        href="/food-creator/content/recipes/create"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                        <BookOpen className="h-5 w-5" />
                        Create Recipe
                    </Link>
                    <Link
                        href="/food-creator/content/stories/create"
                        className="inline-flex items-center gap-2 bg-white text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all border border-gray-300"
                    >
                        <FileText className="h-5 w-5" />
                        Write Story
                    </Link>
                </div>
            </div>
        </div>
    );
}
