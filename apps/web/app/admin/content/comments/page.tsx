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
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  MessageCircle,
  Trash2,
  Eye,
  Flag,
  CheckCircle,
  Clock,
  User,
  Video,
  Radio,
  FileText,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import Image from 'next/image';

interface Comment {
  _id: string;
  _creationTime: number;
  type: "video" | "live" | "content";
  content: string;
  userId: Id<"users">;
  user: {
    _id: Id<"users">;
    name: string;
    avatar?: string;
  } | null;
  parentCommentId?: string;
  likesCount?: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  entityId: Id<"videoPosts"> | Id<"liveSessions"> | Id<"content">;
  video?: {
    _id: Id<"videoPosts">;
    title: string;
    thumbnailUrl?: string;
  } | null;
  session?: {
    _id: Id<"liveSessions">;
    title: string;
    thumbnailUrl?: string;
  } | null;
  contentItem?: {
    _id: Id<"content">;
    title: string;
    type: string;
  } | null;
  commentType?: string; // For live comments
}

export default function CommentsManagementPage() {
  const { user: adminUser, sessionToken } = useAdminUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; commentId: string | null; commentType: "video" | "live" | "content" | null }>({
    isOpen: false,
    commentId: null,
    commentType: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all comments
  const commentsData = useQuery(
    api.queries.comments.getAllCommentsForAdmin,
    sessionToken ? { limit: 1000 } : "skip"
  );
  
  const allComments = (commentsData || []) as Comment[];

  // Mutations
  const deleteComment = useMutation(api.mutations.comments.adminDeleteComment);
  const updateCommentStatus = useMutation(api.mutations.comments.adminUpdateCommentStatus);

  // Filter comments
  const filteredComments = useMemo(() => {
    let filtered = [...allComments];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((comment: Comment) =>
        comment.content.toLowerCase().includes(searchLower) ||
        comment.user?.name.toLowerCase().includes(searchLower) ||
        comment.video?.title.toLowerCase().includes(searchLower) ||
        comment.session?.title.toLowerCase().includes(searchLower) ||
        comment.contentItem?.title.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((comment: Comment) => comment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((comment: Comment) => comment.type === typeFilter);
    }

    // Sort
    filtered.sort((a: Comment, b: Comment) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'likes':
          return (b.likesCount || 0) - (a.likesCount || 0);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }, [allComments, searchTerm, statusFilter, typeFilter, sortBy]);

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'deleted', label: 'Deleted' },
        { value: 'flagged', label: 'Flagged' },
        { value: 'hidden', label: 'Hidden' },
        { value: 'muted', label: 'Muted' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'video', label: 'Video Comments' },
        { value: 'live', label: 'Live Comments' },
        { value: 'content', label: 'Content Comments' },
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
        { value: 'likes', label: 'Most Likes' },
      ],
    },
  ];

  const handleDelete = async (commentId: string, commentType: "video" | "live" | "content") => {
    setDeleteConfirm({ isOpen: true, commentId, commentType });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.commentId || !deleteConfirm.commentType) return;
    try {
      await deleteComment({
        commentId: deleteConfirm.commentId,
        commentType: deleteConfirm.commentType,
        sessionToken,
      });
      toast({
        title: "Success",
        description: "Comment deleted successfully!",
        variant: "default",
      });
      setDeleteConfirm({ isOpen: false, commentId: null, commentType: null });
      setSuccess('Comment deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment');
      toast({
        title: "Error",
        description: err.message || "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const handleFlag = async (commentId: string, commentType: "video" | "live" | "content") => {
    try {
      await updateCommentStatus({
        commentId,
        commentType,
        status: "flagged",
        sessionToken,
      });
      toast({
        title: "Success",
        description: "Comment flagged successfully!",
        variant: "default",
      });
      setSuccess('Comment flagged successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to flag comment');
      toast({
        title: "Error",
        description: err.message || "Failed to flag comment",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (commentId: string, commentType: "video" | "live" | "content") => {
    try {
      await updateCommentStatus({
        commentId,
        commentType,
        status: "active",
        sessionToken,
      });
      toast({
        title: "Success",
        description: "Comment restored successfully!",
        variant: "default",
      });
      setSuccess('Comment restored successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to restore comment');
      toast({
        title: "Error",
        description: err.message || "Failed to restore comment",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'live':
        return Radio;
      case 'content':
        return FileText;
      default:
        return MessageCircle;
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = allComments.length;
    const active = allComments.filter((c: Comment) => c.status === 'active').length;
    const deleted = allComments.filter((c: Comment) => c.status === 'deleted').length;
    const flagged = allComments.filter((c: Comment) => c.status === 'flagged').length;
    const video = allComments.filter((c: Comment) => c.type === 'video').length;
    const live = allComments.filter((c: Comment) => c.type === 'live').length;
    const content = allComments.filter((c: Comment) => c.type === 'content').length;
    return { total, active, deleted, flagged, video, live, content };
  }, [allComments]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Comments</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage all comments across the platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Comments</p>
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
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
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
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Deleted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Video Comments</p>
                <p className="text-xl font-bold text-gray-900">{stats.video}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Live Comments</p>
                <p className="text-xl font-bold text-gray-900">{stats.live}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Content Comments</p>
                <p className="text-xl font-bold text-gray-900">{stats.content}</p>
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
        searchPlaceholder="Search comments by content, user, or associated content..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setTypeFilter('all');
          setSortBy('recent');
        }}
      />

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No comments found"
          description={searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
            ? "Try adjusting your filters to see more results"
            : "No comments have been created yet"}
        />
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment: Comment) => {
            const TypeIcon = getTypeIcon(comment.type);
            return (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {comment.user?.avatar ? (
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {comment.user?.name || 'Unknown User'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {comment.type}
                        </Badge>
                        <StatusBadge status={comment.status} />
                        {comment.parentCommentId && (
                          <Badge variant="secondary" className="text-xs">
                            Reply
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-3">{comment.content}</p>

                    {/* Associated Content */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {comment.video && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          {comment.video.title}
                        </Badge>
                      )}
                      {comment.session && (
                        <Badge variant="outline" className="text-xs">
                          <Radio className="w-3 h-3 mr-1" />
                          {comment.session.title}
                        </Badge>
                      )}
                      {comment.contentItem && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          {comment.contentItem.title} ({comment.contentItem.type})
                        </Badge>
                      )}
                      {comment.likesCount !== undefined && comment.likesCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {comment.likesCount} likes
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {comment.status !== 'deleted' && (
                        <>
                          {comment.status !== 'flagged' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFlag(comment._id, comment.type)}
                            >
                              <Flag className="w-3 h-3 mr-1" />
                              Flag
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(comment._id, comment.type)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      {comment.status === 'deleted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(comment._id, comment.type)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, commentId: null, commentType: null })}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </div>
  );
}

