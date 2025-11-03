# Backend Requirements for Home Page Integration

## Summary

This document outlines the backend API requirements and changes needed to support the fully integrated home page sections.

## Current Status

All frontend sections have been integrated with backend APIs using RTK Query hooks. The following sections are now fully functional:

1. ✅ **PopularMealsSection** - Uses `GET /reviews/popular-picks`
2. ✅ **SpecialOffersSection** - Uses `GET /customer/offers/active`
3. ✅ **KitchensNearMe** - Uses `GET /customer/chefs/nearby`
4. ✅ **TakeAways** - Uses `GET /customer/search` with query="takeaway"
5. ✅ **TooFreshToWaste** - Uses `GET /customer/search` with query="sustainability too fresh waste"
6. ✅ **TopKebabs** - Uses `GET /customer/search` with query="kebab" and cuisine="middle eastern"
7. ✅ **OrderAgainSection** - Uses `GET /customer/orders`
8. ✅ **CuisinesSection** - Uses `GET /customer/cuisines`
9. ✅ **CuisineCategoriesSection** - Uses `GET /customer/cuisines` (shared with CuisinesSection)
10. ✅ **FeaturedKitchensSection** - Uses `GET /customer/chefs`

## Backend Implementation Status

### ✅ 1. Search Endpoint Enhancement (COMPLETED)

**Status:** Implemented

The search endpoint (`GET /customer/search` and `POST /customer/search`) now supports `category` and `tag` query parameters:

```typescript
// Example endpoint usage
GET /customer/search?q=kebab&type=dishes&category=takeaway&tag=too-fresh
POST /customer/search
{
  "query": "kebab",
  "type": "dishes",
  "category": "takeaway",
  "tag": "too-fresh"
}
```

**Parameters:**
- `category` (string, optional): Filter by category (e.g., "takeaway", "dine-in", "delivery")
- `tag` (string, optional): Filter by tag (e.g., "too-fresh", "sustainability", "eco-friendly")

**Implementation Details:**
- ✅ Added `category` and `tag` parameters to GET handler
- ✅ Added `category` and `tag` to filters object in POST handler
- ✅ Updated Swagger documentation for both handlers
- ✅ Enhanced `lookupDishes` function in inference engine to filter by category and tag
- ✅ Filters are passed through to emotions engine and applied during dish lookup

### 2. Meal/Dish Category Field

**Requirement:**
Meals/dishes should have a `category` field that can be used for filtering.

**Suggested Schema:**
```typescript
interface Dish {
  // ... existing fields
  category?: string[]; // e.g., ["takeaway", "dine-in", "quick-bite"]
  tags?: string[]; // e.g., ["too-fresh", "sustainability", "eco-friendly", "organic"]
}
```

**Business Logic:**
- Category should indicate the type of service (takeaway, dine-in, delivery, etc.)
- Tags should indicate special attributes (sustainability, freshness, dietary, etc.)

### 3. Sustainability Tag Support

**Requirement:**
For the "TooFreshToWaste" section, meals should support sustainability-related tags.

**Suggested Tags:**
- `too-fresh` - Items that are about to expire
- `sustainability` - Environmentally sustainable items
- `eco-friendly` - Eco-friendly packaging/ingredients
- `waste-reduction` - Items that help reduce food waste

### 4. Popular Meals Endpoint Verification

**Current Endpoint:** `GET /reviews/popular-picks`

**Verification Needed:**
- Ensure the endpoint returns meals with complete data (chef, kitchen, ratings, etc.)
- Verify the response structure matches what the frontend expects:
  ```typescript
  {
    success: boolean;
    data: {
      popular: Array<{
        mealId: string;
        meal: Dish;
        avgRating: number;
        reviewCount: number;
        chef: Chef;
      }>;
    };
  }
  ```

### 5. Nearby Chefs Endpoint Verification

**Current Endpoint:** `GET /customer/chefs/nearby`

**Verification Needed:**
- Ensure the endpoint accepts location parameters (latitude, longitude, radius)
- Verify distance calculation is accurate
- Ensure the response includes distance information:
  ```typescript
  {
    success: boolean;
    data: {
      chefs: Array<Chef & { distance: number }>; // distance in km
      pagination: Pagination;
    };
  }
  ```

## Implementation Summary

### ✅ Completed Changes

1. **Search Endpoint**: Added `category` and `tag` query parameters to both GET and POST handlers
2. **Emotions Engine**: Enhanced `lookupDishes` function to filter meals by category and tag
3. **Frontend Hooks**: Updated to use category and tag filters instead of keyword search
   - `getTakeawayItems`: Now uses `category=takeaway` filter
   - `getTooFreshItems`: Now uses `tag=too-fresh` filter
   - `getTopKebabs`: Continues to use `cuisine=middle eastern` filter (works correctly)

## Priority Recommendations

### High Priority (Required for Accurate Filtering)
1. Add `category` and `tag` support to search endpoint
2. Add `category` and `tags` fields to Dish/Meal schema
3. Implement business logic for assigning categories and tags to dishes

### Medium Priority (Improves UX)
1. Verify and ensure all endpoints return consistent data structures
2. Add proper error handling for edge cases (no location, no results, etc.)
3. Optimize search queries for better performance

### Low Priority (Nice to Have)
1. Add analytics tracking for section interactions
2. Implement caching strategies for frequently accessed sections
3. Add recommendation algorithms for personalized content

## Testing Recommendations

1. **Test Category Filtering**: Verify that takeaway items can be filtered accurately
2. **Test Tag Filtering**: Verify that sustainability items can be filtered accurately
3. **Test Location Services**: Verify nearby chefs endpoint works with various location inputs
4. **Test Empty States**: Verify graceful handling when no results are found
5. **Test Loading States**: Verify skeleton loading states appear during API calls
6. **Test Error Handling**: Verify error messages are user-friendly and actionable

## Notes

- All frontend components are designed to gracefully handle missing or incomplete backend data
- Empty states and skeleton loaders are in place for better UX
- Error handling is implemented with user-friendly toast notifications
- The frontend can work with mock data if backend endpoints are not ready

