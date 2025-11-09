"use client";

import { AuthWrapper } from '@/components/layout/AuthWrapper';
import React, { useState } from 'react';


import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'motion/react';
import { Edit, FileText, Globe, Image, Plus, Search, Trash, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/admin/empty-state';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';


interface ContentItem {
  _id: Id<"content">;
  title: string;
  type: 'blog' | 'story' | 'recipe' | 'page';
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

interface ContentFormData {
  title: string;
  type: 'blog' | 'story' | 'recipe' | 'page';
  content: string;
  status: 'draft' | 'published' | 'archived';
  author: string;
  thumbnail?: string;
  metadata: {
    description: string;
    tags: string[];
    readTime: number;
  };
}

export default function AdminContentPage() {
  // Auth is handled by middleware, no client-side checks needed
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<ContentItem['type'] | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ContentItem['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; contentId: Id<"content"> | null }>({
    isOpen: false,
    contentId: null,
  });
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    type: 'blog',
    content: '',
    status: 'draft',
    author: '',
    thumbnail: '',
    metadata: {
      description: '',
      tags: [],
      readTime: 0,
    },
  });

  const contentItems = useQuery(api.queries.admin.getContentItems) as ContentItem[] | undefined;
  const createContent = useMutation(api.mutations.admin.createContent);
  const updateContent = useMutation(api.mutations.admin.updateContent);
  const deleteContent = useMutation(api.mutations.admin.deleteContent);
  const publishContent = useMutation(api.mutations.admin.publishContent);
  const archiveContent = useMutation(api.mutations.admin.archiveContent);

  const filteredItems = contentItems?.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Get content types from configuration or API
  const contentTypes = [
    { type: 'blog' as const, icon: FileText, label: 'Blog Posts' },
    { type: 'story' as const, icon: Image, label: 'Stories' },
    { type: 'recipe' as const, icon: FileText, label: 'Recipes' },
    { type: 'page' as const, icon: Globe, label: 'Pages' },
  ];

  const handleCreateNew = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      type: 'blog',
      content: '',
      status: 'draft',
      author: '',
      thumbnail: '',
      metadata: {
        description: '',
        tags: [],
        readTime: 0,
      },
    });
    setShowModal(true);
  };

  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      type: content.type,
      content: content.content,
      status: content.status,
      author: content.author,
      thumbnail: content.thumbnail || '',
      metadata: {
        description: content.metadata?.description || '',
        tags: content.metadata?.tags || [],
        readTime: content.metadata?.readTime || 0,
      },
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingContent) {
        await updateContent({
          contentId: editingContent._id,
          ...formData,
        });
      } else {
        await createContent(formData);
      }
      setShowModal(false);
      setEditingContent(null);
      toast({
        title: "Success",
        description: editingContent ? "Content updated successfully!" : "Content created successfully!",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error saving content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (contentId: Id<"content">) => {
    setDeleteConfirm({ isOpen: true, contentId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.contentId) return;
    try {
      await deleteContent({ contentId: deleteConfirm.contentId });
      toast({
        title: "Success",
        description: "Content deleted successfully!",
        variant: "success"
      });
      setDeleteConfirm({ isOpen: false, contentId: null });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error deleting content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (contentId: Id<"content">) => {
    try {
      await publishContent({ contentId });
      toast({
        title: "Success",
        description: "Content published successfully!",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error publishing content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (contentId: Id<"content">) => {
    try {
      await archiveContent({ contentId });
      toast({
        title: "Success",
        description: "Content archived successfully!",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error archiving content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: [...prev.metadata.tags, ''],
      },
    }));
  };

  const updateTag = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.map((tag, i) => i === index ? value : tag),
      },
    }));
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        tags: prev.metadata.tags.filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <AuthWrapper role="admin">
          <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-asgard text-gray-900">
          Content Management
        </h1>
        <Button
          onClick={handleCreateNew}
          size="lg"
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4" />
          New Content
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(contentTypes || []).map(({ type, icon: Icon, label }: { type: string; icon: any; label: string }) => (
          <Button
            key={type}
            onClick={() => setSelectedType(type === selectedType ? 'all' : type as ContentItem['type'])}
            variant={type === selectedType ? "default" : "outline"}
            className={type === selectedType ? "bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white" : "bg-white/50 backdrop-blur-sm border-gray-200/30 hover:bg-gray-100/50"}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'draft' | 'published' | 'archived')}
          className="px-4 py-2 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {!contentItems ? (
        <div className="flex items-center justify-center h-64 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredItems?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchQuery || selectedType !== 'all' || selectedStatus !== 'all' ? "No content found" : "No content yet"}
          description={searchQuery || selectedType !== 'all' || selectedStatus !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Create your first content item to get started"}
          action={searchQuery || selectedType !== 'all' || selectedStatus !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedStatus('all');
            },
            variant: "secondary"
          } : {
            label: "Create Content",
            onClick: handleCreateNew,
            variant: "primary"
          }}
          variant={searchQuery || selectedType !== 'all' || selectedStatus !== 'all' ? "filtered" : "no-data"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems?.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200/30 p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full font-satoshi ${
                    item.status === 'published' ? 'bg-green-200 text-green-800' :
                    item.status === 'draft' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-1 text-gray-600 hover:text-primary-600 transition-colors"
                    aria-label="Edit content"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                    aria-label="Delete content"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 font-asgard">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-3 font-satoshi line-clamp-2">
                {item.metadata?.description || 'No description available'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-700 font-satoshi mb-4">
                <span>By {item.author}</span>
                <span>{new Date(item.lastModified).toLocaleDateString()}</span>
              </div>
              
              <div className="flex gap-2">
                {item.status === 'draft' && (
                  <Button
                    onClick={() => handlePublish(item._id)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Publish
                  </Button>
                )}
                {item.status === 'published' && (
                  <Button
                    onClick={() => handleArchive(item._id)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Archive
                  </Button>
                )}
                <Button
                  onClick={() => handleEdit(item)}
                  size="sm"
                  className="flex-1 bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                >
                  Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-asgard text-gray-900">
              {editingContent ? 'Edit Content' : 'Create New Content'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                      placeholder="Enter content title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'blog' | 'recipe' | 'page' | 'story' }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    >
                      <option value="blog">Blog Post</option>
                      <option value="story">Story</option>
                      <option value="recipe">Recipe</option>
                      <option value="page">Page</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Author
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                      placeholder="Enter author name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Description
                  </label>
                  <textarea
                    value={formData.metadata.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, description: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    placeholder="Enter content description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    placeholder="Enter content body"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Tags
                  </label>
                  <div className="space-y-2">
                    {formData.metadata.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => updateTag(index, e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                          placeholder="Enter tag"
                        />
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-satoshi"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-satoshi"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2 font-satoshi">
                    Read Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.metadata.readTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, readTime: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 font-satoshi"
                    placeholder="5"
                    min="0"
                  />
                </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
            >
              {editingContent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, contentId: null })}
        onConfirm={confirmDelete}
        title="Delete Content"
        message="Are you sure you want to delete this content? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
      />
    </div>
    </AuthWrapper>
  );
}

