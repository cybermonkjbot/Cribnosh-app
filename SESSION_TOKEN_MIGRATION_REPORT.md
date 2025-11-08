# Session Token Migration Report

## Summary
This report identifies all files that need to be updated to complete the migration from JWT-based authentication (via `setAuth()`) to session token-based authentication (passing `sessionToken` as a parameter).

## ✅ Already Updated (4 API routes)
- `apps/web/app/api/staff/data/route.ts` ✅
- `apps/web/app/api/staff/notices/route.ts` ✅
- `apps/web/app/api/orders/ready/route.ts` ✅
- `apps/web/app/api/chat/messages/route.ts` ✅

## ✅ Already Updated (3 Client Components)
- `apps/web/app/staff/layout.tsx` ✅
- `apps/web/app/staff/portal/page.tsx` ✅
- `apps/web/app/staff/onboarding/page.tsx` ✅

---

## 🔴 CRITICAL: API Routes That Need `sessionToken` (237+ files)

### High Priority (Frequently Used / Likely to Fail)

#### Orders & Payments
- `apps/web/app/api/orders/prepare/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/review/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/deliver/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/confirm/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/complete/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/cancel/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/[order_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/[order_id]/notify/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/orders/[order_id]/notes/route.ts` - Missing `sessionToken` in queries/mutations

#### Chat & Messaging
- `apps/web/app/api/chat/conversations/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/chat/conversations/[chat_id]/messages/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/chat/conversations/[chat_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/chat/order/[order_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/messaging/send/route.ts` - Missing `sessionToken` in mutations

#### Live Streaming
- `apps/web/app/api/live-streaming/comments/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/live-streaming/reactions/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/functions/getLiveSession/route.ts` - Missing `sessionToken` in queries (may be public)
- `apps/web/app/api/functions/startLiveSession/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/endLiveSession/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/leaveLiveSession/route.ts` - Missing `sessionToken` in mutations

#### Customer APIs
- `apps/web/app/api/customer/notifications/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/profile/me/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/profile/update-phone-email/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/stats/monthly-overview/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/stats/weekly-summary/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/meals/recommended/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/family-profile/spending/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/treats/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/support-chat/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/support-chat/messages/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/support-chat/quick-replies/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/support-chat/agent/route.ts` - Missing `sessionToken` in queries/mutations

#### Admin APIs
- `apps/web/app/api/admin/users/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/admin/analytics/users/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/analytics/top-menus/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/orders/refund-eligibility-status/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/reports/user-growth-export/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/reviews/sentiment-batch/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/pending/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/chef/[chef_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/admin/[document_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/admin/[document_id]/review/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/admin/[document_id]/review-new/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/admin/[document_id]/download/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/dishes/[dish_id]/review/route.ts` - Missing `sessionToken` in mutations

#### Staff APIs
- `apps/web/app/api/staff/upload-document/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/payroll/tax-documents/route.ts` - Missing `sessionToken` in queries/mutations

#### Chef APIs
- `apps/web/app/api/chef/dishes/[dish_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/chef/documents/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/chef/documents/[document_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/chef/documents/upload/route.ts` - Missing `sessionToken` in mutations

#### Nosh Heaven (Video) APIs
- `apps/web/app/api/nosh-heaven/videos/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/like/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/comments/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/comments/[commentId]/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/edit/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/delete/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/users/[userId]/follow/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/users/[userId]/videos/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/nosh-heaven/admin/videos/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/nosh-heaven/admin/videos/[videoId]/moderate/route.ts` - Missing `sessionToken` in mutations

#### Custom Orders
- `apps/web/app/api/custom_orders/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/custom_orders/[custom_order_id]/route.ts` - Missing `sessionToken` in queries/mutations

#### Other APIs
- `apps/web/app/api/customer/group-orders/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/join/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/ready/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/close/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/status/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/group-orders/[group_order_id]/selections/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/budget/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/budget/chip-in/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/group-orders/[group_order_id]/start-selection/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/family-profile/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/family-profile/members/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/family-profile/members/[memberId]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/family-profile/invite/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/family-profile/accept/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/family-profile/validate-member/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/family-profile/orders/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/connections/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/connections/[connection_id]/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/chefs/search/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/[chef_id]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/nearby/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/popular/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/popular/[chef_id]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/featured/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/chefs/search-by-location/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/meals/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/meals/search/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/meals/popular/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/categories/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/tags/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/kitchens/[kitchenId]/favorite/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/dishes/[dish_id]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/dishes/[dish_id]/favorite/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/menus/chef/[chef_id]/menus/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/menus/menus/[menu_id]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/cuisines/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/cuisines/top/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/cuisines/categories/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/rewards/nosh-points/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/balance/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/balance/transactions/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/balance/top-up/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/payment-methods/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/payment-methods/[payment_method_id]/default/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/orders/from-cart/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/orders/recent-dishes/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/orders/usual-dinner-items/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/dietary-preferences/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/allergies/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/nutrition/calories-progress/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/forkprint/score/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/analytics/user-behavior/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/support-cases/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/offers/active/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/data-sharing-preferences/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/account/delete-feedback/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/custom-orders/[order_id]/share/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/meals/similar/[meal_id]/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/regional-availability/check/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/regional-availability/config/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/customer/social/colleagues/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/games/play-to-win/history/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/food-safety/cross-contamination/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/search/chefs/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/customer/event-chef-request/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/customer/treats/[treat_token]/route.ts` - Missing `sessionToken` in mutations

#### Functions & Moderation
- `apps/web/app/api/functions/admin/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/functions/admin/getAllLiveSessions/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/functions/admin/forceEndLiveSession/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/admin/muteLiveChatUser/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/moderation/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/functions/moderation/muteUser/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/moderation/reportUser/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/functions/getNearbyLiveSessions/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/functions/reportLiveSession/route.ts` - Missing `sessionToken` in mutations (may be public)

#### Analytics & Reports
- `apps/web/app/api/analytics/orders/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/analytics/orders/reports/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/analytics/event/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/admin/analytics/revenue-chart/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/analytics/recent-orders/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/analytics/chefs/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/analytics/sales/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/analytics/top-chefs/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/reports/user-growth/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/logs-export/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/admin/realtime-broadcast/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/admin/orders/bulk-refund-eligibility/route.ts` - Missing `sessionToken` in queries

#### Other
- `apps/web/app/api/delivery-applications/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/reviews/index/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/reviews/popular-picks/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/reviews/[review_id]/emotion-tags/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/emotions-engine/route.ts` - Missing `sessionToken` in actions (may not need it)
- `apps/web/app/api/chat/ai/messages/route.ts` - Missing `sessionToken` in actions (may not need it)
- `apps/web/app/api/nosh-heaven/search/users/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/nosh-heaven/search/videos/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/nosh-heaven/trending/route.ts` - Missing `sessionToken` in queries (may be public)
- `apps/web/app/api/nosh-heaven/collections/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/nosh-heaven/kitchens/[kitchenId]/featured-video/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/share/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/view/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/report/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/[videoId]/download/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/nosh-heaven/videos/upload-url/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/thumbnail-upload-url/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/nosh-heaven/videos/convex-upload-url/route.ts` - Missing `sessionToken` in queries
- `apps/web/app/api/images/customer/profile/route.ts` - Missing `sessionToken` in mutations
- `apps/web/app/api/payments/manage/route.ts` - Missing `sessionToken` in queries/mutations
- `apps/web/app/api/payments/status/route.ts` - Missing `sessionToken` in queries

### Special Cases

#### Health Endpoint (Needs Fix)
- `apps/web/app/api/health/route.ts` - **CRITICAL**: Calls `getAllUsers` which requires staff auth, but doesn't pass `sessionToken`. This will fail!
  - **Solution**: Either create a public health check query, or make health endpoint authenticated

#### Webhook Endpoints (May Not Need)
- `apps/web/app/api/webhooks/stripe/route.ts` - Webhook, may not need `sessionToken`
- `apps/web/app/api/stripe/webhook/route.ts` - Webhook, may not need `sessionToken`

#### Public Endpoints (May Not Need)
- `apps/web/app/api/nosh-heaven/trending/route.ts` - May be public
- `apps/web/app/api/functions/getLiveSession/route.ts` - May be public
- `apps/web/app/api/functions/reportLiveSession/route.ts` - May be public (anyone can report)

---

## 🔴 CRITICAL: Client Components That Need `useSessionToken` Hook (47+ files)

### High Priority (Frequently Used)

#### Admin Pages
- `apps/web/app/admin/users/page.tsx` - **CRITICAL**: Uses `useQuery(api.queries.users.getAllUsers)` without `sessionToken`
- `apps/web/app/admin/staff/overview/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/staff/emails/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/analytics/revenue/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/analytics/reports/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/waitlist/details/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/careers/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/time-tracking/reports/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/time-tracking/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/content/recipes/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/payroll/tax-documents/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/payroll/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/payroll/reports/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/staff/work-ids/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/staff/leave-requests/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/staff/work-email-requests/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/staff/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/content/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/waitlist/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/careers/reviews/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/careers/approved/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/content/pages/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/content/blog/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/waitlist/emails/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/compliance/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/analytics/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/cities/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/users/permissions/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/users/roles/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/orders/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/delivery/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/chefs/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/account/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/settings/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/admin/page.tsx` - Missing `useSessionToken` hook

#### Staff Pages
- `apps/web/app/staff/mattermost/page.tsx` - **Uses manual cookie extraction instead of hook** - Should use `useSessionToken`
- `apps/web/app/staff/profile/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/staff/documents/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/staff/leave-request/page.tsx` - Missing `useSessionToken` hook (uses manual cookie extraction)
- `apps/web/app/staff/work-email-request/page.tsx` - Missing `useSessionToken` hook (uses manual cookie extraction)
- `apps/web/app/staff/time-tracking/page.tsx` - Missing `useSessionToken` hook (uses manual cookie extraction)
- `apps/web/app/staff/time-tracking/recent-sessions/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/staff/blog/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/staff/email-campaigns/page.tsx` - Missing `useSessionToken` hook
- `apps/web/app/staff/payroll/page.tsx` - **Uses manual cookie extraction** - Should use `useSessionToken` hook

#### Other Pages
- `apps/web/app/waitlist/page.tsx` - May be public, check if needs `sessionToken`
- `apps/web/app/by-us/page.tsx` - May be public, check if needs `sessionToken`
- `apps/web/app/driving/apply/page.tsx` - May be public, check if needs `sessionToken`

---

## 📋 Pattern to Follow

### For API Routes:
```typescript
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';

const convex = getConvexClientFromRequest(request);
const sessionToken = getSessionTokenFromRequest(request);

// For queries
await convex.query(api.queries.example.query, { 
  ...args,
  sessionToken: sessionToken || undefined
});

// For mutations
await convex.mutation(api.mutations.example.mutation, { 
  ...args,
  sessionToken: sessionToken || undefined
});
```

### For Client Components:
```typescript
import { useSessionToken } from '@/hooks/useSessionToken';

const sessionToken = useSessionToken();

// For queries
const data = useQuery(api.queries.example.query, 
  sessionToken ? { ...args, sessionToken } : "skip"
);

// For mutations
const mutation = useMutation(api.mutations.example.mutation);
await mutation({ ...args, sessionToken: sessionToken || undefined });
```

---

## ⚠️ Important Notes

1. **Not all endpoints need `sessionToken`**: Only endpoints that call queries/mutations using `requireAuth`, `requireStaff`, or `requireAdmin` need it.

2. **Public endpoints**: Some endpoints may be public and don't need `sessionToken` (e.g., `/health`, webhooks, public waitlist).

3. **Health endpoint issue**: The `/health` endpoint calls `getAllUsers` which requires staff auth. This needs to be fixed - either create a public health check query or make the endpoint authenticated.

4. **Manual cookie extraction**: Some components manually extract cookies instead of using the `useSessionToken` hook. These should be updated to use the hook for consistency.

5. **Backward compatibility**: All queries/mutations accept `sessionToken` as optional, so the migration can be gradual. However, without `sessionToken`, authenticated queries/mutations will fail.

---

## 🎯 Priority Order

1. **CRITICAL** - Fix health endpoint
2. **HIGH** - Update frequently used API routes (orders, chat, customer APIs)
3. **HIGH** - Update admin pages (especially `admin/users/page.tsx`)
4. **MEDIUM** - Update staff pages
5. **LOW** - Update remaining API routes and components

---

## 📊 Statistics

- **Total API routes using Convex**: ~241 files
- **Already updated**: 4 files
- **Need updating**: ~237 files
- **Total client components using Convex**: ~50 files
- **Already updated**: 3 files
- **Need updating**: ~47 files

---

## ✅ Completed

- ✅ All query files updated to accept `sessionToken`
- ✅ All mutation files updated to accept `sessionToken`
- ✅ All auth helper functions updated to accept `sessionToken`
- ✅ `useSessionToken` hook created
- ✅ Pattern established for API routes and client components

