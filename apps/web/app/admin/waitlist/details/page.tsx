"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardList, 
  Search, 
  Filter,
  Users,
  Calendar,
  MapPin,
  Phone,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';
import { useAdminUser } from '@/app/admin/AdminUserProvider';

type WaitlistEntry = Doc<"waitlist">;

export default function WaitlistDetailsPage() {
  // Waitlist details page component
  const { sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    try {
      await approveWaitlistEntry({ entryId });
      setSuccess('Entry approved successfully');
      setError(null);
    } catch {
      setError('Failed to approve entry');
    }
  };

  const handleReject = async (entryId: Id<"waitlist">) => {
    try {
      await rejectWaitlistEntry({ entryId });
      setSuccess('Entry rejected successfully');
      setError(null);
    } catch {
      setError('Failed to reject entry');
    }
  };

  const handleDelete = async (entryId: Id<"waitlist">) => {
    if (confirm('Are you sure you want to delete this waitlist entry?')) {
      try {
        await deleteWaitlistEntry({ entryId });
        setSuccess('Entry deleted successfully');
        setError(null);
      } catch {
        setError('Failed to delete entry');
      }
    }
  };

  const filteredEntries = waitlistEntries?.filter((entry: WaitlistEntry) => {
    const matchesSearch = 
      entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.location && entry.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || entry.priority === priorityFilter;
    const matchesLocation = locationFilter === 'all' || entry.location === locationFilter;
    
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
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'converted':
        return <Badge className="bg-blue-100 text-blue-800">Converted</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const uniqueLocations = Array.from(new Set(waitlistEntries?.map((entry: WaitlistEntry) => entry.location).filter(Boolean) || []));

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

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search waitlist entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
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

      {/* Waitlist Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry: WaitlistEntry) => (
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
                  {getStatusBadge(entry.status || 'active')}
                  {getPriorityBadge(entry.priority || 'normal')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(entry.joinedAt).toLocaleDateString()}
                  </div>
                  {entry.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {entry.location}
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
                    onClick={() => {/* View details */}}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* Edit entry */}}
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
                        onClick={() => handleApprove(entry._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(entry._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(entry._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No waitlist entries found"
          description="Try adjusting your search or filter criteria"
          action={searchTerm || statusFilter !== 'all' || locationFilter !== 'all' || priorityFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
              setLocationFilter('all');
              setPriorityFilter('all');
            },
            variant: "secondary"
          } : undefined}
          variant="filtered"
        />
      )}

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
    </div>
  );
}
