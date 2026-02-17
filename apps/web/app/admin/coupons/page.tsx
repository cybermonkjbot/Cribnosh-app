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
import { useToast } from '@/hooks/use-toast';
import { useQuery } from 'convex/react';
import { Calendar, Copy, Edit, Gift, MoreHorizontal, Percent, Plus, Ticket, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Coupon {
    _id: Id<"coupons">;
    code: string;
    type: 'discount' | 'referral' | 'nosh_pass';
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    status: 'active' | 'expired' | 'deactivated';
    valid_from: number;
    valid_until: number;
    usage_limit?: number;
}

export default function AdminCoupons() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const coupons = useQuery(api.queries.coupons.getAll, queryArgs);
    const { toast } = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredCoupons = coupons?.filter((coupon: Coupon) => {
        const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || coupon.status === statusFilter;
        const matchesType = typeFilter === 'all' || coupon.type === typeFilter;
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
                { value: 'discount', label: 'Standard Discount' },
                { value: 'referral', label: 'Referral' },
                { value: 'nosh_pass', label: 'Nosh Pass' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'deactivated': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({
            title: "Code Copied",
            description: `${code} copied to clipboard`,
        });
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
                            <Gift className="w-8 h-8 text-primary-600" />
                        </div>
                        Coupons & Certificates
                    </h1>
                    <p className="text-gray-700 font-satoshi text-lg">
                        Manage discount codes, referral coupons, and Nosh Pass
                    </p>
                </div>

                <Button
                    size="lg"
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search codes..."
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
                {!coupons ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={5} />
                    </div>
                ) : filteredCoupons?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Ticket}
                            title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? "No coupons found" : "No coupons yet"}
                            description="Coupons will appear here once they are generated."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Code</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Discount</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Expiry</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredCoupons.map((coupon: Coupon) => (
                                    <tr key={coupon._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-1 bg-gray-100 rounded font-mono font-bold text-gray-900">
                                                    {coupon.code}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                                    onClick={() => copyToClipboard(coupon.code)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="capitalize">
                                                {coupon.type.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-semibold text-gray-900">
                                                {coupon.discount_type === 'percentage' ? (
                                                    <>
                                                        <Percent className="w-4 h-4 text-gray-400" />
                                                        {coupon.discount_value}%
                                                    </>
                                                ) : (
                                                    <>
                                                        £{coupon.discount_value}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${getStatusBadge(coupon.status)} capitalize`}>
                                                {coupon.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 font-satoshi">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(coupon.valid_until).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Coupon
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Deactivate
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
