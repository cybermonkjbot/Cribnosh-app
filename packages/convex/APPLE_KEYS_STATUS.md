# Apple-Related Environment Variables Status

## Summary

Apple-related keys are **NOT needed in Convex**. They are only needed in:
- **Web App (Next.js)** - For Apple Sign-In and Apple Maps
- **Mobile App (Expo)** - For Apple Sign-In (optional, not currently used)

## Web App (Next.js) - Required for Apple Sign-In

These variables are needed in `apps/web/.env.local`:

### 1. **`APPLE_CLIENT_ID`** (Required for Apple Sign-In)
   - **Used in**: `app/api/auth/apple-signin/route.ts`
   - **Description**: Apple Client ID (Service ID) for Sign-In
   - **Where to get**: https://developer.apple.com/account/resources/identifiers/list
   - **Value**: `com.cribnosh.co.uk` ✅ (Confirmed - this is the Bundle ID)
   - **Note**: For Sign-In, you need a Service ID (not the App ID). Create one at the identifiers page.
   - **Status**: ❌ **MISSING** - Needs to be set in web app .env.local

### 2. **`APPLE_TEAM_ID`** (Required for Apple Sign-In)
   - **Used in**: `app/api/auth/apple-signin/route.ts`
   - **Description**: Apple Team ID for generating client secret
   - **Where to get**: https://developer.apple.com/account (top right corner)
   - **Value**: `9H45CVD35P` ✅ (Confirmed from Apple Developer account)
   - **Status**: ❌ **MISSING** - Needs to be set in web app .env.local

### 3. **`APPLE_KEY_ID`** (Required for Apple Sign-In)
   - **Used in**: `app/api/auth/apple-signin/route.ts`
   - **Description**: Apple Key ID for JWT signing
   - **Where to get**: https://developer.apple.com/account/resources/authkeys/list
   - **Example**: `ABC123DEF4`
   - **Status**: ❌ **MISSING** - Check if set in web app

### 4. **`APPLE_PRIVATE_KEY`** (Required for Apple Sign-In)
   - **Used in**: `app/api/auth/apple-signin/route.ts` (generateAppleClientSecret function)
   - **Description**: Apple Private Key (.p8 file content) for JWT signing
   - **Where to get**: Download from https://developer.apple.com/account/resources/authkeys/list
   - **Format**: The entire .p8 file content (including headers)
   - **Example**: 
     ```
     -----BEGIN PRIVATE KEY-----
     MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
     -----END PRIVATE KEY-----
     ```
   - **Status**: ❌ **MISSING** - Check if set in web app

### 5. **`APPLE_MAPS_API_KEY`** (Required for Apple Maps)
   - **Used in**: 
     - `app/api/apple-maps/geocode/route.ts`
     - `app/api/apple-maps/reverse-geocode/route.ts`
     - `app/api/apple-maps/places-search/route.ts`
     - `app/api/apple-maps/directions/route.ts`
     - `lib/apple-maps/service.ts`
   - **Description**: Apple Maps API Key for geocoding and maps
   - **Where to get**: https://developer.apple.com/maps/
   - **Status**: ❌ **MISSING** - Check if set in web app

### 6. **`NEXT_PUBLIC_APPLE_CLIENT_ID`** (Optional - for client-side Apple Sign-In)
   - **Used in**: `components/auth/sign-in-screen.tsx`
   - **Description**: Apple Client ID for client-side Sign-In flow
   - **Where to get**: Same as `APPLE_CLIENT_ID`
   - **Status**: ❌ **MISSING** - Check if set in web app

## Mobile App (Expo) - Optional

### 7. **`EXPO_PUBLIC_APPLE_CLIENT_ID`** (Optional - not currently used)
   - **Status**: Not currently used in codebase
   - **Description**: Apple Client ID for mobile app Sign-In
   - **Where to get**: https://developer.apple.com/account/resources/identifiers/list
   - **Note**: Mobile app uses the web API endpoint for Apple Sign-In, so this may not be needed

## Convex Backend - NOT NEEDED ✅

**No Apple-related environment variables are needed in Convex.**

The Convex backend has an Apple Sign-In notification endpoint (`internal/appleNotifications.ts`), but it:
- Verifies JWTs from Apple using Apple's public keys (fetched from Apple's servers)
- Does not require any Apple API keys or credentials
- Works without any Apple environment variables

## How to Set Apple Keys in Web App

Add these to `apps/web/.env.local`:

```bash
# =============================================================================
# APPLE SIGN-IN
# =============================================================================
# Team ID: 9H45CVD35P (confirmed)
# Bundle ID: com.cribnosh.co.uk (confirmed)
# You need to create a Service ID for Sign-In at: https://developer.apple.com/account/resources/identifiers/list
APPLE_CLIENT_ID=com.cribnosh.co.uk  # Or your Service ID if different
APPLE_TEAM_ID=9H45CVD35P
APPLE_KEY_ID=your_apple_key_id  # Create at: https://developer.apple.com/account/resources/authkeys/list
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----"  # Download .p8 file from authkeys page
NEXT_PUBLIC_APPLE_CLIENT_ID=com.cribnosh.co.uk  # Same as APPLE_CLIENT_ID

# =============================================================================
# APPLE MAPS
# =============================================================================
APPLE_MAPS_API_KEY=your_apple_maps_api_key
```

## Notes

1. **Apple Private Key**: Must include the full .p8 file content with headers
2. **Team ID**: Already in `app.json` as `"appleTeamId": "9H45CVD35P"`
3. **Client ID**: Should match your Apple Service ID
4. **Apple Maps Key**: Separate from Sign-In, used for geocoding/maps features

