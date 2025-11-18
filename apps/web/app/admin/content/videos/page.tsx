"use client";

import { EmptyState } from '@/components/admin/empty-state';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { StatusBadge } from '@/components/admin/content/StatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Flag,
  CheckCircle,
  Clock,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface VideoPost {
  _id: Id<"videoPosts">;
  _creationTime: number;
  creatorId: Id<"users">;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  fileSize: number;
  resolution: {
    width: number;
    height: number;
  };
  tags: string[];
  cuisine?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived" | "flagged" | "removed";
  visibility: "public" | "followers" | "private";
  isLive?: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  creator: {
    _id: Id<"users">;
    name: string;
    avatar?: string;
    roles?: string[];
  };
}

export default function VideosManagementPage() {
  const { user: adminUser, sessionToken } = useAdminUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<Id<"videoPosts"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; videoId: Id<"videoPosts"> | null }>({
    isOpen: false,
    videoId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    cuisine: '',
    difficulty: 'beginner' as const,
    visibility: 'public' as const,
    tagInput: '',
  });

  // Fetch all videos using admin query
  const videoData = useQuery(
    api.queries.videoPosts.getAllVideosForAdmin,
    sessionToken ? { limit: 1000 } : "skip"
  );
  
  const allVideos = videoData?.videos || [];

  // Mutations
  const updateVideo = useMutation(api.mutations.videoPosts.updateVideoPost);
  const publishVideo = useMutation(api.mutations.videoPosts.publishVideoPost);
  const deleteVideo = useMutation(api.mutations.videoPosts.deleteVideoPost);
  const flagVideo = useMutation(api.mutations.videoPosts.flagVideo);

  // Get unique cuisines for filter
  const cuisines = useMemo(() => {
    const uniqueCuisines = new Set<string>();
    allVideos.forEach((video: VideoPost) => {
      if (video.cuisine) uniqueCuisines.add(video.cuisine);
    });
    return Array.from(uniqueCuisines).sort();
  }, [allVideos]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    let filtered = [...allVideos];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((video: VideoPost) =>
        video.title.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        video.creator.name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((video: VideoPost) => video.status === statusFilter);
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter((video: VideoPost) => video.visibility === visibilityFilter);
    }

    // Cuisine filter
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter((video: VideoPost) => video.cuisine === cuisineFilter);
    }

    // Sort
    filtered.sort((a: VideoPost, b: VideoPost) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'views':
          return b.viewsCount - a.viewsCount;
        case 'likes':
          return b.likesCount - a.likesCount;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [allVideos, searchTerm, statusFilter, visibilityFilter, cuisineFilter, sortBy]);

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
        { value: 'flagged', label: 'Flagged' },
        { value: 'removed', label: 'Removed' },
      ],
    },
    {
      key: 'visibility',
      label: 'Visibility',
      value: visibilityFilter,
      onChange: setVisibilityFilter,
      options: [
        { value: 'all', label: 'All Visibility' },
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Followers' },
        { value: 'private', label: 'Private' },
      ],
    },
    {
      key: 'cuisine',
      label: 'Cuisine',
      value: cuisineFilter,
      onChange: setCuisineFilter,
      options: [
        { value: 'all', label: 'All Cuisines' },
        ...cuisines.map(c => ({ value: c, label: c })),
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
        { value: 'views', label: 'Most Views' },
        { value: 'likes', label: 'Most Likes' },
        { value: 'title', label: 'Title A-Z' },
      ],
    },
  ];

  const handleCreateNew = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      description: '',
      tags: [],
      cuisine: '',
      difficulty: 'beginner',
      visibility: 'public',
      tagInput: '',
    });
  };

  const handleEdit = (video: VideoPost) => {
    setIsEditing(video._id);
    setFormData({
      title: video.title,
      description: video.description || '',
      tags: video.tags,
      cuisine: video.cuisine || '',
      difficulty: video.difficulty || 'beginner',
      visibility: video.visibility,
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
        await updateVideo({
          videoId: isEditing,
          title: formData.title,
          description: formData.description || undefined,
          tags: formData.tags,
          cuisine: formData.cuisine || undefined,
          difficulty: formData.difficulty,
          visibility: formData.visibility,
        });
        toast({
          title: "Success",
          description: "Video updated successfully!",
          variant: "default",
        });
      } else {
        // For creating, we'd need video upload - this is a placeholder
        toast({
          title: "Info",
          description: "Video creation requires file upload. Use the upload interface.",
          variant: "default",
        });
      }
      setIsCreating(false);
      setIsEditing(null);
      setError(null);
      setSuccess('Video saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save video');
      toast({
        title: "Error",
        description: err.message || "Failed to save video",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (videoId: Id<"videoPosts">) => {
    try {
      await publishVideo({ videoId });
      toast({
        title: "Success",
        description: "Video published successfully!",
        variant: "default",
      });
      setSuccess('Video published successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to publish video');
      toast({
        title: "Error",
        description: err.message || "Failed to publish video",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (videoId: Id<"videoPosts">) => {
    setDeleteConfirm({ isOpen: true, videoId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.videoId) return;
    try {
      await deleteVideo({ videoId: deleteConfirm.videoId });
      toast({
        title: "Success",
        description: "Video deleted successfully!",
        variant: "default",
      });
      setDeleteConfirm({ isOpen: false, videoId: null });
      setSuccess('Video deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete video');
      toast({
        title: "Error",
        description: err.message || "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const handleFlag = async (videoId: Id<"videoPosts">) => {
    try {
      await flagVideo({ videoId });
      toast({
        title: "Success",
        description: "Video flagged for review",
        variant: "default",
      });
      setSuccess('Video flagged successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to flag video');
      toast({
        title: "Error",
        description: err.message || "Failed to flag video",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Stats
  const stats = useMemo(() => {
    const total = allVideos.length;
    const published = allVideos.filter((v: VideoPost) => v.status === 'published').length;
    const draft = allVideos.filter((v: VideoPost) => v.status === 'draft').length;
    const flagged = allVideos.filter((v: VideoPost) => v.status === 'flagged').length;
    return { total, published, draft, flagged };
  }, [allVideos]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Videos (Nosh Heaven)</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage video posts and content</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Video
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Videos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-gray-900">{stats.flagged}</p>
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
        searchPlaceholder="Search videos by title, description, tags, or creator..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setVisibilityFilter('all');
          setCuisineFilter('all');
          setSortBy('recent');
        }}
      />

      {/* Videos List */}
      {filteredVideos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No videos found"
          description={searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all' || cuisineFilter !== 'all'
            ? "Try adjusting your filters to see more results"
            : "Get started by creating your first video post"}
          action={!searchTerm && statusFilter === 'all' && visibilityFilter === 'all' && cuisineFilter === 'all' ? {
            label: "Create Video",
            onClick: handleCreateNew,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video: VideoPost) => (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={video.status} />
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                )}
                
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {video.creator.name}
                  </Badge>
                  {video.cuisine && (
                    <Badge variant="outline" className="text-xs">
                      {video.cuisine}
                    </Badge>
                  )}
                  {video.difficulty && (
                    <Badge variant="outline" className="text-xs">
                      {video.difficulty}
                    </Badge>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {video.viewsCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {video.likesCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {video.commentsCount}
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-3 h-3" />
                    {video.sharesCount}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(video)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  {video.status !== 'published' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePublish(video._id)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Publish
                    </Button>
                  )}
                  {video.status !== 'flagged' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFlag(video._id)}
                    >
                      <Flag className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(video._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || isEditing !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setIsEditing(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Video' : 'Create New Video'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update video details' : 'Add a new video post to Nosh Heaven'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter video title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter video description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  placeholder="e.g., Italian, Thai"
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
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
                setIsCreating(false);
                setIsEditing(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, videoId: null })}
        onConfirm={confirmDelete}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </div>
  );
}

