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
import { Calendar, Eye, MapPin, MoreHorizontal, ShieldAlert, ShieldCheck, Utensils } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Kitchen {
    _id: Id<"kitchens">;
    owner_id: Id<"users">;
    address: string;
    certified: boolean;
    inspectionDates?: string[];
}

export default function AdminKitchens() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const kitchens = useQuery(api.queries.kitchens.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [certifiedFilter, setCertifiedFilter] = useState('all');

    const filteredKitchens = kitchens?.filter((kitchen: Kitchen) => {
        const matchesSearch = kitchen.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            kitchen.owner_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCertified = certifiedFilter === 'all' ||
            (certifiedFilter === 'certified' && kitchen.certified) ||
            (certifiedFilter === 'pending' && !kitchen.certified);
        return matchesSearch && matchesCertified;
    });

    const filters: FilterOption[] = [
        {
            key: 'certified',
            label: 'Certification',
            value: certifiedFilter,
            onChange: setCertifiedFilter,
            options: [
                { value: 'all', label: 'All Kitchens' },
                { value: 'certified', label: 'Certified' },
                { value: 'pending', label: 'Pending Certification' },
            ],
        },
    ];

    return (
        <div className="container mx-auto py-6 space-y-[18px]">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold font-asgard text-gray-900 mb-3 flex items-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-xl">
                        <Utensils className="w-8 h-8 text-primary-600" />
                    </div>
                    Kitchen Verification
                </h1>
                <p className="text-gray-700 font-satoshi text-lg">
                    Manage kitchen certifications and safety inspections
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search address or owner ID..."
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
                {!kitchens ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={5} />
                    </div>
                ) : filteredKitchens?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Utensils}
                            title="No kitchens found"
                            description="Kitchen data will appear here once food creators register their premises."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Kitchen / Owner</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Address</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Last Inspection</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredKitchens.map((kitchen: Kitchen) => (
                                    <tr key={kitchen._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <Utensils className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold font-asgard text-gray-900">Kitchen {kitchen._id.slice(-4)}</p>
                                                    <p className="text-xs font-mono text-gray-400">Owner: {kitchen.owner_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-1 text-sm text-gray-600 font-satoshi max-w-xs">
                                                <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                                                <span>{kitchen.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {kitchen.certified ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    Certified
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                                                    <ShieldAlert className="w-3 h-3" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-satoshi">
                                            {kitchen.inspectionDates && kitchen.inspectionDates.length > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>{kitchen.inspectionDates[kitchen.inspectionDates.length - 1]}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No inspections recorded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Details
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Verification</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                                            Approve Certification
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Schedule Inspection
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600">
                                                            <ShieldAlert className="w-4 h-4 mr-2" />
                                                            Revoke Certification
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
