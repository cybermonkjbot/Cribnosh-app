# Migration Plan: Cart Management to Direct Convex Communication

## Overview
Migrate cart management functionality from Next.js API routes to direct Convex actions for the mobile app, reducing latency and simplifying the architecture.

## Current State
- **API Routes**: `/customer/cart`, `/customer/cart/items`, `/customer/cart/items/[cart_item_id]`
- **Convex Backend**: Mutations and queries already exist in `packages/convex/mutations/orders.ts` and `packages/convex/queries/orders.ts`
- **Mobile App**: Uses RTK Query hooks (`useGetCartQuery`, `useAddToCartMutation`, `useUpdateCartItemMutation`, `useRemoveFromCartMutation`)

## Target State
- **Convex Actions**: New actions in `packages/convex/actions/users.ts` for cart operations
- **Mobile Hook**: New `useCart` hook in `apps/mobile/hooks/useCart.ts`
- **UI Updates**: Update `CartScreen.tsx` and other components to use the new hook

## Implementation Steps

### 1. Create Convex Actions for Cart Management
**File**: `packages/convex/actions/users.ts`

Create the following actions:
- `customerGetCart` - Get customer's cart with all items
- `customerAddToCart` - Add item to cart (dish_id, quantity)
- `customerUpdateCartItem` - Update cart item quantity (cart_item_id, quantity)
- `customerRemoveFromCart` - Remove item from cart (cart_item_id)

**Key Requirements**:
- Use session token authentication
- Verify customer role
- Call existing Convex mutations (`api.mutations.orders.addToCart`, etc.)
- Transform data format to match mobile app expectations
- Return consistent success/error response format

**Data Transformations**:
- Cart items: Transform `id` to `dish_id`, add `_id` field, ensure `total_price` is calculated
- Response format: Match existing API response structure for backward compatibility

### 2. Export New Actions
**File**: `packages/convex/actions/index.ts`
- Ensure actions are exported (should be automatic via `export * from "./users"`)

### 3. Create useCart Hook
**File**: `apps/mobile/hooks/useCart.ts`

Create a hook with the following functions:
- `getCart()` - Fetch cart data
- `addToCart(dishId, quantity)` - Add item to cart
- `updateCartItem(cartItemId, quantity)` - Update item quantity
- `removeFromCart(cartItemId)` - Remove item from cart

**Key Features**:
- Use `getConvexClient()` and `getSessionToken()` from `convexClient`
- Handle loading states
- Show toast notifications for success/error
- Return data in format compatible with existing UI

### 4. Update CartScreen Component
**File**: `apps/mobile/components/ui/CartScreen.tsx`

**Changes**:
- Remove `useGetCartQuery` import
- Import and use `useCart` hook
- Replace RTK Query calls with hook functions
- Update data fetching to use `useEffect` with `getCart()`
- Update quantity change handlers to use `updateCartItem()`
- Update remove item handlers to use `removeFromCart()`

### 5. Update Other Components Using Cart
**Files to check**:
- `apps/mobile/components/ui/MealItemDetails.tsx` - Likely uses `useAddToCartMutation`
- `apps/mobile/components/ui/FloatingActionButton.tsx` - May show cart count
- Any other components that add items to cart

**Changes**:
- Replace `useAddToCartMutation` with `useCart().addToCart`
- Update cart count fetching if needed

### 6. Testing Checklist
- [ ] Get cart - verify items display correctly
- [ ] Add to cart - verify item is added and cart updates
- [ ] Update quantity - verify quantity changes and totals update
- [ ] Remove item - verify item is removed from cart
- [ ] Empty cart - verify empty state displays
- [ ] Error handling - verify errors show appropriate messages
- [ ] Loading states - verify loading indicators work
- [ ] Multiple items - verify cart handles multiple items correctly

## Technical Considerations

### Data Format Compatibility
The existing API returns cart items in this format:
```typescript
{
  _id: string,
  dish_id: string,
  quantity: number,
  price: number,
  total_price: number,
  name: string,
  chef_id?: string,
  chef_name?: string,
  added_at?: number
}
```

Convex cart items are stored as:
```typescript
{
  id: string,  // This is the dish_id
  name: string,
  price: number,
  quantity: number,
  updatedAt?: number
}
```

**Action**: Transform Convex format to API format in the actions.

### Session Token Authentication
All actions must:
1. Get user from session token
2. Verify customer role
3. Pass userId to mutations

### Error Handling
- Return consistent error format: `{ success: false, error: string }`
- Handle cases: cart not found, item not found, invalid quantity, etc.
- Show user-friendly error messages via toast notifications

### Performance
- Cart operations are frequent, so ensure actions are efficient
- Consider caching cart data on the client side
- Minimize unnecessary re-fetches

## Dependencies
- Existing Convex mutations: `addToCart`, `updateCartItem`, `removeFromCart`
- Existing Convex queries: `getUserCart`
- Session token authentication system
- Toast notification system

## Success Criteria
1. All cart operations work without Next.js API layer
2. UI remains unchanged (backward compatible)
3. Error handling is robust
4. Performance is equal or better than before
5. Code is maintainable and follows existing patterns

## Next Steps After Cart Migration
1. **Order Management** - Create order from cart, get orders, cancel order
2. **Payment Management** - Payment methods, checkout, balance management
3. **Chef/Kitchen Browsing** - Search, filters, favorites
4. **Notifications** - Real-time updates using Convex subscriptions

