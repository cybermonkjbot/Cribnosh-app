"use client";

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Star,
  Tag,
  Utensils,
  Flame,
  ChefHat as ChefIcon
} from 'lucide-react';
import { EmptyState } from '@/components/admin/empty-state';

interface Recipe {
  _id: Id<"recipes">;
  title: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
    unit: string;
  }[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  images: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  rating: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
}

export default function RecipeManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New recipe form
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [''],
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    difficulty: 'easy' as const,
    cuisine: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as const,
    featuredImage: '',
    images: [] as string[]
  });

  // Fetch data
  const recipes = useQuery(api.queries.content.getRecipes);
  const cuisines = useQuery(api.queries.content.getCuisines);
  const categories = useQuery(api.queries.content.getRecipeCategories);

  // Mutations
  const createRecipe = useMutation(api.mutations.content.createRecipe);
  const updateRecipe = useMutation(api.mutations.content.updateRecipe);
  const deleteRecipe = useMutation(api.mutations.content.deleteRecipe);
  const publishRecipe = useMutation(api.mutations.content.publishRecipe);

  const handleCreateRecipe = async () => {
    if (!newRecipe.title.trim() || !newRecipe.description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      await createRecipe({
        ...newRecipe,
        ingredients: newRecipe.ingredients.filter(ing => ing.name.trim()),
        instructions: newRecipe.instructions.filter(inst => inst.trim())
      });
      
      setNewRecipe({
        title: '',
        description: '',
        ingredients: [{ name: '', amount: '', unit: '' }],
        instructions: [''],
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        difficulty: 'easy',
        cuisine: '',
        category: '',
        tags: [],
        status: 'draft',
        featuredImage: '',
        images: []
      });
      setIsCreating(false);
      setSuccess('Recipe created successfully');
      setError(null);
    } catch (err) {
      setError('Failed to create recipe');
    }
  };

  const handleUpdateRecipe = async (recipeId: Id<"recipes">, updates: Partial<Recipe>) => {
    try {
      await updateRecipe({ recipeId, ...updates });
      setSuccess('Recipe updated successfully');
      setError(null);
      setIsEditing(null);
    } catch (err) {
      setError('Failed to update recipe');
    }
  };

  const handleDeleteRecipe = async (recipeId: Id<"recipes">) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe({ recipeId });
        setSuccess('Recipe deleted successfully');
        setError(null);
      } catch (err) {
        setError('Failed to delete recipe');
      }
    }
  };

  const handlePublishRecipe = async (recipeId: Id<"recipes">) => {
    try {
      await publishRecipe({ recipeId });
      setSuccess('Recipe published successfully');
      setError(null);
    } catch (err) {
      setError('Failed to publish recipe');
    }
  };

  const addIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  const addInstruction = () => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setNewRecipe(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => 
        i === index ? value : inst
      )
    }));
  };

  const filteredRecipes = recipes?.filter((recipe: any) => {
    const matchesSearch = 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags.some((tag: any) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || recipe.status === statusFilter;
    const matchesCuisine = cuisineFilter === 'all' || recipe.cuisine === cuisineFilter;
    const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
    
    return matchesSearch && matchesStatus && matchesCuisine && matchesDifficulty;
  }).sort((a: any, b: any) => {
    switch (sortBy) {
      case 'recent':
        return b.updatedAt - a.updatedAt;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'rating':
        return b.rating - a.rating;
      case 'prepTime':
        return a.prepTime - b.prepTime;
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

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-100 text-green-800">Easy</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'hard':
        return <Badge className="bg-red-100 text-red-800">Hard</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  const uniqueCuisines = Array.from(new Set(recipes?.map((recipe: any) => recipe.cuisine) || []));
  const uniqueCategories = Array.from(new Set(recipes?.map((recipe: any) => recipe.category) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Recipe Management</h1>
          <p className="text-gray-600 font-satoshi mt-2">Create and manage recipe database</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Recipe
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChefHat className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Recipes</p>
                <p className="text-2xl font-bold text-gray-900">{recipes?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Utensils className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recipes?.filter((r: any) => r.status === 'published').length || 0}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {recipes?.length ? (recipes.reduce((sum: any, r: any) => sum + r.rating, 0) / recipes.length).toFixed(1) : '0.0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Flame className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cuisines</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueCuisines.length}</p>
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

      {/* Create Recipe Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
            <CardDescription>Add a new recipe to the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={newRecipe.title}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter recipe title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cuisine</label>
                <Select value={newRecipe.cuisine} onValueChange={(value) => setNewRecipe(prev => ({ ...prev, cuisine: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCuisines.map((cuisine: any) => (
                      <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newRecipe.description}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter recipe description"
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Prep Time (min)</label>
                <Input
                  type="number"
                  value={newRecipe.prepTime}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Cook Time (min)</label>
                <Input
                  type="number"
                  value={newRecipe.cookTime}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Servings</label>
                <Input
                  type="number"
                  value={newRecipe.servings}
                  onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                <Select value={newRecipe.difficulty} onValueChange={(value) => setNewRecipe(prev => ({ ...prev, difficulty: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select value={newRecipe.category} onValueChange={(value) => setNewRecipe(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCategories.map((category: any) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <Input
                  value={newRecipe.tags.join(', ')}
                  onChange={(e) => setNewRecipe(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map((tag: any) => tag.trim()).filter(Boolean)
                  }))}
                  placeholder="Enter tags"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Ingredients</label>
                <Button size="sm" variant="outline" onClick={addIngredient}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              <div className="space-y-2">
                {newRecipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Amount"
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                      className="w-24"
                    />
                    <Input
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="w-20"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Instructions</label>
                <Button size="sm" variant="outline" onClick={addInstruction}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {newRecipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center text-sm font-medium text-[#F23E2E]">
                      {index + 1}
                    </div>
                    <textarea
                      placeholder="Enter instruction step"
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeInstruction(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRecipe} className="bg-[#F23E2E] hover:bg-[#F23E2E]/90">
                Create Recipe
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
            placeholder="Search recipes..."
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
        
        <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Cuisine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cuisines</SelectItem>
            {uniqueCuisines.map((cuisine: any) => (
              <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="prepTime">Prep Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe: any) => (
          <Card key={recipe._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">{recipe.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {getStatusBadge(recipe.status)}
                  {getDifficultyBadge(recipe.difficulty)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Recipe Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{recipe.prepTime + recipe.cookTime} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{recipe.rating.toFixed(1)} ({recipe.reviewCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefIcon className="w-4 h-4 text-gray-500" />
                  <span>{recipe.cuisine}</span>
                </div>
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 3).map((tag: any) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{recipe.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {/* View recipe */}}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(recipe._id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {recipe.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handlePublishRecipe(recipe._id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteRecipe(recipe._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <EmptyState
          icon={ChefHat}
          title={searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? "No recipes found" : "No recipes yet"}
          description={searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
            ? "Try adjusting your search or filter criteria" 
            : "Create your first recipe to get started"}
          action={searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? {
            label: "Clear filters",
            onClick: () => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStatusFilter('all');
            },
            variant: "secondary"
          } : {
            label: "Create Recipe",
            onClick: () => setIsCreating(true),
            variant: "primary"
          }}
          variant={searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' ? "filtered" : "no-data"}
        />
      )}
    </div>
  );
}
