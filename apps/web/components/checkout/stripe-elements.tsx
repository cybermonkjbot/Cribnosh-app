"use client";

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface StripeElementsProps {
  clientSecret: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

/**
 * Stripe Elements wrapper component
 */
export function StripeElements({ clientSecret, onPaymentSuccess, onPaymentError }: StripeElementsProps) {
  const [stripe, setStripe] = useState<import('@stripe/stripe-js').Stripe | null>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff3b30]" />
        <span className="ml-2 text-gray-600">Loading payment form...</span>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#ff3b30',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripe} options={options}>
      <PaymentForm onPaymentSuccess={onPaymentSuccess} onPaymentError={onPaymentError} />
    </Elements>
  );
}

/**
 * Payment form component
 */
function PaymentForm({ onPaymentSuccess, onPaymentError }: { 
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment form validation failed');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/success`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        onPaymentError(confirmError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      } else {
        setError('Payment was not completed');
        onPaymentError('Payment was not completed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white py-6 text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Place Order'
        )}
      </Button>
    </form>
  );
}

