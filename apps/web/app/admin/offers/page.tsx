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
import { Calendar, Coins, Edit, Eye, MoreHorizontal, Percent, Plus, Ticket, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface SpecialOffer {
    _id: Id<"special_offers">;
    offer_id: string;
    name: string;
    description: string;
    type: 'fixed' | 'percentage' | 'points';
    value: number;
    starts_at: number;
    ends_at: number;
    is_active: boolean;
    status: 'active' | 'scheduled' | 'expired' | 'deactivated';
    target_audience: 'all' | 'new_users' | 'existing_users' | 'group_orders';
}

export default function AdminOffers() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const offers = useQuery(api.queries.specialOffers.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredOffers = offers?.filter((offer: SpecialOffer) => {
        const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            offer.offer_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
        const matchesType = typeFilter === 'all' || offer.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'expired', label: 'Expired' },
                { value: 'deactivated', label: 'Deactivated' },
            ],
        },
        {
            key: 'type',
            label: 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: 'all', label: 'All Types' },
                { value: 'fixed', label: 'Fixed Discount' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'points', label: 'Loyalty Points' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'deactivated': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'percentage': return <Percent className="w-4 h-4" />;
            case 'points': return <Coins className="w-4 h-4" />;
            default: return <Ticket className="w-4 h-4" />;
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-[18px]">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
            >
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
                        <div className="p-3 bg-primary-100 rounded-xl">
                            <Ticket className="w-8 h-8 text-primary-600" />
                        </div>
                        Special Offers
                    </h1>
                    <p className="text-gray-700 font-satoshi text-lg">
                        Manage seasonal and promotional offers
                    </p>
                </div>

                <Button
                    size="lg"
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Offer
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search offers..."
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
                {!offers ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={5} />
                    </div>
                ) : filteredOffers?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Ticket}
                            title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? "No offers found" : "No offers yet"}
                            description="Offers will appear here once they are created in the system."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Offer</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Validity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredOffers.map((offer: SpecialOffer) => (
                                    <tr key={offer._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold font-asgard text-gray-900">{offer.name}</p>
                                                <p className="text-sm text-gray-600 font-satoshi truncate max-w-xs">{offer.description}</p>
                                                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{offer.offer_id}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(offer.type)}
                                                <span className="text-sm font-medium capitalize">{offer.type}</span>
                                                <span className="text-xs text-gray-500">
                                                    ({offer.value}{offer.type === 'percentage' ? '%' : offer.type === 'points' ? ' pts' : ' GBP'})
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${getStatusBadge(offer.status)} capitalize`}>
                                                {offer.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600 font-satoshi">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(offer.starts_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-gray-400">to</span>
                                                    <span>{new Date(offer.ends_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
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
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Offer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Delete Offer
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
