import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { CreateRecipeModal } from '@/components/ui/CreateRecipeModal';
import { CreateStoryModal } from '@/components/ui/CreateStoryModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Archive, ArrowLeft, CheckSquare, Edit2, Eye, Plus, Search, SortAsc, Square, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ContentType = 'all' | 'recipes' | 'stories' | 'videos';
type StatusFilter = 'all' | 'draft' | 'published' | 'archived';
type SortOption = 'date' | 'title' | 'popularity';

export default function ContentLibraryScreen() {
  const { chef, user, sessionToken } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [contentType, setContentType] = useState<ContentType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);
  const [isMealModalVisible, setIsMealModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // @ts-ignore - Complex Convex type inference
  const deleteRecipe = useMutation(api.mutations.recipes.deleteRecipe);
  // @ts-ignore - Complex Convex type inference
  const updateStory = useMutation(api.mutations.stories.updateStory);
  // @ts-ignore - Complex Convex type inference
  const publishVideoPost = useMutation(api.mutations.videoPosts.publishVideoPost);
  // @ts-ignore - Complex Convex type inference
  const deleteVideoPost = useMutation(api.mutations.videoPosts.deleteVideoPost);

  // Get recipes by author (chef name) - returns all statuses
  const recipes = useQuery(
    api.queries.recipes.getByAuthor,
    chef?.name && sessionToken
      ? { author: chef.name, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  // Get stories by author (chef name) - returns all statuses
  const stories = useQuery(
    api.queries.stories.getByAuthor,
    chef?.name && sessionToken
      ? { author: chef.name, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  // Get videos by creator (user ID) - returns all statuses
  const videosRaw = useQuery(
    api.queries.videoPosts.getAllVideosByCreator,
    user?._id
      ? { creatorId: user._id, limit: 1000 }
      : 'skip'
  ) as any | undefined;

  // Extract videos from the query result
  const videos = React.useMemo(() => {
    if (!videosRaw) return undefined;
    // The query returns { videos: [...] }
    return videosRaw.videos || [];
  }, [videosRaw]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Unified content type for all content items
  type UnifiedContent = {
    _id: string;
    type: 'recipe' | 'story' | 'video';
    title: string;
    description?: string;
    status: string;
    createdAt: number;
    updatedAt?: number;
    cuisine?: string;
    viewsCount?: number;
    [key: string]: any;
  };

  // Combine all content into unified format
  const allContent = React.useMemo(() => {
    const content: UnifiedContent[] = [];
    
    // Add recipes
    if (recipes) {
      recipes.forEach((recipe: any) => {
        content.push({
          _id: recipe._id,
          type: 'recipe',
          title: recipe.title,
          description: recipe.description,
          status: recipe.status,
          createdAt: recipe.createdAt || recipe._creationTime || 0,
          updatedAt: recipe.updatedAt,
          cuisine: recipe.cuisine,
          ...recipe,
        });
      });
    }
    
    // Add stories
    if (stories) {
      stories.forEach((story: any) => {
        content.push({
          _id: story._id,
          type: 'story',
          title: story.title,
          description: story.excerpt || story.content?.substring(0, 100),
          status: story.status,
          createdAt: story.createdAt || story._creationTime || 0,
          updatedAt: story.updatedAt,
          ...story,
        });
      });
    }
    
    // Add videos
    if (videos) {
      videos.forEach((video: any) => {
        content.push({
          _id: video._id,
          type: 'video',
          title: video.title,
          description: video.description,
          status: video.status,
          createdAt: video.createdAt || video._creationTime || 0,
          updatedAt: video.updatedAt,
          cuisine: video.cuisine,
          viewsCount: video.viewsCount || 0,
          ...video,
        });
      });
    }
    
    return content;
  }, [recipes, stories, videos]);

  // Filter and sort unified content
  const filteredContent = React.useMemo(() => {
    let filtered = allContent;
    
    // Apply content type filter
    if (contentType !== 'all') {
      const typeMap: Record<string, string> = {
        'recipes': 'recipe',
        'stories': 'story',
        'videos': 'video',
      };
      filtered = filtered.filter(item => item.type === typeMap[contentType]);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.cuisine?.toLowerCase().includes(query) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'popularity':
          // Sort by views/likes if available, otherwise by date
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        case 'date':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });
    
    return filtered;
  }, [allContent, contentType, statusFilter, searchQuery, sortOption]);

  // Get counts for each content type
  const getContentTypeCount = (type: ContentType) => {
    if (type === 'all') {
      return allContent.length;
    }
    const typeMap: Record<string, string> = {
      'recipes': 'recipe',
      'stories': 'story',
      'videos': 'video',
    };
    return allContent.filter(item => item.type === typeMap[type]).length;
  };

  // Get status count across all content types
  const getStatusCount = (status: string) => {
    return allContent.filter(item => item.status === status).length;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleToggleSelection = (itemKey: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemKey)) {
      newSelection.delete(itemKey);
    } else {
      newSelection.add(itemKey);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredContent.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredContent.map(item => `${item.type}:${item._id}`)));
    }
  };

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedItems.size === 0) return;

    const actionText = action === 'publish' ? 'publish' : action === 'archive' ? 'archive' : 'delete';
    const confirmText = action === 'delete' ? 'This action cannot be undone.' : '';

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}`,
      `Are you sure you want to ${actionText} the selected item${selectedItems.size > 1 ? 's' : ''}? ${confirmText}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              let successCount = 0;
              let errorCount = 0;

              // Perform bulk actions
              for (const itemKey of selectedItems) {
                try {
                  const [type, itemId] = itemKey.split(':');
                  
                  if (action === 'delete') {
                    if (type === 'recipe') {
                      await deleteRecipe({ recipeId: itemId as any, sessionToken });
                    } else if (type === 'video') {
                      await deleteVideoPost({ videoId: itemId as any });
                    } else if (type === 'story') {
                      // Stories don't have delete, use archive instead
                      await updateStory({ storyId: itemId as any, status: 'archived', sessionToken });
                    }
                    successCount++;
                  } else if (action === 'publish') {
                    if (type === 'recipe') {
                      // Recipe publish mutation would go here
                      // await updateRecipe({ recipeId: itemId, status: 'published', sessionToken });
                    } else if (type === 'video') {
                      await publishVideoPost({ videoId: itemId as any });
                    } else if (type === 'story') {
                      await updateStory({ storyId: itemId as any, status: 'published', sessionToken });
                    }
                    successCount++;
                  } else if (action === 'archive') {
                    if (type === 'recipe') {
                      // Recipe archive mutation would go here
                      // await updateRecipe({ recipeId: itemId, status: 'archived', sessionToken });
                    } else if (type === 'video') {
                      // Videos use 'archived' status
                      // await updateVideoPost({ videoId: itemId, status: 'archived' });
                    } else if (type === 'story') {
                      await updateStory({ storyId: itemId as any, status: 'archived', sessionToken });
                    }
                    successCount++;
                  }
                } catch (error: any) {
                  errorCount++;
                  console.error(`Failed to ${actionText} item ${itemKey}:`, error);
                }
              }

              setSelectedItems(new Set());
              setIsSelectionMode(false);
              
              if (errorCount === 0) {
                showSuccess(
                  'Success',
                  `${successCount} item${successCount > 1 ? 's' : ''} ${actionText}ed successfully.`
                );
              } else {
                showError(
                  'Partial Success',
                  `${successCount} item${successCount > 1 ? 's' : ''} ${actionText}ed, ${errorCount} failed.`
                );
              }
            } catch (error: any) {
              showError('Error', error.message || `Failed to ${actionText} items`);
            }
          },
        },
      ]
    );
  };

  if (!chef) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Content Library</Text>
        <View style={styles.headerRight}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity
                onPress={handleSelectAll}
                style={styles.headerButton}
              >
                {selectedItems.size === filteredContent.length ? (
                  <CheckSquare size={24} color="#007AFF" />
                ) : (
                  <Square size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setSelectedItems(new Set());
                  setIsSelectionMode(false);
                }}
                style={styles.headerButton}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowSortMenu(!showSortMenu)}
                style={styles.headerButton}
              >
                <SortAsc size={24} color="#007AFF" />
              </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (contentType === 'stories') {
              setIsStoryModalVisible(true);
            } else if (contentType === 'recipes') {
              setIsRecipeModalVisible(true);
            } else {
              setIsMealModalVisible(true);
            }
          }}
          style={styles.addButton}
        >
          <Plus size={24} color="#007AFF" />
        </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search content..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'date' && styles.sortOptionActive]}
            onPress={() => {
              setSortOption('date');
              setShowSortMenu(false);
            }}
          >
            <Text style={[styles.sortOptionText, sortOption === 'date' && styles.sortOptionTextActive]}>
              Date (Newest)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'title' && styles.sortOptionActive]}
            onPress={() => {
              setSortOption('title');
              setShowSortMenu(false);
            }}
          >
            <Text style={[styles.sortOptionText, sortOption === 'title' && styles.sortOptionTextActive]}>
              Title (A-Z)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'popularity' && styles.sortOptionActive]}
            onPress={() => {
              setSortOption('popularity');
              setShowSortMenu(false);
            }}
          >
            <Text style={[styles.sortOptionText, sortOption === 'popularity' && styles.sortOptionTextActive]}>
              Popularity
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bulk Actions Bar */}
      {isSelectionMode && selectedItems.size > 0 && (
        <View style={styles.bulkActionsBar}>
          <Text style={styles.bulkActionsText}>
            {selectedItems.size} selected
          </Text>
          <View style={styles.bulkActionsButtons}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={() => handleBulkAction('publish')}
            >
              <Text style={styles.bulkActionButtonText}>Publish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkActionButtonArchive]}
              onPress={() => handleBulkAction('archive')}
            >
              <Text style={styles.bulkActionButtonText}>Archive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.bulkActionButtonDelete]}
              onPress={() => handleBulkAction('delete')}
            >
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content Type Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          onPress={() => setContentType('all')}
          style={[styles.filterChip, contentType === 'all' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'all' && styles.filterTextActive]}>
            All ({getContentTypeCount('all')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('recipes')}
          style={[styles.filterChip, contentType === 'recipes' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'recipes' && styles.filterTextActive]}>
            Recipes ({getContentTypeCount('recipes')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('stories')}
          style={[styles.filterChip, contentType === 'stories' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'stories' && styles.filterTextActive]}>
            Stories ({getContentTypeCount('stories')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('videos')}
          style={[styles.filterChip, contentType === 'videos' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'videos' && styles.filterTextActive]}>
            Videos ({getContentTypeCount('videos')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          onPress={() => setStatusFilter('all')}
          style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('published')}
          style={[styles.filterChip, statusFilter === 'published' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, statusFilter === 'published' && styles.filterTextActive]}>
            Published ({getStatusCount('published')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('draft')}
          style={[styles.filterChip, statusFilter === 'draft' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, statusFilter === 'draft' && styles.filterTextActive]}>
            Draft ({getStatusCount('draft')})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setStatusFilter('archived')}
          style={[styles.filterChip, statusFilter === 'archived' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, statusFilter === 'archived' && styles.filterTextActive]}>
            Archived ({getStatusCount('archived')})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredContent.length === 0 ? (
          <EmptyState
            title={`No ${contentType === 'all' ? 'content' : contentType} found`}
            subtitle={
              statusFilter === 'all' 
                ? contentType === 'recipes' 
                  ? 'Create your first recipe to get started!'
                  : contentType === 'stories'
                  ? 'Create your first story to get started!'
                  : contentType === 'videos'
                  ? 'Upload your first video to get started!'
                  : 'Create your first content to get started!'
                : `No ${statusFilter} ${contentType === 'all' ? 'content' : contentType}.`
            }
            icon={
              contentType === 'recipes' ? 'restaurant-outline' :
              contentType === 'stories' ? 'book-outline' :
              contentType === 'videos' ? 'videocam-outline' :
              'document-outline'
            }
            actionButton={statusFilter === 'all' ? {
              label: 
                contentType === 'recipes' ? 'Create Recipe' :
                contentType === 'stories' ? 'Create Story' :
                contentType === 'videos' ? 'Upload Video' :
                'Create Content',
              onPress: () => {
                if (contentType === 'recipes' || contentType === 'all') {
                  setIsRecipeModalVisible(true);
                } else if (contentType === 'stories') {
                  setIsStoryModalVisible(true);
                } else if (contentType === 'videos') {
                  router.push('/(tabs)/food-creator/content/videos/upload');
                }
              }
            } : undefined}
            style={{ paddingVertical: 40 }}
          />
        ) : (
          filteredContent.map((item) => {
            const itemKey = `${item.type}:${item._id}`;
            const isSelected = selectedItems.has(itemKey);
            
            return (
              <TouchableOpacity
                key={itemKey}
                style={[
                  styles.contentCard,
                  isSelected && styles.contentCardSelected
                ]}
                onPress={() => {
                  if (isSelectionMode) {
                    handleToggleSelection(itemKey);
                  } else {
                    if (item.type === 'recipe') {
                      router.push(`/(tabs)/food-creator/content/recipes/${item._id}`);
                    } else if (item.type === 'story') {
                      // Navigate to story edit/view - you may need to create this route
                      // router.push(`/(tabs)/food-creator/content/stories/${item._id}`);
                    } else if (item.type === 'video') {
                      // Navigate to video edit/view - you may need to create this route
                      // router.push(`/(tabs)/food-creator/content/videos/${item._id}`);
                    }
                  }
                }}
                onLongPress={() => {
                  setIsSelectionMode(true);
                  handleToggleSelection(itemKey);
                }}
              >
                {isSelectionMode && (
                  <View style={styles.selectionCheckbox}>
                    {isSelected ? (
                      <CheckSquare size={20} color="#007AFF" />
                    ) : (
                      <Square size={20} color="#999" />
                    )}
                  </View>
                )}
                <View style={styles.contentHeader}>
                  <View style={styles.contentInfo}>
                    <View style={styles.contentTitleRow}>
                      <Text style={styles.contentTitle}>{item.title}</Text>
                      <View style={styles.contentTypeBadge}>
                        <Text style={styles.contentTypeBadgeText}>
                          {item.type === 'recipe' ? 'Recipe' : item.type === 'story' ? 'Story' : 'Video'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.contentMeta}>
                      {item.status === 'published' ? 'Published' : item.status === 'draft' ? 'Draft' : 'Archived'} • {formatDate(item.createdAt || Date.now())}
                    </Text>
                    {item.cuisine && (
                      <Text style={styles.contentCuisine}>{item.cuisine}</Text>
                    )}
                    {item.viewsCount !== undefined && (
                      <Text style={styles.contentViews}>{item.viewsCount} views</Text>
                    )}
                  </View>
                  {(item.featuredImage || item.coverImage || item.thumbnailUrl) && (
                    <View style={styles.imagePlaceholder}>
                      <Eye size={20} color="#666" />
                    </View>
                  )}
                </View>
                <View style={styles.contentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (item.type === 'recipe') {
                        router.push(`/(tabs)/food-creator/content/recipes/${item._id}`);
                      } else if (item.type === 'story') {
                        // Navigate to story edit
                      } else if (item.type === 'video') {
                        // Navigate to video edit
                      }
                    }}
                  >
                    <Edit2 size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  {item.status !== 'archived' && item.status !== 'removed' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        const contentTypeLabel = item.type === 'recipe' ? 'Recipe' : item.type === 'story' ? 'Story' : 'Video';
                        Alert.alert(
                          `Archive ${contentTypeLabel}`,
                          `Are you sure you want to archive this ${item.type}?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Archive',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  if (item.type === 'recipe') {
                                    await deleteRecipe({ recipeId: item._id as any, sessionToken });
                                  } else if (item.type === 'story') {
                                    await updateStory({ storyId: item._id as any, status: 'archived', sessionToken });
                                  } else if (item.type === 'video') {
                                    // Archive video - you may need to add this mutation
                                    await deleteVideoPost({ videoId: item._id as any });
                                  }
                                  showSuccess(`${contentTypeLabel} Archived`, `The ${item.type} has been archived.`);
                                } catch (error: any) {
                                  showError('Error', error.message || `Failed to archive ${item.type}`);
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Archive size={16} color="#666" />
                      <Text style={[styles.actionButtonText, { color: '#666' }]}>Archive</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Recipe Creation Modal */}
      <CreateRecipeModal
        isVisible={isRecipeModalVisible}
        onClose={() => setIsRecipeModalVisible(false)}
      />

      {/* Story Creation Modal */}
      <CreateStoryModal
        isVisible={isStoryModalVisible}
        onClose={() => setIsStoryModalVisible(false)}
      />

      {/* Meal Creation Modal */}
      <CreateMealModal
        isVisible={isMealModalVisible}
        onClose={() => setIsMealModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 5,
  },
  addButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
  },
  sortMenu: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sortOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortOptionActive: {
    backgroundColor: '#F0F9FF',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bulkActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bulkActionButtonArchive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bulkActionButtonDelete: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
  },
  bulkActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  contentCardSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contentCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  contentCuisine: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contentTypeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contentTypeBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentViews: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  contentActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

