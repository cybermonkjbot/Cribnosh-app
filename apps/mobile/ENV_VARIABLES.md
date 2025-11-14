# Mobile App Environment Variables

## Required Environment Variables

The following environment variables should be set in your `.env` file in the `apps/mobile/` directory.

### Currently Used Variables

Based on the codebase, these variables are **currently being used**:

1. **`EXPO_PUBLIC_API_BASE_URL`** (Optional)
   - **Status**: ✅ Already in .env
   - **Description**: API base URL for backend calls
   - **Default**: Automatically uses `http://localhost:3000/api` in development, `https://cribnosh.com/api` in production
   - **Example**: `EXPO_PUBLIC_API_BASE_URL=https://cribnosh.com/api`

2. **`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`** (Required for payments)
   - **Status**: ❌ **MISSING** - Add this to .env
   - **Description**: Stripe publishable key for payment processing
   - **Where to get**: https://dashboard.stripe.com/apikeys
   - **Format**: `pk_test_...` for development, `pk_live_...` for production
   - **Example**: `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEf...`

### Optional Variables (Not Currently Used But May Be Needed)

These variables are **not currently used** in the codebase but may be needed for future features:

3. **`EXPO_PUBLIC_APPLE_CLIENT_ID`** (Optional - for Apple Sign-In)
   - **Status**: ❌ Not in codebase yet
   - **Description**: Apple Client ID for Sign-In authentication
   - **Where to get**: https://developer.apple.com/account/resources/identifiers/list
   - **Example**: `EXPO_PUBLIC_APPLE_CLIENT_ID=com.cribnosh.co.uk`

4. **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** (Optional - for Google Sign-In)
   - **Status**: ❌ Not in codebase yet
   - **Description**: Google Web Client ID for Sign-In authentication
   - **Where to get**: https://console.cloud.google.com/apis/credentials
   - **Example**: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc.apps.googleusercontent.com`

5. **`EXPO_PUBLIC_CONVEX_URL`** (Required - for direct Convex communication)
   - **Status**: ✅ **REQUIRED** - Now used for email authentication
   - **Description**: Convex deployment URL for direct backend communication
   - **Where to get**: https://dashboard.convex.dev
   - **Example**: `EXPO_PUBLIC_CONVEX_URL=https://wandering-finch-293.convex.cloud`

6. **`EXPO_PUBLIC_APPLE_MAPS_API_KEY`** (Optional - if using Apple Maps directly)
   - **Status**: ❌ Not in codebase yet
   - **Description**: Apple Maps API Key
   - **Where to get**: https://developer.apple.com/maps/
   - **Example**: `EXPO_PUBLIC_APPLE_MAPS_API_KEY=your_key_here`

## Current .env File Status

Your current `.env` file contains:
- ✅ `EXPO_PUBLIC_API_BASE_URL` (set to localhost for development)

## Missing Variables

Add these to your `.env` file:

```bash
# Required for payments
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here

# Required for direct Convex communication (email auth)
EXPO_PUBLIC_CONVEX_URL=https://wandering-finch-293.convex.cloud
```

## Complete .env Template

Here's a complete template for your `.env` file:

```bash
# =============================================================================
# API CONFIGURATION
# =============================================================================
# Leave unset to use automatic localhost detection in development
# EXPO_PUBLIC_API_BASE_URL=https://cribnosh.com/api

# =============================================================================
# PAYMENT PROCESSING (STRIPE) - REQUIRED
# =============================================================================
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# =============================================================================
# APPLE SIGN-IN (Optional)
# =============================================================================
# EXPO_PUBLIC_APPLE_CLIENT_ID=com.cribnosh.co.uk

# =============================================================================
# GOOGLE SIGN-IN (Optional)
# =============================================================================
# EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_web_client_id_here

# =============================================================================
# CONVEX (Required - for direct Convex communication)
# =============================================================================
EXPO_PUBLIC_CONVEX_URL=https://wandering-finch-293.convex.cloud

# =============================================================================
# APPLE MAPS (Optional)
# =============================================================================
# EXPO_PUBLIC_APPLE_MAPS_API_KEY=your_apple_maps_api_key_here
```

## Notes

1. **Only `EXPO_PUBLIC_*` variables are accessible** in Expo apps
2. **Restart the Expo dev server** after adding/changing variables
3. **For production builds**, set these in EAS Secrets or your CI/CD pipeline
4. **Never commit** actual API keys to version control (`.env` is in `.gitignore`)
5. The app **automatically uses localhost** in development mode if `EXPO_PUBLIC_API_BASE_URL` is not set

## How to Add Variables

1. Open `apps/mobile/.env` file
2. Add the missing variables listed above
3. Save the file
4. Restart your Expo dev server: `bun run start`

