import Stripe from "stripe";

/**
 * Initialize Stripe client using environment variables
 */
export const getStripe = () => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey || stripeSecretKey.trim().length === 0) {
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            console.error('Stripe secret key (STRIPE_SECRET_KEY) is missing in environment variables.');
        }
        return null;
    }

    return new Stripe(stripeSecretKey.trim(), {
        apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
    });
};
