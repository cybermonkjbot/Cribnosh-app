# Immediate Action Plan: Session Token Migration

## Critical Files Needing Updates (Do First)

### 1. `apps/mobile/hooks/useCribNoshAuth.ts` ⚠️ CRITICAL
**Issue**: Uses `localStorage` which doesn't work in React Native
**Changes Needed**:
- Replace `localStorage` with `expo-secure-store`
- Change `cribnosh_token` → `cribnosh_session_token`
- Update `loadToken()`, `saveToken()`, `clearToken()` methods
- Update `request()` method to send `X-Session-Token` header instead of `Authorization: Bearer`

**Priority**: HIGH - This file is likely used for authentication

### 2. `apps/mobile/utils/authUtils.ts` ⚠️ CRITICAL
**Issue**: Still uses `cribnosh_token` (JWT key)
**Changes Needed**:
- Change all `cribnosh_token` → `cribnosh_session_token`
- Update JWT comments to sessionToken
- Remove JWT-specific logic if any

**Priority**: HIGH - Used by authentication utilities

### 3. `apps/mobile/hooks/useAuthState.ts` ⚠️ HIGH
**Issue**: Uses `isTokenExpired` from `jwtUtils`
**Changes Needed**:
- Remove `isTokenExpired` import
- Remove token expiration checks (server validates sessionToken)
- Update to use `cribnosh_session_token` instead of `cribnosh_token`
- Update `checkTokenExpiration()` method or remove it

**Priority**: HIGH - Used for auth state management

## Test Files (Can Be Done Incrementally)

### High Priority Test Files
1. `apps/web/tests/api/customer-profile.test.ts`
2. `apps/web/tests/api/customer-cart.test.ts`
3. `apps/web/tests/api/comprehensive-auth.test.ts`
4. `apps/web/tests/api/payment-endpoints.test.ts`

### Update Pattern
```typescript
// Replace this pattern:
const token = createTestJwt({ user_id: 'u1', email: 'user@example.com' });
const req = new NextRequest(url, {
  headers: { Authorization: `Bearer ${token}` }
});

// With this:
const sessionToken = await createTestSessionToken('u1');
const req = createTestRequestWithSessionToken(url, sessionToken);
```

## Quick Wins (Easy Updates)

### 1. Update `buildAuthedRequest()` in test utils
**File**: `apps/web/tests/utils/auth.ts`
- Update to use `createTestSessionToken()` by default
- Keep JWT option for backward compatibility

### 2. Check Other Mobile Files
- `apps/mobile/utils/tokenTestUtils.ts` - Check if it exists and needs updates
- Any other files that import `jwtUtils` or use `cribnosh_token`

## Testing Checklist (Before Production)

### Must Test
- [ ] Mobile app login flow
- [ ] Mobile app API requests
- [ ] Mobile app logout
- [ ] Web app authentication (should still work)
- [ ] JWT fallback (backward compatibility)

### Nice to Test
- [ ] Test files updated and passing
- [ ] Documentation updated

## Estimated Time

- **Critical Files**: 2-3 hours
- **Test Files**: 4-6 hours (can be done incrementally)
- **Testing**: 2-3 hours
- **Total**: ~8-12 hours

## Order of Execution

1. **First**: Update `useCribNoshAuth.ts` (critical for mobile auth)
2. **Second**: Update `authUtils.ts` (used by auth system)
3. **Third**: Update `useAuthState.ts` (used for auth state)
4. **Fourth**: Test mobile app authentication
5. **Fifth**: Update test files (can be done in parallel)
6. **Sixth**: Final testing and verification

## Notes

- The backend already supports both sessionToken and JWT fallback
- Mobile app core files (`authApi.ts`, `customerApi.ts`) are already updated
- These remaining files are mostly utilities and hooks
- Test files can be updated incrementally without blocking deployment
