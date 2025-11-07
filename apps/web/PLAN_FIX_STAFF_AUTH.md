# Fix Staff Authentication Issues - Comprehensive Plan

## Problem Analysis

The header shows "Not logged in" even when the user is logged in. Root causes identified:

1. **HttpOnly Cookie Issue**: The `convex-auth-token` cookie is set with `httpOnly: true`, which means JavaScript cannot read it from `document.cookie`. The `useStaffAuth` hook tries to check for the cookie before making the API call, but it will always return null.

2. **Hook Only Runs Once**: The `useStaffAuth` hook only runs on mount (empty dependency array), so it won't refresh after login.

3. **No Refresh Mechanism**: After successful login, there's no way to refresh the auth state in components that are already mounted.

4. **Silent Failures**: API calls can fail silently without proper error handling or retry logic.

5. **Race Conditions**: Multiple components calling `useStaffAuth` independently can cause race conditions and inconsistent state.

## Solution Overview

1. Remove cookie check from `useStaffAuth` hook (can't read HttpOnly cookies anyway)
2. Always call the API endpoint which can read HttpOnly cookies server-side
3. Add refresh mechanism to update auth state after login
4. Add better error handling and retry logic
5. Create a context provider to share auth state across components
6. Add event-based refresh system for post-login updates

## Implementation Plan

### 1. Create StaffAuthContext Provider
- **File**: `apps/web/contexts/StaffAuthContext.tsx` (new file)
- Create a React context to share staff auth state across all components
- Provide refresh function to update auth state
- Handle loading and error states centrally

### 2. Update useStaffAuth Hook
- **File**: `apps/web/hooks/useStaffAuth.ts`
- Remove cookie check (can't read HttpOnly cookies)
- Always call API endpoint directly
- Add retry logic for failed requests
- Add refresh function to manually update state
- Add better error handling

### 3. Update StaffLayout to Use Context
- **File**: `apps/web/app/staff/layout.tsx`
- Wrap layout with StaffAuthContext provider
- Use context instead of hook directly
- Pass refresh function to components that need it

### 4. Update Login Component to Refresh Auth
- **File**: `apps/web/components/ui/UnifiedInternalLogin.tsx`
- After successful login, trigger auth refresh
- Use event or context to notify other components

### 5. Update GlassNavbar to Use Context
- **File**: `apps/web/components/admin/glass-navbar.tsx`
- Use StaffAuthContext instead of useStaffAuth hook
- Remove duplicate API calls
- Use shared auth state

### 6. Add Event-Based Refresh System
- **File**: `apps/web/lib/auth/auth-events.ts` (new file)
- Create custom event system for auth state changes
- Emit events on login/logout
- Listen for events in components to refresh state

### 7. Add Error Recovery
- **File**: `apps/web/hooks/useStaffAuth.ts`
- Add retry logic with exponential backoff
- Handle network errors gracefully
- Add timeout handling

### 8. Update All Staff Pages
- Update all staff pages to use StaffAuthContext
- Remove duplicate useStaffAuth calls
- Use shared auth state

## Files to Modify

1. `apps/web/contexts/StaffAuthContext.tsx` (new) - Context provider
2. `apps/web/hooks/useStaffAuth.ts` - Remove cookie check, add refresh
3. `apps/web/lib/auth/auth-events.ts` (new) - Event system
4. `apps/web/app/staff/layout.tsx` - Add context provider
5. `apps/web/components/ui/UnifiedInternalLogin.tsx` - Trigger refresh on login
6. `apps/web/components/admin/glass-navbar.tsx` - Use context
7. `apps/web/app/staff/portal/page.tsx` - Use context
8. All other staff pages - Use context instead of hook

## Implementation Details

### StaffAuthContext Structure
```typescript
interface StaffAuthContextValue {
  staff: StaffUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isAuthenticated: boolean;
}
```

### useStaffAuth Hook Changes
- Remove `getCookie('convex-auth-token')` check
- Always call `/api/staff/data` endpoint
- Add `refresh()` function to manually update state
- Add retry logic (3 attempts with exponential backoff)
- Add timeout (10 seconds)

### Event System
- Emit `staff-auth:login` event on successful login
- Emit `staff-auth:logout` event on logout
- Components listen for events and refresh state

## Benefits

1. **Fixes "Not logged in" issue** - Removes cookie check that always fails
2. **Consistent state** - Single source of truth via context
3. **Better performance** - One API call instead of multiple
4. **Automatic refresh** - State updates after login automatically
5. **Better error handling** - Retry logic and error recovery
6. **Easier maintenance** - Centralized auth logic

## Testing Checklist

- [ ] Login shows user info in header immediately
- [ ] Logout clears user info in header
- [ ] Page refresh maintains auth state
- [ ] Multiple tabs stay in sync
- [ ] Network errors are handled gracefully
- [ ] Retry logic works on failed requests
- [ ] All staff pages show correct user info

