# Functions That Incorrectly Require Authentication

This document lists functions (queries/mutations/actions) that currently require authentication but shouldn't, based on their usage patterns and business logic.

## 🔴 Critical Issues - Sign-In Related

These functions are used during authentication/sign-in flows and MUST be public:

### 1. `getUserByPhone` (packages/convex/queries/users.ts:41)
- **Current**: Requires `requireAuth`
- **Should be**: Public (like `getUserByEmail`)
- **Reason**: Used during phone number sign-in to check if user exists
- **Fix**: Remove `requireAuth` check, make it public like `getUserByEmail`

### 2. `getUserByOAuthProvider` (packages/convex/queries/users.ts:64)
- **Current**: Requires `requireAuth`
- **Should be**: Public
- **Reason**: Used during OAuth sign-in (Google/Apple) to find existing users
- **Fix**: Remove `requireAuth` check, make it public

## 🟡 Potential Issues - Public Data Access

These might be intentionally protected, but could be public for better UX:

### 3. `getWaitlistCount` (packages/convex/queries/waitlist.ts:207)
- **Current**: Requires `requireStaff`
- **Should be**: Public (optional)
- **Reason**: Waitlist count might be displayed on public landing pages
- **Note**: This might be intentional for privacy, but consider making it public

### 4. Meal browsing queries
- **Status**: ✅ Already public - `get`, `getById`, `getAll` in meals.ts don't require auth
- **Good**: These are correctly public for browsing

### 5. Video feed queries
- **Status**: ✅ Already public - `getVideoFeed` in videoPosts.ts doesn't require auth
- **Good**: These are correctly public for browsing

## 📝 Summary of Fixes Needed

### Priority 1 (Critical - Breaks Sign-In):
1. **`getUserByPhone`** - Remove `requireAuth`, make public
2. **`getUserByOAuthProvider`** - Remove `requireAuth`, make public

### Priority 2 (Consider for better UX):
3. **`getWaitlistCount`** - Consider making public if used on landing pages

## Implementation Notes

- `getUserByEmail` is correctly public ✅
- `getUserByToken` is correctly public ✅
- Meal queries are correctly public ✅
- Video feed queries are correctly public ✅

## Security Considerations

When making these queries public:
- They only return user lookup results (existence checks)
- They don't expose sensitive data
- They're necessary for authentication flows
- Similar to `getUserByEmail` which is already public

