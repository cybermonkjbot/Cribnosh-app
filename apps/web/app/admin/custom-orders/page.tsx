"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { EmptyState } from '@/components/admin/empty-state';
import { GenericTableSkeleton } from '@/components/admin/skeletons';
import { Badge } from '@/components/ui/badge';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { Calendar, ShoppingCart, User, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface CustomOrder {
    _id: Id<"custom_orders">;
    custom_order_id: string;
    userId: Id<"users">;
    requirements: string;
    servingSize: number;
    status: 'pending' | 'quoted' | 'accepted' | 'rejected' | 'completed';
    price?: number;
    _creationTime: number;
}

export default function AdminCustomOrders() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const customOrders = useQuery(api.queries.custom_orders.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredOrders = customOrders?.filter((order: CustomOrder) => {
        const matchesSearch = order.requirements.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.custom_order_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Orders' },
                { value: 'pending', label: 'Pending' },
                { value: 'quoted', label: 'Quoted' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'completed', label: 'Completed' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'quoted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
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
                        <ShoppingCart className="w-8 h-8 text-primary-600" />
                    </div>
                    Custom Orders
                </h1>
                <p className="text-gray-700 font-satoshi text-lg">
                    Manage bespoke food requests and custom quotes
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search requirements or order ID..."
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
                {!customOrders ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={5} />
                    </div>
                ) : filteredOrders?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={ShoppingCart}
                            title="No custom orders found"
                            description="Bespoke orders will appear here once customers submit requests."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Order ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Requirements</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Customer Details</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Price</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredOrders.map((order: CustomOrder) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-gray-900">{order.custom_order_id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <p className="text-sm text-gray-900 font-satoshi line-clamp-2">{order.requirements}</p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    Serves: {order.servingSize}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-satoshi">
                                                <User className="w-3 h-4 text-gray-400" />
                                                <span className="truncate max-w-[120px]">{order.userId}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${getStatusBadge(order.status)} capitalize`}>
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.price ? (
                                                <span className="font-bold text-gray-900">£{order.price.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Pending Quote</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(order._creationTime).toLocaleDateString()}</span>
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
