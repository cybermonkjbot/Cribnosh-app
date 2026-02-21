"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CreateMealPage() {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        prepTime: "",
        servings: "",
        isAvailable: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement meal creation
        console.log("Creating meal:", formData);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/food-creator/meals"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Meals
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Create New Meal</h1>
                <p className="mt-1 text-gray-600">Add a new meal to your menu</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Meal Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                    placeholder="e.g., Jollof Rice with Chicken"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition resize-none"
                                    placeholder="Describe your meal..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                        Price (£) *
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                    >
                                        <option value="">Select category</option>
                                        <option value="african">African</option>
                                        <option value="caribbean">Caribbean</option>
                                        <option value="asian">Asian</option>
                                        <option value="european">European</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                                        Prep Time (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        id="prepTime"
                                        min="0"
                                        value={formData.prepTime}
                                        onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                        placeholder="30"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                                        Servings
                                    </label>
                                    <input
                                        type="number"
                                        id="servings"
                                        min="1"
                                        value={formData.servings}
                                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition"
                                        placeholder="2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meal Image</h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-secondary transition-colors cursor-pointer">
                            <p className="text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
                                <p className="text-sm text-gray-600 mt-1">Make this meal available for orders</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${formData.isAvailable ? "bg-green-500" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${formData.isAvailable ? "translate-x-11" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl"
                        >
                            Create Meal
                        </button>
                        <Link
                            href="/food-creator/meals"
                            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
