"use client";

import { useCartTotal } from "@/hooks/use-cart";

interface CartSummaryProps {
  className?: string;
}

export function CartSummary({ className }: CartSummaryProps) {
  const { subtotal, deliveryFee, total } = useCartTotal();

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">£{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery Fee</span>
          <span className="font-medium">£{deliveryFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-[#ff3b30]">£{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

