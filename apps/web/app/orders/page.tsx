"use client";

import { useSession } from "@/lib/auth/use-session";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, LogIn, Lock } from "lucide-react";

export default function OrdersPage() {
  const { isAuthenticated, isLoading } = useSession();

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-asgard text-gray-900 mb-2">Your Orders</h1>
            <p className="text-gray-600 font-satoshi">View and manage your order history</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-asgard text-gray-900 mb-2">Sign in to view your orders</h2>
            <p className="text-gray-600 font-satoshi mb-6 max-w-md mx-auto">
              Please sign in to your account to view your order history and track your deliveries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/try-it">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse Meals
                </Button>
              </Link>
              <Link href="/waitlist">
                <Button className="bg-[#ff3b30] hover:bg-[#ff5e54] text-white w-full sm:w-auto">
                  <LogIn className="w-4 h-4 mr-2" />
                  Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-asgard text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600 font-satoshi">View and manage your order history</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-asgard text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 font-satoshi mb-6">
            Start exploring our delicious meals and place your first order!
          </p>
          <Link href="/try-it">
            <Button className="bg-[#ff3b30] hover:bg-[#ff5e54] text-white">
              Browse Meals
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Order history will be displayed here when orders exist */}
      </div>
    </div>
  );
}

