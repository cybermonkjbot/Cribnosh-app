# Hidden Sections Utility

A specialized utility for managing initially hidden sections that appear dynamically based on user behavior, time context, and configuration settings.

## Features

### 🍽️ **"Your Dinner Favourites"**
- **Personalized Recommendations**: Shows dinner items based on user's order history
- **Time-Aware**: Only appears during dinner time (5-9 PM)
- **User Requirements**: 
  - Minimum 3 orders
  - At least 7 days active
  - Must have usual dinner items in history
- **30% Show Frequency**: Random chance to appear when conditions are met

### 🌟 **"Sections Like These Made Your Day"**
- **Engagement-Based**: Shows content that resonated with the user
- **Interaction History**: Based on clicked sections and positive feedback
- **User Requirements**:
  - Must have favorite sections
  - At least 7 days active
  - Must have clicked sections (positive engagement)
- **30% Show Frequency**: Random chance to appear when conditions are met

### 🎮 **"Play to Win - Free Lunch with Colleagues"**
- **Free Food Game**: All items are £0 - completely free
- **Social Feature**: Requires colleagues to participate
- **Time-Specific**: Only appears during lunch time (11 AM - 2 PM)
- **User Requirements**:
  - At least 2 colleague connections
  - At least 7 days active
  - Haven't played in last 24 hours
- **30% Show Frequency**: Random chance to appear when conditions are met

## Configuration

### Master Controls
```typescript
HIDDEN_SECTIONS_CONFIG = {
  ENABLED: true,                    // Master toggle
  USUAL_DINNER_ENABLED: true,       // Dinner recommendations
  MADE_YOUR_DAY_ENABLED: true,      // Engagement highlights
  PLAY_TO_WIN_ENABLED: true,        // Free lunch games
  SHOW_FREQUENCY: 0.3,              // 30% chance to show
  MIN_ORDER_COUNT: 3,               // Minimum orders for dinner section
  MIN_DAYS_ACTIVE: 7,               // Minimum days active
}
```

### Play to Win Settings
```typescript
PLAY_TO_WIN_CONFIG = {
  ENABLED: true,
  FREE_AMOUNT: 0,                   // All items are £0
  MAX_PARTICIPANTS: 10,             // Max players per game
  GAME_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  MIN_COLLEAGUES: 2,                // Minimum colleagues needed
}
```

## Usage

### Basic Usage

```typescript
import { 
  getHiddenSectionsToShow, 
  getUsualDinnerData,
  getMadeYourDayData,
  getPlayToWinData 
} from '@/utils/hiddenSections';

// Check which hidden sections should be shown
const timeContext = {
  hour: 18, // 6 PM
  minute: 0,
  isWeekend: false,
  mealTime: 'dinner'
};

const userBehavior = {
  totalOrders: 5,
  daysActive: 14,
  usualDinnerItems: ['Pizza Margherita', 'Chicken Curry', 'Pasta Carbonara'],
  favoriteSections: ['featured_kitchens', 'popular_meals'],
  clickedSections: ['featured_kitchens', 'cuisine_categories'],
  colleagueConnections: 3,
  playToWinHistory: {
    gamesPlayed: 2,
    gamesWon: 1,
    lastPlayed: new Date('2024-01-10T12:00:00')
  }
};

const hiddenSections = getHiddenSectionsToShow(timeContext, userBehavior);
console.log(hiddenSections.map(s => s.name));
// Output: ['Your Dinner Favourites', 'Sections Like These Made Your Day']
```

### Get Section Data

```typescript
// Get data for "Your Dinner Favourites"
const dinnerData = getUsualDinnerData(userBehavior);
console.log(dinnerData);
// Output: {
//   title: "Your Dinner Favourites",
//   subtitle: "Based on your order history",
//   items: ['Pizza Margherita', 'Chicken Curry', 'Pasta Carbonara'],
//   totalOrders: 5,
//   lastOrderTime: Date
// }

// Get data for "Sections Like These Made Your Day"
const dayData = getMadeYourDayData(userBehavior);
console.log(dayData);
// Output: {
//   title: "Sections Like These Made Your Day",
//   subtitle: "Content that resonated with you",
//   favoriteSections: ['featured_kitchens', 'popular_meals'],
//   clickedSections: ['featured_kitchens', 'cuisine_categories'],
//   daysActive: 14
// }

// Get data for "Play to Win"
const playData = getPlayToWinData(userBehavior);
console.log(playData);
// Output: {
//   title: "Play to Win - Free Lunch with Colleagues",
//   subtitle: "All items are £0 - Free lunch with friends!",
//   freeAmount: 0,
//   maxParticipants: 10,
//   minColleagues: 2,
//   colleagueConnections: 3,
//   playHistory: { gamesPlayed: 2, gamesWon: 1, lastPlayed: Date }
// }
```

### Check Eligibility

```typescript
import { isEligibleForPlayToWin, getPlayToWinGameStatus } from '@/utils/hiddenSections';

// Check if user can play
const canPlay = isEligibleForPlayToWin(userBehavior);
console.log(canPlay); // true

// Get detailed game status
const gameStatus = getPlayToWinGameStatus(userBehavior);
console.log(gameStatus);
// Output: {
//   isEligible: true,
//   canPlayNow: true,
//   gamesPlayed: 2,
//   gamesWon: 1,
//   colleagueCount: 3
// }
```

## API Reference

### Functions

#### `getHiddenSectionsToShow(timeContext: TimeContext, userBehavior: UserBehavior): HiddenSectionConfig[]`
Returns an array of hidden sections that should be shown based on current context.

#### `shouldShowUsualDinnerSection(timeContext: TimeContext, userBehavior: UserBehavior): boolean`
Checks if the "Your Dinner Favourites" section should be shown.

#### `shouldShowMadeYourDaySection(timeContext: TimeContext, userBehavior: UserBehavior): boolean`
Checks if the "Sections Like These Made Your Day" section should be shown.

#### `shouldShowPlayToWinSection(timeContext: TimeContext, userBehavior: UserBehavior): boolean`
Checks if the "Play to Win" section should be shown.

#### `getUsualDinnerData(userBehavior: UserBehavior): object`
Returns formatted data for the dinner recommendations section.

#### `getMadeYourDayData(userBehavior: UserBehavior): object`
Returns formatted data for the engagement highlights section.

#### `getPlayToWinData(userBehavior: UserBehavior): object`
Returns formatted data for the play to win section.

#### `isEligibleForPlayToWin(userBehavior: UserBehavior): boolean`
Checks if user is eligible to participate in play to win games.

#### `getPlayToWinGameStatus(userBehavior: UserBehavior): object`
Returns detailed game status and eligibility information.

### Interfaces

#### `HiddenSectionConfig`
```typescript
interface HiddenSectionConfig {
  id: string;                    // Section identifier
  name: string;                  // Display name
  description: string;           // Section description
  showConditions: string[];      // Required conditions
  priority: number;              // Display priority
  minPosition: number;           // Minimum position
  maxPosition: number;           // Maximum position
}
```

#### `UserBehavior`
```typescript
interface UserBehavior {
  totalOrders?: number;          // Total orders placed
  daysActive?: number;           // Days since first order
  usualDinnerItems?: string[];   // Frequently ordered dinner items
  favoriteSections?: string[];   // User's favorite sections
  playToWinHistory?: {           // Play to win game history
    gamesPlayed: number;
    gamesWon: number;
    lastPlayed?: Date;
  };
  colleagueConnections?: number; // Number of colleague connections
  freeFoodPreferences?: string[]; // Preferred free food items
  clickedSections?: string[];    // Sections user has clicked
}
```

#### `TimeContext`
```typescript
interface TimeContext {
  hour: number;                  // Hour of day (0-23)
  minute: number;                // Minute of hour (0-59)
  isWeekend: boolean;            // Weekend flag
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
```

## Integration with Section Ordering

The hidden sections utility integrates seamlessly with the main section ordering system:

```typescript
import { getOrderedSectionsWithHidden } from '@/utils/sectionOrdering';

// Get all sections including hidden ones
const context = {
  timeContext: getCurrentTimeContext(),
  userBehavior: getUserBehavior(),
  currentLocation: getCurrentLocation(),
  weather: getWeatherData(),
  appState: 'active'
};

const allSections = getOrderedSectionsWithHidden(context);
console.log(allSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Your Dinner Favourites', ...]
```

## Show Conditions

### "Your Dinner Favourites"
- ✅ `HIDDEN_SECTIONS_CONFIG.USUAL_DINNER_ENABLED` is true
- ✅ `totalOrders >= MIN_ORDER_COUNT` (3)
- ✅ `mealTime === 'dinner'` (5-9 PM)
- ✅ `usualDinnerItems.length > 0`
- ✅ `daysActive >= MIN_DAYS_ACTIVE` (7)
- ✅ Random chance < `SHOW_FREQUENCY` (30%)

### "Sections Like These Made Your Day"
- ✅ `HIDDEN_SECTIONS_CONFIG.MADE_YOUR_DAY_ENABLED` is true
- ✅ `favoriteSections.length > 0`
- ✅ `daysActive >= MIN_DAYS_ACTIVE` (7)
- ✅ `clickedSections.length > 0`
- ✅ Random chance < `SHOW_FREQUENCY` (30%)

### "Play to Win - Free Lunch with Colleagues"
- ✅ `HIDDEN_SECTIONS_CONFIG.PLAY_TO_WIN_ENABLED` is true
- ✅ `PLAY_TO_WIN_CONFIG.ENABLED` is true
- ✅ `mealTime === 'lunch'` (11 AM - 2 PM)
- ✅ `colleagueConnections >= MIN_COLLEAGUES` (2)
- ✅ `daysActive >= MIN_DAYS_ACTIVE` (7)
- ✅ Haven't played in last 24 hours
- ✅ Random chance < `SHOW_FREQUENCY` (30%)

## Benefits

### 🎯 **Personalization**
- Content adapts to user behavior and preferences
- Shows relevant content at the right time
- Creates a more engaging user experience

### 🎮 **Gamification**
- Free food games encourage social interaction
- Rewards user engagement with special content
- Creates excitement and anticipation

### 📊 **Data-Driven**
- Uses actual user behavior to determine content
- Respects user preferences and history
- Provides meaningful recommendations

### ⚙️ **Configurable**
- Easy to enable/disable features
- Adjustable show frequencies
- Flexible eligibility requirements

## Testing

```typescript
// Test different scenarios
const testScenarios = [
  {
    name: 'Dinner Time with History',
    timeContext: { hour: 18, minute: 0, isWeekend: false, mealTime: 'dinner' },
    userBehavior: { totalOrders: 5, daysActive: 10, usualDinnerItems: ['Pizza'] }
  },
  {
    name: 'Lunch Time with Colleagues',
    timeContext: { hour: 12, minute: 0, isWeekend: false, mealTime: 'lunch' },
    userBehavior: { daysActive: 10, colleagueConnections: 3 }
  },
  {
    name: 'Engaged User',
    timeContext: { hour: 14, minute: 0, isWeekend: false },
    userBehavior: { daysActive: 10, favoriteSections: ['featured'], clickedSections: ['popular'] }
  }
];

testScenarios.forEach(scenario => {
  const sections = getHiddenSectionsToShow(scenario.timeContext, scenario.userBehavior);
  console.log(`${scenario.name}:`, sections.map(s => s.name));
});
``` 