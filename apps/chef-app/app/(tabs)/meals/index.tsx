import { EmptyState } from '@/components/ui/EmptyState';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit2, Eye, EyeOff, MoreVertical, Plus, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type StatusFilter = 'all' | 'available' | 'unavailable';

export default function MealsManagementScreen() {
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  const actionSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);

  const deleteMeal = useMutation(api.mutations.meals.deleteMeal);
  const updateMeal = useMutation(api.mutations.meals.updateMeal);

  // Get all meals for management (includes all statuses)
  const meals = useQuery(
    api.queries.meals.getAllByChefIdForManagement,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken, limit: 100 }
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

  useEffect(() => {
    if (selectedMealId) {
      actionSheetRef.current?.expand();
    } else {
      actionSheetRef.current?.close();
    }
  }, [selectedMealId]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedMealId(null);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    []
  );

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
      actionSheetRef.current?.close();
      setSelectedMealId(null);
    } catch (error: any) {
      showError('Error', error.message || 'Failed to update meal status');
    }
  };

  const handleOpenActionMenu = (mealId: string) => {
    setSelectedMealId(mealId);
  };

  const handleCloseActionMenu = () => {
    actionSheetRef.current?.close();
    setSelectedMealId(null);
  };

  const getSelectedMeal = () => {
    if (!selectedMealId || !meals) return null;
    return meals.find(meal => meal._id === selectedMealId);
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Meal Management</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/meals/create')}
            style={styles.addButton}
          >
            <Plus size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Status Filters */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
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
          </ScrollView>
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
              icon="restaurant-outline"
              actionButton={statusFilter === 'all' ? {
                label: 'Create Meal',
                onPress: () => router.push('/(tabs)/meals/create')
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
                <View key={meal._id} style={styles.mealCard}>
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
                      <View style={styles.mealTitleRow}>
                        <Text style={styles.mealName} numberOfLines={1}>
                          {meal.name || 'Unnamed Meal'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleOpenActionMenu(meal._id)}
                          style={styles.moreButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <MoreVertical size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.mealPrice}>
                        £{((meal.price || 0) / 100).toFixed(2)}
                      </Text>
                      <View style={styles.mealMeta}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: isAvailable ? '#FFE5E5' : '#FEE2E2' }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: isAvailable ? '#FF3B30' : '#991B1B' }
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
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Action Menu Bottom Sheet */}
        <BottomSheet
          ref={actionSheetRef}
          snapPoints={snapPoints}
          index={-1}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          backgroundStyle={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          containerStyle={{
            zIndex: 1000000,
          }}
        >
          <BottomSheetView style={styles.actionSheetContainer}>
            {(() => {
              const selectedMeal = getSelectedMeal();
              if (!selectedMeal) return null;
              const mealStatus = selectedMeal.status || 'unavailable';
              const isMealAvailable = mealStatus === 'available' || mealStatus === 'active';

              return (
                <>
                  <View style={styles.actionSheetHeader}>
                    <Text style={styles.actionSheetTitle}>Meal Actions</Text>
                    <TouchableOpacity onPress={handleCloseActionMenu} style={styles.closeButton}>
                      <X size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionMenuItems}>
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => {
                        handleToggleStatus(selectedMeal);
                      }}
                      activeOpacity={0.7}
                    >
                      {isMealAvailable ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#FF3B30" />
                      )}
                      <Text style={[styles.actionMenuItemText, { color: isMealAvailable ? '#6B7280' : '#FF3B30' }]}>
                        {isMealAvailable ? 'Make Unavailable' : 'Make Available'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => {
                        handleCloseActionMenu();
                        router.push(`/(tabs)/meals/${selectedMeal._id}/edit`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Edit2 size={20} color="#FF3B30" />
                      <Text style={[styles.actionMenuItemText, { color: '#FF3B30' }]}>Edit</Text>
                    </TouchableOpacity>
                    <View style={styles.actionMenuDivider} />
                    <TouchableOpacity
                      style={styles.actionMenuItem}
                      onPress={() => {
                        handleCloseActionMenu();
                        handleDeleteMeal(selectedMeal._id, selectedMeal.name || 'this meal');
                      }}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={20} color="#EF4444" />
                      <Text style={[styles.actionMenuItemText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </BottomSheetView>
        </BottomSheet>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#FF3B30',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120, // Account for tab bar
  },
  mealCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  mealImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  mealImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealImagePlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  mealPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 8,
    marginTop: 4,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
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
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  cuisineTagText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '500',
  },
  mealDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 4,
  },
  actionSheetContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Archivo',
    color: '#111827',
  },
  actionMenuItems: {
    paddingVertical: 8,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionMenuItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  closeButton: {
    padding: 4,
  },
});

