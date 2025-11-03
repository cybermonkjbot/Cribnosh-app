# Critical `any` Usages for Type Safety Replacement

This document identifies critical uses of `any` type that should be replaced with proper types for full type safety.

## Priority 1: API Route Handlers (High Impact)

### JWT Payload Types
**Location**: Multiple API route files
**Issue**: `payload: any` used for JWT verification
**Fix**: Use centralized `JWTPayload` from `types/convex-contexts.ts`

**Files to fix:**
- `app/api/admin/analytics-overview/route.ts` (line 125)
- `app/api/notifications/route.ts` (lines 140, 171, 193, 220)
- `app/api/reviews/route.ts` (lines 128, 241, 283, 323, 360, 396)
- `app/api/messaging/chats/route.ts` (lines 124, 157)
- `app/api/delivery-applications/route.ts` (lines 162, 286, 354, 395, 432)
- `app/api/contacts/route.ts` (lines 265, 322, 356, 392, 410)
- `app/api/customer/orders/route.ts` (line 158, 306)
- And many more...

**Example fix:**
```typescript
// Before
let payload: any;
payload = jwt.verify(token, JWT_SECRET);

// After
import type { JWTPayload } from '@/types/convex-contexts';
let payload: JWTPayload;
payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
```

### Error Handling Types
**Location**: All API route catch blocks
**Issue**: `error: any` in catch blocks
**Fix**: Use `unknown` and type guards, or `Error`

**Files to fix:**
- `app/api/admin/analytics-overview/route.ts` (line 199)
- `app/api/auth/apple-signin/route.ts` (line 196)
- `app/api/notifications/route.ts` (lines 159, 181, 208, 232)
- `app/api/reviews/route.ts` (lines 146, 271, 311, 348, 384, 408)
- `app/api/messaging/chats/route.ts` (lines 143, 178)
- `app/api/delivery-applications/route.ts` (lines 183, 239, 307, 383, 420, 451)

**Example fix:**
```typescript
// Before
} catch (error: any) {
  return ResponseFactory.internalError(error.message || 'Failed');
}

// After
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed';
  return ResponseFactory.internalError(message);
}
```

## Priority 2: Convex Functions (Core Business Logic)

### Mutation Context Types
**Location**: Convex mutation handlers
**Issue**: `ctx: any` and `args: any` used instead of proper types
**Fix**: Use `MutationCtx` from `types/convex-contexts.ts`

**Files to fix:**
- `convex/mutations/analytics.ts` (lines 44, 71, 81)
  - `generateReport`: `handler: async (ctx: any, args: any)`
  - `deleteReport`: `handler: async (ctx: any, args: any)`
  - `downloadReport`: `handler: async (ctx: any, args: any)`

**Example fix:**
```typescript
// Before
import { mutation } from "../_generated/server";
export const generateReport = mutation({
  args: { reportType: v.string(), parameters: v.any() },
  handler: async (ctx: any, args: any) => { ... }
});

// After
import { mutation } from "../_generated/server";
import type { MutationCtx } from "../../types/convex-contexts";
export const generateReport = mutation({
  args: { reportType: v.string(), parameters: v.any() },
  handler: async (ctx: MutationCtx, args: { reportType: string; parameters: unknown }) => { ... }
});
```

### Internal Function Context Types
**Location**: Internal helper functions in Convex
**Issue**: `ctx: any` in internal helper functions
**Fix**: Use proper context types

**Files to fix:**
- `convex/internal/appleNotifications.ts` (lines 151, 169, 185, 210)
  - `handleEmailDisabled(ctx: any, ...)`
  - `handleEmailEnabled(ctx: any, ...)`
  - `handleConsentWithdrawn(ctx: any, ...)`
  - `handleAccountDeleted(ctx: any, ...)`

**Example fix:**
```typescript
// Before
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../../types/convex-contexts";

async function handleEmailDisabled(ctx: any, userId: Id<"users">) { ... }

// After
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../../types/convex-contexts";

async function handleEmailDisabled(ctx: MutationCtx, userId: Id<"users">) { ... }
```

### Query Context Types
**Location**: Convex query handlers
**Issue**: `ctx: any` in query functions
**Fix**: Use `QueryCtx` from `types/convex-contexts.ts`

**Files to check:**
- `convex/queries/adminActions.ts` (lines 348, 405)
  - `getRealServiceStatus(ctx: any): Promise<any[]>`
  - `getRealSystemMetrics(ctx: any): Promise<any>`

## Priority 3: Array and Generic Types

### Array Parameter Types
**Location**: Utility functions with generic arrays
**Issue**: `items: any[]` or `arr: any[]` parameters
**Fix**: Use generics or specific types

**Files to fix:**
- `app/api/admin/analytics-overview/route.ts` (lines 11, 140, 145)
  - `groupByDate(items: any[], ...)`
  - `let orders: any[] = []`
  - `filterByDateRange(arr: any[], ...)`

**Example fix:**
```typescript
// Before
function groupByDate(items: any[], field: string, range: 'day' | 'week' | 'month') {
  items.forEach(item => {
    if (!item[field]) return;
    ...
  });
}

// After
function groupByDate<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  range: 'day' | 'week' | 'month'
): Record<string, number> {
  items.forEach(item => {
    if (!item[field]) return;
    ...
  });
}
```

## Priority 4: Type Assertions (`as any`)

### Database Operations
**Location**: Convex mutations with database operations
**Issue**: Unnecessary `as any` assertions
**Fix**: Use proper type guards or narrow types

**Files to fix:**
- `convex/mutations/chefs.ts` (lines 177, 223)
  - `await ctx.db.patch(args.chefId, updates as any);`
- `convex/mutations/meals.ts` (line 20)
  - `chefId: args.chefId as any, // Should be Id<'chefs'>`
- `convex/queries/users.ts` (line 69)
  - `const userRoles = (u as any).roles as string[] | undefined;`
- `convex/queries/staff.ts` (lines 112, 169, 233, 247)
  - Multiple `(ctx.auth as any)?.isAdmin` checks

**Example fix:**
```typescript
// Before
const userRoles = (u as any).roles as string[] | undefined;

// After
interface UserWithRoles {
  roles?: string[];
}
const userRoles = (u as UserWithRoles).roles;
```

### Component State Types
**Location**: React components
**Issue**: `useState<any>` for component state
**Fix**: Define proper interfaces

**Files to fix:**
- `components/admin/email-template-editor.tsx` (line 81)
  - `const [validation, setValidation] = useState<any>(null);`
- `app/staff/portal/page.tsx` (lines 44, 48, 49)
  - `useState<any>(null)` for staffMember, localStaffMember
  - `useState<any[]>([])` for staffNotices
- `components/admin/glass-navbar.tsx` (lines 44, 56)
  - `useState<any>(null)` for searchResults and staffUser

## Priority 5: Function Parameters

### Callback Functions
**Location**: Component event handlers
**Issue**: `(value: any)` in Select/input handlers
**Fix**: Use specific string literal types

**Files to fix:**
- `components/admin/email-queue-dashboard.tsx` (lines 248, 262, 328, 344)
  - `onValueChange={(value: any) => ...}`
- `app/admin/time-tracking/reports/page.tsx` (line 352)
  - `onValueChange={(value) => setNewReport(prev => ({ ...prev, type: value as any }))}`

**Example fix:**
```typescript
// Before
<Select value={queueFilter} onValueChange={(value: any) => setQueueFilter(value)}>

// After
<Select 
  value={queueFilter} 
  onValueChange={(value: 'all' | 'pending' | 'sent' | 'failed') => setQueueFilter(value)}
>
```

## Priority 6: Library/Utility Functions

### JWT Decode Function
**Location**: `lib/middleware/monitoring.ts`
**Issue**: `decodeJWT(token: string): any`
**Fix**: Return `JWTPayload` type

**File:**
- `lib/middleware/monitoring.ts` (line 170)

**Example fix:**
```typescript
// Before
function decodeJWT(token: string): any { ... }

// After
import type { JWTPayload } from '@/types/convex-contexts';
function decodeJWT(token: string): JWTPayload { ... }
```

### Convex API Client
**Location**: `lib/conxed-client.ts`
**Issue**: `(api as any)[type][mod][fn]`
**Fix**: Use proper Convex API types

**File:**
- `lib/conxed-client.ts` (line 20)

## Summary Statistics

- **API Routes with `payload: any`**: ~50+ files
- **Error handlers with `error: any`**: ~30+ files
- **Convex functions with `ctx: any`**: ~15+ files
- **Array types with `any[]`**: ~20+ files
- **Type assertions `as any`**: ~100+ instances
- **Component state `useState<any>`**: ~10+ files

## Recommended Fix Order

1. **Start with JWT Payload types** - High impact, affects many files, but centralized fix
2. **Fix Convex context types** - Core business logic, critical for type safety
3. **Fix error handling** - Improves error safety across the codebase
4. **Fix array types** - Improves function type safety
5. **Fix type assertions** - Clean up remaining `as any` usage
6. **Fix component types** - UI-level type safety

