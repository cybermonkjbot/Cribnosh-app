"use client";

import { useStaffAuthContext } from '@/app/staff/staff-auth-context';
import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StaffBlogPage() {
  const router = useRouter();
  const { sessionToken } = useStaffAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data
  const blogPosts = useQuery(
    api.queries.blog.getBlogPosts,
    sessionToken ? {
      status: statusFilter === 'all' ? 'all' : statusFilter,
      sessionToken,
    } : "skip"
  );
  const categories = useQuery(
    api.queries.blog.getBlogCategories,
    sessionToken ? {} : "skip"
  );

  // Mutations
  const deletePost = useMutation(api.mutations.blog.deleteBlogPost);
  const publishPost = useMutation(api.mutations.blog.publishBlogPost);

  const handleDeletePost = async (postId: Id<"blogPosts">) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deletePost({ postId });
        setSuccess('Blog post deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete blog post');
      }
    }
  };

  const handlePublishPost = async (postId: Id<"blogPosts">) => {
    try {
      await publishPost({ postId });
      setSuccess('Blog post published successfully');
      setError(null);
    } catch (err) {
      setError('Failed to publish blog post');
    }
  };

  const filteredPosts = blogPosts?.filter((post: any) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || 
      (post.categories && post.categories.includes(categoryFilter));
    
    return matchesSearch && matchesCategory;
  }).sort((a: any, b: any) => {
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 transition-all duration-200 hover:shadow-sm"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case 'published':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 transition-all duration-200 hover:shadow-sm"><CheckCircle className="w-3 h-3 mr-1" />Published</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 transition-all duration-200 hover:shadow-sm"><XCircle className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="secondary" className="transition-all duration-200 hover:shadow-sm">{status}</Badge>;
    }
  };

  const uniqueCategories = Array.from(new Set(
    blogPosts?.flatMap((post: any) => post.categories || []) || []
  ));

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/staff/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/60 text-gray-700 hover:text-gray-900 hover:bg-gray-100/80 transition-colors font-satoshi text-sm font-medium shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 font-satoshi mt-2">Create and manage blog posts</p>
        </div>
        <Button
          onClick={() => router.push('/staff/blog/new')}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg transition-transform duration-200 group-hover:scale-110">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{blogPosts?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg transition-transform duration-200 group-hover:scale-110">
                <CheckCircle className="w-5 h-5 text-[#F23E2E]" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.filter((p: any) => p.status === 'published').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg transition-transform duration-200 group-hover:scale-110">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.filter((p: any) => p.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg transition-transform duration-200 group-hover:scale-110">
                <Eye className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.reduce((sum: number, post: any) => sum + (post.viewCount || 0), 0) || 0}
                </p>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none transition-colors duration-200" />
          <Input
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all duration-200"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(uniqueCategories as string[]).map((category: string) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Blog Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post: any) => (
          <Card key={post._id} className="hover:shadow-md hover:border-gray-300 transition-all duration-200 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900 hover:text-[#F23E2E] transition-colors duration-200 cursor-pointer" onClick={() => router.push(`/staff/blog/${post._id}`)}>{post.title}</h4>
                    {getStatusBadge(post.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author?.name || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'N/A')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewCount || 0} views
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/by-us/${post.slug}`)}
                    className="hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/staff/blog/${post._id}`)}
                    className="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {post.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublishPost(post._id)}
                      className="bg-[#F23E2E] hover:bg-[#ed1d12] text-white transition-all duration-200 hover:shadow-sm"
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePost(post._id)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs transition-all duration-200 hover:shadow-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Categories */}
              {post.categories && post.categories.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Categories:</span>
                  <div className="flex flex-wrap gap-1">
                    {post.categories.map((category: string) => (
                      <Badge key={category} variant="outline" className="transition-all duration-200 hover:border-[#F23E2E] hover:text-[#F23E2E] hover:shadow-sm">{category}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchTerm || statusFilter !== 'all' ? "No blog posts found" : "No blog posts yet"}
          description={searchTerm || statusFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Create your first blog post to get started"}
          action={searchTerm || statusFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Create Post",
            onClick: () => router.push('/staff/blog/new'),
            variant: "primary"
          }}
          variant={searchTerm || statusFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}

