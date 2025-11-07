# Type Safety Implementation - Next Steps Plan

## Current Progress Summary

### ✅ Completed
- **Phase 1**: Core type infrastructure created
  - `apps/web/types/errors.ts` - Error handling utilities
  - `apps/web/types/api-request.ts` - Request body helpers
  - `apps/web/types/convex-returns.ts` - Convex return type helpers
  - `apps/web/lib/api/auth-helpers.ts` - JWT verification helpers

- **Phase 2**: JWT Payload Types (Partial - ~15 files fixed)
  - Fixed: notifications, family-profile, treats, balance routes
  - Remaining: ~183 JWT payload `any` types across 136 files

- **Phase 3**: Error Handling Types (Partial - same files as Phase 2)
  - Fixed: error handling in ~15 files
  - Remaining: ~233 `catch (error: any)` across 171 files

### 📊 Remaining Work

1. **JWT Payload Types**: ~183 instances across 136 API route files
2. **Error Handling**: ~233 instances across 171 files
3. **Convex Context Types**: ~338 instances across 43 files
4. **Record<string, any>**: ~68 instances across 35 files
5. **Component State**: ~23 instances across 10 files
6. **Type Assertions**: ~100+ `as any` instances
7. **Array Types**: ~20 files with `any[]`
8. **Mobile App Types**: Multiple files in `apps/mobile/`

## Next Steps Plan

### Priority 1: Complete JWT Payload Types (High Impact)
**Target**: Fix remaining ~183 JWT payload `any` types

**Strategy**: Use the new `auth-helpers.ts` to standardize JWT verification

**Files to fix (prioritized by usage)**:
1. Customer API routes (~50 files)
   - `apps/web/app/api/customer/group-orders/**/*.ts`
   - `apps/web/app/api/customer/connections/**/*.ts`
   - `apps/web/app/api/customer/account/**/*.ts`
   - `apps/web/app/api/customer/orders/**/*.ts`
   - `apps/web/app/api/customer/support-chat/**/*.ts`

2. Payment API routes (~8 files)
   - `apps/web/app/api/payments/**/*.ts`

3. Order API routes (~15 files)
   - `apps/web/app/api/orders/**/*.ts`

4. Admin API routes (~30 files)
   - `apps/web/app/api/admin/**/*.ts`

5. Chef API routes (~20 files)
   - `apps/web/app/api/chef/**/*.ts`

**Implementation Pattern**:
```typescript
// Before
let payload: any;
payload = jwt.verify(token, JWT_SECRET);

// After
import { verifyJWT, verifyJWTWithRole } from '@/lib/api/auth-helpers';
const payload = verifyJWTWithRole(request, 'customer');
```

### Priority 2: Complete Error Handling Types
**Target**: Fix remaining ~233 `catch (error: any)` instances

**Strategy**: Use `getErrorMessage` from `@/types/errors`

**Implementation Pattern**:
```typescript
// Before
} catch (error: any) {
  return ResponseFactory.internalError(error.message || 'Failed');
}

// After
} catch (error: unknown) {
  return ResponseFactory.internalError(getErrorMessage(error, 'Failed'));
}
```

### Priority 3: Fix Convex Context Types
**Target**: Fix ~338 `any` types in Convex functions

**Files to fix**:
- `packages/convex/mutations/*.ts` - Replace `ctx: any` with `MutationCtx`
- `packages/convex/queries/*.ts` - Replace `ctx: any` with `QueryCtx`
- `packages/convex/actions/*.ts` - Replace `ctx: any` with `ActionCtx`

**Implementation Pattern**:
```typescript
// Before
import { mutation } from "../_generated/server";
export const myMutation = mutation({
  handler: async (ctx: any, args: any) => { ... }
});

// After
import { mutation } from "../_generated/server";
import type { MutationCtx } from "../../types/convex-contexts";
export const myMutation = mutation({
  handler: async (ctx: MutationCtx, args: { ... }) => { ... }
});
```

### Priority 4: Fix Record<string, any> Types
**Target**: Replace ~68 instances with `Record<string, unknown>`

**Files to fix**:
- `apps/web/lib/api/types.ts` - `ApiError.details`
- `apps/web/lib/mattermost/*.ts` - Mattermost service types
- `apps/mobile/types/customer.ts` - Metadata fields
- `packages/convex/queries/analytics.ts` - Analytics types

### Priority 5: Fix Component State Types
**Target**: Replace ~23 `useState<any>` instances

**Files to fix**:
- `apps/mobile/components/ui/MainScreen.tsx`
- `apps/web/components/admin/*.tsx`
- `apps/web/app/staff/portal/page.tsx`

### Priority 6: Fix Type Assertions
**Target**: Remove unnecessary `as any` casts (~100+ instances)

**Focus areas**:
- Convex database operations
- Property access on unknown types
- Type narrowing issues

### Priority 7: Fix Array Types
**Target**: Replace `any[]` with generics or specific types

**Files to fix**:
- `apps/web/app/api/admin/analytics-overview/route.ts`
- Utility functions with generic arrays

### Priority 8: Fix Mobile App Types
**Target**: Fix types in mobile app

**Files to fix**:
- `apps/mobile/store/customerApi.ts` - 19 instances
- `apps/mobile/store/authApi.ts`
- `apps/mobile/types/customer.ts`

## Recommended Implementation Order

### Batch 1: High-Impact API Routes (Week 1)
1. Complete customer API routes JWT payload types (~50 files)
2. Complete customer API routes error handling (~50 files)
3. Fix payment API routes (~8 files)
4. Fix order API routes (~15 files)

### Batch 2: Admin & Chef Routes (Week 2)
1. Fix admin API routes (~30 files)
2. Fix chef API routes (~20 files)
3. Fix remaining API routes (~20 files)

### Batch 3: Convex Functions (Week 3)
1. Fix mutation context types (~100 files)
2. Fix query context types (~100 files)
3. Fix action context types (~20 files)
4. Fix remaining Convex `any` types (~118 files)

### Batch 4: Utility & Component Types (Week 4)
1. Fix `Record<string, any>` types (~68 instances)
2. Fix component state types (~23 instances)
3. Fix array types (~20 files)
4. Fix type assertions (~100+ instances)

### Batch 5: Mobile App & Final Cleanup (Week 5)
1. Fix mobile app types
2. Run TypeScript compiler
3. Fix any remaining errors
4. Validate no `any` types remain

## Efficiency Improvements

### Use Helper Functions
- Use `verifyJWT()` and `verifyJWTWithRole()` from `auth-helpers.ts`
- Use `getErrorMessage()` from `@/types/errors`
- Create more helpers as patterns emerge

### Batch Processing
- Fix files in the same directory together
- Fix files with similar patterns together
- Use find/replace for common patterns

### Validation
- Run TypeScript compiler after each batch
- Fix errors immediately
- Don't accumulate technical debt

## Success Criteria

1. ✅ Zero `let payload: any` in API routes
2. ✅ Zero `catch (error: any)` in catch blocks
3. ✅ Zero `ctx: any` in Convex functions
4. ✅ Zero `Record<string, any>` (use `unknown` instead)
5. ✅ Zero `useState<any>` in components
6. ✅ Minimal `as any` assertions (only when absolutely necessary)
7. ✅ TypeScript compilation passes with no errors
8. ✅ All types properly defined and exported

## Notes

- Generated files (`_generated/*`) should not be modified
- Third-party library types may contain `any` - these are acceptable
- Some `any` types may be necessary for complex generic scenarios - document these
- Focus on application code, not generated or third-party types

