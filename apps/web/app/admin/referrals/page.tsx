"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { EmptyState } from '@/components/admin/empty-state';
import { GenericTableSkeleton } from '@/components/admin/skeletons';
import { Badge } from '@/components/ui/badge';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { AlertCircle, ArrowRight, Calendar, CheckCircle, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Referral {
    _id: Id<"referrals">;
    referrer_id: Id<"users">;
    referred_email: string;
    referred_user_id?: Id<"users">;
    status: 'pending' | 'completed' | 'expired' | 'fraud_suspected';
    reward_status: 'none' | 'pending' | 'sent' | 'claimed';
    _creationTime: number;
}

export default function AdminReferrals() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const referrals = useQuery(api.queries.referrals.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredReferrals = referrals?.filter((ref: Referral) => {
        const matchesSearch = ref.referred_email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ref.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'expired', label: 'Expired' },
                { value: 'fraud_suspected', label: 'Fraud Suspected' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'fraud_suspected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
            case 'fraud_suspected': return <AlertCircle className="w-4 h-4 text-red-600" />;
            default: return null;
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
                        <Users className="w-8 h-8 text-primary-600" />
                    </div>
                    Referral Tracking
                </h1>
                <p className="text-gray-700 font-satoshi text-lg">
                    Monitor referral growth and fraud suspicion
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search referred email..."
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
                {!referrals ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={4} />
                    </div>
                ) : filteredReferrals?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Users}
                            title="No referrals found"
                            description="Referral events will appear here once users invite their friends."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Referrer</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold font-asgard text-gray-900">Result</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Referred Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredReferrals.map((ref: Referral) => (
                                    <tr key={ref._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-mono text-gray-500">{ref.referrer_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ArrowRight className="w-4 h-4 mx-auto text-gray-400" />
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 font-medium font-satoshi">
                                            {ref.referred_email}
                                            {ref.referred_user_id && (
                                                <p className="text-[10px] text-gray-400 font-mono mt-1">{ref.referred_user_id}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(ref.status)}
                                                <Badge className={`${getStatusBadge(ref.status)} capitalize`}>
                                                    {ref.status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Reward: {ref.reward_status}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-sm text-gray-600 font-satoshi">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(ref._creationTime).toLocaleDateString()}</span>
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
