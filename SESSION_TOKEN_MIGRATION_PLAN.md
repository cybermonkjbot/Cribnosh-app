# Session Token Migration Plan
## Transitioning from JWT to SessionToken Authentication

### Overview
This plan outlines the migration from JWT (JSON Web Token) authentication to sessionToken-based authentication across all applications (web, mobile) and API endpoints.

### Current State Analysis

#### ✅ Already Migrated (SessionToken)
- **Web App Authentication**: 
  - `apps/web/lib/api/session-auth.ts` - Session token authentication helpers
  - Most API routes using `getAuthenticatedUser`, `getAuthenticatedCustomer`, etc.
  - Login endpoints (`/api/auth/login`, `/api/auth/google-signin`, `/api/auth/apple-signin`, etc.) already return sessionToken
  - Session tokens stored in `convex-auth-token` cookie for web

- **Convex Backend**:
  - `packages/convex/mutations/users.ts` - `createAndSetSessionToken` mutation
  - `packages/convex/queries/users.ts` - `getUserBySessionToken` query
  - Schema includes `sessionToken` and `sessionExpiry` fields

#### ❌ Still Using JWT
- **Mobile App**:
  - `apps/mobile/store/authApi.ts` - Uses JWT tokens from SecureStore
  - `apps/mobile/store/customerApi.ts` - Sends JWT as Bearer token
  - `apps/mobile/utils/jwtUtils.ts` - JWT validation utilities
  - `apps/mobile/hooks/useCribNoshAuth.ts` - Uses JWT tokens

- **API Endpoints** (Need Verification):
  - Some endpoints may still accept JWT in Authorization header
  - Need to support both JWT (mobile) and sessionToken (web) during transition

- **Tests**:
  - All test files use JWT tokens (`createTestJwt` utility)
  - `apps/web/tests/utils/auth.ts` - JWT test token creation

### Migration Strategy

#### Phase 1: Backend API Support (Dual Mode)
**Goal**: Support both JWT and sessionToken during transition period

1. **Update API Route Authentication**
   - Modify `apps/web/lib/api/session-auth.ts` to accept sessionToken from:
     - Cookie: `convex-auth-token` (web)
     - Header: `X-Session-Token` or `Authorization: Bearer <sessionToken>` (mobile)
   - Add fallback to check JWT if sessionToken not found (for backward compatibility)
   - Create unified authentication function that tries sessionToken first, then JWT

2. **Update All API Routes**
   - Ensure all routes use the unified authentication helper
   - Remove JWT-specific code
   - Update comments to reflect sessionToken usage

#### Phase 2: Mobile App Migration
**Goal**: Update mobile app to use sessionToken instead of JWT

1. **Update Token Storage**
   - Change from `cribnosh_token` (JWT) to `cribnosh_session_token` (sessionToken)
   - Update SecureStore keys:
     - `cribnosh_token` → `cribnosh_session_token`
     - Keep `cribnosh_user` (unchanged)

2. **Update API Clients**
   - `apps/mobile/store/authApi.ts`:
     - Remove JWT expiration checks
     - Send sessionToken in `X-Session-Token` header or as Bearer token
     - Update login responses to store sessionToken
   
   - `apps/mobile/store/customerApi.ts`:
     - Replace JWT token retrieval with sessionToken
     - Update header format to use sessionToken

3. **Remove JWT Utilities**
   - `apps/mobile/utils/jwtUtils.ts` - Mark as deprecated or remove
   - Update all imports to remove JWT utilities

4. **Update Authentication Hooks**
   - `apps/mobile/hooks/useCribNoshAuth.ts` - Use sessionToken instead of JWT
   - Update token refresh logic if needed

#### Phase 3: Test Updates
**Goal**: Update all tests to use sessionToken

1. **Update Test Utilities**
   - `apps/web/tests/utils/auth.ts`:
     - Create `createTestSessionToken()` function
     - Keep `createTestJwt()` for backward compatibility during transition
     - Update to generate sessionToken using Convex mutation

2. **Update All Test Files**
   - Replace `createTestJwt()` calls with `createTestSessionToken()`
   - Update test requests to use sessionToken in cookies or headers
   - Update test expectations for sessionToken format

#### Phase 4: Cleanup & Documentation
**Goal**: Remove JWT code and document new authentication flow

1. **Remove JWT Dependencies**
   - Remove `jsonwebtoken` package if no longer needed
   - Remove `jwt-decode` if not used elsewhere
   - Clean up JWT-related environment variables

2. **Update Documentation**
   - API documentation (Swagger/OpenAPI)
   - Update authentication examples
   - Update mobile app documentation
   - Update developer guides

3. **Code Cleanup**
   - Remove JWT-related comments
   - Remove deprecated JWT utilities
   - Clean up unused imports

### Detailed Implementation Steps

#### Step 1: Create Unified Authentication Helper

**File**: `apps/web/lib/api/session-auth.ts`

Add function to support both sessionToken (cookie/header) and JWT (header) for backward compatibility:

```typescript
/**
 * Get authenticated user from session token or JWT (fallback)
 * Supports both sessionToken (preferred) and JWT (legacy) during migration
 */
async function getAuthenticatedUserWithFallback(
  request: NextRequest
): Promise<AuthenticatedUser> {
  // Try sessionToken from cookie first (web)
  const cookieToken = request.cookies.get('convex-auth-token')?.value;
  
  // Try sessionToken from header (mobile)
  const headerToken = request.headers.get('X-Session-Token') || 
    request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Try JWT from Authorization header (legacy mobile)
  const authHeader = request.headers.get('Authorization');
  const jwtToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.replace('Bearer ', '') 
    : null;
  
  // Priority: cookie sessionToken > header sessionToken > JWT
  if (cookieToken) {
    return getAuthenticatedUserFromSessionToken(cookieToken);
  }
  
  if (headerToken && headerToken.length > 50) { // SessionToken is longer
    return getAuthenticatedUserFromSessionToken(headerToken);
  }
  
  if (jwtToken) {
    // Fallback to JWT verification (legacy)
    return getAuthenticatedUserFromJWT(jwtToken);
  }
  
  throw new AuthenticationError('Missing authentication token');
}
```

#### Step 2: Update Mobile App Token Management

**File**: `apps/mobile/store/authApi.ts`

```typescript
// Replace JWT token handling with sessionToken
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrlNoTrailing,
  prepareHeaders: async (headers) => {
    const sessionToken = await SecureStore.getItemAsync("cribnosh_session_token");
    if (sessionToken) {
      // Send sessionToken in X-Session-Token header or as Bearer token
      headers.set("X-Session-Token", sessionToken);
      // OR: headers.set("authorization", `Bearer ${sessionToken}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});
```

**File**: `apps/mobile/store/authApi.ts` - Update login responses

```typescript
// After successful login, store sessionToken instead of JWT
transformResponse: (response: any) => {
  if (response?.data?.sessionToken) {
    SecureStore.setItemAsync("cribnosh_session_token", response.data.sessionToken);
  }
  return response;
}
```

#### Step 3: Create SessionToken Test Utility

**File**: `apps/web/tests/utils/auth.ts`

```typescript
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';

/**
 * Create a test session token for a user
 * This creates a real session token using Convex mutation
 */
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

/**
 * Create a test request with session token in cookie
 */
export function createTestRequestWithSessionToken(
  url: string,
  sessionToken: string,
  method: string = 'GET'
): NextRequest {
  const request = new NextRequest(url, { method });
  request.cookies.set('convex-auth-token', sessionToken);
  return request;
}

/**
 * Create a test request with session token in header
 */
export function createTestRequestWithSessionTokenHeader(
  url: string,
  sessionToken: string,
  method: string = 'GET'
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'X-Session-Token': sessionToken,
    },
  });
  return request;
}
```

#### Step 4: Update API Routes to Use Unified Auth

**Example**: `apps/web/app/api/customer/dishes/[dish_id]/favorite/route.ts`

```typescript
// Before (with JWT comment):
// Get user from JWT token
const { userId } = await getAuthenticatedCustomer(request);

// After (clean):
// Get authenticated customer from session token
const { userId } = await getAuthenticatedCustomer(request);
```

#### Step 5: Update Mobile App Login Flow

**Files to Update**:
- `apps/mobile/app/login-security.tsx` - Update to store sessionToken
- `apps/mobile/store/authApi.ts` - Update all login mutations
- `apps/mobile/hooks/useCribNoshAuth.ts` - Update token management

### Migration Checklist

#### Backend/API
- [ ] Update `session-auth.ts` to support sessionToken from headers (mobile)
- [ ] Add JWT fallback support during transition
- [ ] Update all API route comments (remove JWT references)
- [ ] Verify all routes use unified authentication
- [ ] Update Swagger/OpenAPI documentation

#### Mobile App
- [ ] Update `authApi.ts` to use sessionToken
- [ ] Update `customerApi.ts` to use sessionToken
- [ ] Update SecureStore keys (`cribnosh_token` → `cribnosh_session_token`)
- [ ] Remove JWT expiration checks
- [ ] Update login flows to store sessionToken
- [ ] Update `useCribNoshAuth.ts` hook
- [ ] Remove or deprecate `jwtUtils.ts`

#### Tests
- [ ] Create `createTestSessionToken()` utility
- [ ] Update all test files to use sessionToken
- [ ] Update test request helpers
- [ ] Verify all tests pass

#### Documentation
- [ ] Update API documentation
- [ ] Update mobile app authentication guide
- [ ] Update developer documentation
- [ ] Create migration guide for developers

#### Cleanup
- [ ] Remove JWT-related code
- [ ] Remove unused JWT dependencies
- [ ] Clean up JWT environment variables
- [ ] Remove deprecated utilities

### Testing Strategy

1. **Unit Tests**: Update all authentication-related unit tests
2. **Integration Tests**: Test both web (cookie) and mobile (header) flows
3. **E2E Tests**: Verify end-to-end authentication flows
4. **Backward Compatibility**: Test JWT fallback during transition
5. **Mobile App**: Test on iOS and Android devices

### Rollout Plan

1. **Week 1**: Backend support for dual mode (sessionToken + JWT fallback)
2. **Week 2**: Mobile app migration to sessionToken
3. **Week 3**: Test updates and verification
4. **Week 4**: Remove JWT support and cleanup

### Risk Mitigation

1. **Backward Compatibility**: Keep JWT support during transition period
2. **Gradual Rollout**: Migrate mobile app incrementally
3. **Monitoring**: Track authentication failures during migration
4. **Rollback Plan**: Keep JWT code until migration is verified

### Success Criteria

- ✅ All API endpoints accept sessionToken
- ✅ Mobile app uses sessionToken instead of JWT
- ✅ All tests pass with sessionToken
- ✅ No JWT code remains in codebase
- ✅ Documentation updated
- ✅ Zero authentication failures during migration
