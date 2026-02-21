"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { EmptyState } from '@/components/admin/empty-state';
import { GenericTableSkeleton } from '@/components/admin/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { ChefHat, Clock, Eye, MoreHorizontal, ShieldAlert, ShieldCheck, Star, Trash, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Review {
    _id: Id<"reviews">;
    user_id: Id<"users">;
    foodCreator_id?: Id<"chefs">;
    meal_id?: Id<"meals">;
    order_id?: Id<"orders">;
    rating: number;
    comment: string;
    status: 'pending' | 'published' | 'hidden' | 'flagged';
    createdAt: number;
}

export default function AdminReviews() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const reviews = useQuery(api.queries.reviews.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');

    const filteredReviews = reviews?.filter((review: Review) => {
        const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
        const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
        return matchesSearch && matchesStatus && matchesRating;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Reviews' },
                { value: 'pending', label: 'Pending' },
                { value: 'published', label: 'Published' },
                { value: 'hidden', label: 'Hidden' },
                { value: 'flagged', label: 'Flagged' },
            ],
        },
        {
            key: 'rating',
            label: 'Rating',
            value: ratingFilter,
            onChange: setRatingFilter,
            options: [
                { value: 'all', label: 'All Ratings' },
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' },
            ],
        },
    ];

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                ))}
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
            case 'hidden': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-[18px]">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-xl">
                        <Star className="w-8 h-8 text-primary-600" />
                    </div>
                    Review Moderation
                </h1>
                <p className="text-gray-700 font-satoshi text-lg">
                    Moderate foodCreator and meal reviews across the platform
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search review comment..."
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl overflow-hidden"
            >
                {!reviews ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={5} />
                    </div>
                ) : filteredReviews?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Star}
                            title="No reviews found"
                            description="User reviews will appear here once they are submitted."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Rating & Comment</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Entity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Customer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredReviews.map((review: Review) => (
                                    <tr key={review._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-2 max-w-sm">
                                                {renderStars(review.rating)}
                                                <p className="text-sm text-gray-900 font-satoshi italic">"{review.comment}"</p>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(review.createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {review.foodCreator_id && (
                                                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
                                                        <ChefHat className="w-3 h-3" />
                                                        <span>FoodCreator: {review.foodCreator_id.slice(-6)}</span>
                                                    </div>
                                                )}
                                                {review.meal_id && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                                        <span className="font-bold">Meal ID:</span>
                                                        <span>{review.meal_id.slice(-6)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>{review.user_id.slice(-6)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${getStatusBadge(review.status)} capitalize`}>
                                                {review.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                                            Approve / Publish
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-yellow-600">
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Hide Review
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <ShieldAlert className="w-4 h-4 mr-2" />
                                                            Flag for Removal
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-700">
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Delete Permanent
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
