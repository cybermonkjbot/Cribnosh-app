# Convex Backend Security Improvements

## Overview
This document outlines the security improvements made to the Convex backend to address authentication and authorization gaps.

## Security Issues Identified

### 1. **Waitlist Queries & Mutations - No Authentication**
- **Issue**: All waitlist queries were publicly accessible without authentication
- **Risk**: Anyone could query all waitlist entries, stats, and sensitive information
- **Fix**: Added `requireStaff()` checks to all waitlist queries except `getByEmail` (public for checking if email exists)

### 2. **Waitlist Mutations - No Authentication**
- **Issue**: Most waitlist mutations were publicly accessible
- **Risk**: Anyone could modify, delete, or approve/reject waitlist entries
- **Fix**: 
  - `addToWaitlist`: Remains public (anyone can join waitlist)
  - All other mutations: Require staff authentication
  - Added ownership checks for `updateWaitlistEntry` and `addBulkWaitlistEntries`

### 3. **Order Queries - No Authentication**
- **Issue**: Order queries were publicly accessible
- **Risk**: Anyone could query orders by customer_id or chef_id, exposing sensitive order data
- **Fix**: 
  - Added authentication requirements
  - Users can only access their own orders unless they're staff/admin
  - Staff/admin can access all orders

### 4. **Order Mutations - No Authentication**
- **Issue**: Order creation mutations had no authentication checks
- **Risk**: Anyone could create orders for any customer
- **Fix**: Added authentication and ownership checks - users can only create orders for themselves unless they're staff/admin

## Security Utilities Created

### `packages/convex/utils/auth.ts`
A centralized authentication and authorization utility module providing:

#### Authentication Functions
- `getAuthenticatedUser(ctx)` - Get current authenticated user (returns null if not authenticated)
- `getAuthenticatedUserBySessionToken(ctx, token)` - Get user by session token
- `requireAuth(ctx)` - Require authentication (throws if not authenticated)
- `requireAuthBySessionToken(ctx, token)` - Require authentication by session token

#### Authorization Functions
- `hasRole(user, role)` - Check if user has specific role
- `hasAnyRole(user, roles)` - Check if user has any of the specified roles
- `hasAllRoles(user, roles)` - Check if user has all specified roles
- `isAdmin(user)` - Check if user is admin/management/developer/compliance
- `isStaff(user)` - Check if user is staff/admin/management/developer/compliance/hr
- `isHROrAdmin(user)` - Check if user is HR or admin

#### Require Functions (Throw on Failure)
- `requireRole(ctx, role)` - Require specific role
- `requireAnyRole(ctx, roles)` - Require any of the specified roles
- `requireAdmin(ctx)` - Require admin role
- `requireStaff(ctx)` - Require staff role

#### Resource Access Functions
- `canAccessResource(ctx, resourceUserId, requireAdmin)` - Check if user can access resource
- `requireResourceAccess(ctx, resourceUserId, requireAdmin)` - Require access to resource
- `canModifyResource(ctx, resourceUserId)` - Check if user can modify resource
- `requireModifyAccess(ctx, resourceUserId)` - Require modification access

## Files Modified

### Queries
- `packages/convex/queries/waitlist.ts` - Added staff authentication to all queries except `getByEmail`
- `packages/convex/queries/orders.ts` - Added authentication and ownership checks
- `packages/convex/queries/users.ts` - Added authentication and ownership checks to all user queries
- `packages/convex/queries/staff.ts` - Added authentication and ownership checks to all staff queries
- `packages/convex/queries/chefs.ts` - Added authentication and ownership checks to chef queries
- `packages/convex/queries/meals.ts` - Added authentication checks where needed
- `packages/convex/queries/reviews.ts` - Added authentication checks for user-specific review queries
- `packages/convex/queries/timelogs.ts` - Added authentication and ownership checks
- `packages/convex/queries/workSessions.ts` - Added authentication and ownership checks
- `packages/convex/payroll/staff.ts` - Added authentication and ownership checks to payroll queries

### Mutations
- `packages/convex/mutations/waitlist.ts` - Added staff authentication to all mutations except `addToWaitlist`
- `packages/convex/mutations/orders.ts` - Added authentication and ownership checks to order creation
- `packages/convex/mutations/users.ts` - Added authentication and ownership checks to all user mutations
- `packages/convex/mutations/staff.ts` - Added authentication and ownership checks to all staff mutations
- `packages/convex/mutations/chefs.ts` - Added authentication and ownership checks to chef mutations
- `packages/convex/mutations/meals.ts` - Added authentication and ownership checks to meal mutations
- `packages/convex/mutations/reviews.ts` - Added authentication and ownership checks to review mutations
- `packages/convex/mutations/orderReviews.ts` - Added authentication and ownership checks
- `packages/convex/mutations/timelogs.ts` - Added authentication and ownership checks
- `packages/convex/mutations/workSessions.ts` - Added authentication and ownership checks
- `packages/convex/mutations/payroll.ts` - Added authentication checks for tax document operations
- `packages/convex/payroll/admin.ts` - Added authentication and role checks for admin payroll operations
- `packages/convex/mutations/compliance.ts` - Added authentication and admin checks for compliance operations

## Security Patterns Applied

### 1. **Public Endpoints**
- Only truly public endpoints remain unauthenticated (e.g., `addToWaitlist`, `getByEmail`)

### 2. **Staff-Only Endpoints**
- Administrative queries and mutations require staff authentication
- Examples: `getWaitlistStats`, `updateWaitlistStatus`, `deleteWaitlistEntry`

### 3. **Ownership-Based Access**
- Users can only access their own resources unless they're staff/admin
- Examples: Order queries filter by customer_id, cart queries check ownership

### 4. **Role-Based Access Control**
- Different roles have different access levels:
  - **Admin/Management/Developer/Compliance**: Full access
  - **Staff/HR**: Access to staff-related resources
  - **Customer/Chef**: Access to own resources only

## Completed Work

### ✅ High Priority - COMPLETED
1. ✅ **User Management Queries & Mutations** - Added authentication and ownership checks
2. ✅ **Staff/Payroll Queries & Mutations** - Added authentication and ownership checks
3. ✅ **Chef Queries & Mutations** - Added authentication and ownership checks
4. ✅ **Meal Queries & Mutations** - Added authentication and ownership checks
5. ✅ **Review Queries & Mutations** - Added authentication and ownership checks
6. ✅ **Timelog Queries & Mutations** - Added authentication and ownership checks
7. ✅ **WorkSession Queries & Mutations** - Added authentication and ownership checks
8. ✅ **Payroll Queries & Mutations** - Added authentication and role checks
9. ✅ **Compliance Mutations** - Added authentication and admin checks

## Remaining Work

### Medium Priority
1. **Review all remaining queries** - Ensure proper authentication for other domain areas (notifications, chats, etc.)
2. **Review all remaining mutations** - Ensure proper authentication for other domain areas
3. **Add rate limiting** - Prevent abuse
4. **Add input validation** - Ensure data integrity

### Low Priority
1. **Add audit logging** - Track all security-relevant actions
2. **Add session management** - Better session token handling
3. **Add IP-based restrictions** - For sensitive operations
4. **Update API routes** - Ensure API routes use secured Convex functions

## Best Practices Going Forward

1. **Always authenticate** - Every query/mutation should check authentication unless it's truly public
2. **Use centralized utilities** - Use functions from `utils/auth.ts` instead of custom checks
3. **Check ownership** - Users should only access their own resources unless they're staff/admin
4. **Validate input** - Always validate and sanitize input data
5. **Log security events** - Log authentication failures and unauthorized access attempts
6. **Principle of least privilege** - Grant minimum necessary permissions

## Testing Recommendations

1. **Test unauthenticated access** - Ensure unauthenticated users cannot access protected endpoints
2. **Test unauthorized access** - Ensure users cannot access other users' resources
3. **Test role-based access** - Ensure roles have correct permissions
4. **Test edge cases** - Test with invalid tokens, expired sessions, etc.

