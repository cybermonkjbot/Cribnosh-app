"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge, StatusBadge } from '@/components/ui/glass-badges';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  BarChart2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Edit,
  Eye,
  Filter,
  MapPin,
  Phone,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

type WaitlistEntry = Doc<"waitlist">;

export default function WaitlistDetailsPage() {
  // Waitlist details page component
  const { sessionToken } = useAdminUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  
  // Loading states
  const [isApproving, setIsApproving] = useState<Id<"waitlist"> | null>(null);
  const [isRejecting, setIsRejecting] = useState<Id<"waitlist"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"waitlist"> | null>(null);
  
  // Confirmation dialogs
  const [approveConfirm, setApproveConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });
  const [rejectConfirm, setRejectConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: Id<"waitlist"> | null }>({
    isOpen: false,
    entryId: null,
  });

  // Fetch data
  const waitlistEntries = useQuery(
    api.queries.waitlist.getWaitlistEntries,
    sessionToken ? { sessionToken } : "skip"
  );
  const waitlistStats = useQuery(api.queries.analytics.getWaitlistStats, {});

  // Mutations
  const deleteWaitlistEntry = useMutation(api.mutations.waitlist.deleteWaitlistEntry);
  const approveWaitlistEntry = useMutation(api.mutations.waitlist.approveWaitlistEntry);
  const rejectWaitlistEntry = useMutation(api.mutations.waitlist.rejectWaitlistEntry);


  const handleApprove = async (entryId: Id<"waitlist">) => {
    setIsApproving(entryId);
    try {
      await approveWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry approved",
        description: "The waitlist entry has been approved successfully.",
        variant: "success",
      });
      setApproveConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to approve entry",
        description: "An error occurred while approving the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async (entryId: Id<"waitlist">) => {
    setIsRejecting(entryId);
    try {
      await rejectWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry rejected",
        description: "The waitlist entry has been rejected successfully.",
        variant: "success",
      });
      setRejectConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to reject entry",
        description: "An error occurred while rejecting the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(null);
    }
  };

  const handleDelete = async (entryId: Id<"waitlist">) => {
    setIsDeleting(entryId);
    try {
      await deleteWaitlistEntry({ entryId, sessionToken: sessionToken || undefined });
      toast({
        title: "Entry deleted",
        description: "The waitlist entry has been deleted successfully.",
        variant: "success",
      });
      setDeleteConfirm({ isOpen: false, entryId: null });
    } catch (error) {
      toast({
        title: "Failed to delete entry",
        description: "An error occurred while deleting the entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Helper function to extract location string from entry
  const getLocationString = useCallback((entry: WaitlistEntry): string => {
    if (typeof entry.location === 'string') {
      return entry.location;
    }
    if (entry.location && typeof entry.location === 'object') {
      const loc = entry.location as any;
      if (loc.city && loc.country) {
        return `${loc.city}, ${loc.country}`;
      }
      if (loc.city) return loc.city;
      if (loc.country) return loc.country;
      if (loc.country_name) return loc.country_name;
    }
    return '';
  }, []);

  const filteredEntries = useMemo(() => {
    if (!waitlistEntries) return [];
    
    return waitlistEntries.filter((entry: WaitlistEntry) => {
      const locationString = getLocationString(entry);
      const matchesSearch = 
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        locationString.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
      const matchesLocation = locationFilter === 'all' || locationString === locationFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesLocation;
    }).sort((a: WaitlistEntry, b: WaitlistEntry) => {
    switch (sortBy) {
      case 'recent':
        return (b.joinedAt || 0) - (a.joinedAt || 0);
      case 'oldest':
        return (a.joinedAt || 0) - (b.joinedAt || 0);
      case 'name':
        return (a.name || a.email).localeCompare(b.name || b.email);
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'priority':
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1, normal: 1 };
        return (priorityOrder[b.priority || 'normal'] || 1) - (priorityOrder[a.priority || 'normal'] || 1);
      default:
        return 0;
    }
    });
  }, [waitlistEntries, searchTerm, statusFilter, priorityFilter, locationFilter, getLocationString, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEntries.slice(startIndex, endIndex);
  }, [filteredEntries, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, locationFilter]);

  const uniqueLocations = useMemo(() => {
    if (!waitlistEntries) return [];
    const locations = new Set<string>();
    waitlistEntries.forEach((entry: WaitlistEntry) => {
      const locationString = getLocationString(entry);
      if (locationString) {
        locations.add(locationString);
      }
    });
    return Array.from(locations).sort();
  }, [waitlistEntries, getLocationString]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setLocationFilter('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || locationFilter !== 'all';
  }, [searchTerm, statusFilter, priorityFilter, locationFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Waitlist Details</h1>
          <p className="text-gray-600 font-satoshi mt-2">Detailed view of waitlist entries and analytics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{waitlistStats?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{waitlistStats?.pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-gray-900">{waitlistStats?.converted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{waitlistStats?.conversionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              placeholder="Search waitlist entries..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {(uniqueLocations as string[]).map((location: string) => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Waitlist Entries */}
      <div className="space-y-4">
        {paginatedEntries.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No waitlist entries found"
            description={hasActiveFilters 
              ? "Try adjusting your search or filter criteria"
              : "No waitlist entries available"}
            action={hasActiveFilters ? {
              label: "Clear filters",
              onClick: handleClearFilters,
              variant: "secondary"
            } : undefined}
            variant={hasActiveFilters ? "filtered" : "no-data"}
          />
        ) : (
          <>
            {paginatedEntries.map((entry: WaitlistEntry) => (
          <Card key={entry._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                    <span className="text-[#F23E2E] font-bold">
                      {(entry.name || entry.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {entry.name || 'No Name'}
                    </h4>
                    <p className="text-sm text-gray-600">{entry.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.status || 'active'} />
                  <PriorityBadge priority={entry.priority || 'normal'} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(entry.joinedAt).toLocaleDateString()}
                  </div>
                  {getLocationString(entry) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {getLocationString(entry)}
                    </div>
                  )}
                  {entry.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {entry.phone}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-600">Source: </span>
                    <Badge variant="outline" className="text-xs">{entry.source}</Badge>
                  </div>
                  {entry.referralCode && (
                    <div className="text-sm text-gray-600">
                      Referral: {entry.referralCode}
                    </div>
                  )}
                  {entry.referrer && (
                    <div className="text-sm text-gray-600">
                      Referred by: {entry.referrer}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Additional entry details can be added here */}
                </div>
              </div>

              {entry.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{entry.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/waitlist/${entry._id}`);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/waitlist/${entry._id}?edit=true`);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="flex gap-2">
                  {entry.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setApproveConfirm({ isOpen: true, entryId: entry._id });
                        }}
                        disabled={isApproving === entry._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {isApproving === entry._id ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRejectConfirm({ isOpen: true, entryId: entry._id });
                        }}
                        disabled={isRejecting === entry._id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {isRejecting === entry._id ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm({ isOpen: true, entryId: entry._id });
                    }}
                    disabled={isDeleting === entry._id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting === entry._id ? 'Deleting...' : ''}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 font-satoshi">
                Page {currentPage} of {totalPages} ({filteredEntries.length} entries)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[36px]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[36px]"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Analytics Section */}
      {waitlistStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F23E2E]" />
                Top Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {waitlistStats.topLocations.map((location: { location: string; count: number }) => (
                  <div key={location.location} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{location.location}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(location.count / waitlistStats.total) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{location.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#F23E2E]" />
                Top Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {waitlistStats.topSources.map((source: { source: string; count: number }) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{source.source}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(source.count / waitlistStats.total) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium">{source.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, entryId: null })}
        onConfirm={() => approveConfirm.entryId && handleApprove(approveConfirm.entryId)}
        title="Approve Entry"
        message="Are you sure you want to approve this waitlist entry?"
        confirmText="Approve"
        cancelText="Cancel"
        type="info"
        isLoading={isApproving !== null}
      />

      <ConfirmationDialog
        isOpen={rejectConfirm.isOpen}
        onClose={() => setRejectConfirm({ isOpen: false, entryId: null })}
        onConfirm={() => rejectConfirm.entryId && handleReject(rejectConfirm.entryId)}
        title="Reject Entry"
        message="Are you sure you want to reject this waitlist entry? This action cannot be undone."
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
        isLoading={isRejecting !== null}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, entryId: null })}
        onConfirm={() => deleteConfirm.entryId && handleDelete(deleteConfirm.entryId)}
        title="Delete Entry"
        message="Are you sure you want to delete this waitlist entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        isLoading={isDeleting !== null}
      />
    </div>
  );
}
