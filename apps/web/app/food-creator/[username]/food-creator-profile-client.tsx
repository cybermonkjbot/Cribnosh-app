"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession } from "@/lib/auth/use-session";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Clock, ChefHat as FoodCreatorHat, MapPin, Play, ShoppingCart, Star, UserCheck, UserPlus, Users, Video } from "lucide-react";
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
    const meals = useQuery(api.queries.meals.searchMealsByFoodCreatorId, {
        chefId: foodCreator._id,
        query: "",
        userId,
        limit: 50
    });

    // Fetch follower stats for the creator's user ID
    const followStats = useQuery(
        api.queries.userFollows.getUserFollowStats,
        foodCreator.userId ? { userId: foodCreator.userId as Id<'users'> } : "skip"
    );

    // Fetch published videos by this creator
    const creatorVideos = useQuery(
        api.queries.videoPosts.getVideosByCreator,
        foodCreator.userId ? { creatorId: foodCreator.userId as Id<'users'>, limit: 6 } : "skip"
    );

    // Follower functionality
    const isFollowing = useQuery(
        api.queries.userFollows.isFollowing,
        foodCreator.userId && isAuthenticated ? { followingId: foodCreator.userId as Id<'users'> } : "skip"
    );
    const followUser = useMutation(api.mutations.userFollows.followUser);
    const unfollowUser = useMutation(api.mutations.userFollows.unfollowUser);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (!isAuthenticated) {
            toast.error('Please sign in to follow creators');
            router.push('/try-it');
            return;
        }

        if (!foodCreator.userId || isFollowLoading) return;

        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser({ followingId: foodCreator.userId as Id<'users'> });
                toast.success(`Unfollowed ${foodCreator.name}`);
            } else {
                await followUser({ followingId: foodCreator.userId as Id<'users'> });
                toast.success(`Following ${foodCreator.name}`);
            }
        } catch (error: any) {
            console.error('Error toggling follow:', error);
            toast.error(error?.message || 'Failed to update follow status');
        } finally {
            setIsFollowLoading(false);
        }
    };

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
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 justify-center md:justify-start">
                                <h1 className="font-asgard text-3xl md:text-4xl">{foodCreator.name}</h1>

                                {/* Follow Button */}
                                {foodCreator.userId && (
                                    <Button
                                        onClick={handleFollowToggle}
                                        disabled={isFollowLoading || isFollowing === undefined}
                                        variant={isFollowing ? "outline" : "default"}
                                        className={`rounded-full shadow-xs px-6 ${isFollowing
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800'
                                            : 'bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white'
                                            }`}
                                    >
                                        {isFollowLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                        ) : isFollowing ? (
                                            <UserCheck size={16} className="mr-2" />
                                        ) : (
                                            <UserPlus size={16} className="mr-2" />
                                        )}
                                        {isFollowLoading ? 'Wait...' : isFollowing ? 'Following' : 'Follow'}
                                    </Button>
                                )}
                            </div>

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

                            {/* Social Proof Stats */}
                            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                                {followStats?.followersCount !== undefined && (
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <Users size={15} className="text-slate-400" />
                                        <span className="font-semibold">{followStats.followersCount >= 1000 ? `${(followStats.followersCount / 1000).toFixed(1)}k` : followStats.followersCount}</span>
                                        <span className="text-slate-500">followers</span>
                                    </div>
                                )}
                                {followStats?.videosCount !== undefined && followStats.videosCount > 0 && (
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <Video size={15} className="text-slate-400" />
                                        <span className="font-semibold">{followStats.videosCount}</span>
                                        <span className="text-slate-500">videos</span>
                                    </div>
                                )}
                                {foodCreator.performance?.totalOrders !== undefined && foodCreator.performance.totalOrders > 0 && (
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <ShoppingCart size={15} className="text-slate-400" />
                                        <span className="font-semibold">{foodCreator.performance.totalOrders}</span>
                                        <span className="text-slate-500">orders completed</span>
                                    </div>
                                )}
                            </div>
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
                        <FoodCreatorHat size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No meals available right now</h3>
                        <p className="text-slate-500">Check back later for new dishes.</p>
                    </div>
                )}
            </div>

            {/* Video Content Grid */}
            {creatorVideos?.videos && creatorVideos.videos.length > 0 && (
                <div className="container mx-auto px-4 pb-12">
                    <h2 className="font-asgard text-2xl mb-8">Videos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {creatorVideos.videos.map((video: any) => (
                            <motion.div
                                key={video._id}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-100 group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                            >
                                {video.thumbnailUrl ? (
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                        <Play size={32} className="text-slate-400" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                    <p className="text-white text-sm font-semibold line-clamp-2">{video.title}</p>
                                    {video.likesCount > 0 && (
                                        <p className="text-white/70 text-xs mt-1">{video.likesCount} ♥</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
