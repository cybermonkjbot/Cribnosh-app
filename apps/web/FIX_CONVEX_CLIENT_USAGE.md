# Fix Convex Client Usage in API Routes

## Issue
Many API routes are using `ConvexHttpClient` from `convex/browser` or `getConvexClient()`/`getConvexClientFromRequest()` which return `ConvexHttpClient`. According to Convex best practices, Next.js API routes should use `fetchMutation`/`fetchQuery`/`fetchAction` from `convex/nextjs` instead.

## Pattern to Fix

### Before:
```typescript
import { ConvexHttpClient } from 'convex/browser';
import { getConvexClient } from '@/lib/conxed-client';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
// OR
const convex = getConvexClient();
// OR
const convex = getConvexClientFromRequest(request);

await convex.mutation(api.mutations.something.doSomething, args);
await convex.query(api.queries.something.getSomething, args);
await convex.action(api.actions.something.doAction, args);
```

### After:
```typescript
import { fetchMutation, fetchQuery, fetchAction } from 'convex/nextjs';

// No client initialization needed - fetchMutation/fetchQuery handle it automatically

await fetchMutation(api.mutations.something.doSomething, args);
await fetchQuery(api.queries.something.getSomething, args);
await fetchAction(api.actions.something.doAction, args);
```

## Files That Need Fixing

Run this command to find all files:
```bash
find apps/web/app/api -name "*.ts" -o -name "*.tsx" | xargs grep -l "getConvexClient\|getConvexClientFromRequest\|ConvexHttpClient.*from.*convex/browser"
```

## Already Fixed
- ✅ `apps/web/app/api/auth/apple-signin/route.ts`
- ✅ `apps/web/app/api/webhooks/resend/route.ts`
- ✅ `apps/web/app/api/chef/dishes/[dish_id]/route.ts`
- ✅ `apps/web/app/api/chat/webhook/route.ts`

## Notes
- `fetchMutation`/`fetchQuery`/`fetchAction` automatically use `NEXT_PUBLIC_CONVEX_URL` from environment variables
- No need to initialize a client
- Better error handling and clearer error messages
- This is the recommended approach per Convex documentation

