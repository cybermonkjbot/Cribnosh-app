# Session Token Migration - Quick Reference Guide

## Code Examples: Before and After

### 1. Mobile App: Token Storage

#### Before (JWT)
```typescript
// apps/mobile/store/authApi.ts
const token = await SecureStore.getItemAsync("cribnosh_token");
if (token && !isTokenExpired(token)) {
  headers.set("authorization", `Bearer ${token}`);
}
```

#### After (SessionToken)
```typescript
// apps/mobile/store/authApi.ts
const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
if (sessionToken) {
  headers.set("X-Session-Token", sessionToken);
  // OR: headers.set("authorization", `Bearer ${sessionToken}`);
}
```

### 2. Mobile App: Login Response

#### Before (JWT)
```typescript
// After login, store JWT token
if (response?.data?.token) {
  await SecureStore.setItemAsync("cribnosh_token", response.data.token);
}
```

#### After (SessionToken)
```typescript
// After login, store sessionToken
if (response?.data?.sessionToken) {
  await SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
}
```

### 3. Backend: Authentication Helper

#### Before (Cookie Only)
```typescript
// apps/web/lib/api/session-auth.ts
async function getAuthenticatedUserBase(request: NextRequest) {
  const sessionToken = request.cookies.get('convex-auth-token')?.value;
  if (!sessionToken) {
    throw new AuthenticationError('Missing session token');
  }
  // ... validate token
}
```

#### After (Cookie + Header Support)
```typescript
// apps/web/lib/api/session-auth.ts
async function getAuthenticatedUserBase(request: NextRequest) {
  // Try cookie first (web)
  let sessionToken = request.cookies.get('convex-auth-token')?.value;
  
  // Try header (mobile)
  if (!sessionToken) {
    sessionToken = request.headers.get('X-Session-Token') || 
                   request.headers.get('Authorization')?.replace('Bearer ', '');
  }
  
  if (!sessionToken) {
    throw new AuthenticationError('Missing session token');
  }
  // ... validate token
}
```

### 4. API Route: Authentication

#### Before (JWT Comment)
```typescript
// apps/web/app/api/customer/dishes/[dish_id]/favorite/route.ts
// Get user from JWT token
const { userId } = await getAuthenticatedCustomer(request);
```

#### After (SessionToken Comment)
```typescript
// apps/web/app/api/customer/dishes/[dish_id]/favorite/route.ts
// Get authenticated customer from session token
const { userId } = await getAuthenticatedCustomer(request);
```

### 5. Tests: Token Creation

#### Before (JWT)
```typescript
// apps/web/tests/utils/auth.ts
import jwt from 'jsonwebtoken';

export function createTestJwt(payload: Record<string, any>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

// Usage
const token = createTestJwt({ user_id: 'u1', email: 'user@example.com' });
const req = new NextRequest(url, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### After (SessionToken)
```typescript
// apps/web/tests/utils/auth.ts
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';

export async function createTestSessionToken(
  userId: string,
  expiresInDays: number = 30
): Promise<string> {
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
    userId: userId as any,
    expiresInDays,
  });
  return result.sessionToken;
}

// Usage
const sessionToken = await createTestSessionToken('u1');
const req = new NextRequest(url, {
  cookies: { 'convex-auth-token': sessionToken }
});
// OR for mobile tests:
const req = new NextRequest(url, {
  headers: { 'X-Session-Token': sessionToken }
});
```

### 6. Mobile App: Token Expiration Check

#### Before (JWT)
```typescript
// apps/mobile/store/customerApi.ts
import { isTokenExpired } from "@/utils/jwtUtils";

const token = await SecureStore.getItemAsync("cribnosh_token");
if (token && !isTokenExpired(token)) {
  headers.set("authorization", `Bearer ${token}`);
} else {
  // Clear expired token
  await SecureStore.deleteItemAsync("cribnosh_token");
}
```

#### After (SessionToken)
```typescript
// apps/mobile/store/customerApi.ts
// No expiration check needed - backend validates sessionToken
const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
if (sessionToken) {
  headers.set("X-Session-Token", sessionToken);
}
// Backend will return 401 if token is expired/invalid
```

### 7. Mobile App: Logout

#### Before (JWT)
```typescript
// Clear JWT token
await SecureStore.deleteItemAsync("cribnosh_token");
await SecureStore.deleteItemAsync("cribnosh_user");
```

#### After (SessionToken)
```typescript
// Clear sessionToken
await SecureStore.deleteItemAsync("cribnosh_session_token");
await SecureStore.deleteItemAsync("cribnosh_user");
```

## Key Differences

| Aspect | JWT | SessionToken |
|--------|-----|--------------|
| **Storage Key** | `cribnosh_token` | `cribnosh_session_token` |
| **Format** | JWT (3 parts: header.payload.signature) | Base64url string |
| **Expiration Check** | Client-side (decode JWT) | Server-side (check sessionExpiry) |
| **Header Format** | `Authorization: Bearer <token>` | `X-Session-Token: <token>` or `Authorization: Bearer <token>` |
| **Length** | ~200-300 chars | ~43 chars (32 bytes base64url) |
| **Validation** | Client can decode | Server validates against database |

## Migration Checklist

### Mobile App
- [ ] Change SecureStore key: `cribnosh_token` → `cribnosh_session_token`
- [ ] Remove `isTokenExpired()` checks
- [ ] Update header: `Authorization: Bearer` → `X-Session-Token` (or keep Bearer)
- [ ] Update login handlers to store `sessionToken` instead of `token`
- [ ] Update logout to clear `cribnosh_session_token`

### Backend
- [ ] Update `session-auth.ts` to check headers
- [ ] Support both cookie and header formats
- [ ] Add JWT fallback during transition
- [ ] Update API route comments

### Tests
- [ ] Create `createTestSessionToken()` utility
- [ ] Update test requests to use sessionToken
- [ ] Update test helpers

## Common Issues

### Issue 1: Token Not Found
**Problem**: Mobile app can't find sessionToken  
**Solution**: Ensure login response stores `sessionToken` in `cribnosh_session_token` key

### Issue 2: 401 Unauthorized
**Problem**: Backend rejects sessionToken  
**Solution**: Verify backend checks headers, not just cookies

### Issue 3: Token Expired
**Problem**: SessionToken expired  
**Solution**: Backend should return 401, mobile app should handle and re-authenticate

## Testing Tips

1. **Test Both Formats**: Test cookie (web) and header (mobile) formats
2. **Test Expiration**: Verify expired tokens return 401
3. **Test Invalid Tokens**: Verify invalid tokens return 401
4. **Test Missing Tokens**: Verify missing tokens return 401
5. **Test Logout**: Verify logout clears token and returns 401 on subsequent requests
