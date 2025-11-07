"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { sanitizeContent, validateContent } from '@/lib/utils/content-sanitizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Globe,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BlogPost {
  _id: Id<"blogPosts">;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  category: string;
  featuredImage?: string;
  readTime: number;
  views: number;
  likes: number;
  comments: number;
  seoTitle?: string;
  seoDescription?: string;
}

export default function BlogManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New post form
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as const,
    featuredImage: '',
    seoTitle: '',
    seoDescription: ''
  });

  // Fetch data
  const blogPosts = useQuery(api.queries.content.getBlogPosts);
  const categories = useQuery(api.queries.content.getBlogCategories);

  // Mutations
  const createPost = useMutation(api.mutations.content.createBlogPost);
  const updatePost = useMutation(api.mutations.content.updateBlogPost);
  const deletePost = useMutation(api.mutations.content.deleteBlogPost);
  const publishPost = useMutation(api.mutations.content.publishBlogPost);

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Title and content are required');
      return;
    }

    // Sanitize content before saving
    const sanitizedPost = {
      ...newPost,
      title: sanitizeContent(newPost.title),
      content: sanitizeContent(newPost.content),
      excerpt: newPost.excerpt ? sanitizeContent(newPost.excerpt) : newPost.excerpt,
      seoTitle: newPost.seoTitle ? sanitizeContent(newPost.seoTitle) : newPost.seoTitle,
      seoDescription: newPost.seoDescription ? sanitizeContent(newPost.seoDescription) : newPost.seoDescription,
    };

    // Validate content for encoding issues
    const titleValidation = validateContent(sanitizedPost.title);
    const contentValidation = validateContent(sanitizedPost.content);
    
    if (!titleValidation.isValid || !contentValidation.isValid) {
      const allIssues = [...titleValidation.issues, ...contentValidation.issues];
      setError(`Content validation failed: ${allIssues.join(', ')}`);
      return;
    }

    try {
      await createPost({
        ...sanitizedPost,
        slug: sanitizedPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        readTime: Math.ceil(sanitizedPost.content.split(' ').length / 200)
      });
      
      setNewPost({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: [],
        status: 'draft',
        featuredImage: '',
        seoTitle: '',
        seoDescription: ''
      });
      setIsCreating(false);
      setSuccess('Blog post created successfully');
      setError(null);
    } catch (err) {
      setError('Failed to create blog post');
    }
  };

  const handleUpdatePost = async (postId: Id<"blogPosts">, updates: Partial<BlogPost>) => {
    try {
      await updatePost({ postId, ...updates });
      setSuccess('Blog post updated successfully');
      setError(null);
      setIsEditing(null);
    } catch (err) {
      setError('Failed to update blog post');
    }
  };

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
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag: any) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recent':
        return b.updatedAt - a.updatedAt;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'views':
        return b.views - a.views;
      case 'likes':
        return b.likes - a.likes;
      default:
        return 0;
    }
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'archived':
        return <Badge className="bg-red-100 text-red-800">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const uniqueCategories = Array.from(new Set(blogPosts?.map((post: any) => post.category) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Blog Management</h1>
          <p className="text-gray-600 font-satoshi mt-2">Create and manage blog posts and content</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{blogPosts?.length || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.filter((p: any) => p.status === 'published').length || 0}
                </p>
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
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.filter((p: any) => p.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {blogPosts?.reduce((sum: any, post: any) => sum + post.views, 0) || 0}
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

      {/* Create Post Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Blog Post</CardTitle>
            <CardDescription>Write and publish a new blog post</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select value={newPost.category} onValueChange={(value) => setNewPost(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((category: any) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Excerpt</label>
              <textarea
                value={newPost.excerpt}
                onChange={(e) => setNewPost(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Enter post excerpt"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <Input
                  value={newPost.tags.join(', ')}
                  onChange={(e) => setNewPost(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="Enter tags"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Featured Image URL</label>
                <Input
                  value={newPost.featuredImage}
                  onChange={(e) => setNewPost(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="Enter image URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">SEO Title</label>
                <Input
                  value={newPost.seoTitle}
                  onChange={(e) => setNewPost(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Enter SEO title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={newPost.status} onValueChange={(value) => setNewPost(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">SEO Description</label>
              <textarea
                value={newPost.seoDescription}
                onChange={(e) => setNewPost(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Enter SEO description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreatePost} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
                Create Post
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            placeholder="Search blog posts..."
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
            {uniqueCategories.map((category: any) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post: any) => (
          <Card key={post._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{post.title}</h4>
                    {getStatusBadge(post.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views} views
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* View post */}}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(post._id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {post.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublishPost(post._id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((tag: any) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>Category:</span>
                  <Badge variant="outline">{post.category}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span>Likes:</span>
                  <span className="font-medium">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Comments:</span>
                  <span className="font-medium">{post.comments}</span>
                </div>
                {post.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-600">Create your first blog post to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
