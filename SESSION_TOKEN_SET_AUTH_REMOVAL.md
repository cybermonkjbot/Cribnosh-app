# Session Token Migration: Removing setAuth()

## Overview
`ConvexHttpClient.setAuth()` expects a JWT token, but we're using session tokens. This document outlines the changes made to remove `setAuth()` and use session tokens as parameters instead.

## Changes Made

### 1. Server-Side Changes (`apps/web/lib/conxed-client.ts`)
- **Removed**: `setAuth()` call from `getConvexClientFromRequest()`
- **Added**: `getSessionTokenFromRequest()` helper function to extract session tokens
- **Result**: Client is returned without auth set; session tokens must be passed as parameters

### 2. Client-Side Changes (`apps/web/components/ConvexClientProvider.tsx`)
- **Removed**: `convex.setAuth(async () => token)` call
- **Updated**: Authentication status is tracked but not set on client
- **Result**: Client-side queries must pass session tokens as parameters

## How to Use Session Tokens

### Server-Side API Routes

**Before (using setAuth):**
```typescript
const convex = getConvexClientFromRequest(request);
// setAuth() was called internally, queries could use getAuthenticatedUser(ctx)
const user = await convex.query(api.queries.users.getCurrentUser);
```

**After (passing session token):**
```typescript
const convex = getConvexClientFromRequest(request);
const sessionToken = getSessionTokenFromRequest(request);

if (sessionToken) {
  // Pass session token as parameter to queries that accept it
  const user = await convex.query(api.queries.users.getUserBySessionToken, { 
    sessionToken 
  });
}
```

### Client-Side React Hooks

**Before (using setAuth):**
```typescript
// setAuth() was called in ConvexClientProvider
const user = useQuery(api.queries.users.getCurrentUser);
```

**After (passing session token):**
```typescript
// Extract session token from cookie
const sessionToken = getCookie('convex-auth-token');

// Pass session token as parameter
const user = useQuery(
  api.queries.users.getUserBySessionToken,
  sessionToken ? { sessionToken } : 'skip'
);
```

## Queries/Mutations That Need Updates

### Queries/Mutations Using `getAuthenticatedUser(ctx)` or `requireAuth(ctx)`

These functions rely on `ctx.auth.getUserIdentity()` which requires JWT from `setAuth()`. They need to be updated to:

1. Accept `sessionToken` as a parameter
2. Use `getAuthenticatedUserBySessionToken(ctx, sessionToken)` or `requireAuthBySessionToken(ctx, sessionToken)` instead

**Example Update:**

**Before:**
```typescript
export const getCurrentUser = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return user;
  },
});
```

**After:**
```typescript
export const getCurrentUser = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuthBySessionToken(ctx, args.sessionToken);
    return user;
  },
});
```

## Migration Status

### ✅ Completed
- [x] Removed `setAuth()` from `getConvexClientFromRequest()`
- [x] Removed `setAuth()` from `ConvexClientProvider`
- [x] Added `getSessionTokenFromRequest()` helper function

### 🔄 In Progress
- [ ] Update all API routes to use `getSessionTokenFromRequest()` and pass session tokens
- [ ] Update queries/mutations that use `getAuthenticatedUser(ctx)` to accept `sessionToken` parameter
- [ ] Update queries/mutations that use `requireAuth(ctx)` to accept `sessionToken` parameter

### 📋 To Do
- [ ] Audit all queries/mutations for `getAuthenticatedUser(ctx)` usage
- [ ] Update client-side queries to pass session tokens
- [ ] Test all authentication flows
- [ ] Update documentation

## Helper Functions Available

### Server-Side
- `getConvexClientFromRequest(request)` - Returns Convex client (no auth set)
- `getSessionTokenFromRequest(request)` - Extracts session token from request
- `extractSessionToken(request)` - Internal function to extract token from cookies/headers

### Client-Side
- Session tokens should be extracted from cookies: `document.cookie.match(/(^| )convex-auth-token=([^;]+)/)`

## Notes

- Session tokens are passed as parameters, not via `setAuth()`
- Queries/mutations that accept `userId` directly don't need changes (they already work)
- Queries/mutations that use `getAuthenticatedUser(ctx)` need to be updated to accept `sessionToken`
- The `getAuthenticatedUserBySessionToken()` function is available in `packages/convex/utils/auth.ts`

