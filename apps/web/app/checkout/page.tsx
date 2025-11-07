"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/use-session";
import { useCart, useCartTotal } from "@/hooks/use-cart";
import { useCreateCheckout, useCreateOrderFromCart } from "@/hooks/use-checkout";
import { StripeElements } from "@/components/checkout/stripe-elements";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useSession();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const { total } = useCartTotal();
  const createCheckout = useCreateCheckout();
  const createOrderFromCart = useCreateOrderFromCart();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
    country: "United Kingdom",
    state: "",
  });
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/try-it");
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (isAuthenticated && cart && cart.items.length > 0 && !clientSecret && !isCreatingCheckout) {
      initializeCheckout();
    }
  }, [isAuthenticated, cart, clientSecret, isCreatingCheckout]);

  const initializeCheckout = async () => {
    setIsCreatingCheckout(true);
    try {
      const response = await createCheckout.mutateAsync();
      if (response.success && response.data?.paymentIntent?.client_secret) {
        setClientSecret(response.data.paymentIntent.client_secret);
      } else {
        toast.error('Failed to initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error("Error initializing checkout:", error);
      const errorMessage = error?.message || 'Failed to initialize checkout. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const response = await createOrderFromCart.mutateAsync({
        payment_intent_id: paymentIntentId,
        delivery_address: deliveryAddress.street ? deliveryAddress : undefined,
        special_instructions: specialInstructions || undefined,
      });

      if (response.success && response.data?.order_id) {
        toast.success('Order placed successfully!');
        router.push(`/orders/${response.data.order_id}/success`);
      } else {
        toast.error('Failed to create order. Please contact support.');
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      const errorMessage = error?.message || 'Failed to create order. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error("Payment error:", error);
    toast.error(error || 'Payment failed. Please try again.');
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/try-it">
            <Button variant="outline">Browse Meals</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#ff3b30] mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#ff3b30]" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                      placeholder="London"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={deliveryAddress.postal_code}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, postal_code: e.target.value })}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={deliveryAddress.country}
                    onChange={(e) => setDeliveryAddress({ ...deliveryAddress, country: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {isCreatingCheckout ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff3b30] mr-3"></div>
                    <span className="text-gray-600">Initializing payment...</span>
                  </div>
                ) : clientSecret ? (
                  <StripeElements
                    clientSecret={clientSecret}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-600 mb-4">Unable to initialize payment</p>
                    <Button onClick={initializeCheckout} variant="outline">
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary className="sticky top-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

