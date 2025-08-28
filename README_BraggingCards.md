# Bragging Cards for Cribnosh

Apple Health-style food statistics cards that celebrate user achievements and provide insights into their eating habits.

## 📦 Components

### 1. MealsLoggedCard
Mirrors Apple Health's "Steps" card design with a bar chart showing meals per day over the last 7 days.

**Features:**
- Bar chart visualization of daily meals
- Average meals calculation
- Apple Health-style design with rounded corners and subtle shadows
- Interactive press handling

**Props:**
```typescript
interface MealsLoggedCardProps {
  weekMeals: number[]; // Array of 7 numbers representing meals per day
  avgMeals: number;    // Average meals per day
  onPress?: () => void; // Optional press handler
}
```

**Usage:**
```tsx
<MealsLoggedCard
  weekMeals={[2, 3, 4, 3, 5, 1, 2]}
  avgMeals={2.9}
  onPress={() => console.log('Meals card pressed')}
/>
```

### 2. CalorieCompareCard
Mirrors Apple Health's "Active Energy" card design with calorie comparison between yesterday and the day before.

**Features:**
- Numerical comparison display
- Visual bars for each day
- Highlighted reference day
- Clean, minimal design

**Props:**
```typescript
interface CalorieCompareCardProps {
  kcalToday: number;     // Yesterday's calories
  kcalYesterday: number; // Day before yesterday's calories
  onPress?: () => void;  // Optional press handler
}
```

**Usage:**
```tsx
<CalorieCompareCard
  kcalToday={1420}
  kcalYesterday={1680}
  onPress={() => console.log('Calories card pressed')}
/>
```

### 3. CuisineScoreCard
Custom card celebrating food diversity and culinary exploration.

**Features:**
- Unique cuisine counter
- Tag-based cuisine display
- Celebration icons
- Encourages trying new cuisines

**Props:**
```typescript
interface CuisineScoreCardProps {
  cuisines: string[];   // Array of cuisine names
  onPress?: () => void; // Optional press handler
}
```

**Usage:**
```tsx
<CuisineScoreCard
  cuisines={['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian']}
  onPress={() => console.log('Cuisine card pressed')}
/>
```

### 4. WeeklySummaryCard
Combines all three cards into a comprehensive weekly summary view.

**Features:**
- Scrollable container for all cards
- Section header with title and subtitle
- Unified data structure
- Individual press handlers for each card

**Props:**
```typescript
interface WeeklySummaryData {
  weekMeals: number[];
  avgMeals: number;
  kcalToday: number;
  kcalYesterday: number;
  cuisines: string[];
}

interface WeeklySummaryCardProps {
  data: WeeklySummaryData;
  onMealsPress?: () => void;
  onCaloriesPress?: () => void;
  onCuisinePress?: () => void;
}
```

**Usage:**
```tsx
<WeeklySummaryCard
  data={{
    weekMeals: [2, 3, 4, 3, 5, 1, 2],
    avgMeals: 2.9,
    kcalToday: 1420,
    kcalYesterday: 1680,
    cuisines: ['Nigerian', 'Italian', 'Asian Fusion', 'Mexican', 'Indian'],
  }}
  onMealsPress={() => console.log('Meals pressed')}
  onCaloriesPress={() => console.log('Calories pressed')}
  onCuisinePress={() => console.log('Cuisine pressed')}
/>
```

## 🎨 Design System

### Visual Design Guide
- **Layout:** Rounded card containers (`borderRadius: 16`)
- **Shadow:** Subtle shadow with light border (`box-shadow: rgba(0,0,0,0.05)`)
- **Background:** Flat background, very light gray or white
- **Highlight Color:** Cribnosh Red Orange (`#FF6B00`)

### Typography
- **Heading:** Bold, 16px for card titles
- **Body:** Regular, 16px for summary text
- **Numbers:** Bold, 28px for key metrics
- **Labels:** Regular, 14px for units and secondary info
- **Small Text:** 12px for day labels and tags

### Colors
- **Primary:** `#FF6B00` (Cribnosh Red Orange)
- **Text:** `#000000` (Black)
- **Secondary Text:** `#9BA1A6` (Light Gray)
- **Background:** `#FFFFFF` (White)
- **Card Background:** `#F8F8F8` (Very Light Gray)
- **Separators:** `#E5E5E5` (Light Gray)
- **Tags:** `#F5F5F5` (Light Gray)

## 📊 Data Structure

### Sample Convex Data Structure
```typescript
{
  userId: "user_xyz",
  weekMeals: [2, 3, 4, 3, 5, 1, 2], // Monday to Sunday
  avgMeals: 2.9,
  kcalToday: 1420,
  kcalYesterday: 1680,
  cuisines: ["Nigerian", "Italian", "Asian Fusion"]
}
```

## 🚀 Integration

### In Profile Screen
```tsx
import { WeeklySummaryCard } from '@/components/ui';

// In your profile screen component
<WeeklySummaryCard
  data={userStats}
  onMealsPress={() => navigation.navigate('MealsDetail')}
  onCaloriesPress={() => navigation.navigate('CaloriesDetail')}
  onCuisinePress={() => navigation.navigate('CuisineDetail')}
/>
```

### Individual Cards
```tsx
import { 
  MealsLoggedCard, 
  CalorieCompareCard, 
  CuisineScoreCard 
} from '@/components/ui';

// Use individual cards as needed
<MealsLoggedCard weekMeals={data.weekMeals} avgMeals={data.avgMeals} />
```

## 🎯 Features

### Accessibility
- Pressable cards with visual feedback
- Clear typography hierarchy
- High contrast colors
- Semantic structure

### Performance
- Optimized SVG charts
- Minimal re-renders
- Efficient data processing

### Customization
- Configurable colors and styling
- Flexible data structures
- Optional press handlers
- Modular component design

## 📱 Demo

Visit `/bragging-cards-demo` to see all components in action with sample data.

## 🔧 Development

### Adding New Cards
1. Create new component following the established pattern
2. Add to `components/ui/index.ts` exports
3. Update this README with documentation
4. Add to demo page for testing

### Styling Guidelines
- Use consistent spacing (16px for padding, 8px for margins)
- Follow Apple Health design patterns
- Maintain accessibility standards
- Use semantic color names

### Testing
- Test with various data scenarios
- Verify accessibility features
- Check performance with large datasets
- Validate on different screen sizes 