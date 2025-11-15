# Stripe Configuration Guide

This document outlines how Stripe credentials are configured across the Cribnosh application.

## ⚠️ IMPORTANT: Hardcoded Test Keys

**TEMPORARY FALLBACK KEYS ARE HARDCODED - REMOVE BEFORE PRODUCTION**

Test Stripe keys have been hardcoded as fallbacks in the following files:
- `apps/mobile/constants/api.ts` - Publishable key fallback
- `packages/convex/actions/payments.ts` - Secret key fallback

**These are temporary test keys for development and MUST be removed before production deployment.**

To remove:
1. Remove the hardcoded fallback values from both files
2. Ensure environment variables are properly set:
   - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `apps/mobile/.env`
   - `STRIPE_SECRET_KEY` in Convex environment variables

## Overview

Stripe credentials are required in three places:
1. **Convex Backend** - Secret key for server-side operations
2. **Expo/Mobile App** - Publishable key for client-side operations
3. **Local Development** - Both keys for local testing

## Current Configuration Status

### ✅ Convex Backend
- **Status**: Configured
- **Variable**: `STRIPE_SECRET_KEY`
- **Location**: Convex environment variables
- **Current Value**: `sk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`
- **Used in**: `packages/convex/actions/payments.ts`

### ✅ Mobile App (Expo)
- **Status**: Configured
- **Variable**: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Location**: `apps/mobile/.env`
- **Current Value**: `pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT`
- **Used in**: `apps/mobile/constants/api.ts` → `apps/mobile/app/_layout.tsx`

## ⚠️ Important: Key Matching

**CRITICAL**: The secret key and publishable key **MUST** be from the same Stripe account.

### How to Verify Keys Match

1. **Check Account ID**: Both keys should reference the same Stripe account
   - Secret key format: `sk_test_<account_id>...`
   - Publishable key format: `pk_test_<account_id>...`
   - The account IDs should match (or be from the same account)

2. **Get Matching Keys from Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/apikeys
   - Ensure you're in the correct mode (Test or Live)
   - Copy both the **Publishable key** and **Secret key** from the same account

3. **Current Keys Analysis**:
   - Secret key account: `51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`
   - Publishable key account: `51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT`
   - **⚠️ These appear to be from different accounts!**

## Configuration Locations

### 1. Convex Backend

**File**: `packages/convex/convex.json` (documentation)
**Environment**: Convex Dashboard or CLI

**Set via CLI**:
```bash
cd packages/convex
npx convex env set STRIPE_SECRET_KEY "sk_test_..."
```

**Set via Dashboard**:
1. Go to https://dashboard.convex.dev
2. Select your project
3. Settings → Environment Variables
4. Add `STRIPE_SECRET_KEY` with your secret key

**Verify**:
```bash
cd packages/convex
npx convex env list | grep STRIPE
```

### 2. Mobile App (Expo)

**File**: `apps/mobile/.env`

**Required Variable**:
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Important Notes**:
- Only variables prefixed with `EXPO_PUBLIC_` are accessible in the app
- After changing `.env`, restart the Expo dev server
- For production builds, set via EAS Secrets or CI/CD

**Verify**:
```bash
cd apps/mobile
grep EXPO_PUBLIC_STRIPE .env
```

### 3. Local Development

For local development, you may need both keys in your local environment:

**Convex Local** (if running locally):
- Set in `packages/convex/.env.local` or via `npx convex env set`

**Mobile App Local**:
- Set in `apps/mobile/.env`

## How Stripe is Used

### Backend (Convex Actions)

The Stripe secret key is used in `packages/convex/actions/payments.ts`:

```typescript
const getStripe = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return null;
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: '2025-07-30.basil',
  });
};
```

**Operations**:
- Creating payment intents
- Creating setup intents
- Managing Stripe customers
- Processing payments

### Frontend (Mobile App)

The Stripe publishable key is used in `apps/mobile/app/_layout.tsx`:

```typescript
import { STRIPE_CONFIG } from '@/constants/api';

// StripeProvider wraps the app
<StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
  {appContent}
</StripeProvider>
```

**Operations**:
- Collecting card details (via `CardField`)
- Confirming setup intents (via `confirmSetupIntent`)
- Confirming payment intents (via `confirmPayment`)

## Troubleshooting

### Error: "You did not provide an API key"

This error typically occurs when:

1. **Keys don't match**: Secret and publishable keys are from different accounts
   - **Solution**: Get matching keys from the same Stripe account

2. **Publishable key not set**: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is missing or empty
   - **Solution**: Check `apps/mobile/.env` and restart Expo dev server

3. **Secret key not set**: `STRIPE_SECRET_KEY` is missing in Convex
   - **Solution**: Set via `npx convex env set STRIPE_SECRET_KEY "sk_test_..."`

4. **StripeProvider not initialized**: The publishable key is empty
   - **Solution**: Verify `STRIPE_CONFIG.publishableKey` is not empty in `apps/mobile/constants/api.ts`

### Error: "Stripe is not configured"

This error occurs when `getStripe()` returns `null` in Convex actions.

**Check**:
```bash
cd packages/convex
npx convex env list | grep STRIPE_SECRET_KEY
```

**Fix**: Set the secret key if missing.

### Keys Not Working

1. **Verify keys are from the same account**:
   - Go to Stripe Dashboard → API keys
   - Ensure both keys are from the same account (Test or Live mode)

2. **Check key format**:
   - Secret key should start with `sk_test_` or `sk_live_`
   - Publishable key should start with `pk_test_` or `pk_live_`

3. **Restart services**:
   - Restart Expo dev server after changing `.env`
   - Restart Convex dev server after setting environment variables

## Testing

### Test Setup Intent Creation

1. **Backend Test** (Convex):
   - Call `customerCreateSetupIntent` action
   - Should return `clientSecret` if configured correctly

2. **Frontend Test** (Mobile):
   - Open AddCardSheet
   - Enter card details
   - Should successfully create and confirm setup intent

### Test Payment Intent Creation

1. **Backend Test** (Convex):
   - Call `customerCreateCheckout` action
   - Should return `paymentIntent` with `client_secret`

2. **Frontend Test** (Mobile):
   - Complete checkout flow
   - Should successfully process payment

## Production Checklist

Before deploying to production:

- [ ] Switch to **Live** mode keys (not test keys)
- [ ] Set `STRIPE_SECRET_KEY` in Convex production environment
- [ ] Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in EAS Secrets or CI/CD
- [ ] Verify keys are from the same Stripe account
- [ ] Test payment flow end-to-end
- [ ] Set up Stripe webhooks (if needed)
- [ ] Configure `STRIPE_WEBHOOK_SECRET` in Convex (if handling webhooks)

## Additional Resources

- [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe React Native SDK](https://stripe.dev/stripe-react-native/)
- [Convex Environment Variables](https://docs.convex.dev/production/environment-variables)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

