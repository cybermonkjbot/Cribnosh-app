import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/conxed-client';
import Stripe from 'stripe';
import { ErrorFactory, ErrorCode } from '@/lib/errors';

// Initialize Stripe client only if API key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion, // Latest stable version as of 2025
    })
  : null;

// Helper to get or create a Stripe customer for a user
export async function getOrCreateCustomer({ userId, email }: { userId: string, email: string }) {
  if (!stripe) {
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  const stripeCustomerId = await getStripeCustomerIdFromDB(userId);
  if (stripeCustomerId) {
    try {
      return await stripe.customers.retrieve(stripeCustomerId);
    } catch {
      // If not found in Stripe, create new
    }
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await saveStripeCustomerIdToDB(userId, customer.id);
  return customer;
}

async function getStripeCustomerIdFromDB(userId: string): Promise<string | null> {
  const convex = getConvexClient();
  return await convex.query(api.queries.users.getStripeCustomerId, { userId: userId as Id<'users'> });
}
async function saveStripeCustomerIdToDB(userId: string, customerId: string) {
  const convex = getConvexClient();
  await convex.mutation(api.mutations.users.setStripeCustomerId, { userId: userId as Id<'users'>, stripeCustomerId: customerId });
} 