"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AdminFilterBar, FilterOption } from '@/components/admin/admin-filter-bar';
import { StatusBadge } from '@/components/admin/content/StatusBadge';
import { EmptyState } from '@/components/admin/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
    CheckCircle,
    ChefHat,
    Edit,
    Image as ImageIcon,
    Plus,
    PoundSterling,
    Star,
    Trash2,
    Utensils,
    X
} from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface Meal {
  _id: Id<"meals">;
  chefId: Id<"chefs">;
  name: string;
  description: string;
  price: number;
  cuisine: string[];
  dietary: string[];
  status: "available" | "unavailable";
  rating?: number;
  images: string[];
  calories?: number;
  ingredients?: Array<{
    name: string;
    quantity?: string;
    isAllergen?: boolean;
    allergenType?: string;
  }>;
  chef?: {
    _id: Id<"chefs">;
    name?: string;
    bio?: string;
    specialties?: string[];
    rating?: number;
    profileImage?: string | null;
  };
  reviewCount?: number;
  averageRating?: number;
}

export default function MealsManagementPage() {
  const { user: adminUser, sessionToken } = useAdminUser();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<Id<"meals"> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; mealId: Id<"meals"> | null }>({
    isOpen: false,
    mealId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: number;
    cuisine: string[];
    dietary: string[];
    status: "available" | "unavailable";
    images: string[];
    calories: number | undefined;
    cuisineInput: string;
    dietaryInput: string;
  }>({
    name: '',
    description: '',
    price: 0,
    cuisine: [],
    dietary: [],
    status: 'available',
    images: [],
    calories: undefined,
    cuisineInput: '',
    dietaryInput: '',
  });

  // Fetch all meals
  const mealsData = useQuery(
    api.queries.meals.getAll,
    sessionToken ? { limit: 1000 } : "skip"
  );
  
  const allMeals = (mealsData || []) as Meal[];

  // Mutations
  const updateMeal = useMutation(api.mutations.meals.updateMeal);
  const deleteMeal = useMutation(api.mutations.meals.deleteMeal);

  // Get unique cuisines for filter
  const cuisines = useMemo(() => {
    const uniqueCuisines = new Set<string>();
    allMeals.forEach((meal: Meal) => {
      meal.cuisine?.forEach(c => uniqueCuisines.add(c));
    });
    return Array.from(uniqueCuisines).sort();
  }, [allMeals]);

  // Filter meals
  const filteredMeals = useMemo(() => {
    let filtered = [...allMeals];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((meal: Meal) =>
        meal.name.toLowerCase().includes(searchLower) ||
        meal.description?.toLowerCase().includes(searchLower) ||
        meal.cuisine?.some(c => c.toLowerCase().includes(searchLower)) ||
        meal.chef?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((meal: Meal) => meal.status === statusFilter);
    }

    // Cuisine filter
    if (cuisineFilter !== 'all') {
      filtered = filtered.filter((meal: Meal) => 
        meal.cuisine?.includes(cuisineFilter)
      );
    }

    // Sort
    filtered.sort((a: Meal, b: Meal) => {
      switch (sortBy) {
        case 'recent':
          // Use _creationTime if available, otherwise use a default
          return (b as any)._creationTime - (a as any)._creationTime;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return (b as any)._creationTime - (a as any)._creationTime;
      }
    });

    return filtered;
  }, [allMeals, searchTerm, statusFilter, cuisineFilter, sortBy]);

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'available', label: 'Available' },
        { value: 'unavailable', label: 'Unavailable' },
      ],
    },
    {
      key: 'cuisine',
      label: 'Cuisine',
      value: cuisineFilter,
      onChange: setCuisineFilter,
      options: [
        { value: 'all', label: 'All Cuisines' },
        ...cuisines.map(c => ({ value: c, label: c })),
      ],
    },
    {
      key: 'sort',
      label: 'Sort By',
      value: sortBy,
      onChange: setSortBy,
      options: [
        { value: 'recent', label: 'Most Recent' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'name', label: 'Name A-Z' },
      ],
    },
  ];

  const handleCreateNew = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      price: 0,
      cuisine: [],
      dietary: [],
      status: 'available',
      images: [],
      calories: undefined,
      cuisineInput: '',
      dietaryInput: '',
    });
  };

  const handleEdit = (meal: Meal) => {
    setIsEditing(meal._id);
    setFormData({
      name: meal.name,
      description: meal.description,
      price: meal.price,
      cuisine: meal.cuisine || [],
      dietary: meal.dietary || [],
      status: meal.status,
      images: meal.images || [],
      calories: meal.calories,
      cuisineInput: '',
      dietaryInput: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    try {
      if (isEditing) {
        await updateMeal({
          mealId: isEditing,
          updates: {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            cuisine: formData.cuisine,
            dietary: formData.dietary,
            status: formData.status,
            images: formData.images,
            rating: undefined, // Keep existing rating
          },
          sessionToken,
        });
        toast({
          title: "Success",
          description: "Meal updated successfully!",
          variant: "default",
        });
      } else {
        // For creating, we'd need chefId - this is a placeholder
        toast({
          title: "Info",
          description: "Meal creation requires chef selection. Use the create interface.",
          variant: "default",
        });
      }
      setIsCreating(false);
      setIsEditing(null);
      setError(null);
      setSuccess('Meal saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save meal');
      toast({
        title: "Error",
        description: err.message || "Failed to save meal",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (mealId: Id<"meals">) => {
    setDeleteConfirm({ isOpen: true, mealId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.mealId) return;
    try {
      await deleteMeal({ 
        mealId: deleteConfirm.mealId,
        sessionToken,
      });
      toast({
        title: "Success",
        description: "Meal deleted successfully!",
        variant: "default",
      });
      setDeleteConfirm({ isOpen: false, mealId: null });
      setSuccess('Meal deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete meal');
      toast({
        title: "Error",
        description: err.message || "Failed to delete meal",
        variant: "destructive",
      });
    }
  };

  const addCuisine = () => {
    if (formData.cuisineInput.trim() && !formData.cuisine.includes(formData.cuisineInput.trim())) {
      setFormData({
        ...formData,
        cuisine: [...formData.cuisine, formData.cuisineInput.trim()],
        cuisineInput: '',
      });
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine.filter(c => c !== cuisine),
    });
  };

  const addDietary = () => {
    if (formData.dietaryInput.trim() && !formData.dietary.includes(formData.dietaryInput.trim())) {
      setFormData({
        ...formData,
        dietary: [...formData.dietary, formData.dietaryInput.trim()],
        dietaryInput: '',
      });
    }
  };

  const removeDietary = (dietary: string) => {
    setFormData({
      ...formData,
      dietary: formData.dietary.filter(d => d !== dietary),
    });
  };

  // Stats
  const stats = useMemo(() => {
    const total = allMeals.length;
    const available = allMeals.filter((m: Meal) => m.status === 'available').length;
    const unavailable = allMeals.filter((m: Meal) => m.status === 'unavailable').length;
    const avgRating = allMeals.length > 0
      ? allMeals.reduce((sum: number, m: Meal) => sum + (m.averageRating || 0), 0) / allMeals.length
      : 0;
    return { total, available, unavailable, avgRating };
  }, [allMeals]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Meals & Dishes</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage meals and dishes from all chefs</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Meal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Utensils className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Meals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unavailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgRating.toFixed(1)}</p>
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
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <AdminFilterBar
        searchPlaceholder="Search meals by name, description, cuisine, or chef..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterOptions}
        onClearAll={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setCuisineFilter('all');
          setSortBy('recent');
        }}
      />

      {/* Meals List */}
      {filteredMeals.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No meals found"
          description={searchTerm || statusFilter !== 'all' || cuisineFilter !== 'all'
            ? "Try adjusting your filters to see more results"
            : "Get started by creating your first meal"}
          action={!searchTerm && statusFilter === 'all' && cuisineFilter === 'all' ? {
            label: "Create Meal",
            onClick: handleCreateNew,
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((meal: Meal) => (
            <motion.div
              key={meal._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-100">
                {meal.images && meal.images.length > 0 ? (
                  <Image
                    src={meal.images[0]}
                    alt={meal.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={meal.status} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{meal.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{meal.description}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <PoundSterling className="w-4 h-4 text-gray-600" />
                    <span className="font-bold text-gray-900">{meal.price.toFixed(2)}</span>
                  </div>
                  {meal.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-700">
                        {meal.averageRating.toFixed(1)}
                        {meal.reviewCount && ` (${meal.reviewCount})`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {meal.chef?.name && (
                    <Badge variant="outline" className="text-xs">
                      <ChefHat className="w-3 h-3 mr-1" />
                      {meal.chef.name}
                    </Badge>
                  )}
                  {meal.cuisine && meal.cuisine.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {meal.cuisine[0]}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(meal)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(meal._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || isEditing !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setIsEditing(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Meal' : 'Create New Meal'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update meal details' : 'Add a new meal to the platform'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter meal name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter meal description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (£) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="cuisine">Cuisine</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="cuisine"
                  value={formData.cuisineInput}
                  onChange={(e) => setFormData({ ...formData, cuisineInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCuisine();
                    }
                  }}
                  placeholder="Add cuisine and press Enter"
                />
                <Button type="button" onClick={addCuisine} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.cuisine.map((cuisine) => (
                  <Badge key={cuisine} variant="secondary" className="flex items-center gap-1">
                    {cuisine}
                    <button
                      onClick={() => removeCuisine(cuisine)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="dietary">Dietary Requirements</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="dietary"
                  value={formData.dietaryInput}
                  onChange={(e) => setFormData({ ...formData, dietaryInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDietary();
                    }
                  }}
                  placeholder="Add dietary requirement and press Enter"
                />
                <Button type="button" onClick={addDietary} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.dietary.map((dietary) => (
                  <Badge key={dietary} variant="secondary" className="flex items-center gap-1">
                    {dietary}
                    <button
                      onClick={() => removeDietary(dietary)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setIsEditing(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, mealId: null })}
        onConfirm={confirmDelete}
        title="Delete Meal"
        message="Are you sure you want to delete this meal? This action cannot be undone."
        confirmText="Delete"
        type="error"
      />
    </div>
  );
}

