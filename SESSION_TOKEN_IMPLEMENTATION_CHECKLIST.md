# Session Token Implementation Checklist

## Quick Reference: Files That Need Updates

### Critical Files (Must Update)

#### Backend/API
1. **`apps/web/lib/api/session-auth.ts`**
   - [ ] Add support for sessionToken from `X-Session-Token` header
   - [ ] Add support for sessionToken from `Authorization: Bearer <sessionToken>` header
   - [ ] Add JWT fallback for backward compatibility during migration
   - [ ] Update function documentation

2. **API Routes Using JWT Comments** (Update comments only):
   - [ ] `apps/web/app/api/customer/dishes/[dish_id]/favorite/route.ts` - Line 66
   - [ ] `apps/web/app/api/messaging/send/route.ts` - Line 71
   - [ ] `apps/web/app/api/nosh-heaven/videos/[videoId]/report/route.ts` - Line 76
   - [ ] `apps/web/app/api/chat/order/[order_id]/route.ts` - Lines 126, 163
   - [ ] `apps/web/app/api/chat/order/[order_id]/read/route.ts` - Line 148
   - [ ] `apps/web/app/api/chat/order/[order_id]/messages/route.ts` - Line 163
   - [ ] `apps/web/app/api/admin/users/reject-chef/[chef_id]/route.ts` - Line 144

#### Mobile App
3. **`apps/mobile/store/authApi.ts`**
   - [ ] Remove `isTokenExpired` import from `jwtUtils`
   - [ ] Change SecureStore key from `cribnosh_token` to `cribnosh_session_token`
   - [ ] Remove JWT expiration checks
   - [ ] Update `prepareHeaders` to send `X-Session-Token` header
   - [ ] Update login response handlers to store sessionToken
   - [ ] Update logout to clear sessionToken

4. **`apps/mobile/store/customerApi.ts`**
   - [ ] Remove `isTokenExpired` import from `jwtUtils`
   - [ ] Change SecureStore key from `cribnosh_token` to `cribnosh_session_token`
   - [ ] Remove JWT expiration checks
   - [ ] Update `prepareHeaders` to send `X-Session-Token` header
   - [ ] Update FormData handler to use sessionToken

5. **`apps/mobile/hooks/useCribNoshAuth.ts`**
   - [ ] Update token storage key
   - [ ] Remove JWT-specific logic
   - [ ] Update token refresh logic if needed

6. **`apps/mobile/utils/jwtUtils.ts`**
   - [ ] Mark as deprecated
   - [ ] Add deprecation notice
   - [ ] Remove after migration complete

7. **`apps/mobile/app/login-security.tsx`**
   - [ ] Update to store sessionToken instead of JWT
   - [ ] Update token key references

#### Tests
8. **`apps/web/tests/utils/auth.ts`**
   - [ ] Add `createTestSessionToken()` function
   - [ ] Add `createTestRequestWithSessionToken()` helper
   - [ ] Add `createTestRequestWithSessionTokenHeader()` helper
   - [ ] Keep `createTestJwt()` for backward compatibility during transition

9. **Test Files** (Update to use sessionToken):
   - [ ] `apps/web/tests/api/metrics-export.test.ts`
   - [ ] `apps/web/tests/api/payments-history-and-analytics-event.test.ts`
   - [ ] `apps/web/tests/api/customer-profile.test.ts`
   - [ ] `apps/web/tests/api/customer-cart.test.ts`
   - [ ] `apps/web/tests/api/comprehensive-auth.test.ts`
   - [ ] `apps/web/tests/api/payment-endpoints.test.ts`
   - [ ] `apps/web/tests/api/order-notes-and-notifications.test.ts`
   - [ ] `apps/web/tests/api/order-management.test.ts`
   - [ ] `apps/web/tests/api/more-endpoints.test.ts`
   - [ ] `apps/web/tests/api/order-history-and-messages.test.ts`
   - [ ] `apps/web/tests/api/live-streaming.test.ts`
   - [ ] `apps/web/tests/api/admin-logs-export.test.ts`
   - [ ] `apps/web/tests/api/notifications-read.test.ts`
   - [ ] `apps/web/tests/api/admin-management.test.ts`
   - [ ] `apps/web/tests/api/order-notify.test.ts`

### Documentation Files
10. **API Documentation**
    - [ ] Update Swagger/OpenAPI spec
    - [ ] Update authentication examples
    - [ ] Update endpoint documentation

11. **Developer Documentation**
    - [ ] Update authentication guide
    - [ ] Update mobile app integration guide
    - [ ] Create migration guide

### Optional Cleanup (After Migration Complete)
12. **Remove JWT Dependencies**
    - [ ] Check if `jsonwebtoken` is used elsewhere
    - [ ] Check if `jwt-decode` is used elsewhere
    - [ ] Remove unused JWT packages

13. **Environment Variables**
    - [ ] Remove `JWT_SECRET` if no longer needed
    - [ ] Update environment variable documentation

## Implementation Order

### Phase 1: Backend Support (Week 1)
1. Update `session-auth.ts` to support headers
2. Add JWT fallback
3. Update API route comments
4. Test backend changes

### Phase 2: Mobile App (Week 2)
1. Update `authApi.ts`
2. Update `customerApi.ts`
3. Update hooks and utilities
4. Test mobile app changes

### Phase 3: Tests (Week 3)
1. Create test utilities
2. Update all test files
3. Run full test suite
4. Fix any failing tests

### Phase 4: Cleanup (Week 4)
1. Remove JWT code
2. Update documentation
3. Remove unused dependencies
4. Final verification

## Testing Checklist

### Backend Testing
- [ ] Test sessionToken from cookie (web)
- [ ] Test sessionToken from `X-Session-Token` header (mobile)
- [ ] Test sessionToken from `Authorization: Bearer` header (mobile)
- [ ] Test JWT fallback (during transition)
- [ ] Test expired sessionToken handling
- [ ] Test invalid sessionToken handling
- [ ] Test missing sessionToken handling

### Mobile App Testing
- [ ] Test login flow stores sessionToken
- [ ] Test API requests send sessionToken
- [ ] Test token refresh (if applicable)
- [ ] Test logout clears sessionToken
- [ ] Test expired token handling
- [ ] Test on iOS device
- [ ] Test on Android device

### Integration Testing
- [ ] Test web app authentication flow
- [ ] Test mobile app authentication flow
- [ ] Test cross-platform compatibility
- [ ] Test backward compatibility during transition

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Revert mobile app changes, keep JWT support
2. **Partial Rollback**: Keep dual mode (sessionToken + JWT) longer
3. **Gradual Rollback**: Rollback specific features, not entire migration

## Monitoring

Track these metrics during migration:
- Authentication success rate
- Authentication failure rate
- Token-related errors
- API request failures
- Mobile app crashes related to auth
