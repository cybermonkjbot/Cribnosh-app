"use client";

import { OrderFilterBar } from '@/components/admin/order-filter-bar';
import { AuthWrapper } from '@/components/layout/AuthWrapper';
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
  ChefHat,
  Clock,
  DollarSign,
  Download,
  Eye,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Package,
  RefreshCw,
  ShoppingCart,
  Star,
  TrendingUp,
  Truck,
  XCircle,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

interface Order {
  _id: Id<"orders">;
  customer_id: Id<"users">;
  chef_id: Id<"chefs">;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  items: Array<{
    meal_id: Id<"meals">;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: number[];
  };
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  delivery_fee: number;
  service_fee: number;
  tax: number;
  tip: number;
  estimated_delivery_time: number;
  actual_delivery_time?: number;
  special_instructions?: string;
  createdAt: number;
  updatedAt: number;
  // Related data
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  chef?: {
    bio: string;
    location: { city: string };
    rating: number;
  };
  meals?: Array<{
    name: string;
    description: string;
  }>;
}

export default function OrderManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('today');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data
  const orders = useQuery(api.queries.admin.getAllOrdersWithDetails, {}) as Order[] | undefined;
  const orderStats = useQuery(api.queries.admin.getOrderStats);

  // Mutations
  const updateOrderStatus = useMutation((api as any)["mutations/orderAdmin"].updateOrderStatus);
  const sendOrderNotification = useMutation((api as any)["mutations/orderAdmin"].sendOrderNotification);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    const filtered = orders.filter(order => {
      const matchesSearch = 
        order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.chef?.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
      
      // Time filter
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;
      const oneMonth = 30 * oneDay;
      
      let matchesTime = true;
      if (timeFilter === 'today') {
        matchesTime = order.createdAt >= now - oneDay;
      } else if (timeFilter === 'week') {
        matchesTime = order.createdAt >= now - oneWeek;
      } else if (timeFilter === 'month') {
        matchesTime = order.createdAt >= now - oneMonth;
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesTime;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.total_amount - a.total_amount;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'status':
          return a.order_status.localeCompare(b.order_status);
        case 'recent':
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, timeFilter, sortBy]);

  const handleStatusUpdate = async (orderId: Id<"orders">, newStatus: string) => {
    try {
      await updateOrderStatus({ orderId, status: newStatus as any });
      setSuccess('Order status updated successfully');
      setError(null);
    } catch (err) {
      setError('Failed to update order status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      preparing: { color: 'bg-orange-100 text-orange-800', icon: ChefHat },
      ready: { color: 'bg-purple-100 text-purple-800', icon: Package },
      out_for_delivery: { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: RefreshCw }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      paid: { color: 'bg-green-100 text-green-800' },
      failed: { color: 'bg-red-100 text-red-800' },
      refunded: { color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getUrgencyLevel = (order: Order) => {
    const now = Date.now();
    const timeSinceCreated = now - order.createdAt;
    const estimatedDelivery = order.estimated_delivery_time;
    
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
    const config = {
      critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      warning: { color: 'bg-orange-100 text-orange-800', icon: Clock },
      attention: { color: 'bg-yellow-100 text-yellow-800', icon: Zap },
      normal: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    
    const { color, icon: Icon } = config[urgency as keyof typeof config];
    
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  return (
    <AuthWrapper role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">Order Management</h1>
            <p className="text-gray-600 font-satoshi mt-2">Monitor and oversee order fulfillment across the platform</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-[#F23E2E] text-[#F23E2E] hover:bg-[#F23E2E]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Orders
            </Button>
            <Button
              className="bg-[#F23E2E] hover:bg-[#F23E2E]/90"
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
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-[#F23E2E]" />
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
                    <p className="text-sm font-medium text-gray-600">Active Orders</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {orders?.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.order_status)).length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${orders?.filter(o => {
                        const today = new Date();
                        const orderDate = new Date(o.createdAt);
                        return orderDate.toDateString() === today.toDateString();
                      }).reduce((sum, o) => sum + o.total_amount, 0).toLocaleString() || '0'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${orders?.length ? Math.round(orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length) : '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <OrderFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          totalCount={orders?.length || 0}
          filteredCount={filteredOrders.length}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-lg border border-white/20">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Orders
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
              {filteredOrders.map((order, index) => {
                const urgency = getUrgencyLevel(order);
                return (
                  <motion.div
                    key={order._id}
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
                              <ShoppingCart className="w-6 h-6 text-[#F23E2E]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Order #{order._id.slice(-8)}</h3>
                                {getUrgencyBadge(urgency)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>Customer: {order.customer?.name || 'Unknown'}</span>
                                <span>Chef: {order.chef?.bio?.substring(0, 30) || 'Unknown'}...</span>
                                <span>Amount: ${order.total_amount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(order.order_status)}
                                {getPaymentBadge(order.payment_status)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
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

          {/* Active Orders Tab */}
          <TabsContent value="active" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders
                .filter(order => !['delivered', 'cancelled', 'refunded'].includes(order.order_status))
                .map((order, index) => {
                  const urgency = getUrgencyLevel(order);
                  return (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`hover:shadow-lg transition-shadow ${
                        urgency === 'critical' ? 'border-red-200 bg-red-50/30' : 
                        urgency === 'warning' ? 'border-orange-200 bg-orange-50/30' : 
                        urgency === 'attention' ? 'border-yellow-200 bg-yellow-50/30' : ''
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Order #{order._id.slice(-8)}</CardTitle>
                            {getUrgencyBadge(urgency)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-600">Customer</p>
                              <p>{order.customer?.name || 'Unknown'}</p>
                              <p className="text-gray-500">{order.customer?.phone || 'No phone'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-600">Chef</p>
                              <p>{order.chef?.bio?.substring(0, 30) || 'Unknown'}...</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span className="text-sm">{order.chef?.rating?.toFixed(1) || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.order_status)}
                              {getPaymentBadge(order.payment_status)}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">${order.total_amount.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
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
                  );
                })}
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <div className="space-y-4">
              {filteredOrders
                .filter(order => {
                  const urgency = getUrgencyLevel(order);
                  return urgency === 'critical' || urgency === 'warning' || 
                         order.payment_status === 'failed' || 
                         order.order_status === 'cancelled';
                })
                .map((order, index) => {
                  const urgency = getUrgencyLevel(order);
                  return (
                    <motion.div
                      key={order._id}
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
                                  <h3 className="font-semibold text-red-900">Order #{order._id.slice(-8)}</h3>
                                  {getUrgencyBadge(urgency)}
                                </div>
                                <p className="text-sm text-red-700 mt-1">
                                  {urgency === 'critical' ? 'Order is significantly delayed' :
                                   urgency === 'warning' ? 'Order is running late' :
                                   order.payment_status === 'failed' ? 'Payment failed' :
                                   'Order was cancelled'}
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
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
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
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(status => {
                      const count = orders?.filter(o => o.order_status === status).length || 0;
                      const percentage = orders?.length ? (count / orders.length) * 100 : 0;
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
                  <CardTitle>Revenue by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['delivered', 'preparing', 'ready', 'out_for_delivery'].map(status => {
                      const statusOrders = orders?.filter(o => o.order_status === status) || [];
                      const revenue = statusOrders.reduce((sum, o) => sum + o.total_amount, 0);
                      const count = statusOrders.length;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${revenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{count} orders</p>
                          </div>
                        </div>
                      );
                    })}
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
    </AuthWrapper>
  );
}
