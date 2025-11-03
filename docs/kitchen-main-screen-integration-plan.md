# Kitchen Main Screen - Full End-to-End Integration Plan

## Overview
Complete integration plan for the Kitchen Main Screen page, including favorite/like functionality, search within kitchen, menu browsing, category filters, and meal display features.

## Features to Integrate

### 1. Like/Favorite Kitchen/Chef Functionality
**Current State:** Heart icon in header exists but not connected to backend
**Requirements:**
- Toggle favorite status for kitchen/chef
- Show favorite state visually (filled vs outline heart)
- Persist favorite status across app sessions

### 2. Search Within Kitchen
**Current State:** Search UI exists but shows placeholder
**Requirements:**
- Search meals/dishes by name within the kitchen
- Search by ingredients
- Search by dietary filters
- Real-time search results display
- Handle empty states and loading states

### 3. Menu/Category Browsing
**Current State:** "Today's Menu" categories exist but are static
**Requirements:**
- Fetch actual meal categories from backend
- Display meals grouped by category (Sweet, Fresh, Steamed, Artisan)
- Handle category selection and filtering
- Show meal count per category

### 4. Popular Meals Display
**Current State:** Popular meals section shows static data
**Requirements:**
- Fetch popular meals for the kitchen/chef
- Display with pricing, images, badges
- Handle "See all" navigation
- Show popularity metrics (rating, review count)

### 5. Category Filters (Keto-friendly, Late-night cravings)
**Current State:** Filter chips exist but not functional
**Requirements:**
- Filter meals by dietary preferences (Keto-friendly)
- Filter meals by availability (Late-night cravings)
- Show filtered meal results
- Clear filters functionality

### 6. Featured Items Section
**Current State:** Featured items display exists
**Requirements:**
- Fetch featured/chef's pick meals
- Display special badges
- Handle pricing with discounts
- Navigation to meal details

## Backend API Endpoints Needed

### 1. Kitchen/Chef Favorites
**File:** `apps/web/app/api/customer/kitchens/[kitchenId]/favorite/route.ts` (NEW)
- `POST /api/customer/kitchens/{kitchenId}/favorite` - Add kitchen/chef to favorites
- `DELETE /api/customer/kitchens/{kitchenId}/favorite` - Remove from favorites
- `GET /api/customer/kitchens/{kitchenId}/favorite/status` - Check if favorited

**Convex:**
- Query: Check if kitchen/chef is favorited (needs to check userFavorites table by chefId from kitchen owner_id)
- Mutation: Add/remove favorite in userFavorites table (favoriteType: "chef", favoriteId: chefId)

### 2. Kitchen Meals by Chef
**File:** `apps/web/app/api/customer/kitchens/[kitchenId]/meals/route.ts` (NEW)
- `GET /api/customer/kitchens/{kitchenId}/meals` - Get all meals for kitchen
- Query params: `category`, `dietary`, `limit`, `offset`
- Returns: Array of meals with pricing, images, dietary info

**Convex:**
- Query: Get meals by chefId (derived from kitchen owner_id)
- Query: Get meals by category/dietary filters

### 3. Search Meals Within Kitchen
**File:** `apps/web/app/api/customer/kitchens/[kitchenId]/meals/search/route.ts` (NEW)
- `GET /api/customer/kitchens/{kitchenId}/meals/search`
- Query params: `q` (search query), `category`, `dietary`, `limit`
- Returns: Filtered search results

**Convex:**
- Query: searchMeals with chefId filter and query string

### 4. Popular Meals for Kitchen
**File:** `apps/web/app/api/customer/kitchens/[kitchenId]/meals/popular/route.ts` (NEW)
- `GET /api/customer/kitchens/{kitchenId}/meals/popular`
- Query params: `limit` (default: 10)
- Returns: Most popular meals sorted by rating/reviews

**Convex:**
- Query: Get meals by chefId, sorted by rating/review count

### 5. Kitchen Categories
**File:** `apps/web/app/api/customer/kitchens/[kitchenId]/categories/route.ts` (NEW)
- `GET /api/customer/kitchens/{kitchenId}/categories`
- Returns: Available meal categories with meal counts

**Convex:**
- Query: Aggregate meals by category for a chef

## Implementation Steps

### Phase 1: Backend API Development

#### Step 1: Create Kitchen Favorite Endpoints
1. Create `apps/web/app/api/customer/kitchens/[kitchenId]/favorite/route.ts`
2. Implement GET (check status), POST (add favorite), DELETE (remove favorite)
3. Create Convex queries:
   - `packages/convex/queries/userFavorites.ts` - Check if chef is favorited
   - `packages/convex/mutations/userFavorites.ts` - Add/remove favorites

#### Step 2: Create Kitchen Meals Endpoints
1. Create `apps/web/app/api/customer/kitchens/[kitchenId]/meals/route.ts`
2. Implement GET with filters (category, dietary, pagination)
3. Use existing `getMenusByChefId` query, add filtering logic

#### Step 3: Create Kitchen Search Endpoint
1. Create `apps/web/app/api/customer/kitchens/[kitchenId]/meals/search/route.ts`
2. Implement GET with search query and filters
3. Use existing `searchMeals` query with chefId filter

#### Step 4: Create Popular Meals Endpoint
1. Create `apps/web/app/api/customer/kitchens/[kitchenId]/meals/popular/route.ts`
2. Implement GET returning top-rated meals
3. Query meals sorted by rating/review count

#### Step 5: Create Categories Endpoint
1. Create `apps/web/app/api/customer/kitchens/[kitchenId]/categories/route.ts`
2. Implement GET returning categories with meal counts
3. Aggregate meals by category (Sweet, Fresh, Steamed, Artisan)

### Phase 2: Mobile API Integration

#### Step 6: Add API Endpoints to customerApi.ts
1. `toggleKitchenFavorite` - Mutation to add/remove favorite
2. `getKitchenFavoriteStatus` - Query to check favorite status
3. `getKitchenMeals` - Query to get meals with filters
4. `searchKitchenMeals` - Query to search meals
5. `getPopularKitchenMeals` - Query for popular meals
6. `getKitchenCategories` - Query for categories

### Phase 3: Component Updates

#### Step 7: Update KitchenBottomSheetHeader
**File:** `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheetHeader.tsx`
- Add favorite state management
- Fetch favorite status on mount
- Handle favorite toggle with optimistic UI updates
- Show filled heart when favorited

#### Step 8: Update KitchenBottomSheet (Search)
**File:** `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheet.tsx`
- Implement search functionality using `searchKitchenMeals` query
- Display search results in real-time
- Handle loading and empty states
- Add debouncing for search input

#### Step 9: Update KitchenBottomSheetContent
**File:** `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheetContent.tsx`
- Fetch actual meals data using `getKitchenMeals`
- Fetch categories using `getKitchenCategories`
- Fetch popular meals using `getPopularKitchenMeals`
- Replace static data with API data
- Implement category filtering
- Implement dietary filter chips (Keto-friendly, Late-night cravings)
- Add navigation to meal details

#### Step 10: Update KitchenMainScreen
**File:** `apps/mobile/components/ui/KitchenMainScreen.tsx`
- Pass favorite handler from API
- Pass search handler with API integration
- Handle cart navigation
- Pass meal data to bottom sheet

#### Step 11: Create Meal Detail Navigation
- Navigate to meal details page when meal card is tapped
- Use existing meal details route or create new one

### Phase 4: Data Flow & State Management

#### Step 12: Kitchen/Chef ID Resolution
- Ensure kitchenId and chefId are properly resolved
- Kitchen owner_id maps to chef userId
- Use chefId for meal queries and favorites

#### Step 13: Optimistic UI Updates
- Implement optimistic updates for favorites
- Handle error states and rollback
- Cache favorite status

#### Step 14: Search Debouncing & Performance
- Implement debounced search (300ms delay)
- Cache recent search results
- Handle pagination for search results

## Files to Create/Modify

### Backend API Routes (NEW)
1. `apps/web/app/api/customer/kitchens/[kitchenId]/favorite/route.ts`
2. `apps/web/app/api/customer/kitchens/[kitchenId]/meals/route.ts`
3. `apps/web/app/api/customer/kitchens/[kitchenId]/meals/search/route.ts`
4. `apps/web/app/api/customer/kitchens/[kitchenId]/meals/popular/route.ts`
5. `apps/web/app/api/customer/kitchens/[kitchenId]/categories/route.ts`

### Convex Queries/Mutations (NEW/UPDATE)
1. `packages/convex/queries/userFavorites.ts` (NEW)
2. `packages/convex/mutations/userFavorites.ts` (NEW)
3. `packages/convex/queries/meals.ts` (UPDATE - add kitchen filtering)
4. `packages/convex/queries/kitchens.ts` (UPDATE - add getChefByKitchenId)

### Mobile API (UPDATE)
1. `apps/mobile/store/customerApi.ts` - Add kitchen favorites and meals endpoints

### Components (UPDATE)
1. `apps/mobile/components/ui/KitchenMainScreen.tsx`
2. `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheet.tsx`
3. `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheetHeader.tsx`
4. `apps/mobile/components/ui/KitchenMainScreen/KitchenBottomSheetContent.tsx`

## Data Dependencies

### Kitchen to Chef Relationship
- Kitchens table: `owner_id` → Users table
- Need to find Chef by `userId` from kitchen owner_id
- Use chefId for all meal and favorite queries

### Favorite Implementation
- Use `userFavorites` table with `favoriteType: "chef"`
- `favoriteId` should be chefId (not kitchenId)
- Query favorites by userId + favoriteType + favoriteId

### Meal Categorization
- Categories: "Sweet", "Fresh", "Steamed", "Artisan"
- Need to determine mapping (could be cuisine array or meal tags)
- May need to add category field to meals schema or use existing fields

## Considerations

1. **Kitchen vs Chef:** Kitchens have owner_id pointing to users. Need to resolve chefId from kitchen owner_id
2. **Favorite Scope:** Favoriting a kitchen means favoriting the chef/owner
3. **Meal Categories:** May need to map meal.cuisine array to category names or use tags
4. **Search Performance:** Implement debouncing and pagination
5. **Empty States:** Handle cases where kitchen has no meals, no categories, etc.
6. **Loading States:** Show skeletons/loaders for all async data fetching
7. **Error Handling:** Graceful degradation if APIs fail

