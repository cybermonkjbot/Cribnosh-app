# Section Ordering Utility

A comprehensive utility for dynamically organizing and prioritizing content sections on the home screen based on user behavior, time of day, and contextual factors.

## Features

### 🕐 Time-Based Ordering
- **Meal Times**: Prioritizes relevant sections based on breakfast, lunch, dinner, or snack times
- **Time of Day**: Adjusts section priority based on morning, afternoon, evening, or night
- **Weekend vs Weekday**: Different ordering strategies for weekends vs weekdays
- **Special Occasions**: Custom ordering for holidays and special events

### 👤 User Behavior Analysis
- **Order History**: Prioritizes sections based on recent order patterns
- **Favorite Cuisines**: Influences cuisine categories and featured kitchens
- **Dietary Preferences**: Adjusts sections based on dietary restrictions
- **Budget Preferences**: Influences special offers and featured content
- **Interaction Patterns**: Considers which sections users view and click

### 🌍 Contextual Intelligence
- **Location**: Prioritizes nearby kitchens when location is available
- **Weather**: Adjusts content based on weather conditions
- **App State**: Different ordering for active vs background app states
- **Special Events**: Custom ordering for holidays and celebrations

### 🎯 Smart Prioritization
- **Base Priority**: Each section has a base priority score (1-10)
- **Weighted Scoring**: Combines time, user behavior, and context factors
- **Position Constraints**: Enforces minimum and maximum positions for sections
- **Dependencies**: Handles section dependencies and conflicts

## Default Sections

| Section | Priority | Description | Position Range |
|---------|----------|-------------|----------------|
| Search Bar | 10 | Always at top | 0-0 |
| Featured Kitchens | 9 | High-priority kitchens | 1-3 |
| Popular Meals | 8 | Trending meals | 2-4 |
| Cuisine Categories | 7 | Food type categories | 3-6 |
| Recent Orders | 6 | User's order history | 4-7 |
| Special Offers | 5 | Promotions and deals | 5-8 |
| Kitchens Near Me | 4 | Location-based kitchens | 6-9 |
| Sustainability | 3 | Eco-friendly options | 7-10 |
| Group Orders | 2 | Collaborative ordering | 8-10 |
| Live Content | 1 | Real-time content | 9-10 |

## Usage

### Basic Usage

```typescript
import { getOrderedSections, getCurrentTimeContext } from '@/utils/sectionOrdering';

// Get ordered sections for current context
const timeContext = getCurrentTimeContext();
const userBehavior = {
  lastOrderTime: new Date('2024-01-15T12:00:00'),
  favoriteCuisines: ['italian', 'chinese'],
  orderFrequency: 'medium' as const,
  budgetPreference: 'medium' as const,
};

const context = {
  timeContext,
  userBehavior,
  currentLocation: { latitude: 51.5074, longitude: -0.1278 },
  weather: { condition: 'sunny', temperature: 22 },
  appState: 'active' as const,
};

const orderedSections = getOrderedSections(context);
console.log(orderedSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Popular Meals', ...]
```

### Meal Time Specific Ordering

```typescript
import { getMealTimeSections } from '@/utils/sectionOrdering';

// Get sections optimized for breakfast
const breakfastSections = getMealTimeSections('breakfast');
console.log(breakfastSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Popular Meals', ...]

// Get sections optimized for dinner
const dinnerSections = getMealTimeSections('dinner');
console.log(dinnerSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Special Offers', ...]
```

### User Type Specific Ordering

```typescript
import { getUserTypeSections } from '@/utils/sectionOrdering';

// Get sections for new users
const newUserSections = getUserTypeSections('new');
console.log(newUserSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Special Offers', ...]

// Get sections for power users
const powerUserSections = getUserTypeSections('power');
console.log(powerUserSections.map(s => s.name));
// Output: ['Search Bar', 'Recent Orders', 'Popular Meals', ...]
```

### Time of Day Ordering

```typescript
import { getTimeOfDaySections } from '@/utils/sectionOrdering';

// Get sections for morning
const morningSections = getTimeOfDaySections('morning');
console.log(morningSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Popular Meals', ...]

// Get sections for evening
const eveningSections = getTimeOfDaySections('evening');
console.log(eveningSections.map(s => s.name));
// Output: ['Search Bar', 'Featured Kitchens', 'Special Offers', ...]
```

### Debugging with Scores

```typescript
import { getSectionsWithScores } from '@/utils/sectionOrdering';

// Get sections with their calculated scores
const sectionsWithScores = getSectionsWithScores(context);
sectionsWithScores.forEach(section => {
  console.log(`${section.name}: ${section.score.toFixed(2)}`);
});
// Output:
// Search Bar: 10.00
// Featured Kitchens: 8.45
// Popular Meals: 7.82
// ...
```

## API Reference

### Functions

#### `getOrderedSections(context: OrderingContext, customSections?: SectionConfig[]): SectionConfig[]`
Returns an array of sections ordered by their calculated priority scores.

#### `getSectionsWithScores(context: OrderingContext, customSections?: SectionConfig[]): Array<SectionConfig & { score: number }>`
Returns sections with their calculated scores for debugging purposes.

#### `getMealTimeSections(mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack'): SectionConfig[]`
Returns sections optimized for a specific meal time.

#### `getUserTypeSections(userType: 'new' | 'regular' | 'power'): SectionConfig[]`
Returns sections optimized for a specific user type.

#### `getTimeOfDaySections(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): SectionConfig[]`
Returns sections optimized for a specific time of day.

#### `getCurrentTimeContext(): TimeContext`
Returns the current time context including hour, weekend status, and meal time.

#### `shouldShowSection(section: SectionConfig, context: OrderingContext): boolean`
Determines if a section should be visible based on context and scoring.

#### `getSectionPriorityLevel(section: SectionConfig, context: OrderingContext): 'high' | 'medium' | 'low'`
Returns the priority level of a section based on its calculated score.

### Interfaces

#### `SectionConfig`
```typescript
interface SectionConfig {
  id: string;                    // Unique section identifier
  name: string;                  // Display name
  priority: number;              // Base priority (1-10)
  timeWeight: number;            // Time influence weight (0-1)
  userWeight: number;            // User behavior weight (0-1)
  contextWeight: number;         // Context weight (0-1)
  minPosition: number;           // Minimum position
  maxPosition: number;           // Maximum position
  isRequired: boolean;           // Must always be shown
  isConditional: boolean;        // Can be hidden
  dependencies?: string[];       // Required sections
  conflicts?: string[];          // Conflicting sections
}
```

#### `UserBehavior`
```typescript
interface UserBehavior {
  lastOrderTime?: Date;          // Last order timestamp
  favoriteCuisines?: string[];   // Preferred cuisines
  dietaryPreferences?: string[]; // Dietary restrictions
  budgetPreference?: 'low' | 'medium' | 'high';
  orderFrequency?: 'low' | 'medium' | 'high';
  preferredMealTimes?: string[]; // Preferred meal times
  recentSearches?: string[];     // Recent search terms
  viewedSections?: string[];     // Viewed section IDs
  clickedSections?: string[];    // Clicked section IDs
}
```

#### `TimeContext`
```typescript
interface TimeContext {
  hour: number;                  // Hour of day (0-23)
  minute: number;                // Minute of hour (0-59)
  isWeekend: boolean;            // Weekend flag
  isHoliday?: boolean;           // Holiday flag
  specialOccasion?: string;      // Special occasion
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}
```

#### `OrderingContext`
```typescript
interface OrderingContext {
  timeContext: TimeContext;      // Time-related context
  userBehavior: UserBehavior;    // User behavior data
  currentLocation?: {            // Current location
    latitude: number;
    longitude: number;
    city?: string;
  };
  weather?: {                    // Weather information
    condition: string;
    temperature: number;
  };
  appState?: 'active' | 'background' | 'inactive';
}
```

## Integration with Home Screen

```typescript
// In your HomeScreen component
import { getOrderedSections, getCurrentTimeContext } from '@/utils/sectionOrdering';

const HomeScreen = () => {
  const [orderedSections, setOrderedSections] = useState<SectionConfig[]>([]);
  
  useEffect(() => {
    const updateSections = () => {
      const timeContext = getCurrentTimeContext();
      const userBehavior = getUserBehavior(); // Your user behavior logic
      const context = {
        timeContext,
        userBehavior,
        currentLocation: getCurrentLocation(), // Your location logic
        weather: getWeatherData(), // Your weather logic
        appState: 'active',
      };
      
      const sections = getOrderedSections(context);
      setOrderedSections(sections);
    };
    
    updateSections();
    const interval = setInterval(updateSections, 5 * 60 * 1000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <ScrollView>
      {orderedSections.map((section, index) => (
        <SectionRenderer 
          key={section.id} 
          section={section} 
          position={index}
        />
      ))}
    </ScrollView>
  );
};
```

## Scoring Algorithm

The section ordering uses a weighted scoring algorithm:

```
Final Score = (Base Priority × 0.4) + 
              (Time Score × Time Weight × 0.3) + 
              (User Score × User Weight × 0.2) + 
              (Context Score × Context Weight × 0.1)
```

### Time Scoring Factors
- **Meal Time**: Bonus for sections relevant to current meal
- **Time of Day**: Different bonuses for morning, afternoon, evening, night
- **Weekend**: Special bonuses for weekend-specific content

### User Behavior Scoring Factors
- **Recent Orders**: Higher score for recent order history
- **Favorite Cuisines**: Bonus for cuisine-related sections
- **Dietary Preferences**: Bonus for dietary-specific content
- **Budget Preference**: Influences special offers and premium content
- **Order Frequency**: Different strategies for new vs power users
- **Interaction History**: Considers viewed and clicked sections

### Context Scoring Factors
- **Location**: Bonus for location-based sections
- **Weather**: Adjustments based on weather conditions
- **Special Occasions**: Bonuses for holiday and event content
- **App State**: Different strategies for active vs background states

## Customization

### Adding New Sections

```typescript
const customSections: SectionConfig[] = [
  ...DEFAULT_SECTIONS,
  {
    id: 'new_section',
    name: 'New Section',
    priority: 6,
    timeWeight: 0.3,
    userWeight: 0.4,
    contextWeight: 0.2,
    minPosition: 4,
    maxPosition: 8,
    isRequired: false,
    isConditional: true,
  }
];

const sections = getOrderedSections(context, customSections);
```

### Custom Scoring Logic

```typescript
// Override scoring functions for custom logic
function customTimeScore(section: SectionConfig, timeContext: TimeContext): number {
  // Your custom time scoring logic
  return 0.5;
}

function customUserScore(section: SectionConfig, userBehavior: UserBehavior): number {
  // Your custom user behavior scoring logic
  return 0.3;
}
```

## Performance Considerations

- **Caching**: Section ordering can be cached for 5-minute intervals
- **Lazy Loading**: Only calculate scores for visible sections
- **Background Updates**: Update ordering in background when app is active
- **Minimal Recalculations**: Only recalculate when context changes significantly

## Testing

```typescript
// Test different scenarios
const testScenarios = [
  { name: 'Morning Breakfast', time: 8, meal: 'breakfast' },
  { name: 'Lunch Time', time: 12, meal: 'lunch' },
  { name: 'Evening Dinner', time: 18, meal: 'dinner' },
  { name: 'Late Night', time: 23, meal: 'snack' },
];

testScenarios.forEach(scenario => {
  const timeContext = { hour: scenario.time, minute: 0, isWeekend: false, mealTime: scenario.meal };
  const context = { timeContext, userBehavior: {} };
  const sections = getOrderedSections(context);
  console.log(`${scenario.name}:`, sections.map(s => s.name));
});
``` 