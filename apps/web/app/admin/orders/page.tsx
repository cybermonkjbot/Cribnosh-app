"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { EmptyState } from '@/components/admin/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChefHat,
  Clock,
  Download,
  Eye,
  Flag,
  MessageSquare,
  MoreHorizontal,
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
  const { user, sessionToken, loading } = useAdminUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Fetch data - authentication is handled by layout, so user is guaranteed to be authenticated here
  // These queries don't accept sessionToken, so we just pass an empty object when user is authenticated
  const shouldSkip = !user;
  // Use orderStats from backend query instead of calculating client-side
  const ordersQueryResult = useQuery(api.queries.admin.getAllOrdersWithDetails, shouldSkip || !sessionToken ? "skip" : { sessionToken });
  const orders = ordersQueryResult as Order[] | undefined;
  const orderStatsQueryResult = useQuery(api.queries.admin.getOrderStats, shouldSkip || !sessionToken ? "skip" : { sessionToken });
  const orderStats = orderStatsQueryResult as {
    totalOrders: number;
    activeOrders: number;
    todayRevenue: number;
    averageOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
    completionRate: number;
  } | undefined;

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
      let matchesTime = true;
      if (timeFilter === 'all') {
        matchesTime = true;
      } else if (timeFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesTime = order.createdAt >= today.getTime();
      } else if (timeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTime = order.createdAt >= weekAgo.getTime();
      } else if (timeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesTime = order.createdAt >= monthAgo.getTime();
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
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update order status",
        description: "An error occurred while updating the order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    // Use brand color for active/positive statuses, neutral dark for others
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      confirmed: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
      preparing: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: ChefHat },
      out_for_delivery: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Truck },
      on_the_way: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Truck },
      'on-the-way': { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: Truck },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      completed: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]', icon: CheckCircle },
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
    // Use brand color for paid, neutral dark for others
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800' },
      paid: { color: 'bg-[#F23E2E]/10 text-[#F23E2E]' },
      failed: { color: 'bg-gray-100 text-gray-800' },
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

  // Loading state
  if (orders === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-asgard text-gray-900">Order Management</h1>
            <p className="text-gray-600 font-satoshi mt-2">Monitor and oversee order fulfillment across the platform</p>
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
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check for active filters
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || paymentFilter !== "all" || timeFilter !== "today";

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
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
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {orderStats?.activeOrders || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-900" />
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
          {filteredOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={hasActiveFilters ? "No orders found" : "No orders yet"}
              description={hasActiveFilters
                ? "Try adjusting your search or filter criteria to see more results."
                : "Orders will appear here once they are placed."}
              action={hasActiveFilters ? {
                label: "Clear filters",
                onClick: () => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                  setTimeFilter("today");
                },
                variant: "secondary"
              } : undefined}
              variant={hasActiveFilters ? "filtered" : "no-data"}
            />
          ) : (
            <div className="overflow-hidden flex flex-col h-[calc(100vh-400px)]">
              <div className="overflow-auto flex-1">
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
                        <Card className={`hover:shadow-lg transition-shadow ${urgency === 'critical' || urgency === 'warning' ? 'border-[#F23E2E]/20 bg-[#F23E2E]/5' :
                          urgency === 'attention' ? 'border-gray-200 bg-gray-50/30' : ''
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
                                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
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
              </div>
            </div>
          )}
        </TabsContent>

        {/* Active Orders Tab */}
        <TabsContent value="active" className="space-y-6">
          {filteredOrders.filter(order => !['delivered', 'cancelled', 'refunded'].includes(order.order_status)).length === 0 ? (
            <EmptyState
              icon={Clock}
              title={hasActiveFilters ? "No active orders found" : "No active orders"}
              description={hasActiveFilters
                ? "Try adjusting your search or filter criteria to see more results."
                : "There are currently no active orders."}
              action={hasActiveFilters ? {
                label: "Clear filters",
                onClick: () => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentFilter("all");
                  setTimeFilter("today");
                },
                variant: "secondary"
              } : undefined}
              variant={hasActiveFilters ? "filtered" : "no-data"}
            />
          ) : (
            <div className="overflow-hidden flex flex-col h-[calc(100vh-400px)]">
              <div className="overflow-auto flex-1">
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
                          <Card className={`hover:shadow-lg transition-shadow ${urgency === 'critical' || urgency === 'warning' ? 'border-[#F23E2E]/20 bg-[#F23E2E]/5' :
                            urgency === 'attention' ? 'border-gray-200 bg-gray-50/30' : ''
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
                                    <Star className="w-3 h-3 text-gray-900" />
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
                                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
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
              </div>
            </div>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          {filteredOrders.filter(order => {
            const urgency = getUrgencyLevel(order);
            return urgency === 'critical' || urgency === 'warning' ||
              order.payment_status === 'failed' ||
              order.order_status === 'cancelled';
          }).length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No issues found"
              description="All orders are processing normally. Great job!"
              variant="no-data"
            />
          ) : (
            <div className="overflow-hidden flex flex-col h-[calc(100vh-400px)]">
              <div className="overflow-auto flex-1">
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
                          <Card className={`border-[#F23E2E]/20 bg-[#F23E2E]/5`}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-[#F23E2E]" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-semibold text-gray-900">Order #{order._id.slice(-8)}</h3>
                                      {getUrgencyBadge(urgency)}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">
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
                                    className="border-[#F23E2E]/30 text-[#F23E2E] hover:bg-[#F23E2E]/10"
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
              </div>
            </div>
          )}
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
    </div>
  );
}
