"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { useMutation, useQuery } from 'convex/react';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Loader2, Maximize2, Minimize2, Save, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BlogEditor } from './blog-editor';
import { BlogImageUpload } from './blog-image-upload';

const CATEGORIES = [
  "Family Traditions",
  "Cultural Heritage",
  "Modern Fusion",
  "Sustainable Cooking",
  "Kitchen Stories",
  "Recipe Collections"
];

interface BlogPostFormProps {
  postId?: Id<"blogPosts">;
  onSave?: () => void;
  onCancel?: () => void;
}

export function BlogPostForm({ postId, onSave, onCancel }: BlogPostFormProps) {
  const { staff } = useStaffAuth();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [authorName, setAuthorName] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const originalStateRef = useRef<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    featuredImage: string;
    categories: string[];
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    authorName: string;
    authorAvatar: string;
    seoTitle: string;
    seoDescription: string;
    date: string;
  } | null>(null);

  // Fetch existing post if editing
  const existingPost = useQuery(
    api.queries.blog.getBlogPostById,
    postId ? { postId } : 'skip'
  );

  // Mutations
  const createPost = useMutation(api.mutations.blog.createBlogPost);
  const updatePost = useMutation(api.mutations.blog.updateBlogPost);

  // Load existing post data
  useEffect(() => {
    if (existingPost) {
      const loadedState = {
        title: existingPost.title || '',
        slug: existingPost.slug || '',
        excerpt: existingPost.excerpt || '',
        content: existingPost.content || '',
        coverImage: existingPost.coverImage || '',
        featuredImage: existingPost.featuredImage || '',
        categories: existingPost.categories || [],
        tags: existingPost.tags || [],
        status: existingPost.status || 'draft',
        authorName: existingPost.author?.name || '',
        authorAvatar: existingPost.author?.avatar || '',
        seoTitle: existingPost.seoTitle || '',
        seoDescription: existingPost.seoDescription || '',
        date: existingPost.date || '',
      };
      
      setTitle(loadedState.title);
      setSlug(loadedState.slug);
      setExcerpt(loadedState.excerpt);
      setContent(loadedState.content);
      setCoverImage(loadedState.coverImage);
      setFeaturedImage(loadedState.featuredImage);
      setCategories(loadedState.categories);
      setTags(loadedState.tags);
      setStatus(loadedState.status);
      setAuthorName(loadedState.authorName);
      setAuthorAvatar(loadedState.authorAvatar);
      setSeoTitle(loadedState.seoTitle);
      setSeoDescription(loadedState.seoDescription);
      setDate(loadedState.date);
      
      // Store original state for comparison
      originalStateRef.current = loadedState;
      isInitialLoadRef.current = false;
      setHasUnsavedChanges(false);
    } else if (!postId) {
      // New post - initialize original state as empty
      originalStateRef.current = {
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        coverImage: '',
        featuredImage: '',
        categories: [],
        tags: [],
        status: 'draft',
        authorName: '',
        authorAvatar: '',
        seoTitle: '',
        seoDescription: '',
        date: '',
      };
      isInitialLoadRef.current = false;
    }
  }, [existingPost, postId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, postId]);

  // Set default date
  useEffect(() => {
    if (!date) {
      const now = new Date();
      setDate(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
  }, [date]);

  // Auto-generate excerpt from content
  useEffect(() => {
    if (content && !excerpt && content.length > 0) {
      const autoExcerpt = content.replace(/<[^>]*>/g, '').substring(0, 160).trim();
      if (autoExcerpt.length > 0 && !isInitialLoadRef.current) {
        setExcerpt(autoExcerpt + (content.length > 160 ? '...' : ''));
      }
    }
  }, [content, excerpt]);

  // Track unsaved changes by comparing to original state
  useEffect(() => {
    if (isInitialLoadRef.current || !originalStateRef.current) {
      return;
    }

    const original = originalStateRef.current;
    
    // Helper to compare arrays
    const arraysEqual = (a: string[], b: string[]) => {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => val === b[idx]);
    };

    // Compare all fields
    const hasChanges = 
      title !== original.title ||
      slug !== original.slug ||
      excerpt !== original.excerpt ||
      content !== original.content ||
      coverImage !== original.coverImage ||
      featuredImage !== original.featuredImage ||
      !arraysEqual(categories, original.categories) ||
      !arraysEqual(tags, original.tags) ||
      status !== original.status ||
      authorName !== original.authorName ||
      authorAvatar !== original.authorAvatar ||
      seoTitle !== original.seoTitle ||
      seoDescription !== original.seoDescription ||
      date !== original.date;

    setHasUnsavedChanges(hasChanges);
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, status, authorName, authorAvatar, seoTitle, seoDescription, date]);

  // Auto-save functionality (debounced)
  const autoSave = useCallback(async () => {
    // Don't auto-save if post was published before or is not a draft
    const wasPublishedBefore = existingPost?.publishedAt !== undefined;
    const isDraft = status === 'draft';
    
    if (!title.trim() || !content.trim() || !staff || !hasUnsavedChanges || !isDraft || wasPublishedBefore) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setError(null);

      try {
        const postData = {
          title,
          slug,
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
          content,
          coverImage,
          featuredImage,
          categories,
          tags,
          status: postId ? status : 'draft', // Preserve existing status when editing, use draft for new posts
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          author: {
            name: authorName || 'CribNosh Team',
            avatar: authorAvatar || '/card-images/IMG_2262.png'
          },
        };

        if (postId) {
          await updatePost({
            postId,
            ...postData,
          });
        } else {
          await createPost(postData);
        }

        setLastSaved(new Date());
        setHasUnsavedChanges(false);

        // Update original state after successful auto-save
        originalStateRef.current = {
          title,
          slug,
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
          content,
          coverImage,
          featuredImage,
          categories,
          tags,
          status: postId ? status : 'draft',
          authorName: authorName || 'CribNosh Team',
          authorAvatar: authorAvatar || '/card-images/IMG_2262.png',
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };
      } catch (err) {
        console.error('Auto-save error:', err);
        // Don't show error for auto-save failures
      } finally {
        setSaving(false);
      }
    }, 15000); // Auto-save after 15 seconds of inactivity
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, status, authorName, authorAvatar, seoTitle, seoDescription, date, staff, postId, hasUnsavedChanges, existingPost, createPost, updatePost]);

  // Trigger auto-save on changes
  useEffect(() => {
    if (!isInitialLoadRef.current && hasUnsavedChanges) {
      autoSave();
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleToggleCategory = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter(cat => cat !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!staff) {
      setError('You must be logged in to save posts');
      return;
    }

    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaving(true);
    setError(null);

    try {
      const postData = {
        title,
        slug,
        excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          author: {
            name: authorName || 'CribNosh Team',
            avatar: authorAvatar || '/card-images/IMG_2262.png'
          },
        };

      if (postId) {
        // Update existing post
        await updatePost({
          postId,
          ...postData,
        });
      } else {
        // Create new post
        await createPost(postData);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Update original state after successful save
      originalStateRef.current = {
        title,
        slug,
        excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status,
        authorName: authorName || 'CribNosh Team',
        authorAvatar: authorAvatar || '/card-images/IMG_2262.png',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving post:', err);
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!staff) {
      setError('You must be logged in to publish posts');
      return;
    }

    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaving(true);
    setError(null);

    try {
      const postData = {
        title,
        slug,
        excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status: 'published' as const,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        author: {
          name: authorName || 'CribNosh Team',
          avatar: authorAvatar || '/card-images/IMG_2262.png'
        },
      };

      if (postId) {
        // Update existing post and publish
        await updatePost({
          postId,
          ...postData,
        });
        setStatus('published');
      } else {
        // Create new post and publish
        await createPost(postData);
        setStatus('published');
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Update original state after successful publish
      originalStateRef.current = {
        title,
        slug,
        excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status: 'published',
        authorName: authorName || 'CribNosh Team',
        authorAvatar: authorAvatar || '/card-images/IMG_2262.png',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error publishing post:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish post');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Calculate word and character counts
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const charCount = content.replace(/<[^>]*>/g, '').length;

  return (
    <div className={`h-screen flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Sticky Header */}
      {!isFullscreen && (
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold font-asgard text-gray-900">
              {postId ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              {lastSaved && !hasUnsavedChanges && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {hasUnsavedChanges && !saving && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Circle className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Unsaved changes</span>
                </div>
              )}
              {saving && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              <Badge variant={status === 'published' ? 'default' : status === 'draft' ? 'secondary' : 'outline'} className="text-xs">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 hidden md:block">
            {wordCount} words • {charCount} chars
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {postId ? 'Update' : 'Save'}
              </>
            )}
          </Button>
          {status !== 'published' && (
            <Button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mx-6 mt-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className={`flex-1 overflow-y-auto ${isFullscreen ? 'bg-white' : 'bg-gray-50'}`}>
        {isFullscreen ? (
          /* Fullscreen Mode - Content Only */
          <div className="h-full flex flex-col p-6">
            {/* Title in Fullscreen */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
              <Label htmlFor="title-fullscreen" className="text-sm font-medium mb-2 block text-gray-700">
                Title *
              </Label>
              <Input
                id="title-fullscreen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog post title"
                className="text-lg border-gray-300 focus:border-[#F23E2E] focus:ring-[#F23E2E]"
              />
            </div>

            {/* Content Editor in Fullscreen */}
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Content *</Label>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {wordCount} words • {charCount} characters
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                    className="h-8 w-8 p-0"
                    title="Exit Fullscreen"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <BlogEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your blog post..."
                />
              </div>
            </div>
          </div>
        ) : (
          /* Normal Mode - Two Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <Label htmlFor="title" className="text-sm font-medium mb-2 block text-gray-700">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog post title"
                  className="text-lg border-gray-300 focus:border-[#F23E2E] focus:ring-[#F23E2E]"
                />
              </div>

              {/* Content Editor */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-gray-700">Content *</Label>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {wordCount} words • {charCount} characters
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(true)}
                      className="h-8 w-8 p-0"
                      title="Enter Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <BlogEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your blog post..."
                />
              </div>
            </div>

            {/* Right Column - Metadata (1/3 width) */}
            <div className="space-y-4">
            {/* Status */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Author Settings */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Author</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="authorName" className="text-xs text-gray-600 mb-1 block">Author Name</Label>
                  <Input
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="CribNosh Team"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use "CribNosh Team"</p>
                </div>
                <div>
                  <Label htmlFor="authorAvatar" className="text-xs text-gray-600 mb-1 block">Author Avatar URL</Label>
                  <Input
                    id="authorAvatar"
                    value={authorAvatar}
                    onChange={(e) => setAuthorAvatar(e.target.value)}
                    placeholder="/card-images/IMG_2262.png"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use default CribNosh avatar</p>
                </div>
              </CardContent>
            </Card>

            {/* Images & Excerpt */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Media & Excerpt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Cover Image</Label>
                  <BlogImageUpload
                    onImageUploaded={(url) => setCoverImage(url)}
                    existingUrl={coverImage}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Featured Image</Label>
                  <BlogImageUpload
                    onImageUploaded={(url) => setFeaturedImage(url)}
                    existingUrl={featuredImage}
                  />
                </div>
                <div>
                  <Label htmlFor="excerpt" className="text-xs text-gray-600 mb-1 block">Excerpt</Label>
                  <textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief description (auto-generated from content)"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-[#F23E2E] transition-all duration-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleToggleCategory(category)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        categories.includes(category)
                          ? 'bg-[#F23E2E] text-white border-[#F23E2E]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#F23E2E]'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag"
                    className="text-sm"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-0.5 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slug & Date */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="slug" className="text-xs text-gray-600 mb-1 block">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-xs text-gray-600 mb-1 block">Date</Label>
                  <Input
                    id="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="August 2025"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings - Collapsible */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <button
                  type="button"
                  onClick={() => setShowSeo(!showSeo)}
                  className="flex items-center justify-between w-full"
                >
                  <CardTitle className="text-base">SEO Settings</CardTitle>
                  {showSeo ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </CardHeader>
              {showSeo && (
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="seoTitle" className="text-xs text-gray-600 mb-1 block">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="Leave empty to use post title"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seoDescription" className="text-xs text-gray-600 mb-1 block">SEO Description</Label>
                    <textarea
                      id="seoDescription"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Leave empty to use excerpt"
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-[#F23E2E] transition-all duration-200"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

