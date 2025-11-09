"use client";

import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Globe,
  Plus,
  Search,
  Trash2,
  User
} from 'lucide-react';
import { useState } from 'react';

interface StaticPage {
  _id: Id<"staticPages">;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: number;
  createdAt: number;
  updatedAt: number;
  pageType: 'about' | 'terms' | 'privacy' | 'contact' | 'help' | 'custom';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  featuredImage?: string;
  isHomepage: boolean;
  isFooter: boolean;
  isHeader: boolean;
  sortOrder: number;
  parentPage?: Id<"staticPages">;
  childPages: Id<"staticPages">[];
  views: number;
  lastModifiedBy: string;
}

export default function StaticPagesManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New page form
  const [newPage, setNewPage] = useState({
    title: '',
    content: '',
    excerpt: '',
    pageType: 'custom' as const,
    status: 'draft' as const,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    featuredImage: '',
    isHomepage: false,
    isFooter: false,
    isHeader: false,
    sortOrder: 0
  });

  // Fetch data
  const staticPages = useQuery(api.queries.content.getStaticPages);
  const pageTypes = [
    { value: 'about', label: 'About' },
    { value: 'terms', label: 'Terms of Service' },
    { value: 'privacy', label: 'Privacy Policy' },
    { value: 'contact', label: 'Contact' },
    { value: 'help', label: 'Help' },
    { value: 'custom', label: 'Custom' }
  ];

  // Mutations
  const createPage = useMutation(api.mutations.content.createStaticPage);
  const updatePage = useMutation(api.mutations.content.updateStaticPage);
  const deletePage = useMutation(api.mutations.content.deleteStaticPage);
  const publishPage = useMutation(api.mutations.content.publishStaticPage);

  const handleCreatePage = async () => {
    if (!newPage.title.trim() || !newPage.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      await createPage({
        ...newPage,
        slug: newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        seoKeywords: newPage.seoKeywords.filter(keyword => keyword.trim())
      });
      
      setNewPage({
        title: '',
        content: '',
        excerpt: '',
        pageType: 'custom',
        status: 'draft',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: [],
        featuredImage: '',
        isHomepage: false,
        isFooter: false,
        isHeader: false,
        sortOrder: 0
      });
      setIsCreating(false);
      setSuccess('Static page created successfully');
      setError(null);
    } catch (err) {
      setError('Failed to create static page');
    }
  };

  const handleUpdatePage = async (pageId: Id<"staticPages">, updates: Partial<StaticPage>) => {
    try {
      await updatePage({ pageId, ...updates });
      setSuccess('Static page updated successfully');
      setError(null);
      setIsEditing(null);
    } catch (err) {
      setError('Failed to update static page');
    }
  };

  const handleDeletePage = async (pageId: Id<"staticPages">) => {
    if (confirm('Are you sure you want to delete this static page?')) {
      try {
        await deletePage({ pageId });
        setSuccess('Static page deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete static page');
      }
    }
  };

  const handlePublishPage = async (pageId: Id<"staticPages">) => {
    try {
      await publishPage({ pageId });
      setSuccess('Static page published successfully');
      setError(null);
    } catch (err) {
      setError('Failed to publish static page');
    }
  };

  const filteredPages = staticPages?.filter((page: any) => {
    const matchesSearch = 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    const matchesType = typeFilter === 'all' || page.pageType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recent':
        return b.updatedAt - a.updatedAt;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'views':
        return b.views - a.views;
      case 'type':
        return a.pageType.localeCompare(b.pageType);
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

  const getTypeBadge = (type: string) => {
    const typeConfig = pageTypes.find(t => t.value === type);
    return (
      <Badge variant="outline" className="text-xs">
        {typeConfig?.label || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Static Pages</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage static pages and site content</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
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
                <p className="text-sm text-gray-600">Total Pages</p>
                <p className="text-2xl font-bold text-gray-900">{staticPages?.length || 0}</p>
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
                  {staticPages?.filter((p: any) => p.status === 'published').length || 0}
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
                  {staticPages?.filter((p: any) => p.status === 'draft').length || 0}
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
                  {staticPages?.reduce((sum: any, page: any) => sum + page.views, 0) || 0}
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

      {/* Create Page Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Static Page</CardTitle>
            <CardDescription>Create a new static page for your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={newPage.title}
                  onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter page title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Page Type</label>
                <Select value={newPage.pageType} onValueChange={(value) => setNewPage(prev => ({ ...prev, pageType: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Excerpt</label>
              <textarea
                value={newPage.excerpt}
                onChange={(e) => setNewPage(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Enter page excerpt"
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={newPage.content}
                onChange={(e) => setNewPage(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your page content here..."
                rows={10}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">SEO Title</label>
                <Input
                  value={newPage.seoTitle}
                  onChange={(e) => setNewPage(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Enter SEO title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Featured Image URL</label>
                <Input
                  value={newPage.featuredImage}
                  onChange={(e) => setNewPage(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="Enter image URL"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">SEO Description</label>
              <textarea
                value={newPage.seoDescription}
                onChange={(e) => setNewPage(prev => ({ ...prev, seoDescription: e.target.value }))}
                placeholder="Enter SEO description"
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">SEO Keywords (comma-separated)</label>
              <Input
                value={newPage.seoKeywords.join(', ')}
                onChange={(e) => setNewPage(prev => ({ 
                  ...prev, 
                  seoKeywords: e.target.value.split(',').map(keyword => keyword.trim()).filter(Boolean)
                }))}
                placeholder="Enter keywords"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={newPage.status} onValueChange={(value) => setNewPage(prev => ({ ...prev, status: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Sort Order</label>
                <Input
                  type="number"
                  value={newPage.sortOrder}
                  onChange={(e) => setNewPage(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Page Settings</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPage.isHomepage}
                    onChange={(e) => setNewPage(prev => ({ ...prev, isHomepage: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Homepage</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPage.isHeader}
                    onChange={(e) => setNewPage(prev => ({ ...prev, isHeader: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show in Header</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newPage.isFooter}
                    onChange={(e) => setNewPage(prev => ({ ...prev, isFooter: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show in Footer</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreatePage} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white">
                Create Page
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
            placeholder="Search pages..."
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
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {pageTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
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
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {filteredPages.map((page: any) => (
          <Card key={page._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{page.title}</h4>
                    {getStatusBadge(page.status)}
                    {getTypeBadge(page.pageType)}
                    {page.isHomepage && (
                      <Badge className="bg-blue-100 text-blue-800">Homepage</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{page.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {page.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {page.views} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      /{page.slug}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* View page */}}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {/* Preview page */}}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(page._id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {page.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handlePublishPage(page._id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePage(page._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Page Settings */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {page.isHeader && (
                  <Badge variant="outline" className="text-xs">Header</Badge>
                )}
                {page.isFooter && (
                  <Badge variant="outline" className="text-xs">Footer</Badge>
                )}
                <span>Order: {page.sortOrder}</span>
                {page.publishedAt && (
                  <span>Published: {new Date(page.publishedAt).toLocaleDateString()}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <EmptyState
          icon={FileText}
          title={searchTerm || statusFilter !== 'all' ? "No static pages found" : "No static pages yet"}
          description={searchTerm || statusFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Create your first static page to get started"}
          action={searchTerm || statusFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setStatusFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Create Page",
            onClick: () => setIsCreating(true),
            variant: "primary"
          }}
          variant={searchTerm || statusFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}
