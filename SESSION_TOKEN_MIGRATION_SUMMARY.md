# Session Token Migration Summary

## Overview
This document provides a high-level summary of the migration plan from JWT to sessionToken authentication across all applications.

## Current State

### ✅ Already Using SessionToken
- **Web App**: Uses sessionToken stored in `convex-auth-token` cookie
- **Backend**: Convex mutations/queries for sessionToken management
- **Login Endpoints**: Already return sessionToken after authentication

### ❌ Still Using JWT
- **Mobile App**: Uses JWT tokens stored in SecureStore (`cribnosh_token`)
- **Mobile API Clients**: Send JWT as `Authorization: Bearer <token>`
- **Tests**: All tests use JWT tokens

## Migration Goals

1. **Unified Authentication**: All apps use sessionToken instead of JWT
2. **Backward Compatibility**: Support JWT during transition period
3. **Mobile Support**: Mobile app sends sessionToken in headers
4. **Test Updates**: All tests use sessionToken
5. **Code Cleanup**: Remove all JWT-related code

## Key Changes Required

### 1. Backend API (`apps/web/lib/api/session-auth.ts`)
- Add support for sessionToken from headers (for mobile)
- Support both cookie (web) and header (mobile) formats
- Add JWT fallback during transition

### 2. Mobile App
- **Token Storage**: Change from `cribnosh_token` (JWT) to `cribnosh_session_token`
- **API Clients**: Update `authApi.ts` and `customerApi.ts` to use sessionToken
- **Headers**: Send sessionToken in `X-Session-Token` header or as Bearer token
- **Utilities**: Remove or deprecate `jwtUtils.ts`

### 3. Tests
- Create `createTestSessionToken()` utility
- Update all test files to use sessionToken
- Update test request helpers

### 4. Documentation
- Update API documentation
- Update authentication guides
- Update mobile app integration docs

## Implementation Phases

### Phase 1: Backend Support (Week 1)
- Update `session-auth.ts` to support headers
- Add JWT fallback for backward compatibility
- Update API route comments

### Phase 2: Mobile App (Week 2)
- Update token storage and retrieval
- Update API clients to use sessionToken
- Update authentication hooks

### Phase 3: Tests (Week 3)
- Create test utilities
- Update all test files
- Verify all tests pass

### Phase 4: Cleanup (Week 4)
- Remove JWT code
- Update documentation
- Remove unused dependencies

## Files to Update

### Critical Files
1. `apps/web/lib/api/session-auth.ts` - Add header support
2. `apps/mobile/store/authApi.ts` - Use sessionToken
3. `apps/mobile/store/customerApi.ts` - Use sessionToken
4. `apps/mobile/hooks/useCribNoshAuth.ts` - Update token management
5. `apps/web/tests/utils/auth.ts` - Add sessionToken utilities

### API Routes (Comments Only)
- ~30 API routes with JWT comments (update comments only)

### Test Files
- ~15 test files need updates

## Testing Strategy

1. **Unit Tests**: Update authentication-related tests
2. **Integration Tests**: Test web and mobile flows
3. **E2E Tests**: Verify end-to-end authentication
4. **Backward Compatibility**: Test JWT fallback during transition
5. **Mobile Testing**: Test on iOS and Android devices

## Success Criteria

- ✅ All API endpoints accept sessionToken
- ✅ Mobile app uses sessionToken instead of JWT
- ✅ All tests pass with sessionToken
- ✅ No JWT code remains in codebase
- ✅ Documentation updated
- ✅ Zero authentication failures during migration

## Risk Mitigation

1. **Backward Compatibility**: Keep JWT support during transition
2. **Gradual Rollout**: Migrate incrementally
3. **Monitoring**: Track authentication failures
4. **Rollback Plan**: Keep JWT code until verified

## Related Documents

- **Detailed Plan**: `SESSION_TOKEN_MIGRATION_PLAN.md`
- **Implementation Checklist**: `SESSION_TOKEN_IMPLEMENTATION_CHECKLIST.md`

## Next Steps

1. Review and approve migration plan
2. Start Phase 1: Backend support
3. Test backend changes
4. Proceed to Phase 2: Mobile app migration
5. Complete Phase 3: Test updates
6. Finalize Phase 4: Cleanup
