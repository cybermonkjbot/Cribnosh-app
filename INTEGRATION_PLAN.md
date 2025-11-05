# Frontend Integration Plan for New Backend Endpoints

## Overview
This document outlines the plan to integrate three new specialized backend endpoints into the frontend components:
1. Order Again endpoint (`/customer/orders/recent-dishes`)
2. Cuisine Categories endpoint (`/customer/cuisines/categories`)
3. Featured Kitchens endpoint (`/customer/chefs/featured`)

## Endpoints Created

### 1. Order Again Endpoint
- **Route**: `GET /customer/orders/recent-dishes`
- **Hook**: `useGetRecentDishesQuery`
- **Purpose**: Returns dishes/meals from past orders for quick reordering
- **Response Format**:
  ```typescript
  {
    success: boolean;
    data: {
      dishes: Array<{
        dish_id: string;
        name: string;
        price: number; // in pence
        image_url?: string;
        kitchen_name: string;
        kitchen_id: string;
        last_ordered_at: number;
        order_count: number;
        has_bussin_badge: boolean;
      }>;
      total: number;
      limit: number;
    };
  }
  ```

### 2. Cuisine Categories Endpoint
- **Route**: `GET /customer/cuisines/categories`
- **Hook**: `useGetCuisineCategoriesQuery`
- **Purpose**: Returns cuisine categories with kitchen counts
- **Response Format**:
  ```typescript
  {
    success: boolean;
    data: {
      categories: Array<{
        id: string;
        name: string;
        kitchen_count: number;
        image_url: string | null;
        is_active: boolean;
      }>;
      total: number;
    };
  }
  ```

### 3. Featured Kitchens Endpoint
- **Route**: `GET /customer/chefs/featured`
- **Hook**: `useGetFeaturedKitchensQuery`
- **Purpose**: Returns featured kitchens with sentiment and live status filtering
- **Response Format**:
  ```typescript
  {
    success: boolean;
    data: {
      kitchens: Array<{
        id: string;
        name: string;
        cuisine: string;
        sentiment: string; // 'elite', 'bussing', 'fire', etc.
        delivery_time: string;
        distance: string | null;
        image_url: string | null;
        is_live: boolean;
        live_viewers: number | null;
        avg_rating: number;
        total_reviews: number;
      }>;
      total: number;
      limit: number;
    };
  }
  ```

## Integration Tasks

### Task 1: Update OrderAgainSection
**File**: `apps/mobile/components/ui/OrderAgainSection.tsx`

**Changes Needed**:
1. Replace `useGetOrdersQuery` with `useGetRecentDishesQuery`
2. Update data transformation logic:
   - Transform `dishes` array from API to `OrderItem[]` format
   - Map fields:
     - `dish_id` → `id`
     - `name` → `name`
     - `price` (pence) → `price` (formatted as "£X")
     - `image_url` → `image` (convert to `{ uri: string }` format)
     - `has_bussin_badge` → `hasBussinBadge`
3. Remove the `transformOrdersData` function and create `transformDishesData` instead
4. Update error handling to use new endpoint
5. Ensure loading and empty states work correctly

**Current Component Format**:
```typescript
interface OrderItem {
  id: string;
  name: string;
  price: string; // e.g., "£19"
  image: any;
  hasBussinBadge?: boolean;
}
```

### Task 2: Update CuisineCategoriesSection
**File**: `apps/mobile/components/ui/CuisineCategoriesSection.tsx`

**Changes Needed**:
1. Add backend integration using `useGetCuisineCategoriesQuery`
2. Update data transformation logic:
   - Transform `categories` array from API to `Cuisine[]` format
   - Map fields:
     - `id` → `id`
     - `name` → `name`
     - `kitchen_count` → `restaurantCount`
     - `image_url` → `image` (convert to `{ uri: string }` format or use default)
     - `is_active` → `isActive`
3. Handle loading state with skeleton
4. Handle empty state
5. Update MainScreen.tsx to pass `isLoading` prop based on API state

**Current Component Format**:
```typescript
interface Cuisine {
  id: string;
  name: string;
  image: any;
  restaurantCount: number;
  isActive?: boolean;
}
```

**Note**: May need to handle image URLs - if `image_url` is null, use default cuisine images or placeholder.

### Task 3: Update FeaturedKitchensSection
**File**: `apps/mobile/components/ui/FeaturedKitchensSection.tsx`

**Changes Needed**:
1. Add backend integration using `useGetFeaturedKitchensQuery`
2. Update data transformation logic:
   - Transform `kitchens` array from API to `Kitchen[]` format
   - Map fields:
     - `id` → `id`
     - `name` → `name`
     - `cuisine` → `cuisine`
     - `sentiment` → `sentiment` (ensure type matches)
     - `delivery_time` → `deliveryTime`
     - `distance` → `distance` (handle null)
     - `image_url` → `image` (convert to `{ uri: string }` format)
     - `is_live` → `isLive`
     - `live_viewers` → `liveViewers`
3. Handle loading state with skeleton
4. Handle empty state
5. Update MainScreen.tsx to pass `isLoading` prop based on API state

**Current Component Format**:
```typescript
interface Kitchen {
  id: string;
  name: string;
  cuisine: string;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}
```

### Task 4: Update MainScreen.tsx
**File**: `apps/mobile/components/ui/MainScreen.tsx`

**Changes Needed**:
1. Add API hooks for new endpoints:
   - `useGetCuisineCategoriesQuery` for CuisineCategoriesSection
   - `useGetFeaturedKitchensQuery` for FeaturedKitchensSection
2. Pass loading states to components:
   - `CuisineCategoriesSection`: `isLoading={cuisineCategoriesLoading}`
   - `FeaturedKitchensSection`: `isLoading={featuredKitchensLoading}`
3. Remove or update prop-based data passing for these sections
4. Ensure components handle both prop-based and API-based data

## Implementation Order

1. **OrderAgainSection** (Simplest - single endpoint replacement)
2. **CuisineCategoriesSection** (Medium - needs kitchen count mapping)
3. **FeaturedKitchensSection** (Most complex - needs sentiment/live mapping)

## Testing Checklist

For each component:
- [ ] Loading state shows skeleton correctly
- [ ] Empty state displays when no data
- [ ] Data transformation works correctly
- [ ] Error handling shows appropriate messages
- [ ] Authentication check works (for OrderAgain)
- [ ] Image URLs are handled correctly (null/undefined cases)
- [ ] Type safety is maintained
- [ ] Component renders correctly with real data

## Potential Issues to Watch For

1. **Image URLs**: Backend may return null image URLs - need fallback images
2. **Type Mismatches**: Ensure sentiment types match between API and component
3. **Distance Calculation**: Featured kitchens endpoint may return null distance - handle gracefully
4. **Authentication**: OrderAgain endpoint requires auth - ensure proper error handling
5. **Performance**: Consider caching if these endpoints are called frequently

## Notes

- All endpoints are already created and tested in the backend
- All hooks are already exported from `customerApi.ts`
- Components already have skeleton loading and empty states implemented
- Only data transformation and integration logic needs to be added

