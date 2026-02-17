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
import { Archive, CheckCircle, Clock, Mail, MessageCircle, MoreHorizontal, Reply, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Contact {
    _id: Id<"contacts">;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'archived';
    createdAt: number;
}

export default function AdminSupport() {
    const { sessionToken, loading: authLoading } = useAdminUser();
    const queryArgs = authLoading || !sessionToken ? "skip" : { sessionToken };
    const contacts = useQuery(api.queries.contacts.getAll, queryArgs);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredContacts = contacts?.filter((contact: Contact) => {
        const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filters: FilterOption[] = [
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Messages' },
                { value: 'new', label: 'New' },
                { value: 'read', label: 'Read' },
                { value: 'replied', label: 'Replied' },
                { value: 'archived', label: 'Archived' },
            ],
        },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
            case 'replied': return 'bg-green-100 text-green-800 border-green-200';
            case 'read': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'archived': return 'bg-gray-50 text-gray-500 border-gray-100';
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
                        <MessageCircle className="w-8 h-8 text-primary-600" />
                    </div>
                    Support Inbox
                </h1>
                <p className="text-gray-700 font-satoshi text-lg">
                    Manage contact form submissions and customer inquiries
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <AdminFilterBar
                    searchPlaceholder="Search by name, email, or subject..."
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
                {!contacts ? (
                    <div className="p-8">
                        <GenericTableSkeleton rowCount={5} columnCount={4} />
                    </div>
                ) : filteredContacts?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 p-12">
                        <EmptyState
                            icon={Mail}
                            title="Inbox is empty"
                            description="New messages from the contact form will appear here."
                            variant="no-data"
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50/95 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">From / Subject</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Message Snippet</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Received</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold font-asgard text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/60">
                                {filteredContacts.map((contact: Contact) => (
                                    <tr key={contact._id} className={`hover:bg-gray-50/50 transition-colors ${contact.status === 'new' ? 'bg-primary-50/20' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className={`font-bold font-asgard ${contact.status === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>{contact.name}</p>
                                                <p className="text-xs text-gray-500 font-satoshi">{contact.email}</p>
                                                <p className="text-sm font-semibold text-gray-800 line-clamp-1 mt-1">{contact.subject}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 font-satoshi line-clamp-2 max-w-xs">{contact.message}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${getStatusBadge(contact.status)} capitalize`}>
                                                {contact.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-satoshi">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(contact.createdAt).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    Open
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
                                                            <Reply className="w-4 h-4 mr-2" />
                                                            Reply
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Mark as Replied
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Archive className="w-4 h-4 mr-2" />
                                                            Archive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Delete
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
