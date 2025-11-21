"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { StatusBadge } from '@/components/admin/content/StatusBadge';
import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  Radio,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  MessageCircle,
  Heart,
  Clock,
  MapPin,
  X,
  CheckCircle,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface LiveSession {
  _id: Id<"liveSessions">;
  _creationTime: number;
  session_id: string;
  chef_id: Id<"chefs">;
  title: string;
  description?: string;
  status: 'scheduled' | 'starting' | 'live' | 'ended' | 'cancelled';
  scheduled_start_time: number;
  actual_start_time?: number;
  endedAt?: number;
  endReason?: string;
  thumbnailUrl?: string;
  tags?: string[];
  location?: {
    city: string;
    coordinates: number[];
    address?: string;
    radius?: number;
  };
  viewerCount: number;
  maxViewers: number;
  currentViewers: number;
  chatEnabled: boolean;
  totalComments?: number;
  totalReactions?: number;
  sessionStats: {
    totalViewers: number;
    peakViewers: number;
    averageWatchTime: number;
    totalTips: number;
    totalOrders: number;
  };
  chef?: {
    _id: Id<"chefs">;
    name?: string;
    bio?: string;
    specialties?: string[];
    rating?: number;
    profileImage?: string | null;
  };
}

export default function LiveSessionsManagementPage() {
  const { user: adminUser, sessionToken } = useAdminUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isEditing, setIsEditing] = useState<Id<"liveSessions"> | null>(null);
  const [endConfirm, setEndConfirm] = useState<{ isOpen: boolean; sessionId: Id<"liveSessions"> | null }>({
    isOpen: false,
    sessionId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    maxViewers: 1000,
    tagInput: '',
  });

  // Fetch all live sessions
  const sessionsData = useQuery(
    api.queries.liveSessions.getAllForAdmin,
    sessionToken ? { limit: 1000 } : "skip"
  );
  
  const allSessions = (sessionsData || []) as LiveSession[];

  // Mutations
  const endLiveSession = useMutation(api.mutations.liveSessions.endLiveSession);
  const updateSessionSettings = useMutation(api.mutations.liveSessions.updateSessionSettings);
  const toggleChat = useMutation(api.mutations.liveSessions.toggleChat);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...allSessions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((session: LiveSession) =>
        session.title.toLowerCase().includes(searchLower) ||
        session.description?.toLowerCase().includes(searchLower) ||
        session.session_id.toLowerCase().includes(searchLower) ||
        session.chef?.name?.toLowerCase().includes(searchLower) ||
        session.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((session: LiveSession) => session.status === statusFilter);
    }

    // Sort
    filtered.sort((a: LiveSession, b: LiveSession) => {
      switch (sortBy) {
        case 'recent':
          return b._creationTime - a._creationTime;
        case 'oldest':
          return a._creationTime - b._creationTime;
        case 'viewers':
          return b.currentViewers - a.currentViewers;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return b._creationTime - a._creationTime;
      }
    });

    return filtered;
  }, [allSessions, searchTerm, statusFilter, sortBy]);

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'live', label: 'Live' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'starting', label: 'Starting' },
        { value: 'ended', label: 'Ended' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      key: 'sort',
      label: 'Sort By',
      value: sortBy,
      onChange: setSortBy,
      options: [
        { value: 'recent', label: 'Most Recent' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'viewers', label: 'Most Viewers' },
        { value: 'title', label: 'Title A-Z' },
      ],
    },
  ];

  const handleEdit = (session: LiveSession) => {
    setIsEditing(session._id);
    setFormData({
      title: session.title,
      description: session.description || '',
      tags: session.tags || [],
      maxViewers: session.maxViewers,
      tagInput: '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      if (isEditing) {
        await updateSessionSettings({
          sessionId: isEditing,
          settings: {
            title: formData.title,
            description: formData.description || undefined,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            maxViewers: formData.maxViewers,
          },
        });
        toast({
          title: "Success",
          description: "Session updated successfully!",
          variant: "default",
        });
        setIsEditing(null);
        setError(null);
        setSuccess('Session updated successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update session');
      toast({
        title: "Error",
        description: err.message || "Failed to update session",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async (sessionId: Id<"liveSessions">) => {
    setEndConfirm({ isOpen: true, sessionId });
  };

  const confirmEndSession = async () => {
    if (!endConfirm.sessionId) return;
    try {
      await endLiveSession({ 
        sessionId: endConfirm.sessionId,
        reason: 'Admin ended session',
      });
      toast({
        title: "Success",
        description: "Live session ended successfully!",
        variant: "default",
      });
      setEndConfirm({ isOpen: false, sessionId: null });
      setSuccess('Session ended successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
      toast({
        title: "Error",
        description: err.message || "Failed to end session",
        variant: "destructive",
      });
    }
  };

  const handleToggleChat = async (sessionId: Id<"liveSessions">, enabled: boolean) => {
    try {
      await toggleChat({ sessionId, enabled });
      toast({
        title: "Success",
        description: `Chat ${enabled ? 'enabled' : 'disabled'} successfully!`,
        variant: "default",
      });
      setSuccess(`Chat ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle chat');
      toast({
        title: "Error",
        description: err.message || "Failed to toggle chat",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Stats
  const stats = useMemo(() => {
    const total = allSessions.length;
    const live = allSessions.filter((s: LiveSession) => s.status === 'live').length;
    const scheduled = allSessions.filter((s: LiveSession) => s.status === 'scheduled').length;
    const ended = allSessions.filter((s: LiveSession) => s.status === 'ended').length;
    const totalViewers = allSessions.reduce((sum: number, s: LiveSession) => sum + s.currentViewers, 0);
    return { total, live, scheduled, ended, totalViewers };
  }, [allSessions]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Live Sessions</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage live cooking sessions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Radio className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Live Now</p>
                <p className="text-2xl font-bold text-gray-900">{stats.live}</p>
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
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ended</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Viewers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViewers}</p>
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
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <AdminFilterBar
        searchPlaceholder="Search sessions by title, description, chef, or tags..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setSortBy('recent');
        }}
      />

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No live sessions found"
          description={searchTerm || statusFilter !== 'all'
            ? "Try adjusting your filters to see more results"
            : "No live sessions have been created yet"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session: LiveSession) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {session.thumbnailUrl || session.chef?.profileImage ? (
                  <Image
                    src={session.thumbnailUrl || session.chef?.profileImage || ''}
                    alt={session.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={session.status} />
                </div>
                {session.status === 'live' && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{session.title}</h3>
                {session.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{session.description}</p>
                )}
                
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {session.chef?.name && (
                    <Badge variant="outline" className="text-xs">
                      {session.chef.name}
                    </Badge>
                  )}
                  {session.location?.city && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {session.location.city}
                    </Badge>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {session.currentViewers}/{session.maxViewers}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {session.totalComments || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {session.totalReactions || 0}
                  </div>
                  {session.actual_start_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.actual_start_time, session.endedAt)}
                    </div>
                  )}
                </div>

                {/* Session Info */}
                <div className="text-xs text-gray-500 mb-3">
                  {session.actual_start_time ? (
                    <p>Started: {formatDate(session.actual_start_time)}</p>
                  ) : (
                    <p>Scheduled: {formatDate(session.scheduled_start_time)}</p>
                  )}
                  {session.endedAt && (
                    <p>Ended: {formatDate(session.endedAt)}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(session)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  {session.status === 'live' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleChat(session._id, !session.chatEnabled)}
                      >
                        {session.chatEnabled ? 'Disable Chat' : 'Enable Chat'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndSession(session._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        End
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing !== null} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Live Session</DialogTitle>
            <DialogDescription>
              Update session details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter session title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter session description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="maxViewers">Max Viewers</Label>
              <Input
                id="maxViewers"
                type="number"
                min="1"
                value={formData.maxViewers}
                onChange={(e) => setFormData({ ...formData, maxViewers: parseInt(e.target.value) || 1000 })}
                placeholder="1000"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="tags"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Confirmation */}
      <ConfirmationDialog
        isOpen={endConfirm.isOpen}
        onClose={() => setEndConfirm({ isOpen: false, sessionId: null })}
        onConfirm={confirmEndSession}
        title="End Live Session"
        message="Are you sure you want to end this live session? This action cannot be undone."
        confirmText="End Session"
        type="error"
      />
    </div>
  );
}

