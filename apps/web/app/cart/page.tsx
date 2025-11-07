"use client";

import { useCart } from "@/hooks/use-cart";
import { CartItem } from "@/components/cart/cart-item";
import { CartSummary } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CartPage() {
  const { data: cart, isLoading, error } = useCart();
  const { isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Redirect to login or show auth required message
      router.push('/try-it');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading cart</p>
          <Link href="/try-it">
            <Button variant="outline">Go to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Link href="/try-it" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#ff3b30] mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
          <EmptyCart />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/try-it" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#ff3b30] mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-[#ff3b30]" />
            My Cart
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem key={item._id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              <CartSummary className="mb-6" />
              <Link href="/checkout" className="block">
                <Button className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white py-6 text-lg font-semibold">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

