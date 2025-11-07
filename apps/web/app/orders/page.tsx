"use client";

import { Button } from "@/components/ui/button";
import { useOrdersList } from "@/hooks/use-orders";
import { useSession } from "@/lib/auth/use-session";
import { ArrowRight, CheckCircle, ChefHat, Clock, Package, Receipt, Truck, XCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const statusConfig = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: ChefHat },
  ready: { label: 'Ready', color: 'text-green-600', bgColor: 'bg-green-50', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
};

function formatDate(dateString: string | number | undefined): string {
  if (!dateString) return 'Unknown date';
  
  const date = typeof dateString === 'number' 
    ? new Date(dateString) 
    : new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusBadge(status: string) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useSession();
  const { data: ordersData, isLoading: ordersLoading } = useOrdersList({
    limit: 50,
    status: 'all',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
          <p className="text-gray-600 font-satoshi">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 py-8 w-full text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            <Receipt className="w-12 h-12 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-asgard text-[#094327] mb-2">Place your first order to see orders here</h2>
          <p className="text-[#6B7280] font-satoshi mb-8">
            Browse kitchens and meals to get started with your first order
            </p>
              <Link href="/try-it">
            <Button className="bg-[#ff3b30] hover:bg-[#ff5e54] text-white">
              Browse Kitchens
              <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
        </div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];
  const hasOrders = orders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-asgard text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600 font-satoshi">View and manage your order history</p>
        </div>

        {ordersLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
            <p className="text-gray-600 font-satoshi">Loading your orders...</p>
          </div>
        ) : !hasOrders ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center w-full max-w-md">
              <div className="flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-12 h-12 text-[#10B981]" />
              </div>
              <h2 className="text-xl font-asgard text-[#094327] mb-2">Place your first order to see orders here</h2>
              <p className="text-[#6B7280] font-satoshi mb-8">
                Browse kitchens and meals to get started with your first order
            </p>
            <Link href="/try-it">
              <Button className="bg-[#ff3b30] hover:bg-[#ff5e54] text-white">
                  Browse Kitchens
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderId = order._id || order.id || '';
              const orderStatus = order.order_status || order.orderStatus || order.status || 'pending';
              const totalAmount = order.total_amount || order.totalAmount || 0;
              const orderDate = order.order_date || order.orderDate || order.createdAt || order._creationTime;
              const orderItems = order.order_items || order.orderItems || [];
              
              return (
                <motion.div
                  key={orderId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/orders/${orderId}`}>
                    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-lg font-asgard text-gray-900 mb-1">
                                Order #{orderId.slice(-8).toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-500 font-satoshi">
                                {formatDate(orderDate)}
                              </p>
                            </div>
                            {getStatusBadge(orderStatus)}
                          </div>
                          
                          {orderItems.length > 0 && (
                            <div className="space-y-1 mb-3">
                              <p className="text-sm font-medium text-gray-700 font-satoshi">
                                {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
                              </p>
                              <p className="text-xs text-gray-500 font-satoshi line-clamp-2">
                                {orderItems.slice(0, 2).map((item: any) => item.name || item.dish_name || 'Item').join(', ')}
                                {orderItems.length > 2 && ` +${orderItems.length - 2} more`}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-2">
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#ff3b30] font-asgard">
                              £{totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 sm:block hidden" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

