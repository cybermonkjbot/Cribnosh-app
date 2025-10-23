# Token Refresh Implementation

This document describes the token refresh mechanism implemented in the CribNosh app.

## Overview

The app now includes automatic JWT token expiration detection and a user-friendly session expired modal. When a JWT token expires, users are shown a modal asking them to sign in again, rather than experiencing silent failures.

## Implementation Details

### Components Added

1. **SessionExpiredModal** (`components/ui/SessionExpiredModal.tsx`)
   - Modal that appears when the session expires
   - Clean, user-friendly design matching the app's style
   - "Sign In Again" button that opens the sign-in screen

2. **JWT Utilities** (`utils/jwtUtils.ts`)
   - `decodeJWT()` - Decodes JWT tokens without verification
   - `isTokenExpired()` - Checks if a token is expired (with buffer time)
   - `getTimeUntilExpiration()` - Gets seconds until token expiration
   - `isTokenExpiringSoon()` - Checks if token expires within 5 minutes

3. **Token Test Utilities** (`utils/tokenTestUtils.ts`)
   - Development utilities for testing token expiration
   - `createTestExpiredToken()` - Creates test tokens with specific expiration
   - `setTestExpiringToken()` - Sets a test token that expires soon
   - `clearTestTokens()` - Clears test tokens

### Modified Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Added `isSessionExpired` state
   - Added `handleSessionExpired()` and `clearSessionExpired()` functions
   - Enhanced `checkTokenExpiration()` to trigger session expired modal

2. **useAuthState Hook** (`hooks/useAuthState.ts`)
   - Added token expiration checking during initialization
   - Added `checkTokenExpiration()` function
   - Automatically clears expired tokens

3. **Auth API** (`app/store/authApi.ts`)
   - Added token expiration check before adding to request headers
   - Automatically clears expired tokens from storage

4. **MainScreen** (`components/ui/MainScreen.tsx`)
   - Added periodic token checking (every 30 seconds)
   - Integrated SessionExpiredModal
   - Added handler for session expired relogin

## How It Works

1. **Token Expiration Detection**
   - JWT tokens are checked for expiration before API requests
   - Periodic checks run every 30 seconds when user is authenticated
   - Tokens are checked during app initialization

2. **Session Expired Flow**
   - When an expired token is detected, auth data is cleared
   - `isSessionExpired` state is set to `true`
   - SessionExpiredModal appears with "Sign In Again" button
   - User clicks button → modal closes → sign-in screen opens
   - Main screen already handles unauthenticated state with NotLoggedInNotice

3. **User Experience**
   - No silent failures or confusing error messages
   - Clear indication that session has expired
   - Seamless transition back to sign-in flow
   - Maintains app state and navigation context

## Testing

### Manual Testing

1. **Set a test expiring token:**

   ```typescript
   import { setTestExpiringToken } from "./utils/tokenTestUtils";

   // Set token to expire in 5 seconds
   await setTestExpiringToken(5);
   ```

2. **Clear test tokens:**

   ```typescript
   import { clearTestTokens } from "./utils/tokenTestUtils";

   await clearTestTokens();
   ```

### Testing Scenarios

1. **Token expires during app use**
   - Set a short-lived test token
   - Use the app normally
   - Wait for token to expire
   - Verify session expired modal appears

2. **Token expires on app startup**
   - Set an expired test token
   - Restart the app
   - Verify user is shown as not authenticated

3. **API request with expired token**
   - Set an expired test token
   - Trigger an API request
   - Verify token is cleared and user is logged out

## Configuration

### Token Check Interval

The periodic token check runs every 30 seconds by default. To change this:

```typescript
// In MainScreen.tsx
const checkInterval = setInterval(() => {
  checkTokenExpiration();
}, 30000); // Change this value (in milliseconds)
```

### Token Expiration Buffer

A 30-second buffer is used to prevent edge cases where tokens expire during requests:

```typescript
// In jwtUtils.ts
export const isTokenExpired = (
  token: string,
  bufferSeconds: number = 30
): boolean => {
  // Change the default bufferSeconds value
};
```

## Security Considerations

1. **Client-Side Token Validation**
   - JWT tokens are decoded client-side for expiration checking
   - No sensitive operations rely on client-side validation
   - Server-side validation still occurs for all API requests

2. **Token Storage**
   - Tokens are stored in Expo SecureStore
   - Expired tokens are automatically cleared
   - No tokens are stored in plain text

3. **Session Management**
   - Users are immediately logged out when tokens expire
   - No partial authentication states
   - Clear separation between authenticated and unauthenticated states

## Future Enhancements

1. **Token Refresh**
   - Implement refresh token mechanism
   - Automatic token renewal before expiration
   - Seamless user experience without re-authentication

2. **Background Token Checking**
   - Check token expiration when app comes to foreground
   - Handle token expiration during background operations

3. **Enhanced Security**
   - Device fingerprinting for additional security
   - Suspicious activity detection
   - Multi-device session management
