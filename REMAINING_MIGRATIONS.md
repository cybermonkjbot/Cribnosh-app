# Remaining RTK Query to Convex Migration Tasks

## 🔴 High Priority - Cart Operations (Actions Exist, Hooks Exist)

### Files Using Cart RTK Query Hooks:
1. **MainScreen.tsx**
   - `useGetCartQuery` → Should use `useCart` hook
   - `useAddToCartMutation` → Should use `useCart` hook

2. **LiveViewerScreen.tsx**
   - `useGetCartQuery` → Should use `useCart` hook
   - `useAddToCartMutation` → Should use `useCart` hook
   - `useUpdateCartItemMutation` → Should use `useCart` hook

3. **NoshHeavenModal.tsx**
   - `useAddToCartMutation` → Should use `useCart` hook

4. **FloatingActionButton.tsx**
   - `useGetCartQuery` → Should use `useCart` hook

5. **AIChatDrawer.tsx**
   - `useAddToCartMutation` → Should use `useCart` hook

**Status**: ✅ Convex actions exist (`customerGetCart`, `customerAddToCart`, `customerUpdateCartItem`)
**Status**: ✅ Hook exists (`useCart.ts`)
**Action**: Replace RTK Query hooks with `useCart` hook

---

## 🟡 Medium Priority - Notifications (Actions May Exist, Hook Exists)

### Files Using Notifications RTK Query Hooks:
1. **NotificationsSheet.tsx**
   - `useGetNotificationsQuery` → Should use `useNotifications` hook
   - `useMarkNotificationReadMutation` → Should use `useNotifications` hook
   - `useMarkAllNotificationsReadMutation` → Should use `useNotifications` hook

**Status**: ⚠️ Need to verify Convex actions exist
**Status**: ✅ Hook exists (`useNotifications.ts`)
**Action**: Verify actions exist, then replace RTK Query hooks

---

## 🟡 Medium Priority - Kitchen Features (Actions May Exist)

### Files Using Kitchen RTK Query Hooks:
1. **KitchenBottomSheetContent.tsx**
   - `useGetKitchenCategoriesQuery` → Need Convex action + hook
   - `useGetKitchenTagsQuery` → Need Convex action + hook

2. **CameraModalScreen.tsx**
   - `useGetChefMealsQuery` → May already exist in `useChefs` hook
   - `useStartLiveSessionMutation` → Need Convex action + hook

**Status**: ⚠️ Need to check if actions exist
**Action**: Check for existing actions, create if needed, update components

---

## 🟡 Medium Priority - Takeaway & Too Fresh Items (Actions Exist with Duplicates)

### Files Using These RTK Query Hooks:
1. **TakeawayCategoryDrawer.tsx**
   - `useGetTakeawayItemsQuery` → Should use Convex action
   - **Note**: Action exists but has duplicates in `users.ts` (needs cleanup)

2. **TooFreshToWasteDrawer.tsx**
   - `useGetTooFreshItemsQuery` → Should use Convex action
   - **Note**: Action exists but has duplicates in `users.ts` (needs cleanup)

**Status**: ✅ Actions exist (`customerGetTakeawayItems`, `customerGetTooFreshItems`)
**Status**: ⚠️ Actions have duplicates (needs cleanup)
**Action**: Clean up duplicates, add to hooks, update components

---

## 🟢 Lower Priority - Custom Orders (Actions May Exist)

### Files Using Custom Orders RTK Query Hooks:
1. **BottomSearchDrawer.tsx**
   - `useCreateCustomOrderMutation` → Need Convex action + hook

2. **shared-ordering/setup.tsx**
   - `useCreateCustomOrderMutation` → Need Convex action + hook
   - `useGetCustomOrdersQuery` → Need Convex action + hook

3. **shared-ordering/meal-options.tsx**
   - `useGetCustomOrderQuery` → Need Convex action + hook
   - `useUpdateCustomOrderMutation` → Need Convex action + hook

4. **shared-ordering/index.tsx**
   - `useCreateCustomOrderMutation` → Need Convex action + hook
   - `useUpdateCustomOrderMutation` → Need Convex action + hook
   - `useGetCustomerProfileQuery` → May already exist

5. **orders/index.tsx**
   - `useGetCustomOrdersQuery` → Need Convex action + hook
   - `useGetActiveOffersQuery` → ✅ Already migrated (use `useOffers` hook)

**Status**: ⚠️ Need to check if actions exist
**Action**: Check for existing actions, create if needed, create hooks, update components

---

## 🟢 Lower Priority - User Profile & Family Profile (Actions May Exist)

### Files Using Profile RTK Query Hooks:
1. **profile.tsx**
   - `useGetCustomerProfileQuery` → Need Convex action + hook
   - `useGetForkPrintScoreQuery` → Need Convex action + hook

2. **family-profile/manage.tsx**
   - `useGetFamilyProfileQuery` → Need Convex action + hook
   - `useGetFamilySpendingQuery` → Need Convex action + hook

3. **family-profile/member/[id]/preferences.tsx**
   - Profile-related queries → Need Convex actions + hooks

4. **family-profile/member/[id]/budget.tsx**
   - Budget-related queries → Need Convex actions + hooks

5. **shared-ordering/choose-friends.tsx**
   - `useGetUserConnectionsQuery` → ✅ Already exists (`useConnections` hook)

6. **privacy.tsx**
   - `useGetDataSharingPreferencesQuery` → Need Convex action + hook
   - `useUpdateDataSharingPreferencesMutation` → Need Convex action + hook

**Status**: ⚠️ Need to check if actions exist
**Action**: Check for existing actions, create if needed, create hooks, update components

---

## 🟢 Lower Priority - Live Streaming Features

### Files Using Live Streaming RTK Query Hooks:
1. **LiveViewerScreen.tsx**
   - `useGetLiveSessionQuery` → Need Convex action + hook
   - `useGetLiveCommentsQuery` → Need Convex action + hook
   - `useGetLiveViewersQuery` → Need Convex action + hook
   - `useGetLiveReactionsQuery` → Need Convex action + hook

2. **LiveContent.tsx**
   - `useGetLiveStreamsQuery` → Need Convex action + hook

3. **NoshHeavenModal.tsx**
   - `useGetVideoFeedQuery` → Need Convex action + hook

**Status**: ⚠️ Need to check if actions exist
**Action**: Check for existing actions, create if needed, create hooks, update components

---

## 🟢 Lower Priority - Other Features

### Files Using Other RTK Query Hooks:
1. **MainScreen.tsx**
   - `useGetWeatherQuery` → External API, may stay as-is or wrap in Convex action

2. **help-support.tsx**
   - `useGetOrdersQuery` → ✅ Already exists (`useOrders` hook)

3. **AddressSelectionSheet.tsx**
   - Address-related queries → Need to check

4. **DeliveryMapScreen.tsx**
   - Delivery-related queries → Need to check

5. **EventChefRequestScreen.tsx**
   - Event-related queries → Need to check

6. **AddFamilyMemberSheet.tsx**
   - Family-related mutations → Need to check

7. **UserAccountDetailsScreen.tsx**
   - Profile-related queries → Need to check

8. **DownloadAccountDataSheet.tsx**
   - Data export queries → Need to check

9. **Header.tsx**
   - Header-related queries → Need to check

10. **NoshHeavenPostModal.tsx**
    - Post-related queries → Need to check

11. **KitchenBottomSheetHeader.tsx**
    - Kitchen-related queries → Need to check

---

## Summary by Priority

### 🔴 Immediate (Cart - Actions & Hooks Exist)
- **5 files** need cart hook migration
- **Estimated effort**: 2-3 hours

### 🟡 High (Notifications, Kitchen Features, Takeaway/TooFresh)
- **4 files** for notifications
- **2 files** for kitchen features
- **2 files** for takeaway/too fresh
- **Estimated effort**: 4-6 hours

### 🟢 Medium (Custom Orders, Profiles, Live Streaming)
- **5 files** for custom orders
- **6 files** for profiles
- **3 files** for live streaming
- **Estimated effort**: 8-12 hours

### 🔵 Low (Other Features)
- **11+ files** for miscellaneous features
- **Estimated effort**: 6-10 hours

---

## Next Steps

1. **Start with Cart Operations** (highest priority, everything exists)
   - Update MainScreen.tsx
   - Update LiveViewerScreen.tsx
   - Update NoshHeavenModal.tsx
   - Update FloatingActionButton.tsx
   - Update AIChatDrawer.tsx

2. **Verify and Migrate Notifications**
   - Check if Convex actions exist
   - Update NotificationsSheet.tsx

3. **Clean up Duplicate Actions**
   - Fix duplicate `customerGetTakeawayItems` and `customerGetTooFreshItems` in `users.ts`

4. **Continue with Medium Priority Items**
   - Kitchen features
   - Custom orders
   - Profiles

