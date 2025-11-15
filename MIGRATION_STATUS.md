# RTK Query to Convex Migration Status

## ✅ Completed Migrations

### Payment-Related (High Priority)
- ✅ PaymentScreen.tsx
- ✅ TopUpBalanceSheet.tsx  
- ✅ BalanceTransactionsSheet.tsx
- ✅ AddCardSheet.tsx
- ✅ Added `customerCreateSetupIntent` action

### Kitchen-Related
- ✅ KitchenMainScreen.tsx
- ✅ Added `customerGetKitchenDetails` and `customerGetKitchenFeaturedVideo` actions
- ✅ Updated useChefs hook

### Group Orders
- ✅ select-meal.tsx (migrated to use useMeals hook)

## ⚠️ In Progress / Needs Fixing

### Convex Actions File
- ⚠️ `packages/convex/actions/users.ts` has duplicate actions due to replace_all issue
- Need to clean up duplicates and keep only the last occurrence of:
  - `customerGetCuisines`
  - `customerGetTakeawayItems`
  - `customerGetTopKebabs`
  - `customerGetTooFreshItems`

## 📋 Remaining Files to Migrate

1. **TakeAways.tsx**
   - Needs: `customerGetTakeawayItems` action (created, but file has duplicates)
   - Needs: Hook function in useMeals or new hook
   - Already has: `useCart` hook for addToCart

2. **TopKebabs.tsx**
   - Needs: `customerGetTopKebabs` action (created, but file has duplicates)
   - Needs: Hook function

3. **TooFreshToWaste.tsx**
   - Needs: `customerGetTooFreshItems` action (created, but file has duplicates)
   - Needs: Hook function

4. **CuisinesDrawer.tsx**
   - Needs: `customerGetCuisines` action (created, but file has duplicates)
   - Needs: Hook function

5. **NotificationsSheet.tsx**
   - Needs: New Convex actions for notifications
   - Needs: New hook (useNotifications)

6. **KitchenBottomSheet.tsx** (Lower Priority)
   - Similar to KitchenMainScreen, can reuse useChefs hook

## Next Steps

1. Fix the duplicate actions in `packages/convex/actions/users.ts`
2. Add hook functions for the new actions
3. Update remaining UI files to use the new hooks
4. Create notifications actions and hook

