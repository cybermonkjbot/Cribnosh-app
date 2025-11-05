import { stripe } from '@/lib/stripe';
import { ErrorFactory, ErrorCode } from '@/lib/errors';

export async function validatePaymentMethod(paymentMethodId: string) {
  if (!stripe) {
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Stripe is not configured');
  }

  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return {
      valid: true,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
      } : null,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'resource_missing') {
      throw ErrorFactory.custom(ErrorCode.BAD_REQUEST, 'Payment method not found');
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, `Failed to validate payment method: ${errorMessage}`);
  }
}

export async function processRefund(
  paymentIntentId: string,
  amount?: number,
  reason: 'requested_by_customer' | 'duplicate' | 'fraudulent' = 'requested_by_customer'
) {
  if (!stripe) {
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Stripe is not configured');
  }

  try {
    const refundParams: {
      payment_intent: string;
      reason: 'requested_by_customer' | 'duplicate' | 'fraudulent';
      amount?: number;
    } = {
      payment_intent: paymentIntentId,
      reason,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundParams);
    return {
      id: refund.id,
      amount: refund.amount / 100, // Convert back from cents
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, `Failed to process refund: ${errorMessage}`);
  }
}

