import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { X, Check, Video, BookOpen } from 'lucide-react-native';
import { Id } from '@/convex/_generated/dataModel';

interface ContentLinkSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'recipe' | 'video', id: Id<'recipes'> | Id<'videoPosts'>) => void;
  selectedRecipeId?: Id<'recipes'>;
  selectedVideoIds?: Id<'videoPosts'>[];
  allowMultiple?: boolean;
}

export function ContentLinkSelector({
  visible,
  onClose,
  onSelect,
  selectedRecipeId,
  selectedVideoIds = [],
  allowMultiple = false,
}: ContentLinkSelectorProps) {
  const { chef, sessionToken } = useChefAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'recipes' | 'videos'>('recipes');

  // Get recipes
  const recipes = useQuery(
    api.queries.recipes.getByAuthor,
    chef?.name && sessionToken
      ? { author: chef.name, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  // Get videos
  const videosData = useQuery(
    api.queries.videoPosts.getVideosByCreator,
    chef?.userId
      ? { creatorId: chef.userId, limit: 50 }
      : 'skip'
  ) as { videos: any[] } | undefined;
  
  const videos = videosData?.videos || [];

  const handleSelect = (type: 'recipe' | 'video', id: Id<'recipes'> | Id<'videoPosts'>) => {
    if (type === 'recipe') {
      // Only one recipe can be selected
      onSelect('recipe', id);
      if (!allowMultiple) {
        onClose();
      }
    } else {
      // Multiple videos can be selected
      if (allowMultiple) {
        onSelect('video', id);
      } else {
        onSelect('video', id);
        onClose();
      }
    }
  };

  const isSelected = (type: 'recipe' | 'video', id: string) => {
    if (type === 'recipe') {
      return selectedRecipeId === id;
    } else {
      return selectedVideoIds.includes(id as Id<'videoPosts'>);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
          <Text style={styles.title}>Link Content</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
            onPress={() => setActiveTab('recipes')}
          >
            <BookOpen size={20} color={activeTab === 'recipes' ? '#094327' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
              Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Video size={20} color={activeTab === 'videos' ? '#094327' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
              Videos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List */}
        <ScrollView style={styles.contentList} contentContainerStyle={styles.contentListContent}>
          {activeTab === 'recipes' ? (
            recipes === undefined ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
              </View>
            ) : recipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No recipes found</Text>
                <Text style={styles.emptySubtext}>Create recipes to link them to meals</Text>
              </View>
            ) : (
              recipes.map((recipe) => {
                const selected = isSelected('recipe', recipe._id);
                return (
                  <TouchableOpacity
                    key={recipe._id}
                    style={[styles.contentItem, selected && styles.contentItemSelected]}
                    onPress={() => handleSelect('recipe', recipe._id as Id<'recipes'>)}
                  >
                    {recipe.featuredImage ? (
                      <Image
                        source={{ uri: recipe.featuredImage }}
                        style={styles.contentThumbnail}
                      />
                    ) : (
                      <View style={[styles.contentThumbnail, styles.contentThumbnailPlaceholder]}>
                        <BookOpen size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.contentInfo}>
                      <Text style={styles.contentTitle}>{recipe.title}</Text>
                      <Text style={styles.contentMeta}>
                        {recipe.status === 'published' ? 'Published' : 'Draft'} • {recipe.cuisine || 'No cuisine'}
                      </Text>
                    </View>
                    {selected && (
                      <View style={styles.checkIcon}>
                        <Check size={20} color="#094327" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )
          ) : (
            videos === undefined ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
              </View>
            ) : videos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No videos found</Text>
                <Text style={styles.emptySubtext}>Upload videos to link them to meals</Text>
              </View>
            ) : (
              videos.map((video) => {
                const selected = isSelected('video', video._id);
                return (
                  <TouchableOpacity
                    key={video._id}
                    style={[styles.contentItem, selected && styles.contentItemSelected]}
                    onPress={() => handleSelect('video', video._id as Id<'videoPosts'>)}
                  >
                    {video.thumbnailUrl ? (
                      <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.contentThumbnail}
                      />
                    ) : (
                      <View style={[styles.contentThumbnail, styles.contentThumbnailPlaceholder]}>
                        <Video size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.contentInfo}>
                      <Text style={styles.contentTitle}>{video.title}</Text>
                      <Text style={styles.contentMeta}>
                        {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : '0:00'} • {video.viewsCount || 0} views
                      </Text>
                    </View>
                    {selected && (
                      <View style={styles.checkIcon}>
                        <Check size={20} color="#094327" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )
          )}
        </ScrollView>

        {/* Footer */}
        {allowMultiple && (selectedRecipeId || selectedVideoIds.length > 0) && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  tabActive: {
    backgroundColor: '#E0F2FE',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  tabTextActive: {
    color: '#094327',
    fontWeight: '600',
  },
  contentList: {
    flex: 1,
  },
  contentListContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  contentItemSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#094327',
    borderWidth: 2,
  },
  contentThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  contentThumbnailPlaceholder: {
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  contentMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  checkIcon: {
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doneButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});

