# Next Steps: Session Token Migration

## Current Status

### ✅ Completed
1. **Backend Support** (`apps/web/lib/api/session-auth.ts`)
   - ✅ Added support for sessionToken from headers (`X-Session-Token` or `Authorization: Bearer`)
   - ✅ Added JWT fallback for backward compatibility
   - ✅ Updated all authentication functions

2. **Mobile App Core** 
   - ✅ `apps/mobile/store/authApi.ts` - Updated to use `cribnosh_session_token`
   - ✅ `apps/mobile/store/customerApi.ts` - Updated to use `cribnosh_session_token`
   - ✅ Both files send `X-Session-Token` header
   - ✅ Login responses store sessionToken automatically

3. **API Route Comments**
   - ✅ Updated 7 API routes to remove JWT references

4. **Test Utilities**
   - ✅ Added `createTestSessionToken()` function
   - ✅ Added `createTestRequestWithSessionToken()` helper
   - ✅ Added `createTestRequestWithSessionTokenHeader()` helper
   - ✅ Marked `createTestJwt()` as deprecated

5. **Utilities**
   - ✅ Marked `apps/mobile/utils/jwtUtils.ts` as deprecated

### ⚠️ Remaining Work

## Phase 1: Complete Mobile App Migration (Priority: High)

### 1.1 Update Mobile Hooks
**File**: `apps/mobile/hooks/useCribNoshAuth.ts`
- [ ] Replace `localStorage.getItem("cribnosh_token")` with SecureStore `cribnosh_session_token`
- [ ] Update `saveToken()` to use SecureStore
- [ ] Update `clearToken()` to use SecureStore
- [ ] Update `loadToken()` to use SecureStore
- [ ] Update token references from `token` to `sessionToken`
- [ ] Remove JWT-specific logic

**Note**: This file uses `localStorage` which won't work in React Native. Needs to be updated to use `expo-secure-store`.

### 1.2 Update Other Mobile Utilities
**Files to check**:
- [ ] `apps/mobile/hooks/useAuthState.ts` - Check for JWT references
- [ ] `apps/mobile/utils/tokenTestUtils.ts` - Check for JWT references
- [ ] `apps/mobile/utils/authUtils.ts` - Check for JWT references

### 1.3 Update Mobile Login Flow
**File**: `apps/mobile/app/login-security.tsx`
- [ ] Verify it uses the updated `authApi` hooks
- [ ] Ensure sessionToken is stored correctly after login
- [ ] Update any direct token storage references

## Phase 2: Update Test Files (Priority: Medium)

### 2.1 Update Test Utilities
**File**: `apps/web/tests/utils/auth.ts`
- [x] ✅ Added `createTestSessionToken()` - DONE
- [ ] Update `buildAuthedRequest()` to use sessionToken by default
- [ ] Add helper to create test user with sessionToken

### 2.2 Update Individual Test Files
**Priority Order**:
1. **High Priority** (Core functionality):
   - [ ] `apps/web/tests/api/customer-profile.test.ts`
   - [ ] `apps/web/tests/api/customer-cart.test.ts`
   - [ ] `apps/web/tests/api/comprehensive-auth.test.ts`
   - [ ] `apps/web/tests/api/payment-endpoints.test.ts`

2. **Medium Priority** (Order management):
   - [ ] `apps/web/tests/api/order-management.test.ts`
   - [ ] `apps/web/tests/api/order-history-and-messages.test.ts`
   - [ ] `apps/web/tests/api/order-notes-and-notifications.test.ts`
   - [ ] `apps/web/tests/api/order-notify.test.ts`

3. **Lower Priority** (Admin/analytics):
   - [ ] `apps/web/tests/api/metrics-export.test.ts`
   - [ ] `apps/web/tests/api/payments-history-and-analytics-event.test.ts`
   - [ ] `apps/web/tests/api/admin-management.test.ts`
   - [ ] `apps/web/tests/api/admin-logs-export.test.ts`
   - [ ] `apps/web/tests/api/notifications-read.test.ts`
   - [ ] `apps/web/tests/api/live-streaming.test.ts`
   - [ ] `apps/web/tests/api/more-endpoints.test.ts`

**Update Pattern for Tests**:
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

## Phase 3: Testing & Verification (Priority: High)

### 3.1 Backend Testing
- [ ] Test sessionToken from cookie (web app flow)
- [ ] Test sessionToken from `X-Session-Token` header (mobile app flow)
- [ ] Test sessionToken from `Authorization: Bearer` header (mobile app alternative)
- [ ] Test JWT fallback still works (backward compatibility)
- [ ] Test expired sessionToken handling
- [ ] Test invalid sessionToken handling
- [ ] Test missing sessionToken handling

### 3.2 Mobile App Testing
- [ ] Test login flow stores sessionToken correctly
- [ ] Test API requests send sessionToken in headers
- [ ] Test logout clears sessionToken
- [ ] Test expired token handling (401 response)
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test token refresh flow (if applicable)

### 3.3 Integration Testing
- [ ] Test web app authentication flow end-to-end
- [ ] Test mobile app authentication flow end-to-end
- [ ] Test cross-platform compatibility
- [ ] Test backward compatibility during transition (JWT still works)

## Phase 4: Documentation Updates (Priority: Medium)

### 4.1 API Documentation
- [ ] Update Swagger/OpenAPI spec to reflect sessionToken
- [ ] Update authentication examples
- [ ] Update endpoint documentation
- [ ] Document header format for mobile apps

### 4.2 Developer Documentation
- [ ] Update authentication guide
- [ ] Update mobile app integration guide
- [ ] Create migration guide for developers
- [ ] Document sessionToken format and usage

## Phase 5: Monitoring & Cleanup (Priority: Low - After Verification)

### 5.1 Monitoring
- [ ] Set up monitoring for authentication success rate
- [ ] Track authentication failure rate
- [ ] Monitor token-related errors
- [ ] Track API request failures
- [ ] Monitor mobile app crashes related to auth

### 5.2 Cleanup (After Migration Verified)
- [ ] Remove JWT fallback code from `session-auth.ts`
- [ ] Remove `createTestJwt()` from test utilities
- [ ] Remove or fully deprecate `apps/mobile/utils/jwtUtils.ts`
- [ ] Check if `jsonwebtoken` package is used elsewhere
- [ ] Check if `jwt-decode` package is used elsewhere
- [ ] Remove unused JWT packages if not needed
- [ ] Remove `JWT_SECRET` environment variable if not needed
- [ ] Update environment variable documentation

## Immediate Next Steps (This Week)

### Week 1: Complete Mobile App Migration
1. **Day 1-2**: Update `useCribNoshAuth.ts` hook
   - Replace localStorage with SecureStore
   - Update all token references
   - Test on mobile device

2. **Day 3**: Update other mobile utilities
   - Check and update `useAuthState.ts`
   - Check and update `authUtils.ts`
   - Check and update `tokenTestUtils.ts`

3. **Day 4-5**: Mobile app testing
   - Test login flow
   - Test API requests
   - Test logout
   - Test on iOS and Android

### Week 2: Update Test Files
1. **Day 1-2**: Update high-priority test files
   - Customer profile tests
   - Cart tests
   - Auth tests
   - Payment tests

2. **Day 3-4**: Update medium-priority test files
   - Order management tests
   - Order history tests

3. **Day 5**: Run full test suite and fix any failures

### Week 3: Documentation & Final Verification
1. **Day 1-2**: Update API documentation
2. **Day 3**: Update developer documentation
3. **Day 4-5**: Final testing and verification

## Risk Mitigation

### During Migration
1. **Keep JWT Fallback**: Already implemented - JWT fallback will work during transition
2. **Gradual Rollout**: Test mobile app changes on staging first
3. **Monitor Closely**: Track authentication metrics during rollout
4. **Rollback Plan**: Keep JWT code until migration is fully verified

### After Migration
1. **Monitor for 1-2 weeks**: Ensure no authentication issues
2. **Gradual JWT Removal**: Remove JWT fallback after verification period
3. **Clean Up**: Remove unused JWT code and dependencies

## Success Criteria

- ✅ All mobile app requests use sessionToken
- ✅ All test files use sessionToken
- ✅ All tests pass
- ✅ No authentication failures in production
- ✅ JWT fallback can be safely removed
- ✅ Documentation is up to date

## Notes

- The JWT fallback is currently active and will support legacy clients during migration
- Mobile app should be tested thoroughly before removing JWT fallback
- Test files can be updated incrementally - they don't block production deployment
- Documentation updates can happen in parallel with testing
