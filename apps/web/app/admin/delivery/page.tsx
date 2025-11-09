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
  Truck, 
  Search, 
  Filter,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  MessageSquare,
  BarChart3,
  Download,
  RefreshCw,
  MoreHorizontal,
  Calendar,
  ChefHat,
  Package,
  Star,
  Flag,
  Zap,
  Navigation,
  Route,
  Timer,
  Shield,
  Activity,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';

interface Driver {
  _id: Id<"drivers">;
  userId: Id<"users">;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'busy' | 'offline' | 'suspended';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: number;
  };
  vehicle: {
    type: 'bike' | 'scooter' | 'car' | 'motorcycle';
    make: string;
    model: string;
    licensePlate: string;
  };
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  isAvailable: boolean;
  currentOrder?: Id<"orders">;
  createdAt: number;
  updatedAt: number;
}

interface Delivery {
  _id: Id<"deliveries">;
  orderId: Id<"orders">;
  driverId: Id<"drivers">;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  pickupAddress: {
    street: string;
    city: string;
    coordinates: number[];
  };
  deliveryAddress: {
    street: string;
    city: string;
    coordinates: number[];
  };
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  actualPickupTime?: number;
  actualDeliveryTime?: number;
  distance: number;
  deliveryFee: number;
  tip: number;
  specialInstructions?: string;
  createdAt: number;
  updatedAt: number;
  // Related data
  order?: {
    customer_id: Id<"users">;
    total_amount: number;
    items: Array<{
      meal_id: Id<"meals">;
      quantity: number;
      price: number;
    }>;
  };
  driver?: Driver;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
}

export default function DeliveryManagementPage() {
  // Auth is handled by layout, no client-side checks needed
  const { user } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data - authentication is handled by layout
  const shouldSkip = !user;
  const queryArgs = shouldSkip ? "skip" : {};
  const deliveries = useQuery(api.queries.admin.getAllDeliveriesWithDetails, queryArgs) as Delivery[] | undefined;
  const drivers = useQuery(api.queries.drivers.getAll, queryArgs) as Driver[] | undefined;
  const deliveryStats = useQuery(api.queries.admin.getDeliveryStats, queryArgs);

  // Mutations
  const updateDeliveryStatus = useMutation((api as any)["mutations/deliveryAdmin"].updateDeliveryStatus);
  const assignDriver = useMutation((api as any)["mutations/deliveryAdmin"].assignDriver);
  const sendDeliveryNotification = useMutation((api as any)["mutations/deliveryAdmin"].sendDeliveryNotification);

  // Filter and sort deliveries
  const filteredDeliveries = useMemo(() => {
    if (!deliveries) return [];
    
    const filtered = deliveries.filter(delivery => {
      const matchesSearch = 
        delivery.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.pickupAddress.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery.deliveryAddress.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delivery._id.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
      const matchesDriver = driverFilter === 'all' || delivery.driverId === driverFilter;
      
      // Time filter
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;
      
      let matchesTime = true;
      if (timeFilter === 'today') {
        matchesTime = delivery.createdAt >= now - oneDay;
      } else if (timeFilter === 'week') {
        matchesTime = delivery.createdAt >= now - oneWeek;
      } else if (timeFilter === 'month') {
        matchesTime = delivery.createdAt >= now - oneMonth;
      }
      
      return matchesSearch && matchesStatus && matchesDriver && matchesTime;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'time':
          return a.estimatedDeliveryTime - b.estimatedDeliveryTime;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'recent':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [deliveries, searchTerm, statusFilter, driverFilter, timeFilter, sortBy]);

  const handleStatusUpdate = async (deliveryId: Id<"deliveries">, newStatus: string) => {
    try {
      await updateDeliveryStatus({ deliveryId, status: newStatus as any });
      setSuccess('Delivery status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update delivery status');
    }
  };

  const getStatusBadge = (status: string) => {
    // Use brand color for active/positive statuses, neutral dark for others
    const statusConfig = {
      assigned: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Clock },
      picked_up: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Package },
      in_transit: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Truck },
      delivered: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
      failed: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getDriverStatusBadge = (status: string) => {
    // Use brand color for active/busy, neutral dark for others
    const statusConfig = {
      active: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
      busy: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Clock },
      offline: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      suspended: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getUrgencyLevel = (delivery: Delivery) => {
    const now = Date.now();
    const timeSinceCreated = now - delivery.createdAt;
    const estimatedDelivery = delivery.estimatedDeliveryTime;
    
    if (timeSinceCreated > estimatedDelivery + (30 * 60 * 1000)) { // 30 minutes late
      return 'critical';
    } else if (timeSinceCreated > estimatedDelivery) {
      return 'warning';
    } else if (timeSinceCreated > estimatedDelivery - (15 * 60 * 1000)) { // 15 minutes before
      return 'attention';
    }
    return 'normal';
  };

  const getUrgencyBadge = (urgency: string) => {
    // Use brand color for urgent statuses, neutral dark for normal
    const config = {
      critical: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: AlertTriangle },
      warning: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Clock },
      attention: { color: 'bg-gray-100 text-gray-800', icon: Zap },
      normal: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
    };
    
    const { color, icon: Icon } = config[urgency as keyof typeof config];
    
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">Delivery Management</h1>
            <p className="text-gray-600 font-satoshi mt-2">Monitor and oversee delivery operations across the platform</p>
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
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
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
                    <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {drivers?.filter(d => d.status === 'active').length || 0}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-[#F23E2E]" />
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
                    <p className="text-sm font-medium text-gray-600">In Transit</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deliveries?.filter(d => d.status === 'in_transit').length || 0}
                    </p>
                  </div>
                  <Truck className="w-8 h-8 text-gray-900" />
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
                    <p className="text-sm font-medium text-gray-600">Completed Today</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deliveries?.filter(d => {
                        const today = new Date();
                        const deliveryDate = new Date(d.actualDeliveryTime || d.createdAt);
                        return deliveryDate.toDateString() === today.toDateString() && d.status === 'delivered';
                      }).length || 0}
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
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {drivers?.length ? Math.round(drivers.reduce((sum, d) => sum + d.averageDeliveryTime, 0) / drivers.length) : 0}m
                    </p>
                  </div>
                  <Timer className="w-8 h-8 text-purple-600" />
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
                    placeholder="Search deliveries by driver, customer, or location..."
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
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers?.map(driver => (
                    <SelectItem key={driver._id} value={driver._id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="time">Delivery Time</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
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
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-4">
              {filteredDeliveries.map((delivery, index) => {
                const urgency = getUrgencyLevel(delivery);
                return (
                  <motion.div
                    key={delivery._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`hover:shadow-lg transition-shadow ${
                      urgency === 'critical' ? 'border-red-200 bg-red-50/30' : 
                      urgency === 'warning' ? 'border-orange-200 bg-orange-50/30' : 
                      urgency === 'attention' ? 'border-yellow-200 bg-yellow-50/30' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                              <Truck className="w-6 h-6 text-[#F23E2E]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Delivery #{delivery._id.slice(-8)}</h3>
                                {getUrgencyBadge(urgency)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>Driver: {delivery.driver?.name || 'Unassigned'}</span>
                                <span>Customer: {delivery.customer?.name || 'Unknown'}</span>
                                <span>Distance: {delivery.distance.toFixed(1)}km</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(delivery.status)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                ETA: {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDelivery(delivery);
                                  setShowDeliveryDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {drivers?.map((driver, index) => (
                <motion.div
                  key={driver._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <Truck className="w-5 h-5 text-[#F23E2E]" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{driver.name}</CardTitle>
                            <p className="text-sm text-gray-600">{driver.vehicle.type.toUpperCase()}</p>
                          </div>
                        </div>
                        {getDriverStatusBadge(driver.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Total Deliveries</p>
                          <p className="font-bold">{driver.totalDeliveries}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Completed</p>
                          <p className="font-bold text-green-600">{driver.completedDeliveries}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{driver.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Avg Time</p>
                          <p className="font-bold">{driver.averageDeliveryTime}m</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <div className="space-y-4">
              {filteredDeliveries
                .filter(delivery => {
                  const urgency = getUrgencyLevel(delivery);
                  return urgency === 'critical' || urgency === 'warning' || 
                         delivery.status === 'failed' || 
                         delivery.status === 'cancelled';
                })
                .map((delivery, index) => {
                  const urgency = getUrgencyLevel(delivery);
                  return (
                    <motion.div
                      key={delivery._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`border-red-200 bg-red-50/30`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-red-900">Delivery #{delivery._id.slice(-8)}</h3>
                                  {getUrgencyBadge(urgency)}
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                  {urgency === 'critical' ? 'Delivery is significantly delayed' :
                                   urgency === 'warning' ? 'Delivery is running late' :
                                   delivery.status === 'failed' ? 'Delivery failed' :
                                   'Delivery was cancelled'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Flag className="w-4 h-4 mr-1" />
                                Flag for Review
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDelivery(delivery);
                                  setShowDeliveryDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Investigate
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'].map(status => {
                      const count = deliveries?.filter(d => d.status === status).length || 0;
                      const percentage = deliveries?.length ? (count / deliveries.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{count}</p>
                            <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driver Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {drivers?.slice(0, 5).map((driver) => (
                      <div key={driver._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                            <Truck className="w-4 h-4 text-[#F23E2E]" />
                          </div>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <p className="text-sm text-gray-600">{driver.vehicle.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{driver.completedDeliveries} deliveries</p>
                          <p className="text-sm text-gray-500">{driver.rating.toFixed(1)} rating</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
    </div>
  );
}
