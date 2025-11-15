# Fix: Stripe Key Not Being Passed

## Problem
The Stripe publishable key is set in `.env` but not being passed to the Stripe SDK, causing "You did not provide an API key" errors.

## Solution Applied

I've made the following changes to ensure the key is properly loaded:

### 1. Created `app.config.js`
- This file explicitly loads the `.env` file
- Makes the key available via `Constants.expoConfig.extra.stripePublishableKey`
- Ensures the key is embedded at build time

### 2. Updated `constants/api.ts`
- Now checks multiple sources for the publishable key:
  1. `process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (standard Expo env var)
  2. `Constants.expoConfig.extra.stripePublishableKey` (from app.config.js)
- Added detailed debug logging to help diagnose issues

### 3. Enhanced Error Handling
- Better error messages if Stripe isn't initialized
- Debug logs show where the key is coming from (or if it's missing)

## Next Steps

### Step 1: Install dotenv (if needed)
```bash
cd apps/mobile
npm install --save-dev dotenv
```

### Step 2: Restart Dev Server with Cache Clear
**IMPORTANT**: You MUST restart the dev server for changes to take effect:

```bash
cd apps/mobile

# Stop the current server (Ctrl+C)

# Clear cache and restart
npx expo start --clear
```

### Step 3: Rebuild if Using Development Build
If you're using a development build (not Expo Go), you need to rebuild:

```bash
# For iOS
npx expo run:ios --clear

# For Android
npx expo run:android --clear
```

### Step 4: Check Console Logs
When the app starts, you should see:
```
🔑 Stripe Key Check: {
  fromEnv: true,
  fromConstants: true,
  keyLength: 107,
  keyPrefix: 'pk_test_51QTHZNGAiAa...'
}
```

If you see `keyLength: 0` or `keyPrefix: 'MISSING'`, the key isn't being loaded.

## Verification

1. **Check the console** for the debug logs
2. **Try adding a card** - it should work now
3. **Check StripeProvider initialization** - you should see:
   ```
   Stripe Configuration: {
     hasStripeProvider: true,
     publishableKey: 'pk_test_51...',
     isExpoGo: false
   }
   ```

## If Still Not Working

1. **Verify .env file**:
   ```bash
   cat apps/mobile/.env | grep STRIPE
   ```
   Should show: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`

2. **Check for trailing spaces**:
   ```bash
   cat apps/mobile/.env | grep STRIPE | od -c
   ```
   Make sure there are no extra spaces after the key

3. **Try hardcoding temporarily** (for testing only):
   In `constants/api.ts`, temporarily change:
   ```typescript
   const publishableKey = 'pk_test_51QTHZNGAiAa3ySTV7uMSXj9skUWaiDHpeoBgCHilmzSmcY3CN7NjbpMeF49tjISaAHnJiwzTQeFdDSr9oAyyuxO900GS4YbEIT';
   ```
   If this works, the issue is with environment variable loading.

4. **Check app.config.js is being used**:
   - Make sure `app.config.js` exists (not just `app.json`)
   - Expo will use `app.config.js` if it exists, otherwise `app.json`

## Why This Happens

In Expo, environment variables are embedded at **build time**, not runtime. This means:
- Changing `.env` after building won't work
- You need to restart/rebuild for changes to take effect
- The `app.config.js` approach ensures the key is available via Constants

## Alternative: Use EAS Secrets (Production)

For production builds, use EAS Secrets instead of `.env`:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value pk_test_...
```

