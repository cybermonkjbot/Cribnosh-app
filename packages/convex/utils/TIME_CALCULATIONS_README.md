# Time Calculation Utilities

This document describes the time calculation utilities created to replace hardcoded delivery times, expiration times, and time formatting in the backend.

## Overview

The `timeCalculations.ts` utility provides functions to:
- Calculate delivery times based on distance and prep time
- Calculate remaining time until expiration
- Format time strings for display (e.g., "25-30 min", "in 30 Min")

## Functions

### Delivery Time Calculations

#### `calculateDeliveryTime(distanceKm, prepTimeMinutes?)`
Calculates estimated delivery time based on distance and optional prep time.

**Parameters:**
- `distanceKm`: Distance in kilometers
- `prepTimeMinutes`: Optional meal preparation time in minutes (defaults to 15 minutes)

**Returns:** Estimated delivery time in minutes (rounded to nearest 5 minutes)

**Example:**
```typescript
const deliveryMinutes = calculateDeliveryTime(5.2, 20); // Returns 35 minutes
```

#### `calculateDeliveryTimeFromLocations(chefLat, chefLng, userLat, userLng, prepTimeMinutes?)`
Calculates delivery time between two geographic locations.

**Parameters:**
- `chefLat`, `chefLng`: Chef's location coordinates
- `userLat`, `userLng`: User's location coordinates
- `prepTimeMinutes`: Optional meal preparation time

**Returns:** Estimated delivery time in minutes

**Example:**
```typescript
const deliveryMinutes = calculateDeliveryTimeFromLocations(
  37.7749, -122.4194, // Chef location (San Francisco)
  37.7849, -122.4094, // User location
  20 // Prep time
);
```

#### `formatDeliveryTime(minutes)`
Formats delivery time as a human-readable string.

**Parameters:**
- `minutes`: Time in minutes

**Returns:** Formatted string like "25-30 min" or "1 hour"

**Example:**
```typescript
formatDeliveryTime(28); // Returns "25-30 min"
formatDeliveryTime(75); // Returns "1h 15m"
```

#### `getFormattedDeliveryTime(chefLat, chefLng, userLat, userLng, prepTimeMinutes?)`
Convenience function that calculates and formats delivery time in one call.

**Returns:** Formatted delivery time string

### Expiration Time Calculations

#### `calculateRemainingTime(expiresAt)`
Calculates remaining time until expiration.

**Parameters:**
- `expiresAt`: Expiration timestamp in milliseconds

**Returns:** Object with:
- `totalMinutes`: Total minutes remaining
- `days`, `hours`, `minutes`: Breakdown of time remaining
- `isExpired`: Boolean indicating if already expired
- `formatted`: Human-readable string (e.g., "2 hours left")
- `shortFormatted`: Short format for badges (e.g., "in 30 Min")

**Example:**
```typescript
const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes from now
const remaining = calculateRemainingTime(expiresAt);
// Returns: { totalMinutes: 30, minutes: 30, formatted: "30 minutes left", shortFormatted: "in 30 Min", ... }
```

#### `formatExpirationBadge(expiresAt)`
Formats expiration time for badge display (e.g., "in 30 Min").

**Parameters:**
- `expiresAt`: Expiration timestamp in milliseconds

**Returns:** Short formatted string like "in 30 Min", "2h", or "Expired"

**Example:**
```typescript
const expiresAt = Date.now() + (30 * 60 * 1000);
formatExpirationBadge(expiresAt); // Returns "in 30 Min"
```

### Last Ordered Time Formatting

#### `formatLastOrderedTime(lastOrderedAt)`
Formats time since last order (e.g., "15m", "2h", "3d").

**Parameters:**
- `lastOrderedAt`: Timestamp when item was last ordered

**Returns:** Formatted string like "15m", "2h", or "3d"

**Example:**
```typescript
const lastOrdered = Date.now() - (15 * 60 * 1000); // 15 minutes ago
formatLastOrderedTime(lastOrdered); // Returns "15m"
```

## Configuration Constants

The utility uses the following constants (can be adjusted in `timeCalculations.ts`):

- `AVERAGE_DRIVING_SPEED_KMH`: 30 km/h (average city driving speed)
- `BASE_PREP_TIME_MINUTES`: 15 minutes (default prep time)
- `PICKUP_TIME_MINUTES`: 5 minutes (time to pick up from kitchen)
- `BUFFER_TIME_MINUTES`: 5 minutes (buffer for unexpected delays)

## Usage in Queries

### Chef Queries

Chef queries now automatically include `deliveryTime` when location data is provided:

```typescript
// In packages/convex/queries/chefs.ts
import { calculateDeliveryTimeFromLocations, formatDeliveryTime } from '../utils/timeCalculations';

// When calculating distance, also calculate delivery time
const deliveryTimeMinutes = calculateDeliveryTimeFromLocations(
  chefLat, chefLng, userLat, userLng
);
const deliveryTime = formatDeliveryTime(deliveryTimeMinutes);
return { ...chef, distance, deliveryTime };
```

### Meal Queries

Meal queries can include delivery time when user location is available:

```typescript
// Get user location and chef location
const deliveryTime = getFormattedDeliveryTime(
  chefLat, chefLng, userLat, userLng, meal.prepTime
);
```

### Too Fresh To Waste Items

The `customerGetTooFreshItems` action now calculates expiration times:

```typescript
// In packages/convex/actions/users.ts
import { formatExpirationBadge } from '../utils/timeCalculations';

// Calculate expiration (default: 2 hours from creation)
const expiresAt = meal.expiresAt || (mealCreatedAt + (2 * 60 * 60 * 1000));
const expirationBadge = formatExpirationBadge(expiresAt);
```

## Migration Notes

### Before (Hardcoded)
```typescript
deliveryTime: '30 min' // Hardcoded
expirationBadge: 'in 30 Min' // Hardcoded
```

### After (Calculated)
```typescript
deliveryTime: formatDeliveryTime(calculateDeliveryTimeFromLocations(...))
expirationBadge: formatExpirationBadge(expiresAt)
```

## Future Enhancements

1. **Dynamic Prep Times**: Use actual meal prep times from the database
2. **Traffic-Aware Calculations**: Integrate with traffic APIs for more accurate delivery times
3. **Chef-Specific Settings**: Allow chefs to set their own prep time defaults
4. **Expiration Policies**: Configurable expiration times per meal type or chef
5. **Real-Time Updates**: Update delivery times based on driver location and traffic

## Related Files

- `packages/convex/utils/timeCalculations.ts` - Main utility file
- `packages/convex/queries/chefs.ts` - Updated to include delivery times
- `packages/convex/actions/chefs.ts` - Updated to return delivery times
- `packages/convex/actions/users.ts` - Updated to calculate expiration times
- `packages/convex/types/livestream.ts` - Contains `calculateDistance` function used by utilities

