"use client";

export const dynamic = "force-dynamic";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  Archive,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Globe,
  Image,
  MoreHorizontal,
  Plus,
  Rocket,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import ImageNext from 'next/image';
import { useMemo, useState } from 'react';

interface Story {
  _id: Id<"content">;
  title: string;
  type: 'story';
  status: 'draft' | 'published' | 'archived';
  author: string;
  lastModified: number;
  publishDate?: number;
  thumbnail?: string;
  content: string;
  metadata?: {
    description?: string;
    tags?: string[];
    readTime?: number;
  };
}

export default function StoriesManagementPage() {
  const { user: adminUser, sessionToken } = useAdminUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<Id<"content"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; storyId: Id<"content"> | null }>({
    isOpen: false,
    storyId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    status: "draft" | "published" | "archived";
    author: string;
    thumbnail: string;
    metadata: {
      description: string;
      tags: string[];
      readTime: number;
    };
    tagInput: string;
  }>({
    title: '',
    content: '',
    status: 'draft',
    author: '',
    thumbnail: '',
    metadata: {
      description: '',
      tags: [],
      readTime: 0,
    },
    tagInput: '',
  });

  // Fetch all content items and filter for stories
  const contentItems = useQuery(
    api.queries.admin.getContentItems,
    sessionToken ? { sessionToken } : "skip"
  ) as Story[] | undefined;

  const allStories = useMemo(() => {
    return (contentItems || []).filter(item => item.type === 'story') as Story[];
  }, [contentItems]);

  // Mutations
  const createContent = useMutation(api.mutations.admin.createContent);
  const updateContent = useMutation(api.mutations.admin.updateContent);
  const deleteContent = useMutation(api.mutations.admin.deleteContent);
  const publishContent = useMutation(api.mutations.admin.publishContent);
  const archiveContent = useMutation(api.mutations.admin.archiveContent);

  // Filter stories
  const filteredStories = useMemo(() => {
    let filtered = [...allStories];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((story: Story) =>
        story.title.toLowerCase().includes(searchLower) ||
        story.content?.toLowerCase().includes(searchLower) ||
        story.metadata?.description?.toLowerCase().includes(searchLower) ||
        story.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        story.author.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((story: Story) => story.status === statusFilter);
    }

    // Sort
    filtered.sort((a: Story, b: Story) => {
      switch (sortBy) {
        case 'recent':
          return b.lastModified - a.lastModified;
        case 'oldest':
          return a.lastModified - b.lastModified;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        default:
          return b.lastModified - a.lastModified;
      }
    });

    return filtered;
  }, [allStories, searchTerm, statusFilter, sortBy]);

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
        { value: 'title', label: 'Title A-Z' },
        { value: 'author', label: 'Author A-Z' },
      ],
    },
  ];

  const handleCreateNew = () => {
    setIsCreating(true);
    setFormData({
      title: '',
      content: '',
      status: 'draft',
      author: adminUser?.name || '',
      thumbnail: '',
      metadata: {
        description: '',
        tags: [],
        readTime: 0,
      },
      tagInput: '',
    });
  };

  const handleEdit = (story: Story) => {
    setIsEditing(story._id);
    setFormData({
      title: story.title,
      content: story.content,
      status: story.status,
      author: story.author,
      thumbnail: story.thumbnail || '',
      metadata: {
        description: story.metadata?.description || '',
        tags: story.metadata?.tags || [],
        readTime: story.metadata?.readTime || 0,
      },
      tagInput: '',
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      if (isEditing) {
        await updateContent({
          contentId: isEditing,
          title: formData.title,
          content: formData.content,
          status: formData.status,
          thumbnail: formData.thumbnail || undefined,
          metadata: formData.metadata,
        });
        toast({
          title: "Success",
          description: "Story updated successfully!",
          variant: "default",
        });
      } else {
        await createContent({
          title: formData.title,
          type: 'story' as const,
          content: formData.content,
          status: formData.status,
          author: formData.author,
          thumbnail: formData.thumbnail || undefined,
          metadata: formData.metadata,
        });
        toast({
          title: "Success",
          description: "Story created successfully!",
          variant: "default",
        });
      }
      setIsCreating(false);
      setIsEditing(null);
      setError(null);
      setSuccess('Story saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save story');
      toast({
        title: "Error",
        description: err.message || "Failed to save story",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async (storyId: Id<"content">) => {
    try {
      await publishContent({ contentId: storyId });
      toast({
        title: "Success",
        description: "Story published successfully!",
        variant: "default",
      });
      setSuccess('Story published successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to publish story');
      toast({
        title: "Error",
        description: err.message || "Failed to publish story",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (storyId: Id<"content">) => {
    try {
      await archiveContent({ contentId: storyId });
      toast({
        title: "Success",
        description: "Story archived successfully!",
        variant: "default",
      });
      setSuccess('Story archived successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to archive story');
      toast({
        title: "Error",
        description: err.message || "Failed to archive story",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (storyId: Id<"content">) => {
    setDeleteConfirm({ isOpen: true, storyId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.storyId) return;
    try {
      await deleteContent({ contentId: deleteConfirm.storyId });
      toast({
        title: "Success",
        description: "Story deleted successfully!",
        variant: "default",
      });
      setDeleteConfirm({ isOpen: false, storyId: null });
      setSuccess('Story deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete story');
      toast({
        title: "Error",
        description: err.message || "Failed to delete story",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.metadata.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          tags: [...formData.metadata.tags, formData.tagInput.trim()],
        },
        tagInput: '',
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      metadata: {
        ...formData.metadata,
        tags: formData.metadata.tags.filter(t => t !== tag),
      },
    });
  };

  // Stats
  const stats = useMemo(() => {
    const total = allStories.length;
    const published = allStories.filter((s: Story) => s.status === 'published').length;
    const draft = allStories.filter((s: Story) => s.status === 'draft').length;
    const archived = allStories.filter((s: Story) => s.status === 'archived').length;
    return { total, published, draft, archived };
  }, [allStories]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Stories</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage food stories and content</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Story
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stories</p>
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-900">{stats.archived}</p>
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
        searchPlaceholder="Search stories by title, content, tags, or author..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setSortBy('recent');
        }}
      />

      {/* Stories List */}
      {filteredStories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No stories found"
          description={searchTerm || statusFilter !== 'all'
            ? "Try adjusting your filters to see more results"
            : "Get started by creating your first story"}
          action={!searchTerm && statusFilter === 'all' ? {
            label: "Create Story",
            onClick: handleCreateNew,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStories.map((story: Story) => (
            <motion.div
              key={story._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {story.thumbnail ? (
                  <ImageNext
                    src={story.thumbnail}
                    alt={story.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={story.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{story.title}</h3>
                {story.metadata?.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{story.metadata.description}</p>
                )}

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {story.author}
                  </Badge>
                  {story.metadata?.readTime && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {story.metadata.readTime} min
                    </Badge>
                  )}
                </div>

                {story.metadata?.tags && story.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {story.metadata.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {story.metadata.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{story.metadata.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* View story */ }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Story Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(story)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Story
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        alert('Analytics feature coming soon');
                      }}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        window.open(`/stories/${story._id}`, '_blank');
                      }}>
                        <Globe className="w-4 h-4 mr-2" />
                        Preview Story
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {story.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublish(story._id)}>
                          <Rocket className="w-4 h-4 mr-2" />
                          Publish Story
                        </DropdownMenuItem>
                      )}
                      {story.status === 'published' && (
                        <DropdownMenuItem onClick={() => handleArchive(story._id)}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive Story
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(story._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Story
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Story' : 'Create New Story'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update story content' : 'Create a new food story'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter story title"
              />
            </div>

            <div>
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Enter author name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.metadata.description}
                onChange={(e) => setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, description: e.target.value }
                })}
                placeholder="Enter story description"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter story content"
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  min="0"
                  value={formData.metadata.readTime}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, readTime: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="Enter thumbnail image URL"
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
                {formData.metadata.tags.map((tag) => (
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
        onClose={() => setDeleteConfirm({ isOpen: false, storyId: null })}
        onConfirm={confirmDelete}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </div>
  );
}

