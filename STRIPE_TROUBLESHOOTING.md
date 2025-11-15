# Stripe Troubleshooting Guide

## Issue: "You did not provide an API key" Error

If you're seeing this error even though your keys are from the same Stripe account, here are the most common causes and solutions:

## Common Causes

### 1. Environment Variable Not Loaded at Runtime

**Problem**: In Expo, environment variables are embedded at build time. If you changed the `.env` file after building, the app won't see the new value.

**Solution**:
```bash
cd apps/mobile

# Stop the current dev server (Ctrl+C)

# Clear cache and restart
npx expo start --clear

# Or if using a development build, rebuild:
npx expo run:ios --clear
# or
npx expo run:android --clear
```

### 2. StripeProvider Not Wrapping Components

**Problem**: The `useStripe()` hook requires the component to be wrapped in `StripeProvider`.

**Check**: Look at the console logs when the app starts. You should see:
```
Stripe Configuration: {
  hasStripeProvider: true,
  publishableKey: 'pk_test_51...',
  isExpoGo: false
}
```

**Solution**: If `hasStripeProvider` is `false` or `publishableKey` is `'MISSING'`, check:
- The `.env` file has `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` set
- You've restarted the dev server after changing `.env`
- The app is not running in Expo Go (which doesn't support native modules)

### 3. Running in Expo Go

**Problem**: Expo Go doesn't support native modules like `@stripe/stripe-react-native`.

**Solution**: Use a development build:
```bash
cd apps/mobile
npx expo run:ios
# or
npx expo run:android
```

### 4. Publishable Key Format Issue

**Problem**: The publishable key might have extra whitespace or be malformed.

**Check**: 
```bash
cd apps/mobile
cat .env | grep STRIPE
```

**Solution**: Ensure the key is on one line with no extra spaces:
```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT
```

### 5. Keys from Different Accounts

**Problem**: Even if both keys are valid, they must be from the same Stripe account.

**Check**: Run the verification script:
```bash
./scripts/verify-stripe-keys.sh
```

**Solution**: Get matching keys from the same Stripe account in the Stripe Dashboard.

## Debugging Steps

### Step 1: Verify Environment Variable is Set

```bash
cd apps/mobile
cat .env | grep EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Should output:
```
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 2: Check Console Logs

When the app starts, look for:
- `Stripe Configuration:` log in the console
- Any warnings about missing Stripe keys

### Step 3: Verify StripeProvider is Initialized

In `AddCardSheet`, we now check if Stripe is initialized. If you see "Stripe Not Initialized" error, it means:
- The `StripeProvider` is not wrapping the component, OR
- The publishable key is empty

### Step 4: Test Setup Intent Creation

The setup intent is created on the backend (Convex). If this fails, check:
```bash
cd packages/convex
npx convex env list | grep STRIPE_SECRET_KEY
```

### Step 5: Test Setup Intent Confirmation

The setup intent confirmation happens on the client. If this fails with "You did not provide an API key", it means:
- The Stripe SDK isn't receiving the publishable key
- The StripeProvider isn't properly initialized

## Quick Fix Checklist

- [ ] `.env` file exists in `apps/mobile/` directory
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- [ ] Key starts with `pk_test_` (test) or `pk_live_` (production)
- [ ] No extra spaces or quotes around the key
- [ ] Dev server restarted after changing `.env`
- [ ] Using a development build (not Expo Go)
- [ ] Console shows `hasStripeProvider: true` and a valid `publishableKey`
- [ ] Keys are from the same Stripe account

## Still Not Working?

1. **Check the exact error message** - It might give more clues
2. **Check Stripe Dashboard** - Verify the keys are active and not restricted
3. **Try a fresh build**:
   ```bash
   cd apps/mobile
   rm -rf node_modules .expo
   npm install
   npx expo start --clear
   ```
4. **Check Stripe React Native SDK version** - Ensure it's compatible with your Expo SDK version
5. **Review Stripe logs** - Check Stripe Dashboard → Developers → Logs for API errors

## Additional Resources

- [Stripe React Native Documentation](https://stripe.dev/stripe-react-native/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Stripe API Authentication](https://stripe.com/docs/api/authentication)

