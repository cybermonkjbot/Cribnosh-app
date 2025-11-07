"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChefHat, 
  Search, 
  Filter,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MapPin,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Shield,
  AlertTriangle,
  MessageSquare,
  Award,
  BarChart3,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import { AuthWrapper } from '@/components/layout/AuthWrapper';

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

export default function ChefManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data
  const chefs = useQuery(api.queries.admin.getChefsWithPerformance, {}) as Chef[] | undefined;
  const chefStats = useQuery(api.queries.admin.getChefStats);

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
      setSuccess('Chef status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update chef status');
    }
  };

  const handleVerificationUpdate = async (chefId: Id<"chefs">, verificationStatus: string) => {
    try {
      await updateChefVerification({ chefId, verificationStatus: verificationStatus as any });
      setSuccess('Chef verification updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update chef verification');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
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
    const statusConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  return (
    <AuthWrapper role="admin">
      <div className="space-y-6">
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
              onClick={() => setShowVerificationModal(true)}
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Verify Chef
            </Button>
          </div>
        </div>

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
                    <p className="text-2xl font-bold text-green-600">
                      {chefs?.filter(c => c.status === 'active').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
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
                    <p className="text-2xl font-bold text-yellow-600">
                      {chefs?.filter(c => c.verificationStatus === 'pending').length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
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
                    <p className="text-2xl font-bold text-blue-600">
                      {chefs?.length ? (chefs.reduce((sum, c) => sum + c.rating, 0) / chefs.length).toFixed(1) : '0.0'}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search chefs by name, specialty, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="earnings">Top Earners</SelectItem>
                  <SelectItem value="orders">Most Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-lg border border-white/20">
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
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{chef.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span>${chef.performance.totalEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span>{chef.performance.totalOrders} orders</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-500" />
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
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVerificationUpdate(chef._id, 'rejected')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                      .sort((a, b) => b.performance.totalEarnings - a.performance.totalEarnings)
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
                            <p className="font-bold text-green-600">${chef.performance.totalEarnings.toLocaleString()}</p>
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
                      .sort((a, b) => b.rating - a.rating)
                      .slice(0, 5)
                      .map((chef, index) => (
                        <div key={chef._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Star className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium">{chef.bio.substring(0, 30)}...</p>
                              <p className="text-sm text-gray-600">{chef.location.city}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600">{chef.rating.toFixed(1)}</p>
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
                      onClick={() => {/* Open bulk message modal */}}
                      className="bg-[#F23E2E] hover:bg-[#F23E2E]/90"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Bulk Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {/* Open announcement modal */}}
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

        {/* Error/Success Messages */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
      </div>
    </AuthWrapper>
  );
}
