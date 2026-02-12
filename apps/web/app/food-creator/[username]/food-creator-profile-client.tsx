"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession } from "@/lib/auth/use-session";
import { useQuery } from "convex/react";
import { ArrowLeft, ChefHat, Clock, MapPin, ShoppingCart, Star } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface FoodCreatorProfileClientProps {
    foodCreator: any; // We'll rely on the passed data from server or fetch fresh if needed
}

export default function FoodCreatorProfileClient({ foodCreator }: FoodCreatorProfileClientProps) {
    const { user, isAuthenticated } = useSession();
    const userId = user?._id as Id<'users'> | undefined;
    const router = useRouter();
    const addToCart = useAddToCart();
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    // Fetch food creator's meals
    const meals = useQuery(api.queries.meals.searchMealsByChefId, {
        chefId: foodCreator._id,
        query: "",
        userId,
        limit: 50 // Show reasonable amount of meals
    });

    const isLoadingMeals = meals === undefined;

    // Handle adding item to cart (reused logic)
    const handleAddToCart = async (mealId: string, mealName: string) => {
        if (!isAuthenticated) {
            toast.error('Please sign in to add items to cart');
            router.push('/try-it'); // Redirect to login/try-it
            return;
        }

        setAddingToCart(mealId);
        try {
            await addToCart.mutateAsync({
                dishId: mealId,
                quantity: 1,
            });
            toast.success(`Added ${mealName} to cart`);
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            const errorMessage = error?.message || 'Failed to add item to cart. Please try again.';
            toast.error(errorMessage);
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Simple Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 pl-0"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </Button>
                </div>
            </div>

            {/* Profile Header */}
            <div className="bg-white border-b border-gray-200 pb-12 pt-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        {/* Food Creator Image */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto md:mx-0">
                            <Image
                                src={foodCreator.profileImage || "/card-images/IMG_2262.png"} // Fallback image
                                alt={foodCreator.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Food Creator Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="font-asgard text-3xl md:text-4xl mb-2">{foodCreator.name}</h1>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-600 mb-4">
                                {foodCreator.location?.city && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>{foodCreator.location.city}</span>
                                    </div>
                                )}
                                {foodCreator.rating && (
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full text-yellow-700">
                                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{foodCreator.rating.toFixed(1)}</span>
                                    </div>
                                )}
                                {/* Food Creator Status */}
                                {foodCreator.isAvailable ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        Accepting Orders
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                                        Unavailable
                                    </span>
                                )}
                            </div>

                            {/* Bio */}
                            <p className="text-slate-600 max-w-2xl mx-auto md:mx-0 font-satoshi leading-relaxed">
                                {foodCreator.bio}
                            </p>

                            {/* Specialties */}
                            {foodCreator.specialties && foodCreator.specialties.length > 0 && (
                                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                                    {foodCreator.specialties.map((s: string) => (
                                        <span key={s} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section (Meals) */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="font-asgard text-2xl mb-8">Available Meals</h2>

                {isLoadingMeals ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : meals && meals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {meals.map((meal: any) => (
                            <motion.div
                                key={meal._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100"
                            >
                                <div className="relative h-56">
                                    <Image
                                        src={meal.images?.[0] || "/kitchenillus.png"}
                                        alt={meal.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-display font-bold text-white mb-1 line-clamp-1">{meal.name}</h3>
                                        <div className="flex items-center text-white/90 text-sm">
                                            <Clock size={14} className="mr-1" />
                                            <span>{meal.prepTime || '30-45 min'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[2.5em]">
                                        {meal.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xl font-display font-bold text-[#ff3b30]">
                                            £{meal.price.toFixed(2)}
                                        </span>

                                        <Button
                                            onClick={() => handleAddToCart(meal._id, meal.name)}
                                            disabled={addingToCart === meal._id || meal.status !== 'available'}
                                            className={`
                                ${meal.status === 'available' ? 'bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                            `}
                                        >
                                            {addingToCart === meal._id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                    Add to Cart
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <ChefHat size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No meals available right now</h3>
                        <p className="text-slate-500">Check back later for new dishes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
