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
import { Activity, Clock, MoreHorizontal, Play, RefreshCw, StopCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Job {
    _id: Id<"jobQueue">;
    jobId: string;
    type: string;
    payload: any;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'critical';
    attempts: number;
    maxAttempts: number;
    error?: string;
    scheduledFor: number;
    _creationTime: number;
}

export default function AdminSystemJobs() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const jobs = useQuery(api.queries.jobQueue.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredJobs = jobs?.filter((job: Job) => {
        const matchesSearch = job.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.jobId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Jobs' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
            case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500 text-white border-red-600';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
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
                            <Activity className="w-8 h-8 text-primary-600" />
                        </div>
                        Job Queue Monitoring
                    </h1>
                    <p className="text-gray-700 font-satoshi text-lg">
                        Monitor and manage background system tasks
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh View
                </Button>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search by job ID or type..."
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
                {!jobs ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={6} />
                    </div>
                ) : filteredJobs?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Activity}
                            title="Job queue is empty"
                            description="Background tasks will appear here when they are scheduled."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Job ID / Type</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Priority</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Attempts</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Scheduled</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredJobs.map((job: Job) => (
                                    <tr key={job._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="font-mono text-xs font-bold text-gray-900">{job.jobId}</p>
                                                <p className="text-sm font-semibold text-primary-700 capitalize">{job.type.replace(/_/g, ' ')}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Badge className={`${getStatusBadge(job.status)} capitalize w-fit`}>
                                                    {job.status}
                                                </Badge>
                                                {job.error && (
                                                    <p className="text-[10px] text-red-500 font-satoshi line-clamp-1 max-w-[200px]" title={job.error}>
                                                        {job.error}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`${getPriorityBadge(job.priority)} capitalize`}>
                                                {job.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-700 font-satoshi">
                                                {job.attempts} / {job.maxAttempts}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-xs text-gray-500 font-satoshi">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(job.scheduledFor).toLocaleTimeString()}</span>
                                                </div>
                                                <span className="mt-1">{new Date(job.scheduledFor).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Control</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem disabled={job.status !== 'failed'}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Retry Job
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" disabled={job.status !== 'pending' && job.status !== 'processing'}>
                                                        <StopCircle className="w-4 h-4 mr-2" />
                                                        Cancel Job
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
