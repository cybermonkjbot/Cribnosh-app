"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Package,
  RefreshCw,
  Star,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

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
  const { user, sessionToken } = useAdminUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data - authentication is handled by layout
  const queryArgs = user && sessionToken ? { sessionToken } : "skip";
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
      let matchesTime = true;
      if (timeFilter === 'all') {
        matchesTime = true;
      } else if (timeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesTime = delivery.createdAt >= today.getTime();
      } else if (timeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTime = delivery.createdAt >= weekAgo.getTime();
      } else if (timeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesTime = delivery.createdAt >= monthAgo.getTime();
      }


      return matchesSearch && matchesStatus && matchesDriver && matchesTime;
    });

    // Sort deliveries
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
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
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

      {/* Essential Stats */}
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
          <div className="overflow-hidden flex flex-col h-[calc(100vh-400px)]">
            <div className="overflow-auto flex-1">
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
                      <Card className={`hover:shadow-lg transition-shadow ${urgency === 'critical' ? 'border-red-200 bg-red-50/30' :
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
            </div>
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
          <div className="overflow-hidden flex flex-col h-[calc(100vh-400px)]">
            <div className="overflow-auto flex-1">
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
            </div>
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
  );
}
