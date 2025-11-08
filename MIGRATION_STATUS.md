# Session Token Migration Status

## ✅ Completed Implementation

### Phase 1: Backend Support ✅
1. **`apps/web/lib/api/session-auth.ts`**
   - ✅ Added support for sessionToken from headers (`X-Session-Token` or `Authorization: Bearer`)
   - ✅ Added JWT fallback for backward compatibility
   - ✅ Updated all authentication functions to support both cookie and header formats

2. **API Route Comments**
   - ✅ Updated 7 API routes to remove JWT references

### Phase 2: Mobile App Core ✅
1. **`apps/mobile/store/authApi.ts`**
   - ✅ Changed SecureStore key from `cribnosh_token` to `cribnosh_session_token`
   - ✅ Removed JWT expiration checks
   - ✅ Updated `prepareHeaders` to send `X-Session-Token` header
   - ✅ Added `transformResponse` handlers to store sessionToken after login
   - ✅ Updated logout to clear sessionToken

2. **`apps/mobile/store/customerApi.ts`**
   - ✅ Changed SecureStore key from `cribnosh_token` to `cribnosh_session_token`
   - ✅ Removed JWT expiration checks
   - ✅ Updated `prepareHeaders` to send `X-Session-Token` header
   - ✅ Updated FormData handler to use sessionToken
   - ✅ Updated error handling to clear sessionToken on 401

3. **`apps/mobile/hooks/useCribNoshAuth.ts`** ✅
   - ✅ Replaced `localStorage` with `expo-secure-store`
   - ✅ Changed `cribnosh_token` → `cribnosh_session_token`
   - ✅ Updated `loadToken()`, `saveToken()`, `clearToken()` methods to use SecureStore
   - ✅ Updated `request()` method to send `X-Session-Token` header
   - ✅ Updated all login methods to store sessionToken
   - ✅ Updated AuthResponse interface to include sessionToken

4. **`apps/mobile/utils/authUtils.ts`** ✅
   - ✅ Changed all `cribnosh_token` → `cribnosh_session_token`
   - ✅ Updated comments to reflect sessionToken usage
   - ✅ Updated `storeAuthData()` parameter name to sessionToken

5. **`apps/mobile/hooks/useAuthState.ts`** ✅
   - ✅ Removed `isTokenExpired` import from `jwtUtils`
   - ✅ Removed token expiration checks (server validates sessionToken)
   - ✅ Updated `checkTokenExpiration()` to always return false (server validates)
   - ✅ Updated `login()` method parameter to sessionToken

6. **`apps/mobile/utils/jwtUtils.ts`** ✅
   - ✅ Marked as deprecated with deprecation notice

7. **`apps/mobile/utils/tokenTestUtils.ts`** ✅
   - ✅ Updated to use `cribnosh_session_token`
   - ✅ Added deprecation notices

### Phase 3: Test Utilities ✅
1. **`apps/web/tests/utils/auth.ts`**
   - ✅ Added `createTestSessionToken()` function
   - ✅ Added `createTestRequestWithSessionToken()` helper
   - ✅ Added `createTestRequestWithSessionTokenHeader()` helper
   - ✅ Updated `buildAuthedRequest()` to use sessionToken by default (async)
   - ✅ Added `buildAuthedRequestSync()` for backward compatibility
   - ✅ Marked `createTestJwt()` as deprecated

2. **Test Files**
   - ✅ Updated `apps/web/tests/integration/payments.integration.test.ts` to use async `buildAuthedRequest`

## 📋 Remaining Work

### Test Files (Can Be Done Incrementally)
The following test files still use `createTestJwt()` and need to be updated to use `createTestSessionToken()`:

**High Priority**:
- `apps/web/tests/api/customer-profile.test.ts`
- `apps/web/tests/api/customer-cart.test.ts`
- `apps/web/tests/api/comprehensive-auth.test.ts`
- `apps/web/tests/api/payment-endpoints.test.ts`

**Medium Priority**:
- `apps/web/tests/api/order-management.test.ts`
- `apps/web/tests/api/order-history-and-messages.test.ts`
- `apps/web/tests/api/order-notes-and-notifications.test.ts`
- `apps/web/tests/api/order-notify.test.ts`

**Lower Priority**:
- `apps/web/tests/api/metrics-export.test.ts`
- `apps/web/tests/api/payments-history-and-analytics-event.test.ts`
- `apps/web/tests/api/admin-management.test.ts`
- `apps/web/tests/api/admin-logs-export.test.ts`
- `apps/web/tests/api/notifications-read.test.ts`
- `apps/web/tests/api/live-streaming.test.ts`
- `apps/web/tests/api/more-endpoints.test.ts`

**Update Pattern**:
```typescript
// Before:
const token = createTestJwt({ user_id: 'u1', email: 'user@example.com' });
const req = new NextRequest(url, {
  headers: { Authorization: `Bearer ${token}` }
});

// After:
const sessionToken = await createTestSessionToken('u1');
const req = createTestRequestWithSessionToken(url, sessionToken);
// OR for mobile tests:
const req = createTestRequestWithSessionTokenHeader(url, sessionToken);
```

### Documentation
- [ ] Update Swagger/OpenAPI spec
- [ ] Update authentication examples
- [ ] Update developer documentation

### Cleanup (After Verification)
- [ ] Remove JWT fallback code from `session-auth.ts`
- [ ] Remove `createTestJwt()` from test utilities
- [ ] Remove `apps/mobile/utils/jwtUtils.ts`
- [ ] Check if `jsonwebtoken` package is used elsewhere
- [ ] Remove unused JWT packages

## 🎯 Current Status

### Ready for Testing
- ✅ Backend supports both sessionToken and JWT fallback
- ✅ Mobile app core files updated
- ✅ Mobile hooks and utilities updated
- ✅ Test utilities created

### Next Steps
1. **Test mobile app authentication** - Verify login/logout flows work
2. **Update test files** - Can be done incrementally
3. **Monitor authentication** - Track success/failure rates
4. **Remove JWT fallback** - After verification period

## 🔄 Migration Strategy

### Current State
- **Web App**: Uses sessionToken in cookies ✅
- **Mobile App**: Uses sessionToken in headers ✅
- **Backend**: Supports both sessionToken and JWT fallback ✅

### Backward Compatibility
- JWT fallback is active and will support legacy clients during transition
- Test files can use `buildAuthedRequestSync()` for synchronous JWT-based tests
- All mobile files updated to use sessionToken

### Testing Priority
1. **Mobile App** - Test authentication flows (login, logout, API requests)
2. **Backend** - Test sessionToken validation from headers
3. **Test Files** - Update incrementally (doesn't block deployment)

## 📝 Notes

- All critical mobile files have been updated
- Backend supports both formats during transition
- Test files can be updated incrementally
- JWT fallback ensures no breaking changes during migration
