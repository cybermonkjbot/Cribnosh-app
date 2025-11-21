import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { CreateRecipeModal } from '@/components/ui/CreateRecipeModal';
import { CreateStoryModal } from '@/components/ui/CreateStoryModal';
import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { ArrowLeft, Plus, Edit2, Eye, Archive, Search, X, CheckSquare, Square, SortAsc, Trash2 } from 'lucide-react-native';
import { TextInput } from 'react-native';

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

  const deleteRecipe = useMutation(api.mutations.recipes.deleteRecipe);

  // Get recipes by author (chef name) - returns all statuses
  const recipes = useQuery(
    api.queries.recipes.getByAuthor,
    chef?.name && sessionToken
      ? { author: chef.name, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredRecipes = React.useMemo(() => {
    let filtered = recipes || [];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(recipe => recipe.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title?.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.cuisine?.toLowerCase().includes(query)
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
  }, [recipes, statusFilter, searchQuery, sortOption]) || [];

  const getStatusCount = (status: string) => {
    return recipes?.filter(recipe => recipe.status === status).length || 0;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleToggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredRecipes.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredRecipes.map(r => r._id)));
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
              // Perform bulk actions
              for (const itemId of selectedItems) {
                if (action === 'delete') {
                  await deleteRecipe({ recipeId: itemId as any, sessionToken });
                } else {
                  // Update status - you'll need to implement updateRecipe mutation
                  // await updateRecipe({ recipeId: itemId, status: action === 'publish' ? 'published' : 'archived', sessionToken });
                }
              }
              setSelectedItems(new Set());
              setIsSelectionMode(false);
              showSuccess(
                'Success',
                `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} ${actionText}ed successfully.`
              );
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
                {selectedItems.size === filteredRecipes.length ? (
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
            All ({recipes?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('recipes')}
          style={[styles.filterChip, contentType === 'recipes' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'recipes' && styles.filterTextActive]}>
            Recipes ({recipes?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('stories')}
          style={[styles.filterChip, contentType === 'stories' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'stories' && styles.filterTextActive]}>
            Stories (0)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setContentType('videos')}
          style={[styles.filterChip, contentType === 'videos' && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, contentType === 'videos' && styles.filterTextActive]}>
            Videos (0)
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
        {contentType === 'all' || contentType === 'recipes' ? (
          filteredRecipes.length === 0 ? (
            <EmptyState
              title="No recipes found"
              subtitle={statusFilter === 'all' ? 'Create your first recipe to get started!' : `No ${statusFilter} recipes.`}
              icon="restaurant-outline"
              actionButton={statusFilter === 'all' ? {
                label: 'Create Recipe',
                onPress: () => setIsRecipeModalVisible(true)
              } : undefined}
              style={{ paddingVertical: 40 }}
            />
          ) : (
            filteredRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe._id}
                style={[
                  styles.contentCard,
                  selectedItems.has(recipe._id) && styles.contentCardSelected
                ]}
                onPress={() => {
                  if (isSelectionMode) {
                    handleToggleSelection(recipe._id);
                  } else {
                    router.push(`/(tabs)/chef/content/recipes/${recipe._id}`);
                  }
                }}
                onLongPress={() => {
                  setIsSelectionMode(true);
                  handleToggleSelection(recipe._id);
                }}
              >
                {isSelectionMode && (
                  <View style={styles.selectionCheckbox}>
                    {selectedItems.has(recipe._id) ? (
                      <CheckSquare size={20} color="#007AFF" />
                    ) : (
                      <Square size={20} color="#999" />
                    )}
                  </View>
                )}
                <View style={styles.contentHeader}>
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle}>{recipe.title}</Text>
                    <Text style={styles.contentMeta}>
                      {recipe.status === 'published' ? 'Published' : recipe.status === 'draft' ? 'Draft' : 'Archived'} • {formatDate(recipe.createdAt || Date.now())}
                    </Text>
                    {recipe.cuisine && (
                      <Text style={styles.contentCuisine}>{recipe.cuisine}</Text>
                    )}
                  </View>
                  {recipe.featuredImage && (
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
                      router.push(`/(tabs)/chef/content/recipes/${recipe._id}`);
                    }}
                  >
                    <Edit2 size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  {recipe.status !== 'archived' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        Alert.alert(
                          'Archive Recipe',
                          'Are you sure you want to archive this recipe?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Archive',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await deleteRecipe({ recipeId: recipe._id, sessionToken });
                                  showSuccess('Recipe Archived', 'The recipe has been archived.');
                                } catch (error: any) {
                                  showError('Error', error.message || 'Failed to archive recipe');
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
            ))
          )
        ) : contentType === 'stories' ? (
          <EmptyState
            title="No stories found"
            subtitle={statusFilter === 'all' ? 'Create your first story to get started!' : `No ${statusFilter} stories.`}
            icon="book-outline"
            actionButton={statusFilter === 'all' ? {
              label: 'Create Story',
              onPress: () => setIsStoryModalVisible(true)
            } : undefined}
            style={{ paddingVertical: 40 }}
          />
        ) : (
          <EmptyState
            title="Coming Soon"
            subtitle="Video management will be available soon."
            icon="time-outline"
            style={{ paddingVertical: 40 }}
          />
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

