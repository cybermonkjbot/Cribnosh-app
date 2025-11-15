# Remaining RTK Query Usage

## Files Still Using RTK Query That Should Be Migrated

### 1. Meal/Dish Related
- **TakeAways.tsx**
  - `useGetTakeawayItemsQuery` - Get takeaway items
  - `useAddToCartMutation` - Add to cart (already have useCart hook)

- **TopKebabs.tsx**
  - `useGetTopKebabsQuery` - Get top kebabs

- **TooFreshToWaste.tsx**
  - `useGetTooFreshItemsQuery` - Get "too fresh to waste" items

- **select-meal.tsx** (group orders)
  - `useGetChefMenusQuery` - Get chef menus for group order selection

### 2. Kitchen/Chef Related
- **KitchenMainScreen.tsx**
  - `useGetKitchenDetailsQuery` - Get kitchen details
  - `useGetKitchenFeaturedVideoQuery` - Get featured video

- **KitchenBottomSheet.tsx**
  - `useGetKitchenDetailsQuery` - Get kitchen details

### 3. Payment Related
- **PaymentScreen.tsx**
  - `useGetCartQuery` - Get cart (already have useCart hook)
  - `useCreateCheckoutMutation` - Create checkout (already have usePayments hook)
  - `useCreateOrderFromCartMutation` - Create order from cart (already have useOrders hook)

- **TopUpBalanceSheet.tsx**
  - `useGetCribnoshBalanceQuery` - Get balance (already have usePayments hook)
  - `useGetPaymentMethodsQuery` - Get payment methods (already have usePayments hook)
  - `useTopUpBalanceMutation` - Top up balance (already have usePayments hook)

- **BalanceTransactionsSheet.tsx**
  - `useGetBalanceTransactionsQuery` - Get balance transactions (already have usePayments hook)

- **AddCardSheet.tsx**
  - `useAddPaymentMethodMutation` - Add payment method (already have usePayments hook)
  - `useCreateSetupIntentMutation` - Create setup intent
  - `useGetPaymentMethodsQuery` - Get payment methods (already have usePayments hook)

### 4. Other Features
- **NotificationsSheet.tsx**
  - `useGetNotificationsQuery` - Get notifications
  - `useMarkNotificationReadMutation` - Mark notification as read
  - `useMarkAllNotificationsReadMutation` - Mark all notifications as read

- **CuisinesDrawer.tsx**
  - `useGetCuisinesQuery` - Get cuisines list

## Priority Order for Migration

### High Priority (Core Features)
1. **PaymentScreen.tsx** - Critical payment flow
2. **TopUpBalanceSheet.tsx** - Payment functionality
3. **BalanceTransactionsSheet.tsx** - Payment functionality
4. **AddCardSheet.tsx** - Payment functionality
5. **KitchenMainScreen.tsx** - Core kitchen browsing
6. **select-meal.tsx** - Group order functionality

### Medium Priority (Content Features)
7. **TakeAways.tsx** - Content section
8. **TopKebabs.tsx** - Content section
9. **TooFreshToWaste.tsx** - Content section
10. **CuisinesDrawer.tsx** - Navigation feature

### Lower Priority (Support Features)
11. **NotificationsSheet.tsx** - Notifications
12. **KitchenBottomSheet.tsx** - Already mostly migrated (just kitchen details)

## Notes

- Many payment-related files already have corresponding hooks (`usePayments`, `useCart`, `useOrders`) - these should be straightforward to migrate
- Some queries like `useGetTakeawayItemsQuery`, `useGetTopKebabsQuery`, `useGetTooFreshItemsQuery` might need new Convex actions if they don't exist yet
- `useGetCuisinesQuery` might need a new Convex action
- Notifications functionality might need new Convex actions

