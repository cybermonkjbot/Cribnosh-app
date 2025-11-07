"use client";

import { useCart, useCartTotal } from "@/hooks/use-cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderSummaryProps {
  className?: string;
}

export function OrderSummary({ className }: OrderSummaryProps) {
  const { data: cart } = useCart();
  const { subtotal, deliveryFee, total } = useCartTotal();

  const items = cart?.items || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.dish_name || item.name || 'Unknown Item'}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  £{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span>£{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-[#ff3b30]">£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

