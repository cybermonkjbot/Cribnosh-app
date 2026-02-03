"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { ChefFilterBar } from '@/components/admin/chef-filter-bar';
import { EmptyState } from '@/components/admin/empty-state';
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

interface Chef {
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

function AddChefModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const users = useQuery(api.queries.users.getUsersForAdmin);
  const createChef = useMutation(api.mutations.chefs.createChef);
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

      await createChef({
        userId: selectedUser as any,
        name: user.name,
        location: { lat: 0, lng: 0, city: "Unknown" },
        status: "active"
      });

      toast({ title: "Success", description: "Chef added successfully", variant: "success" });
      onOpenChange(false);
      setSelectedUser("");
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add chef", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Chef</DialogTitle>
          <DialogDescription>
            Promote an existing user to a chef. They will be auto-enrolled in compliance training.
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
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Chef"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ChefManagementPage() {
  const { user, sessionToken, loading } = useAdminUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch data - authentication is handled by layout, so user is guaranteed to be authenticated here
  const queryArgs = loading || !sessionToken ? "skip" : { sessionToken };
  const chefs = useQuery(api.queries.admin.getChefsWithPerformance, queryArgs) as Chef[] | undefined;
  const chefStats = useQuery(api.queries.admin.getChefStats, queryArgs);

  // Mutations
  const updateChefStatus = useMutation(api.mutations.chefs.updateChef);
  const updateChefVerification = useMutation((api as any)["mutations/chefAdmin"].updateChefVerification);
  const sendChefMessage = useMutation((api as any)["mutations/chefAdmin"].sendChefMessage);

  // Filter and sort chefs
  const filteredChefs = useMemo(() => {
    if (!chefs) return [];

    return chefs.filter(chef => {
      const matchesSearch = chef.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chef.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        chef.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || chef.status === statusFilter;
      const matchesVerification = verificationFilter === 'all' || chef.verificationStatus === verificationFilter;

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
  }, [chefs, searchTerm, statusFilter, verificationFilter, sortBy]);

  const handleStatusUpdate = async (chefId: Id<"chefs">, newStatus: string) => {
    try {
      await updateChefStatus({ chefId, status: newStatus as any });
      toast({
        title: "Chef status updated",
        description: "The chef status has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update chef status",
        description: "An error occurred while updating the chef status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerificationUpdate = async (chefId: Id<"chefs">, verificationStatus: string) => {
    try {
      await updateChefVerification({ chefId, verificationStatus: verificationStatus as any });
      toast({
        title: "Chef verification updated",
        description: "The chef verification status has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update chef verification",
        description: "An error occurred while updating the chef verification. Please try again.",
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
  if (chefs === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">Chef Management</h1>
            <p className="text-gray-600 font-satoshi mt-2">Manage food creators, verification, and performance</p>
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
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Chef Management</h1>
          <p className="text-gray-600 font-satoshi mt-2">Manage food creators, verification, and performance</p>
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
            Add Chef
          </Button>
          <Button
            onClick={() => setShowVerificationModal(true)}
            variant="outline"
          >
            Verify Chef
          </Button>
        </div>
      </div>

      <AddChefModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />

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
                  <p className="text-sm font-medium text-gray-600">Total Chefs</p>
                  <p className="text-2xl font-bold text-gray-900">{chefs?.length || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Chefs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chefs?.filter(c => c.status === 'active').length || 0}
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
                    {chefs?.filter(c => c.verificationStatus === 'pending').length || 0}
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
                    {chefs?.length ? (chefs.reduce((sum, c) => sum + c.rating, 0) / chefs.length).toFixed(1) : '0.0'}
                  </p>
                </div>
                <Star className="w-8 h-8 text-gray-900" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <ChefFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        verificationFilter={verificationFilter}
        onVerificationFilterChange={setVerificationFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalCount={chefs?.length || 0}
        filteredCount={filteredChefs.length}
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
          {filteredChefs.length === 0 ? (
            <EmptyState
              icon={ChefHat}
              title={hasActiveFilters ? "No chefs found" : "No chefs yet"}
              description={hasActiveFilters
                ? "Try adjusting your search or filter criteria to see more results."
                : "Chefs will appear here once they register."}
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
                  {filteredChefs.map((chef, index) => (
                    <motion.div
                      key={chef._id}
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
                                <CardTitle className="text-lg">{chef.bio.substring(0, 30)}...</CardTitle>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm text-gray-600">{chef.location.city}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {getStatusBadge(chef.status)}
                              {getVerificationBadge(chef.verificationStatus)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-1">
                            {chef.specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                            {chef.specialties.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{chef.specialties.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-gray-900" />
                              <span>{chef.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <PoundSterling className="w-4 h-4 text-gray-900" />
                              <span>${chef.performance.totalEarnings.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-900" />
                              <span>{chef.performance.totalOrders} orders</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-900" />
                              <span>{chef.performance.completedOrders} completed</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedChef(chef)}
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
                                <DropdownMenuLabel>Chef Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedChef(chef);
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
                                    description: `Viewing orders for ${chef.bio.substring(0, 30)}...`,
                                  });
                                }}>
                                  <ShoppingBag className="w-4 h-4 mr-2" />
                                  View Orders History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Export Data",
                                    description: "Exporting chef data...",
                                  });
                                }}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Export Chef Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to suspend ${chef.bio.substring(0, 30)}?`)) {
                                      handleStatusUpdate(chef._id, 'suspended');
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
              <CardTitle>Chef Verification Queue</CardTitle>
              <CardDescription>
                Review and approve chef applications and verification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredChefs.filter(c => c.verificationStatus === 'pending').length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title="No pending verifications"
                  description="All chefs have been verified. Great job!"
                  variant="no-data"
                />
              ) : (
                <div className="space-y-4">
                  {filteredChefs.filter(c => c.verificationStatus === 'pending').map((chef) => (
                    <div key={chef._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-[#F23E2E]" />
                          </div>
                          <div>
                            <h3 className="font-medium">{chef.bio.substring(0, 50)}...</h3>
                            <p className="text-sm text-gray-600">{chef.location.city}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerificationUpdate(chef._id, 'verified')}
                            className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerificationUpdate(chef._id, 'rejected')}
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
                <CardTitle>Top Performing Chefs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredChefs
                    .sort((a: any, b: any) => b.performance.totalEarnings - a.performance.totalEarnings)
                    .slice(0, 5)
                    .map((chef, index) => (
                      <div key={chef._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-[#F23E2E]">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{chef.bio.substring(0, 30)}...</p>
                            <p className="text-sm text-gray-600">{chef.location.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${chef.performance.totalEarnings.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{chef.performance.totalOrders} orders</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chef Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredChefs
                    .sort((a: any, b: any) => b.rating - a.rating)
                    .slice(0, 5)
                    .map((chef, index) => (
                      <div key={chef._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-gray-900" />
                          </div>
                          <div>
                            <p className="font-medium">{chef.bio.substring(0, 30)}...</p>
                            <p className="text-sm text-gray-600">{chef.location.city}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{chef.rating.toFixed(1)}</p>
                          <p className="text-sm text-gray-600">{chef.performance.totalOrders} orders</p>
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
              <CardTitle>Chef Communication</CardTitle>
              <CardDescription>
                Send messages, updates, and notifications to chefs
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
                    No recent communications. Start by sending a message to your chefs.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chef Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-asgard text-gray-900">
              Chef Verification
            </DialogTitle>
          </DialogHeader>

          {selectedChef && (
            <div className="space-y-6">
              {/* Chef Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-[#F23E2E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedChef.bio}</h3>
                    <p className="text-sm text-gray-600">{selectedChef.location.city}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Status</p>
                    <div className="mt-1">{getStatusBadge(selectedChef.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verification Status</p>
                    <div className="mt-1">{getVerificationBadge(selectedChef.verificationStatus)}</div>
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
                      {selectedChef.verificationDocuments.healthPermit ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Health Permit</span>
                    </div>
                    <Badge className={selectedChef.verificationDocuments.healthPermit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedChef.verificationDocuments.healthPermit ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedChef.verificationDocuments.insurance ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Insurance</span>
                    </div>
                    <Badge className={selectedChef.verificationDocuments.insurance ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedChef.verificationDocuments.insurance ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {selectedChef.verificationDocuments.backgroundCheck ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span>Background Check</span>
                    </div>
                    <Badge className={selectedChef.verificationDocuments.backgroundCheck ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedChef.verificationDocuments.backgroundCheck ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  {selectedChef.verificationDocuments.certifications.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">Certifications</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedChef.verificationDocuments.certifications.map((cert, idx) => (
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
                  {selectedChef.specialties.map((specialty, idx) => (
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
                setSelectedChef(null);
              }}
            >
              Close
            </Button>
            {selectedChef && selectedChef.verificationStatus === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    handleVerificationUpdate(selectedChef._id, 'rejected');
                    setShowVerificationModal(false);
                    setSelectedChef(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  onClick={() => {
                    handleVerificationUpdate(selectedChef._id, 'verified');
                    setShowVerificationModal(false);
                    setSelectedChef(null);
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

      {/* Chef Performance Modal */}
      <Dialog open={showPerformanceModal} onOpenChange={setShowPerformanceModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-asgard text-gray-900">
              Chef Performance Metrics
            </DialogTitle>
          </DialogHeader>

          {selectedChef && (
            <div className="space-y-6">
              {/* Chef Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-[#F23E2E]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedChef.bio}</h3>
                    <p className="text-sm text-gray-600">{selectedChef.location.city}</p>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{selectedChef.performance.totalOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{selectedChef.performance.completedOrders}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <p className="text-2xl font-bold">{selectedChef.performance.averageRating.toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold">£{selectedChef.performance.totalEarnings.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Completion Rate */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Completion Rate</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {selectedChef.performance.completedOrders} of {selectedChef.performance.totalOrders} orders completed
                    </span>
                    <span className="text-lg font-bold text-[#F23E2E]">
                      {selectedChef.performance.totalOrders > 0
                        ? ((selectedChef.performance.completedOrders / selectedChef.performance.totalOrders) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[#F23E2E] h-3 rounded-full transition-all"
                      style={{
                        width: `${selectedChef.performance.totalOrders > 0
                          ? (selectedChef.performance.completedOrders / selectedChef.performance.totalOrders) * 100
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
                  <p className="text-lg font-semibold">{selectedChef.maxOrdersPerDay}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Advance Booking Days</p>
                  <p className="text-lg font-semibold">{selectedChef.advanceBookingDays} days</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-600 mb-2">Available Days</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChef.availableDays.map((day, idx) => (
                      <Badge key={idx} variant="secondary">{day}</Badge>
                    ))}
                  </div>
                </div>
                {selectedChef.performance.lastOrderDate && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600 mb-2">Last Order Date</p>
                    <p className="text-lg">{new Date(selectedChef.performance.lastOrderDate).toLocaleDateString()}</p>
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
                setSelectedChef(null);
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
