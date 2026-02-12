"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useChefAuth } from "@/lib/chef-auth";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditMealPage() {
    const params = useParams();
    const router = useRouter();
    const mealId = params.id as Id<"meals">;
    const { sessionToken, chef } = useChefAuth();

    const meal = useQuery(api.queries.meals.get, { mealId });
    const updateMeal = useMutation(api.mutations.meals.updateMeal);
    const deleteMeal = useMutation(api.mutations.meals.deleteMeal);

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        category: "",
        prepTime: "",
        servings: "",
        isAvailable: true,
        cuisine: [] as string[],
        dietary: [] as string[],
    });

    useEffect(() => {
        if (meal) {
            setFormData({
                name: meal.name,
                description: meal.description,
                price: meal.price.toString(),
                category: meal.cuisine?.[0] || "", // Simplified category mapping
                prepTime: "30", // Mock data if missing in schema
                servings: "2", // Mock data if missing in schema
                isAvailable: meal.status === 'available',
                cuisine: meal.cuisine || [],
                dietary: meal.dietary || [],
            });
        }
    }, [meal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionToken || !mealId) return;

        setIsLoading(true);
        try {
            await updateMeal({
                mealId,
                updates: {
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    status: formData.isAvailable ? 'available' : 'unavailable',
                    cuisine: [formData.category], // Simplified
                    dietary: formData.dietary,
                    // Note: prepTime and servings might not be in the updateMeal args based on schema check
                    // We only send what's defined in the mutation args
                },
                sessionToken
            });
            alert("Meal updated successfully!");
            router.push("/chef/meals");
        } catch (error) {
            console.error("Failed to update meal:", error);
            alert("Failed to update meal");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this meal? This action cannot be undone.")) return;
        if (!sessionToken || !mealId) return;

        try {
            await deleteMeal({ mealId, sessionToken });
            router.push("/chef/meals");
        } catch (error) {
            console.error("Failed to delete meal:", error);
            alert("Failed to delete meal");
        }
    };

    if (!meal) return <div className="p-8">Loading meal details...</div>;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/chef/meals"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Meals
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Meal</h1>
                    <p className="mt-1 text-gray-600">Update your meal details</p>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-200"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete Meal
                </button>
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
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
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
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
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
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
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
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
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
                        </div>
                    </div>

                    {/* Image Upload Placeholder */}
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-md border border-white/20">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meal Image</h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                            <p className="text-gray-600">Click to upload or drag and drop (Updates separate from main form)</p>
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
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                            {isLoading ? "Updating..." : "Update Meal"}
                        </button>
                        <Link
                            href="/chef/meals"
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
