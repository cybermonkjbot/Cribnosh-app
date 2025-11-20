import { Card } from '@/components/ui/Card';
import { CreateMealModal } from '@/components/ui/CreateMealModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit2, Eye, EyeOff, Plus, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'available' | 'unavailable';

export default function MealsManagementScreen() {
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isMealModalVisible, setIsMealModalVisible] = useState(false);

  const deleteMeal = useMutation(api.mutations.meals.deleteMeal);
  const updateMeal = useMutation(api.mutations.meals.updateMeal);

  // Get all meals for management (includes all statuses)
  const meals = useQuery(
    api.queries.meals.getAllByChefIdForManagement,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  ) as any[] | undefined;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredMeals = useMemo(() => {
    if (!meals) return [];
    if (statusFilter === 'all') return meals;
    return meals.filter(meal => {
      const status = meal.status || 'unavailable';
      return statusFilter === 'available' 
        ? status === 'available' || status === 'active'
        : status === 'unavailable';
    });
  }, [meals, statusFilter]);

  const getStatusCount = (status: StatusFilter) => {
    if (!meals) return 0;
    if (status === 'all') return meals.length;
    return meals.filter(meal => {
      const mealStatus = meal.status || 'unavailable';
      return status === 'available'
        ? mealStatus === 'available' || mealStatus === 'active'
        : mealStatus === 'unavailable';
    }).length;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal({ mealId: mealId as any, sessionToken });
              showSuccess('Meal Deleted', 'The meal has been deleted successfully.');
            } catch (error: any) {
              showError('Error', error.message || 'Failed to delete meal');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (meal: any) => {
    const currentStatus = meal.status || 'unavailable';
    const newStatus = currentStatus === 'available' || currentStatus === 'active' 
      ? 'unavailable' 
      : 'available';
    
    try {
      await updateMeal({
        mealId: meal._id,
        updates: { status: newStatus },
        sessionToken,
      });
      showSuccess(
        'Status Updated',
        `Meal is now ${newStatus === 'available' ? 'available' : 'unavailable'}.`
      );
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update meal status');
    }
  };

  if (!chef) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading meals...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#031D11" />
          </TouchableOpacity>
          <Text style={styles.title}>Meal Management</Text>
          <TouchableOpacity
            onPress={() => setIsMealModalVisible(true)}
            style={styles.addButton}
          >
            <Plus size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.filterContent}>
            <TouchableOpacity
              onPress={() => setStatusFilter('all')}
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>
                All ({getStatusCount('all')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('available')}
              style={[styles.filterChip, statusFilter === 'available' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, statusFilter === 'available' && styles.filterTextActive]}>
                Available ({getStatusCount('available')})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatusFilter('unavailable')}
              style={[styles.filterChip, statusFilter === 'unavailable' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, statusFilter === 'unavailable' && styles.filterTextActive]}>
                Unavailable ({getStatusCount('unavailable')})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meals List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredMeals.length === 0 ? (
            <EmptyState
              title={statusFilter === 'all' ? 'No meals yet' : `No ${statusFilter} meals`}
              subtitle={statusFilter === 'all' 
                ? 'Create your first meal to get started!' 
                : `You don't have any ${statusFilter} meals.`}
              icon="utensils"
              actionButton={statusFilter === 'all' ? {
                label: 'Create Meal',
                onPress: () => setIsMealModalVisible(true)
              } : undefined}
              style={{ paddingVertical: 40 }}
            />
          ) : (
            filteredMeals.map((meal) => {
              const mealStatus = meal.status || 'unavailable';
              const isAvailable = mealStatus === 'available' || mealStatus === 'active';
              const primaryImage = Array.isArray(meal.images) && meal.images.length > 0 
                ? meal.images[0] 
                : null;

              return (
                <Card key={meal._id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    {primaryImage ? (
                      <Image source={{ uri: primaryImage }} style={styles.mealImage} />
                    ) : (
                      <View style={styles.mealImagePlaceholder}>
                        <Text style={styles.mealImagePlaceholderText}>
                          {meal.name?.charAt(0)?.toUpperCase() || 'M'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name || 'Unnamed Meal'}</Text>
                      <Text style={styles.mealPrice}>
                        £{((meal.price || 0) / 100).toFixed(2)}
                      </Text>
                      <View style={styles.mealMeta}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: isAvailable ? '#D1FAE5' : '#FEE2E2' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: isAvailable ? '#065F46' : '#991B1B' }
                          ]}>
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </Text>
                        </View>
                        {meal.createdAt && (
                          <Text style={styles.mealDate}>
                            {formatDate(meal.createdAt)}
                          </Text>
                        )}
                      </View>
                      {meal.cuisine && Array.isArray(meal.cuisine) && meal.cuisine.length > 0 && (
                        <View style={styles.cuisineTags}>
                          {meal.cuisine.slice(0, 3).map((cuisine: string, index: number) => (
                            <View key={index} style={styles.cuisineTag}>
                              <Text style={styles.cuisineTagText}>{cuisine}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {meal.description && (
                    <Text style={styles.mealDescription} numberOfLines={2}>
                      {meal.description}
                    </Text>
                  )}

                  <View style={styles.mealActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleToggleStatus(meal)}
                    >
                      {isAvailable ? (
                        <EyeOff size={16} color="#666" />
                      ) : (
                        <Eye size={16} color="#10B981" />
                      )}
                      <Text style={[styles.actionButtonText, { color: isAvailable ? '#666' : '#10B981' }]}>
                        {isAvailable ? 'Make Unavailable' : 'Make Available'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        // TODO: Navigate to edit screen or open edit modal
                        showError('Coming Soon', 'Edit functionality will be available soon.');
                      }}
                    >
                      <Edit2 size={16} color="#007AFF" />
                      <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteMeal(meal._id, meal.name || 'this meal')}
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>

        {/* Meal Creation Modal */}
        <CreateMealModal
          isVisible={isMealModalVisible}
          onClose={() => setIsMealModalVisible(false)}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#031D11',
    flex: 1,
    marginLeft: 12,
  },
  addButton: {
    padding: 5,
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
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
    paddingBottom: 120, // Account for tab bar
  },
  mealCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mealHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  mealImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealImagePlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#031D11',
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  cuisineTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  cuisineTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cuisineTagText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  mealDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  mealActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

