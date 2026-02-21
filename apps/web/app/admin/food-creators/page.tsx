"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { FoodCreatorFilterBar } from '@/components/admin/food-creator-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  Award,
  Ban,
  BarChart3,
  Calendar,
  CheckCircle,
  ChefHat,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  PoundSterling,
  Shield,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

interface FoodCreator {
  _id: Id<"chefs">;
  userId: Id<"users">;
  bio: string;
  specialties: string[];
  rating: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  location: {
    city: string;
    coordinates: number[];
  };
  isAvailable: boolean;
  availableDays: string[];
  maxOrdersPerDay: number;
  advanceBookingDays: number;
  specialInstructions?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: {
    healthPermit: boolean;
    insurance: boolean;
    backgroundCheck: boolean;
    certifications: string[];
  };
  performance: {
    totalOrders: number;
    completedOrders: number;
    averageRating: number;
    totalEarnings: number;
    lastOrderDate?: number;
  };
  createdAt: number;
  updatedAt: number;
}

function AddFoodCreatorModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const users = useQuery(api.queries.users.getUsersForAdmin);
  const createFoodCreator = useMutation(api.mutations.foodCreators.createFoodCreator);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast({ title: "Error", description: "Please select a user", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const user = users?.find((u: { _id: string }) => u._id === selectedUser);
      if (!user) throw new Error("User not found");

      await createFoodCreator({
        userId: selectedUser as any,
        name: user.name,
        location: { lat: 0, lng: 0, city: "Unknown" },
        status: "active"
      });

      toast({ title: "Success", description: "Food Creator added successfully", variant: "success" });
      onOpenChange(false);
      setSelectedUser("");
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add foodCreator", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Food Creator</DialogTitle>
          <DialogDescription>
            Promote an existing user to a foodCreator. They will be auto-enrolled in compliance training.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user to promote" />
              </SelectTrigger>
              <SelectContent>
                {users && users.map((user: { _id: string; name: string; email: string }) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Food Creator"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FoodCreatorManagementPage() {
  const { user, sessionToken, loading } = useAdminUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFoodCreator, setSelectedFoodCreator] = useState<FoodCreator | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch data - authentication is handled by layout, so user is guaranteed to be authenticated here
  const queryArgs = loading || !sessionToken ? "skip" : { sessionToken };
  const foodCreators = useQuery(api.queries.admin.getChefsWithPerformance, queryArgs) as FoodCreator[] | undefined;
  const foodCreatorStats = useQuery(api.queries.admin.getChefStats, queryArgs);

  // Mutations
  const updateFoodCreatorStatus = useMutation(api.mutations.foodCreators.updateChef);
  const updateFoodCreatorVerification = useMutation((api as any)["mutations/chefAdmin"].updateFoodCreatorVerification);
  const sendFoodCreatorMessage = useMutation((api as any)["mutations/chefAdmin"].sendFoodCreatorMessage);

  // Filter and sort foodCreators
  const filteredFoodCreators = useMemo(() => {
    if (!foodCreators) return [];

    return foodCreators.filter(foodCreator => {
      const matchesSearch = foodCreator.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        foodCreator.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        foodCreator.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || foodCreator.status === statusFilter;
      const matchesVerification = verificationFilter === 'all' || foodCreator.verificationStatus === verificationFilter;

      return matchesSearch && matchesStatus && matchesVerification;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'earnings':
          return b.performance.totalEarnings - a.performance.totalEarnings;
        case 'orders':
          return b.performance.totalOrders - a.performance.totalOrders;
        case 'recent':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [foodCreators, searchTerm, statusFilter, verificationFilter, sortBy]);

  const handleStatusUpdate = async (chefId: Id<"chefs">, newStatus: string) => {
    try {
      await updateFoodCreatorStatus({ chefId, status: newStatus as any });
      toast({
        title: "Food Creator status updated",
        description: "The Food Creator status has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update Food Creator status",
        description: "An error occurred while updating the Food Creator status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerificationUpdate = async (chefId: Id<"chefs">, verificationStatus: string) => {
    try {
      await updateFoodCreatorVerification({ chefId, verificationStatus: verificationStatus as any });
      toast({
        title: "Food Creator verification updated",
        description: "The Food Creator verification status has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update Food Creator verification",
        description: "An error occurred while updating the Food Creator verification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    // Use brand color for active/positive statuses, neutral dark for others
    const statusConfig = {
      active: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      pending_verification: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getVerificationBadge = (status: string) => {
    // Use brand color for verified, neutral dark for others
    const statusConfig = {
      verified: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Loading state
  if (foodCreators === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">Food Creator Management</h1>
            <p className="text-gray-600 font-satoshi mt-2">Manage foodCreators, verification, and performance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check for active filters
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || verificationFilter !== "all";

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Food Creator Management</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage foodCreators, verification, and performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#F23E2E] text-[#F23E2E] hover:bg-[#F23E2E]/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Food Creator
          </Button>
          <Button
            onClick={() => setShowVerificationModal(true)}
            variant="outline"
          >
            Verify Food Creator
          </Button>
        </div>
      </div>

      <AddFoodCreatorModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Food Creators</p>
                  <p className="text-2xl font-bold text-gray-900">{foodCreators?.length || 0}</p>
                </div>
                <ChefHat className="w-8 h-8 text-[#F23E2E]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Food Creators</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodCreators?.filter(c => c.status === 'active').length || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodCreators?.filter(c => c.verificationStatus === 'pending').length || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {foodCreators?.length ? (foodCreators.reduce((sum, c) => sum + c.rating, 0) / foodCreators.length).toFixed(1) : '0.0'}
                  </p>
                </div>
                <Star className="w-8 h-8 text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <FoodCreatorFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        verificationFilter={verificationFilter}
        onVerificationFilterChange={setVerificationFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={foodCreators?.length || 0}
        filteredCount={filteredFoodCreators.length}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex md:grid w-full md:grid-cols-4 bg-white/90 backdrop-blur-lg border border-white/20">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="communication" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Communication
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {filteredFoodCreators.length === 0 ? (
            <EmptyState
              icon={ChefHat}
              title={hasActiveFilters ? "No Food Creators found" : "No Food Creators yet"}
              description={hasActiveFilters
                ? "Try adjusting your search or filter criteria to see more results."
                : "foodCreators will appear here once they register."}
              action={hasActiveFilters ? {
                label: "Clear filters",
                onClick: () => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setVerificationFilter("all");
                },
                variant: "secondary"
              } : undefined}
              variant={hasActiveFilters ? "filtered" : "no-data"}
            />
          ) : (
            <div className="overflow-hidden flex flex-col h-[calc(100vh-480px)]">
              <div className="overflow-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredFoodCreators.map((foodCreator, index) => (
                    <motion.div
                      key={foodCreator._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                                <ChefHat className="w-6 h-6 text-[#F23E2E]" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{foodCreator.bio.substring(0, 30)}...</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm text-gray-600">{foodCreator.location.city}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {getStatusBadge(foodCreator.status)}
                              {getVerificationBadge(foodCreator.verificationStatus)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-1">
                            {foodCreator.specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {foodCreator.specialties.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{foodCreator.specialties.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-gray-900" />
                              <span>{foodCreator.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <PoundSterling className="w-4 h-4 text-gray-900" />
                              <span>${foodCreator.performance.totalEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-900" />
                              <span>{foodCreator.performance.totalOrders} orders</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-900" />
                              <span>{foodCreator.performance.completedOrders} completed</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFoodCreator(foodCreator)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowPerformanceModal(true)}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Food Creator Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedFoodCreator(foodCreator);
                                  setShowVerificationModal(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Full Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Send Message",
                                    description: "Message feature coming soon",
                                  });
                                }}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "View Orders",
                                    description: `Viewing orders for ${foodCreator.bio.substring(0, 30)}...`,
                                  });
                                }}>
                                  <ShoppingBag className="w-4 h-4 mr-2" />
                                  View Orders History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Export Data",
                                    description: "Exporting foodCreator data...",
                                  });
                                }}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Export foodCreator Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to suspend ${foodCreator.bio.substring(0, 30)}?`)) {
                                      handleStatusUpdate(foodCreator._id, 'suspended');
                                    }
                                  }}
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspend Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Creator Verification Queue</CardTitle>
              <CardDescription>
                Review and approve foodCreator applications and verification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredFoodCreators.filter(c => c.verificationStatus === 'pending').length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="No pending verifications"
                  description="All foodCreators have been verified. Great job!"
                  variant="no-data"
                />
              ) : (
                <div className="space-y-4">
                  {filteredFoodCreators.filter(c => c.verificationStatus === 'pending').map((foodCreator) => (
                    <div key={foodCreator._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-[#F23E2E]" />
                          </div>
                          <div>
                            <h3 className="font-medium">{foodCreator.bio.substring(0, 50)}...</h3>
                            <p className="text-sm text-gray-600">{foodCreator.location.city}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerificationUpdate(foodCreator._id, 'verified')}
                            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerificationUpdate(foodCreator._id, 'rejected')}
                            className="border-gray-300 text-gray-900 hover:bg-gray-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Food Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFoodCreators
                    .sort((a: any, b: any) => b.performance.totalEarnings - a.performance.totalEarnings)
                    .slice(0, 5)
                    .map((foodCreator, index) => (
                      <div key={foodCreator._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-[#F23E2E]">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{foodCreator.bio.substring(0, 30)}...</p>
                            <p className="text-sm text-gray-600">{foodCreator.location.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${foodCreator.performance.totalEarnings.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{foodCreator.performance.totalOrders} orders</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Food Creator Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFoodCreators
                    .sort((a: any, b: any) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((foodCreator, index) => (
                      <div key={foodCreator._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <p className="font-medium">{foodCreator.bio.substring(0, 30)}...</p>
                            <p className="text-sm text-gray-600">{foodCreator.location.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{foodCreator.rating.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">{foodCreator.performance.totalOrders} orders</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Creator Communication</CardTitle>
              <CardDescription>
                Send messages, updates, and notifications to foodCreators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {/* Open bulk message modal */ }}
                    className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Bulk Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {/* Open announcement modal */ }}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Send Announcement
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recent Communications</h4>
                  <div className="text-sm text-gray-600">
                    No recent communications. Start by sending a message to your foodCreators.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* foodCreator Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-asgard text-gray-900">
              foodCreator Verification
            </DialogTitle>
          </DialogHeader>

          {selectedFoodCreator && (
            <div className="space-y-6">
              {/* foodCreator Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-[#F23E2E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedFoodCreator.bio}</h3>
                    <p className="text-sm text-gray-600">{selectedFoodCreator.location.city}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedFoodCreator.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verification Status</p>
                    <div className="mt-1">{getVerificationBadge(selectedFoodCreator.verificationStatus)}</div>
                  </div>
                </div>
              </div>

              {/* Verification Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Verification Documents
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedFoodCreator.verificationDocuments.healthPermit ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Health Permit</span>
                    </div>
                    <Badge className={selectedFoodCreator.verificationDocuments.healthPermit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedFoodCreator.verificationDocuments.healthPermit ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedFoodCreator.verificationDocuments.insurance ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Insurance</span>
                    </div>
                    <Badge className={selectedFoodCreator.verificationDocuments.insurance ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedFoodCreator.verificationDocuments.insurance ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedFoodCreator.verificationDocuments.backgroundCheck ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Background Check</span>
                    </div>
                    <Badge className={selectedFoodCreator.verificationDocuments.backgroundCheck ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedFoodCreator.verificationDocuments.backgroundCheck ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  {selectedFoodCreator.verificationDocuments.certifications.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFoodCreator.verificationDocuments.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="secondary">{cert}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFoodCreator.specialties.map((specialty, idx) => (
                    <Badge key={idx} className="bg-[#F23E2E]/10 text-[#F23E2E]">{specialty}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowVerificationModal(false);
                setSelectedFoodCreator(null);
              }}
            >
              Close
            </Button>
            {selectedFoodCreator && selectedFoodCreator.verificationStatus === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleVerificationUpdate(selectedFoodCreator._id, 'rejected');
                    setShowVerificationModal(false);
                    setSelectedFoodCreator(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  onClick={() => {
                    handleVerificationUpdate(selectedFoodCreator._id, 'verified');
                    setShowVerificationModal(false);
                    setSelectedFoodCreator(null);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* foodCreator Performance Modal */}
      <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-asgard text-gray-900">
              foodCreator Performance Metrics
            </DialogTitle>
          </DialogHeader>

          {selectedFoodCreator && (
            <div className="space-y-6">
              {/* foodCreator Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-[#F23E2E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedFoodCreator.bio}</h3>
                    <p className="text-sm text-gray-600">{selectedFoodCreator.location.city}</p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{selectedFoodCreator.performance.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{selectedFoodCreator.performance.completedOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <p className="text-2xl font-bold">{selectedFoodCreator.performance.averageRating.toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold">£{selectedFoodCreator.performance.totalEarnings.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Completion Rate */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Completion Rate</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {selectedFoodCreator.performance.completedOrders} of {selectedFoodCreator.performance.totalOrders} orders completed
                    </span>
                    <span className="text-lg font-bold text-[#F23E2E]">
                      {selectedFoodCreator.performance.totalOrders > 0
                        ? ((selectedFoodCreator.performance.completedOrders / selectedFoodCreator.performance.totalOrders) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[#F23E2E] h-3 rounded-full transition-all"
                      style={{
                        width: `${selectedFoodCreator.performance.totalOrders > 0
                          ? (selectedFoodCreator.performance.completedOrders / selectedFoodCreator.performance.totalOrders) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Max Orders Per Day</p>
                  <p className="text-lg font-semibold">{selectedFoodCreator.maxOrdersPerDay}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Advance Booking Days</p>
                  <p className="text-lg font-semibold">{selectedFoodCreator.advanceBookingDays} days</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600 mb-2">Available Days</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFoodCreator.availableDays.map((day, idx) => (
                      <Badge key={idx} variant="secondary">{day}</Badge>
                    ))}
                  </div>
                </div>
                {selectedFoodCreator.performance.lastOrderDate && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">Last Order Date</p>
                    <p className="text-lg">{new Date(selectedFoodCreator.performance.lastOrderDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPerformanceModal(false);
                setSelectedFoodCreator(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
