# ⚠️ Stripe Configuration Issue - Action Required

## Problem Identified

The Stripe secret key and publishable key are from **different Stripe accounts**, which is causing the authentication error:

```
Error: You did not provide an API key. You need to provide your API key in the Authorization header...
```

## Current Configuration

### Convex (Backend)
- **Secret Key**: `sk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`
- **Account ID**: `51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`

### Mobile App (Frontend)
- **Publishable Key**: `pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT`
- **Account ID**: `51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT`

**These are from different accounts!**

## Solution

You need to get the **matching publishable key** for the secret key that's currently in Convex.

### Step 1: Get the Correct Publishable Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Make sure you're in **Test mode** (toggle in the top right)
3. Find the secret key that matches: `sk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`
4. Copy the **Publishable key** from the same row (it should start with `pk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav`)

### Step 2: Update Mobile App Configuration

Update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QTHZNGAiAa3ySTVYw75S6tYEYn2uFwRcf24pIobEpVhgF4uhq7toOtwQeH2RTn67PynAKRjiEhNPe0dkTtILQnB00qEyEuMav...
```

**Important**: Replace with the actual matching publishable key from Stripe Dashboard.

### Step 3: Restart Services

After updating the `.env` file:

1. **Restart Expo dev server**:
   ```bash
   cd apps/mobile
   # Stop the current server (Ctrl+C)
   # Then restart:
   npx expo start --clear
   ```

2. **Rebuild the app** (if using a development build):
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

### Step 4: Verify

Run the verification script:

```bash
./verify-stripe-keys.sh
```

You should see:
```
✅ Keys appear to be from the same account
```

## Alternative: Use Matching Keys from Mobile App's Account

If you prefer to use the account associated with the current mobile app publishable key:

1. Get the matching secret key from Stripe Dashboard for: `pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT`
2. Update Convex:
   ```bash
   cd packages/convex
   npx convex env set STRIPE_SECRET_KEY "sk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT..."
   ```

## Why This Matters

When you create a SetupIntent or PaymentIntent using one account's secret key, you **must** confirm it using the same account's publishable key. Stripe validates that both keys belong to the same account, and if they don't match, you'll get authentication errors.

## Testing After Fix

1. Open the mobile app
2. Try to add a card (AddCardSheet)
3. The setup intent should now work correctly
4. No more "You did not provide an API key" errors

## Need Help?

- [Stripe Dashboard - API Keys](https://dashboard.stripe.com/apikeys)
- [Stripe Documentation - API Keys](https://stripe.com/docs/keys)
- See `STRIPE_CONFIGURATION.md` for full configuration guide

