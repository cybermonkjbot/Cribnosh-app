"use client";

export const dynamic = "force-dynamic";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { EmptyState } from '@/components/admin/empty-state';
import { ModerationSettings } from '@/components/admin/moderation-settings';
import { GenericTableSkeleton } from '@/components/admin/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    Flag,
    Radio,
    Settings,
    Shield,
    Video,
    XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';


type ReportType = 'all' | 'livestream' | 'video';
type ReportStatus = 'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed';

interface ModerationReport {
    _id: string;
    _creationTime: number;
    type: 'livestream' | 'video';
    targetId: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    createdAt: number;
    targetTitle?: string;
    creatorName?: string;
    creatorId?: string;
    channelName?: string; // for livestream
}

export default function ModerationInboxPage() {
    const { user: adminUser, sessionToken } = useAdminUser();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedReport, setSelectedReport] = useState<ModerationReport | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isResolving, setIsResolving] = useState(false);

    // Queries
    const liveReports = useQuery(
        api.queries.liveSessions.adminGetLiveReports,
        sessionToken ? { status: statusFilter === 'all' ? undefined : statusFilter } : "skip"
    );

    const videoReports = useQuery(
        api.queries.adminGetVideoReports.adminGetVideoReports,
        sessionToken ? { status: statusFilter === 'all' ? undefined : statusFilter } : "skip"
    );

    // Mutations
    const resolveLiveReport = useMutation(api.mutations.liveSessions.resolveLiveReport);
    const resolveVideoReport = useMutation(api.mutations.videoPosts.resolveVideoReport);
    const moderateCreator = useMutation(api.mutations.foodCreators.adminModerateFoodCreator);

    // Consolidate reports
    const allReports = useMemo(() => {
        const reports: ModerationReport[] = [];

        if (liveReports) {
            liveReports.forEach((r: any) => {
                reports.push({
                    _id: r._id,
                    _creationTime: r._creationTime,
                    type: 'livestream',
                    targetId: r.sessionId,
                    reporterId: r.reporterId,
                    reporterName: r.reporterName,
                    reason: r.reason,
                    description: r.additionalDetails,
                    status: r.status,
                    createdAt: r.reportedAt,
                    targetTitle: r.channelName,
                    channelName: r.channelName,
                    creatorId: r.chefId,
                });
            });
        }

        if (videoReports) {
            videoReports.forEach((r: any) => {
                reports.push({
                    _id: r._id,
                    _creationTime: r._creationTime,
                    type: 'video',
                    targetId: r.videoId,
                    reporterId: r.reporterId,
                    reporterName: r.reporterName,
                    reason: r.reason,
                    description: r.description,
                    status: r.status,
                    createdAt: r.createdAt,
                    targetTitle: r.videoTitle,
                    creatorName: r.creatorName,
                    creatorId: r.creatorId,
                });
            });
        }

        return reports.sort((a, b) => b.createdAt - a.createdAt);
    }, [liveReports, videoReports]);

    // Filter reports
    const filteredReports = useMemo(() => {
        return allReports.filter(report => {
            const matchesSearch =
                report.targetTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.reason.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'all' || report.type === typeFilter;

            return matchesSearch && matchesType;
        });
    }, [allReports, searchTerm, typeFilter]);

    const handleResolve = async (status: 'resolved' | 'dismissed') => {
        if (!selectedReport) return;

        setIsResolving(true);
        try {
            if (selectedReport.type === 'livestream') {
                await resolveLiveReport({
                    reportId: selectedReport._id as Id<"liveSessionReports">,
                    status,
                    resolutionNotes,
                    sessionToken: sessionToken || undefined,
                });
            } else {
                await resolveVideoReport({
                    reportId: selectedReport._id as Id<"videoReports">,
                    status,
                    resolutionNotes,
                    sessionToken: sessionToken || undefined,
                });
            }

            toast({
                title: "Success",
                description: `Report ${status} successfully`,
                variant: "success",
            });
            setSelectedReport(null);
            setResolutionNotes('');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to resolve report",
                variant: "destructive",
            });
        } finally {
            setIsResolving(false);
        }
    };

    const handleModerateCreator = async (status: 'suspended' | 'flagged') => {
        if (!selectedReport?.creatorId) {
            toast({
                title: "Error",
                description: "Creator ID not found for this report",
                variant: "destructive",
            });
            return;
        }

        try {
            await moderateCreator({
                chefId: selectedReport.creatorId as Id<"chefs">,
                status,
                moderationNote: resolutionNotes,
                sessionToken: sessionToken || undefined,
            });

            toast({
                title: "Creator Moderated",
                description: `Creator has been ${status}`,
                variant: "success",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to moderate creator",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> PENDING</Badge>;
            case 'flagged':
                return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" /> SYSTEM FLAG</Badge>;
            case 'reviewing':
                return <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" /> REVIEWING</Badge>;
            case 'resolved':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> RESOLVED</Badge>;
            case 'dismissed':
                return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> DISMISSED</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const filterOptions: FilterOption[] = [
        {
            key: 'type',
            label: 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: 'all', label: 'All Content' },
                { value: 'livestream', label: 'Livestreams' },
                { value: 'video', label: 'Videos' },
            ],
        },
        {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'flagged', label: 'System Flagged' },
                { value: 'reviewing', label: 'Reviewing' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' },
            ],
        },
    ];

    const isLoading = liveReports === undefined || videoReports === undefined;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-asgard text-gray-900">Moderation Inbox</h1>
                    <p className="text-gray-600 font-satoshi mt-2">Review and resolve user-reported content</p>
                </div>
                <div className="bg-[#F23E2E]/10 px-4 py-2 rounded-lg border border-[#F23E2E]/20 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#F23E2E]" />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Reports</p>
                        <p className="text-xl font-bold text-gray-900">{allReports.filter(r => r.status === 'pending').length}</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="reports" className="w-full">
                <TabsList className="bg-white/50 backdrop-blur-sm border border-gray-100 p-1 mb-2">
                    <TabsTrigger value="reports" className="px-6 py-2 rounded-md transition-all duration-300 data-[state=active]:bg-[#F23E2E] data-[state=active]:text-white data-[state=active]:shadow-lg">
                        <Flag className="w-4 h-4 mr-2" />
                        Moderation Reports
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="px-6 py-2 rounded-md transition-all duration-300 data-[state=active]:bg-[#F23E2E] data-[state=active]:text-white data-[state=active]:shadow-lg">
                        <Settings className="w-4 h-4 mr-2" />
                        System Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="space-y-6 pt-2">

                    <AdminFilterBar
                        searchPlaceholder="Search reports by title, reporter, or reason..."
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        filters={filterOptions}
                        onClearAll={() => {
                            setSearchTerm('');
                            setTypeFilter('all');
                            setStatusFilter('pending');
                        }}
                    />

                    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-y border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Report Info</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Content</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <GenericTableSkeleton rowCount={8} columnCount={6} />
                                    ) : filteredReports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12">
                                                <EmptyState
                                                    icon={Flag}
                                                    title="Clear inbox!"
                                                    description="No reports found matching your criteria."
                                                    variant="filtered"
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReports.map((report) => (
                                            <motion.tr
                                                key={report._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${report.type === 'livestream' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                                            {report.type === 'livestream' ? <Radio className="w-4 h-4 text-red-600" /> : <Video className="w-4 h-4 text-blue-600" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{report.type === 'livestream' ? 'Livestream' : 'Video'}</p>
                                                            <p className="text-xs text-gray-500">By {report.reporterName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[200px]">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{report.targetTitle}</p>
                                                        {report.creatorName && <p className="text-xs text-gray-500">Creator: {report.creatorName}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[250px]">
                                                        <p className="text-sm text-gray-900 font-medium">{report.reason}</p>
                                                        {report.description && <p className="text-xs text-gray-500 line-clamp-1">{report.description}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(report.status)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedReport(report)}
                                                        className="hover:bg-[#F23E2E]/10 hover:text-[#F23E2E]"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Review
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="pt-2">
                    <ModerationSettings sessionToken={sessionToken || undefined} />
                </TabsContent>
            </Tabs>

            {/* Review Dialog */}
            <Dialog open={!!selectedReport} onOpenChange={(open: boolean) => !open && setSelectedReport(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Review Report
                        </DialogTitle>
                        <DialogDescription>
                            Review the details and take appropriate action on this content.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                                    {getStatusBadge(selectedReport.status)}
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reason</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedReport.reason}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Resolution Notes</Label>
                                <Textarea
                                    placeholder="Enter internal notes for this resolution..."
                                    value={resolutionNotes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolutionNotes(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase">Safety Actions</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleModerateCreator('flagged')}
                                    >
                                        <Flag className="w-4 h-4 mr-2" />
                                        Flag Creator
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => handleModerateCreator('suspended')}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Suspend Creator
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 w-full justify-between">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedReport(null)}
                                disabled={isResolving}
                            >
                                Cancel
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => handleResolve('dismissed')}
                                    disabled={isResolving}
                                >
                                    Dismiss Report
                                </Button>
                                <Button
                                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                                    onClick={() => handleResolve('resolved')}
                                    disabled={isResolving}
                                >
                                    {isResolving ? "Resolving..." : "Mark as Resolved"}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
