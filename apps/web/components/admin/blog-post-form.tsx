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
  const [isCribNoshTeamPost, setIsCribNoshTeamPost] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const justPublishedRef = useRef(false);
  const isSavingRef = useRef(false);
  const currentPostIdRef = useRef<Id<"blogPosts"> | undefined>(postId);
  const excerptManuallyEditedRef = useRef(false);
  const slugManuallyEditedRef = useRef(false);
  const justPublishedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalAuthorRef = useRef<{ name: string; avatar: string } | null>(null);
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

  // Update currentPostIdRef when postId prop changes
  useEffect(() => {
    if (postId) {
      currentPostIdRef.current = postId;
    }
  }, [postId]);

  // Use currentPostIdRef for queries to handle auto-saved posts
  const effectivePostId = currentPostIdRef.current || postId;
  
  // Fetch existing post if editing
  const existingPost = useQuery(
    api.queries.blog.getBlogPostById,
    effectivePostId ? { postId: effectivePostId } : 'skip'
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
      
      // Determine the correct status to use
      // Priority: 1) If post has publishedAt, it's published (even if query shows draft - query might be stale)
      //           2) If we just published from this form, preserve published status
      //           3) Otherwise, use status from query
      const hasPublishedAt = existingPost.publishedAt !== undefined;
      const shouldBePublished = hasPublishedAt || justPublishedRef.current;
      
      if (shouldBePublished) {
        // Post is published (either has publishedAt or we just published it)
        if (loadedState.status === 'published') {
          // Query has caught up and shows published - safe to update
          setStatus('published');
          if (justPublishedRef.current) {
            // Reset flag since query is now in sync
            justPublishedRef.current = false;
            if (justPublishedTimeoutRef.current) {
              clearTimeout(justPublishedTimeoutRef.current);
              justPublishedTimeoutRef.current = null;
            }
          }
        } else if (justPublishedRef.current) {
          // We just published but query hasn't caught up yet - keep published status
          setStatus('published');
        } else if (hasPublishedAt && loadedState.status === 'draft') {
          // Post has publishedAt but query shows draft (stale query) - preserve published
          setStatus('published');
          // Update loadedState to reflect published status so originalStateRef is correct
          loadedState.status = 'published';
        }
      } else {
        // Normal case: update status from query
        setStatus(loadedState.status);
      }
      
      // Store original author to preserve it
      const originalAuthor = {
        name: existingPost.author?.name || 'CribNosh Team',
        avatar: existingPost.author?.avatar || '/card-images/IMG_2262.png'
      };
      originalAuthorRef.current = originalAuthor;
      
      // Check if this is a CribNosh Team post
      const isCribNoshTeam = originalAuthor.name === 'CribNosh Team' || originalAuthor.name === '';
      setIsCribNoshTeamPost(isCribNoshTeam);
      
      // For CribNosh Team posts, always use CribNosh Team
      // For user posts, preserve the original author
      if (isCribNoshTeam) {
        setAuthorName('CribNosh Team');
        setAuthorAvatar('/card-images/IMG_2262.png');
      } else {
        setAuthorName(loadedState.authorName);
        setAuthorAvatar(loadedState.authorAvatar);
      }
      
      setSeoTitle(loadedState.seoTitle);
      setSeoDescription(loadedState.seoDescription);
      setDate(loadedState.date);
      
      // Reset manual edit flags when loading existing post
      excerptManuallyEditedRef.current = false;
      slugManuallyEditedRef.current = false;
      
      // Store original state for comparison
      originalStateRef.current = loadedState;
      isInitialLoadRef.current = false;
      setHasUnsavedChanges(false);
      
      // Reset the just published flag after a delay to allow query to update
      // Only reset if we haven't already set a timeout from handlePublish
      if (justPublishedRef.current && !justPublishedTimeoutRef.current) {
        justPublishedTimeoutRef.current = setTimeout(() => {
          justPublishedRef.current = false;
          justPublishedTimeoutRef.current = null;
        }, 2000);
      }
      
      return () => {
        if (justPublishedTimeoutRef.current) {
          clearTimeout(justPublishedTimeoutRef.current);
          justPublishedTimeoutRef.current = null;
        }
      };
    } else if (!postId) {
      // New post - initialize original state as empty
      // New posts by staff are always CribNosh Team posts
      setIsCribNoshTeamPost(true);
      originalAuthorRef.current = {
        name: 'CribNosh Team',
        avatar: '/card-images/IMG_2262.png'
      };
      setAuthorName('CribNosh Team');
      setAuthorAvatar('/card-images/IMG_2262.png');
      
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
        authorName: 'CribNosh Team',
        authorAvatar: '/card-images/IMG_2262.png',
        seoTitle: '',
        seoDescription: '',
        date: '',
      };
      isInitialLoadRef.current = false;
    }
  }, [existingPost, postId]);

  // Auto-generate slug from title (only for new posts, and only if not manually edited)
  useEffect(() => {
    if (!effectivePostId && title && !slugManuallyEditedRef.current) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, effectivePostId]);

  // Set default date (only on initial load)
  useEffect(() => {
    if (!date && isInitialLoadRef.current) {
      const now = new Date();
      setDate(now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
  }, [date]);

  // Auto-generate excerpt from content (only if not manually edited)
  useEffect(() => {
    if (content && !excerpt && content.length > 0 && !excerptManuallyEditedRef.current) {
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
    // Exclude auto-generated slug if it wasn't manually edited
    const currentSlug = (!effectivePostId && !slugManuallyEditedRef.current) ? original.slug : slug;
    // Exclude auto-generated excerpt if it wasn't manually edited
    const currentExcerpt = (!excerptManuallyEditedRef.current && !excerpt) ? original.excerpt : excerpt;
    
    const hasChanges = 
      title !== original.title ||
      currentSlug !== original.slug ||
      currentExcerpt !== original.excerpt ||
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
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, status, authorName, authorAvatar, seoTitle, seoDescription, date, effectivePostId]);

  // Helper function to validate content has actual text
  const hasActualTextContent = (html: string): boolean => {
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length > 0;
  };

  // Helper function to handle slug conflicts
  const generateUniqueSlug = async (baseSlug: string, excludePostId?: Id<"blogPosts">): Promise<string> => {
    // This would need to query the database, but for now we'll just append a number
    // In a real implementation, you'd want to check the database
    return baseSlug;
  };

  // Auto-save functionality (debounced)
  const autoSave = useCallback(async () => {
    // Don't auto-save if manual save is in progress
    if (isSavingRef.current) {
      return;
    }
    
    // Don't auto-save if post was published before or is not a draft
    const wasPublishedBefore = existingPost?.publishedAt !== undefined;
    const isDraft = status === 'draft';
    
    if (!title.trim() || !hasActualTextContent(content) || !staff || !hasUnsavedChanges || !isDraft || wasPublishedBefore) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      // Double-check we're not saving
      if (isSavingRef.current) {
        return;
      }
      
      isSavingRef.current = true;
      setSaving(true);
      setError(null);

      try {
        // Preserve original author for user posts, use CribNosh Team for CribNosh Team posts
        const finalAuthor = isCribNoshTeamPost 
          ? { name: 'CribNosh Team', avatar: '/card-images/IMG_2262.png' }
          : (originalAuthorRef.current || { name: authorName || 'CribNosh Team', avatar: authorAvatar || '/card-images/IMG_2262.png' });
        
        // If post was published before, preserve published status (don't let auto-save change it to draft)
        const finalStatus = wasPublishedBefore 
          ? 'published' 
          : (effectivePostId ? status : 'draft');
        
        const postData = {
          title,
          slug,
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
          content,
          coverImage,
          featuredImage,
          categories,
          tags,
          status: finalStatus,
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          author: finalAuthor,
        };

        if (effectivePostId) {
          await updatePost({
            postId: effectivePostId,
            ...postData,
          });
        } else {
          const result = await createPost(postData);
          // Update postId ref after creation
          if (result?.postId) {
            currentPostIdRef.current = result.postId;
          }
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
          status: finalStatus,
        authorName: finalAuthor.name,
        authorAvatar: finalAuthor.avatar,
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        };
      } catch (err) {
        console.error('Auto-save error:', err);
        // Handle slug conflicts
        if (err instanceof Error && err.message.includes('Slug already exists')) {
          // For auto-save, we'll just log it - user can fix manually
          console.warn('Auto-save failed: slug conflict. User should save manually.');
        }
        // Don't show error for auto-save failures
      } finally {
        isSavingRef.current = false;
        setSaving(false);
      }
    }, 15000); // Auto-save after 15 seconds of inactivity
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, status, authorName, authorAvatar, seoTitle, seoDescription, date, staff, effectivePostId, hasUnsavedChanges, existingPost, isCribNoshTeamPost, createPost, updatePost]);

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
    const normalizedTag = tagInput.trim().toLowerCase();
    const normalizedTags = tags.map(t => t.toLowerCase());
    if (normalizedTag && !normalizedTags.includes(normalizedTag)) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
      setError(null); // Clear error when user makes changes
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

  const handleSave = useCallback(async () => {
    if (!title.trim() || !hasActualTextContent(content)) {
      setError('Title and content with actual text are required');
      return;
    }

    if (!staff) {
      setError('You must be logged in to save posts');
      return;
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (slug && !slugPattern.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Prevent auto-save from running
    isSavingRef.current = true;
    setSaving(true);
    setError(null);

    try {
        // Preserve original author for user posts, use CribNosh Team for CribNosh Team posts
        const finalAuthor = isCribNoshTeamPost 
          ? { name: 'CribNosh Team', avatar: '/card-images/IMG_2262.png' }
          : (originalAuthorRef.current || { name: authorName || 'CribNosh Team', avatar: authorAvatar || '/card-images/IMG_2262.png' });
        
        // If post was published before, preserve published status unless user explicitly changed it via dropdown
        // The issue: status state can get reset to 'draft' due to query refetches, so we need to preserve published status
        const wasPublished = existingPost?.publishedAt !== undefined;
        const originalWasPublished = originalStateRef.current?.status === 'published';
        // If post was published and status state is draft, check if this is intentional
        // If user made other changes (not just status), they likely intentionally changed status too
        // Otherwise, it's likely a bug (state reset) and we should preserve published
        let finalStatus = status;
        if ((wasPublished || originalWasPublished) && status === 'draft' && originalWasPublished) {
          // Check if user made other changes - if so, they might have intentionally changed status
          const hasOtherChanges = originalStateRef.current && (
            title !== originalStateRef.current.title ||
            content !== originalStateRef.current.content ||
            excerpt !== originalStateRef.current.excerpt ||
            coverImage !== originalStateRef.current.coverImage ||
            featuredImage !== originalStateRef.current.featuredImage ||
            categories.length !== originalStateRef.current.categories.length ||
            tags.length !== originalStateRef.current.tags.length
          );
          // Only preserve published if no other changes were made (likely a bug)
          // If other changes were made, user might have intentionally changed status too
          if (!hasOtherChanges) {
            finalStatus = 'published'; // Preserve published status - likely a bug where state got reset
          }
        }
        
        const postData = {
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
          content,
          coverImage,
          featuredImage,
          categories,
          tags,
          status: finalStatus,
          seoTitle: seoTitle || title,
          seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          author: finalAuthor,
        };

      if (effectivePostId) {
        // Update existing post
        await updatePost({
          postId: effectivePostId,
          ...postData,
        });
      } else {
        // Create new post
        const result = await createPost(postData);
        // Update postId ref after creation
        if (result?.postId) {
          currentPostIdRef.current = result.postId;
        }
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Update original state after successful save
      originalStateRef.current = {
        title,
        slug: postData.slug,
        excerpt: postData.excerpt,
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status: finalStatus,
        authorName: finalAuthor.name,
        authorAvatar: finalAuthor.avatar,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving post:', err);
      let errorMessage = 'Failed to save post';
      if (err instanceof Error) {
        if (err.message.includes('Slug already exists')) {
          errorMessage = 'A post with this slug already exists. Please choose a different slug.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, status, authorName, authorAvatar, seoTitle, seoDescription, date, staff, effectivePostId, existingPost, hasUnsavedChanges, createPost, updatePost, onSave]);

  const handlePublish = useCallback(async () => {
    if (!title.trim() || !hasActualTextContent(content)) {
      setError('Title and content with actual text are required');
      return;
    }

    if (!staff) {
      setError('You must be logged in to publish posts');
      return;
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (finalSlug && !slugPattern.test(finalSlug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Prevent auto-save from running
    isSavingRef.current = true;
    setSaving(true);
    setError(null);

    try {
        // Preserve original author for user posts, use CribNosh Team for CribNosh Team posts
        const finalAuthor = isCribNoshTeamPost 
          ? { name: 'CribNosh Team', avatar: '/card-images/IMG_2262.png' }
          : (originalAuthorRef.current || { name: authorName || 'CribNosh Team', avatar: authorAvatar || '/card-images/IMG_2262.png' });
        
        const postData = {
          title,
          slug: finalSlug,
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
          author: finalAuthor,
        };

      if (effectivePostId) {
        // Update existing post and publish
        await updatePost({
          postId: effectivePostId,
          ...postData,
        });
      } else {
        // Create new post and publish
        const result = await createPost(postData);
        // Update postId ref after creation
        if (result?.postId) {
          currentPostIdRef.current = result.postId;
        }
      }

      // Set flag BEFORE any potential query refetch to prevent status from being overwritten
      justPublishedRef.current = true;
      setStatus('published');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Clear any existing timeout and set a new one
      if (justPublishedTimeoutRef.current) {
        clearTimeout(justPublishedTimeoutRef.current);
      }
      // Reset the flag after a delay to allow query to update with published status
      justPublishedTimeoutRef.current = setTimeout(() => {
        justPublishedRef.current = false;
        justPublishedTimeoutRef.current = null;
      }, 2000); // Increased delay to ensure query has time to update

      // Update original state after successful publish
      originalStateRef.current = {
        title,
        slug: finalSlug,
        excerpt: postData.excerpt,
        content,
        coverImage,
        featuredImage,
        categories,
        tags,
        status: 'published',
        authorName: finalAuthor.name,
        authorAvatar: finalAuthor.avatar,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160),
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };

      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error publishing post:', err);
      let errorMessage = 'Failed to publish post';
      if (err instanceof Error) {
        if (err.message.includes('Slug already exists')) {
          errorMessage = 'A post with this slug already exists. Please choose a different slug.';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [title, slug, excerpt, content, coverImage, featuredImage, categories, tags, authorName, authorAvatar, seoTitle, seoDescription, date, staff, effectivePostId, createPost, updatePost, onSave]);

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
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null); // Clear error when user makes changes
                }}
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
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError(null); // Clear error when user makes changes
                  }}
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

            {/* Author Settings - Only show for user posts, hidden for CribNosh Team posts */}
            {!isCribNoshTeamPost && (
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
                      onChange={(e) => {
                        setAuthorName(e.target.value);
                        setError(null);
                      }}
                      placeholder="Author name"
                      className="text-sm"
                      readOnly={!!originalAuthorRef.current && originalAuthorRef.current.name !== 'CribNosh Team'}
                    />
                    {originalAuthorRef.current && originalAuthorRef.current.name !== 'CribNosh Team' && (
                      <p className="text-xs text-gray-500 mt-1">Original author - cannot be changed</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="authorAvatar" className="text-xs text-gray-600 mb-1 block">Author Avatar URL</Label>
                    <Input
                      id="authorAvatar"
                      value={authorAvatar}
                      onChange={(e) => {
                        setAuthorAvatar(e.target.value);
                        setError(null);
                      }}
                      placeholder="/card-images/IMG_2262.png"
                      className="text-sm"
                      readOnly={!!originalAuthorRef.current && originalAuthorRef.current.name !== 'CribNosh Team'}
                    />
                    {originalAuthorRef.current && originalAuthorRef.current.name !== 'CribNosh Team' && (
                      <p className="text-xs text-gray-500 mt-1">Original author avatar - cannot be changed</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    onChange={(e) => {
                      setExcerpt(e.target.value);
                      excerptManuallyEditedRef.current = true;
                      setError(null); // Clear error when user makes changes
                    }}
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
                  onChange={(e) => {
                    setSlug(e.target.value);
                    slugManuallyEditedRef.current = true;
                    setError(null); // Clear error when user makes changes
                  }}
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

