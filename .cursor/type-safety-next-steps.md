# Type Safety Implementation - Next Steps Plan

## Current Status

### Completed ✅
- ✅ Phase 1: Core type infrastructure (errors.ts, api-request.ts, convex-returns.ts, auth-helpers.ts)
- ✅ Phase 2 & 3: **ALL customer API files fixed** (~50+ files)
  - All JWT payload `any` types → `JWTPayload`
  - All error handling `any` types → `unknown` with `getErrorMessage`
  - All request body `any` types → `Record<string, unknown>`
  - All array `any[]` types → proper types

### Remaining Work

#### Other API Routes (Priority: High)
**JWT Payload `any` types** - 125 matches across 87 files:
- **Auth routes** (2 files): `auth/token/refresh-jwt/route.ts`, `auth/me/route.ts`
- **Chef routes** (10 files): documents, dishes, meals, availability, profile, dashboard
- **Admin routes** (10 files): reviews, users, dishes, analytics, documents
- **Orders routes** (13 files): order management, status updates, notifications
- **Payments routes** (10 files): payment intents, cards, refunds, history
- **Reviews routes** (6 files): review management, sentiment scoring
- **Other routes** (36 files): messaging, notifications, delivery, images, webhooks, etc.

**Error handling `any` types** - 155 matches across 105 files:
- Same categories as above, plus:
- **Nosh Heaven routes** (25 files): videos, users, comments, likes, search
- **Live streaming routes** (11 files): reactions, comments
- **Messaging routes** (12 files): chats, messages
- **Delivery routes** (3 files): drivers, tracking, assignments

#### Convex Functions (Priority: Medium)
- Replace context `any` types with proper `QueryCtx`, `MutationCtx`, `ActionCtx`
- Fix function argument and return types
- ~15 files estimated in `packages/convex/`

#### Other Type Issues (Priority: Low)
- Array `any[]` types (~20 files)
- Unnecessary `as any` assertions (~100+ instances)
- Component `useState<any>` (~10 files)
- `Record<string, any>` → `Record<string, unknown>` (~111 instances)

## Recommended Next Steps

### Step 1: Fix Auth Routes (Priority: High)
**Goal**: Fix authentication-related API routes
**Files**: 2 files with JWT payload issues, ~10 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
1. `auth/token/refresh-jwt/route.ts` - JWT payload
2. `auth/me/route.ts` - JWT payload
3. `auth/login/route.ts` - Error handling
4. `auth/register/route.ts` - Error handling
5. `auth/logout/route.ts` - Error handling
6. `auth/verify-2fa/route.ts` - Error handling
7. `auth/phone-signin/route.ts` - Error handling
8. `auth/apple-signin/route.ts` - Error handling
9. `auth/google-signin/route.ts` - Error handling

### Step 2: Fix Chef Routes (Priority: High)
**Goal**: Fix chef-related API routes
**Files**: 10 files with JWT payload issues, ~15 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
1. `chef/documents/*` routes (6 files) - JWT payload + error handling
2. `chef/dishes/route.ts` - JWT payload
3. `chef/meals/*` routes (2 files) - JWT payload
4. `chef/availability/route.ts` - JWT payload
5. `chef/profile/route.ts` - JWT payload + error handling
6. `chef/me/route.ts` - JWT payload
7. `chef/dashboard/*` routes (3 files) - Error handling
8. `chef/orders/*` routes (2 files) - Error handling

### Step 3: Fix Admin Routes (Priority: High)
**Goal**: Fix admin-related API routes
**Files**: 10 files with JWT payload issues, ~20 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
1. `admin/reviews/*` routes (3 files) - JWT payload + error handling
2. `admin/users/*` routes (4 files) - JWT payload + error handling
3. `admin/dishes/*` routes (3 files) - JWT payload + error handling
4. `admin/analytics/*` routes (2 files) - JWT payload + error handling
5. `admin/documents/*` routes (4 files) - JWT payload + error handling
6. `admin/chef/*` routes (2 files) - JWT payload + error handling
7. Other admin routes (10+ files) - Error handling

### Step 4: Fix Orders Routes (Priority: Medium)
**Goal**: Fix order management API routes
**Files**: 13 files with JWT payload issues, ~13 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
1. `orders/[order_id]/route.ts` - JWT payload + error handling
2. `orders/[order_id]/status/route.ts` - JWT payload + error handling
3. `orders/[order_id]/notes/route.ts` - JWT payload + error handling
4. `orders/[order_id]/messages/route.ts` - JWT payload + error handling
5. `orders/[order_id]/notifications/route.ts` - JWT payload + error handling
6. `orders/[order_id]/history/route.ts` - JWT payload + error handling
7. `orders/[order_id]/notify/route.ts` - JWT payload + error handling
8. `orders/review/route.ts` - JWT payload + error handling
9. `orders/confirm/route.ts` - JWT payload + error handling
10. `orders/prepare/route.ts` - JWT payload + error handling
11. `orders/ready/route.ts` - JWT payload + error handling
12. `orders/complete/route.ts` - JWT payload + error handling
13. `orders/deliver/route.ts` - JWT payload + error handling
14. `orders/cancel/route.ts` - JWT payload + error handling

### Step 5: Fix Payments Routes (Priority: Medium)
**Goal**: Fix payment-related API routes
**Files**: 10 files with JWT payload issues, ~10 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
1. `payments/create-payment-intent/route.ts` - JWT payload + error handling
2. `payments/create-customer/route.ts` - JWT payload + error handling
3. `payments/add-card/route.ts` - JWT payload + error handling
4. `payments/cards/route.ts` - JWT payload + error handling
5. `payments/manage/route.ts` - JWT payload + error handling (4 instances)
6. `payments/status/route.ts` - JWT payload + error handling
7. `payments/history/route.ts` - JWT payload + error handling
8. `payments/refund/route.ts` - JWT payload + error handling

### Step 6: Fix Remaining High-Traffic Routes (Priority: Medium)
**Goal**: Fix other frequently-used API routes
**Files**: ~50 files with JWT payload or error handling issues
**Approach**: Fix files individually

**Categories**:
1. **Reviews routes** (6 files): review management, sentiment scoring
2. **Messaging routes** (12 files): chats, messages
3. **Notifications routes** (4 files): notification management
4. **Delivery routes** (3 files): drivers, tracking, assignments
5. **Images routes** (3 files): image uploads and management
6. **Analytics routes** (4 files): analytics and reporting
7. **Other routes** (20+ files): webhooks, contacts, metrics, etc.

### Step 7: Fix Nosh Heaven Routes (Priority: Low)
**Goal**: Fix Nosh Heaven video platform routes
**Files**: ~25 files with error handling issues
**Approach**: Fix files individually

**Files to fix**:
- `nosh-heaven/videos/*` routes (10 files)
- `nosh-heaven/users/*` routes (3 files)
- `nosh-heaven/comments/*` routes (5 files)
- `nosh-heaven/search/*` routes (2 files)
- `nosh-heaven/admin/*` routes (2 files)
- Other nosh-heaven routes (3 files)

### Step 8: Fix Convex Functions (Priority: Medium)
**Goal**: Replace context `any` types with proper Convex context types
**Files**: ~15 files in `packages/convex/`
**Approach**: 
- Use `QueryCtx`, `MutationCtx`, `ActionCtx` from `convex/server`
- Ensure all function arguments use `v.*` validators
- Type return values properly

### Step 9: Fix Other Type Issues (Priority: Low)
**Goal**: Clean up remaining `any` usages
**Categories**:
- Array types: `any[]` → `Array<SpecificType>` or `Array<Record<string, unknown>>` (~20 files)
- Type assertions: Remove unnecessary `as any` (~100+ instances)
- Component state: `useState<any>` → `useState<SpecificType>` (~10 files)
- Records: `Record<string, any>` → `Record<string, unknown>` (~111 instances)

### Step 10: Validation & Testing (Priority: High)
**Goal**: Ensure no `any` types remain and everything compiles
**Tasks**:
1. Run TypeScript compiler: `tsc --noEmit`
2. Search for remaining `any` types: `grep -r ":\s*any" apps/web packages/convex`
3. Fix any compilation errors
4. Test critical API endpoints

## Implementation Strategy

### For Each File:
1. **Add imports**:
   ```typescript
   import type { JWTPayload } from '@/types/convex-contexts';
   import { getErrorMessage } from '@/types/errors';
   ```

2. **Fix JWT payload**:
   ```typescript
   // Before
   let payload: any;
   payload = jwt.verify(token, JWT_SECRET);
   
   // After
   let payload: JWTPayload;
   payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
   ```

3. **Fix error handling**:
   ```typescript
   // Before
   } catch (error: any) {
     return ResponseFactory.internalError(error.message || 'Failed...');
   }
   
   // After
   } catch (error: unknown) {
     return ResponseFactory.internalError(getErrorMessage(error, 'Failed...'));
   }
   ```

4. **Fix other `any` types**:
   - Replace `body: any` with `body: Record<string, unknown>`
   - Replace `as any` with proper types like `Id<'tableName'>`
   - Replace `any[]` with specific array types

## Notes

- **Do NOT batch fix** - Fix files individually as requested
- Continue the systematic approach we've established
- Focus on high-traffic routes first (auth, chef, admin, orders, payments)
- Use the helper functions we created (`verifyJWT`, `getErrorMessage`) where appropriate
- Maintain consistency with the patterns we've established
- Customer API routes are **100% complete** ✅
