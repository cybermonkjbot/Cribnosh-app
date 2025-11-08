"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrder, useOrderStatus } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, MapPin, Package, ChefHat, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

const statusConfig = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: ChefHat },
  ready: { label: 'Ready', color: 'text-green-600', bgColor: 'bg-green-50', icon: Package },
  delivered: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: orderStatus } = useOrderStatus(orderId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading order</p>
          <Link href="/try-it">
            <Button variant="outline">Go to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = (orderStatus as any)?.order_status || (orderStatus as any)?.status || order.orderStatus || 'pending';
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const estimatedDeliveryTime = order.estimatedPrepTimeMinutes 
    ? `${order.estimatedPrepTimeMinutes}-${order.estimatedPrepTimeMinutes + 10} minutes`
    : '30-40 minutes';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#ff3b30] mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order #{order.id.substring(0, 8).toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg ${statusInfo.bgColor}`}>
                  <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                  <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                {order.chefNotes && (
                  <p className="mt-4 text-gray-600">{order.chefNotes}</p>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        £{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#ff3b30]" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Estimated Delivery</p>
                    <p className="text-gray-600">{estimatedDeliveryTime}</p>
                  </div>
                </div>
                {order.specialInstructions && (
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Special Instructions</p>
                    <p className="text-gray-600">{order.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>£{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span>£0.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#ff3b30]">£{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                  <p className={`font-medium ${
                    order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </p>
                </div>
                <Link href="/try-it">
                  <Button variant="outline" className="w-full">
                    Order Again
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

