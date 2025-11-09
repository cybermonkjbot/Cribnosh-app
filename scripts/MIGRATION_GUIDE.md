# Session Token Migration Guide

## Overview

This guide explains how to use the automated migration script to fast-track the session token migration without breaking anything.

## ⚠️ Important Safety Measures

1. **Always run in dry-run mode first** to see what will change
2. **Commit your current work** before running the migration
3. **Test thoroughly** after migration
4. **Review changes** before committing

## Usage

### Step 1: Dry Run (See What Will Change)

```bash
bun run scripts/migrate-session-token.ts --dry-run
```

This will show you all files that would be changed without actually modifying them.

### Step 2: Test on a Single File

```bash
bun run scripts/migrate-session-token.ts --file=api/orders/prepare/route.ts
```

This will migrate a single file so you can verify the changes look correct.

### Step 3: Full Migration

Once you're confident, run the full migration:

```bash
bun run scripts/migrate-session-token.ts
```

## What the Script Does

### For API Routes (`apps/web/app/api/**/route.ts`):

1. **Adds import** (if missing):
   ```typescript
   import { getSessionTokenFromRequest } from '@/lib/conxed-client';
   ```

2. **Extracts sessionToken** (if missing):
   ```typescript
   const sessionToken = getSessionTokenFromRequest(request);
   ```

3. **Updates all `convex.query()` calls**:
   ```typescript
   // Before
   await convex.query(api.queries.orders.getOrderById, { orderId });
   
   // After
   await convex.query(api.queries.orders.getOrderById, { 
     orderId,
     sessionToken: sessionToken || undefined
   });
   ```

4. **Updates all `convex.mutation()` calls**:
   ```typescript
   // Before
   await convex.mutation(api.mutations.orders.prepareOrder, {
     orderId: order._id,
     preparedBy: userId
   });
   
   // After
   await convex.mutation(api.mutations.orders.prepareOrder, {
     orderId: order._id,
     preparedBy: userId,
     sessionToken: sessionToken || undefined
   });
   ```

### For Client Components (`apps/web/app/**/*.tsx`):

1. **Adds import** (if missing):
   ```typescript
   import { useSessionToken } from '@/hooks/useSessionToken';
   ```

2. **Adds hook call** (if missing):
   ```typescript
   const sessionToken = useSessionToken();
   ```

3. **Updates `useQuery()` calls**:
   ```typescript
   // Before
   const users = useQuery(api.queries.users.getAllUsers);
   
   // After
   const users = useQuery(api.queries.users.getAllUsers, 
     sessionToken ? { sessionToken } : "skip"
   );
   ```

4. **Updates `useMutation()` calls**:
   ```typescript
   // Before
   await createUser({ name, email, password });
   
   // After
   await createUser({ 
     name, 
     email, 
     password,
     sessionToken: sessionToken || undefined
   });
   ```

## Files That Are Skipped

The script automatically skips:
- Files already updated (listed in `ALREADY_UPDATED`)
- Webhook endpoints (`webhooks/stripe`, `stripe/webhook`)
- Public endpoints (may need manual review)
- Files that don't use Convex queries/mutations

## Manual Review Required

Some files need manual attention:

1. **`apps/web/app/api/health/route.ts`** - Calls `getAllUsers` which requires staff auth. Needs special handling.

2. **Public endpoints** - May not need `sessionToken`. Review individually.

3. **Webhook endpoints** - Don't need `sessionToken`.

## Verification Steps

After running the migration:

1. **Check for syntax errors**:
   ```bash
   bun run build
   ```

2. **Run linter**:
   ```bash
   bun run lint
   ```

3. **Test critical flows**:
   - Login/logout
   - Order creation
   - Admin pages
   - Staff portal

4. **Review git diff**:
   ```bash
   git diff
   ```

## Rollback

If something goes wrong:

```bash
git checkout -- apps/web/app/
```

## Troubleshooting

### Issue: Script doesn't detect all queries/mutations

**Solution**: The script uses regex patterns. If a file has unusual formatting, it may miss some calls. Review the file manually.

### Issue: Import conflicts

**Solution**: The script tries to update existing imports, but if there are conflicts, you may need to fix them manually.

### Issue: TypeScript errors after migration

**Solution**: Some mutations may need type assertions. Check the error messages and add `as any` if needed (temporary).

## Next Steps

After successful migration:

1. Remove `setAuth()` calls (if any remain)
2. Test all endpoints
3. Update documentation
4. Mark migration as complete

