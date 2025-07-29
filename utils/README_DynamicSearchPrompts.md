# Dynamic Search Prompts Utility

A comprehensive utility for generating contextual search placeholders that replace static text like "I want to eat Eba" with engaging, time-aware, and personalized search CTAs.

## Features

### 🕐 Time-Based Prompts
- **Early Morning (5-8 AM)**: "I want to eat breakfast", "Show me morning meals"
- **Morning (8-12 PM)**: "I want to eat something filling", "What's for lunch today?"
- **Afternoon (12-5 PM)**: "I want to eat something quick", "Afternoon pick-me-up"
- **Evening (5-9 PM)**: "I want to eat dinner", "What's for dinner tonight?"
- **Night (9-11 PM)**: "I want to eat something light", "Late night snack ideas"
- **Late Night (11 PM-5 AM)**: "I want to eat something quick", "Late night cravings"

### 🍽️ Meal-Specific Prompts
- **Breakfast**: "I want to eat breakfast", "What's good for breakfast?"
- **Lunch**: "I want to eat something filling", "Lunch break calling"
- **Dinner**: "I want to eat dinner", "Dinner time, what's cooking?"
- **Snacks**: "I want to eat something light", "Show me quick bites"
- **Brunch**: "I want to eat brunch", "Weekend brunch ideas"

### 🎯 Mood-Based Prompts
- **Hungry**: "I'm hungry, feed me", "I want to eat something filling"
- **Craving**: "I'm craving something specific", "I want to eat my favorite food"
- **Healthy**: "I want to eat something healthy", "Show me nutritious options"
- **Indulgent**: "I want to eat something indulgent", "I deserve something special"
- **Quick**: "I want to eat something quick", "I need food in 30 minutes"

### 🌍 Cuisine-Specific Prompts
- **Italian**: "I want to eat Italian food", "Show me pizza and pasta"
- **Chinese**: "I want to eat Chinese food", "Show me Chinese takeout"
- **Indian**: "I want to eat Indian food", "Show me curry and naan"
- **Mexican**: "I want to eat Mexican food", "Show me tacos and burritos"
- **Japanese**: "I want to eat Japanese food", "Show me sushi and ramen"
- **American**: "I want to eat American food", "Show me burgers and fries"
- **Thai**: "I want to eat Thai food", "Show me pad thai and curry"
- **Mediterranean**: "I want to eat Mediterranean food", "Show me Greek and Lebanese"

### 🥗 Dietary Prompts
- **Vegan**: "I want to eat vegan food", "Show me plant-based options"
- **Vegetarian**: "I want to eat vegetarian food", "Show me meat-free options"
- **Gluten-Free**: "I want to eat gluten-free food", "Show me gluten-free options"
- **Halal**: "I want to eat halal food", "Show me halal options"
- **Kosher**: "I want to eat kosher food", "Show me kosher options"

### 💰 Budget Prompts
- **Low**: "I want to eat something cheap", "What's under £10?"
- **Medium**: "I want to eat something good", "Show me quality food"
- **High**: "I want to eat something special", "Show me premium food"

### 🎉 Special Occasions
- **Valentine's**: "I want to eat romantic food", "Show me date night food"
- **Birthday**: "I want to eat birthday food", "Show me celebration food"
- **Christmas**: "I want to eat festive food", "Show me Christmas food"
- **Anniversary**: "I want to eat anniversary food", "Show me special occasion food"

## Usage

### Basic Usage

```typescript
import { getDynamicSearchPrompt } from '@/utils/dynamicSearchPrompts';

// Get a dynamic search prompt based on current time
const prompt = getDynamicSearchPrompt();
console.log(prompt.placeholder);
// Output: "I want to eat dinner" (if it's evening)

// Get prompt with custom context
const customContext = {
  hour: 19, // 7 PM
  isWeekend: true,
  userPreferences: {
    cuisine: ['italian'],
    mood: 'indulgent'
  }
};

const customPrompt = getDynamicSearchPrompt(customContext);
console.log(customPrompt.placeholder);
// Output: "I want to eat Italian food" or similar
```

### Get Multiple Prompts

```typescript
import { getMultipleSearchPrompts } from '@/utils/dynamicSearchPrompts';

// Get 5 different search prompts
const prompts = getMultipleSearchPrompts(5);
prompts.forEach(prompt => {
  console.log(prompt.placeholder);
});
```

### Category-Specific Prompts

```typescript
import { getSearchPromptByCategory } from '@/utils/dynamicSearchPrompts';

// Get a breakfast-specific prompt
const breakfastPrompt = getSearchPromptByCategory('breakfast');
console.log(breakfastPrompt.placeholder);
// Output: "I want to eat breakfast" or similar

// Get a cuisine-specific prompt
const italianPrompt = getSearchPromptByCategory('italian');
console.log(italianPrompt.placeholder);
// Output: "I want to eat Italian food" or similar
```

### Urgency-Based Prompts

```typescript
import { getSearchPromptByUrgency } from '@/utils/dynamicSearchPrompts';

// Get a high-urgency prompt
const urgentPrompt = getSearchPromptByUrgency('high');
console.log(urgentPrompt.placeholder);
// Output: "I'm hungry, feed me" or similar

// Get a low-urgency prompt
const casualPrompt = getSearchPromptByUrgency('low');
console.log(casualPrompt.placeholder);
// Output: "What should I eat today?" or similar
```

## API Reference

### Functions

#### `getDynamicSearchPrompt(context?: Partial<SearchPromptContext>): SearchPrompt`
Returns a single dynamic search prompt based on the provided context or current time.

#### `getMultipleSearchPrompts(count: number = 5, context?: Partial<SearchPromptContext>): SearchPrompt[]`
Returns multiple unique search prompts for variety.

#### `getSearchPromptByCategory(category: string, context?: Partial<SearchPromptContext>): SearchPrompt`
Returns a search prompt specific to the given category.

#### `getSearchPromptByUrgency(urgency: 'low' | 'medium' | 'high', context?: Partial<SearchPromptContext>): SearchPrompt`
Returns a search prompt matching the specified urgency level.

#### `getCurrentSearchContext(): SearchPromptContext`
Returns the current time context for search prompts.

### Interfaces

#### `SearchPrompt`
```typescript
interface SearchPrompt {
  placeholder: string;    // The search placeholder text
  category?: string;      // Optional category (breakfast, italian, etc.)
  urgency?: 'low' | 'medium' | 'high';  // How urgent the search is
  mood?: string;          // The mood/emotion of the search
}
```

#### `SearchPromptContext`
```typescript
interface SearchPromptContext {
  hour: number;                    // Hour of day (0-23)
  minute: number;                  // Minute of hour (0-59)
  isWeekend: boolean;              // Whether it's weekend
  isHoliday?: boolean;             // Optional holiday flag
  specialOccasion?: string;        // Special occasion identifier
  userPreferences?: {
    cuisine?: string[];            // Preferred cuisines
    dietary?: string[];            // Dietary restrictions
    budget?: 'low' | 'medium' | 'high';  // Budget preference
    mood?: 'hungry' | 'craving' | 'healthy' | 'indulgent' | 'quick';  // Current mood
  };
}
```

## Integration with BottomSearchDrawer

Update your `BottomSearchDrawer.tsx` to use dynamic prompts:

```typescript
import { getDynamicSearchPrompt } from '@/utils/dynamicSearchPrompts';

// In your component
const [searchPrompt, setSearchPrompt] = useState(() => getDynamicSearchPrompt());

// Update prompt every 30 minutes
useEffect(() => {
  const updatePrompt = () => {
    setSearchPrompt(getDynamicSearchPrompt());
  };
  
  const interval = setInterval(updatePrompt, 30 * 60 * 1000);
  updatePrompt(); // Initial update
  
  return () => clearInterval(interval);
}, []);

// Use in SearchArea
<SearchArea 
  placeholder={searchPrompt.placeholder}
  // ... other props
/>
```

## Prompt Examples

### Time-Based Examples

| Time | Example Prompts |
|------|----------------|
| 6 AM | "I want to eat breakfast", "Show me morning meals" |
| 12 PM | "I want to eat something filling", "What's for lunch today?" |
| 7 PM | "I want to eat dinner", "What's for dinner tonight?" |
| 11 PM | "I want to eat something light", "Late night snack ideas" |

### Weekend Examples

| Context | Example Prompts |
|---------|----------------|
| Weekend 10 AM | "I want to eat brunch", "Weekend brunch ideas" |
| Weekend 7 PM | "I want to eat something nice", "Weekend dinner ideas" |

### Mood Examples

| Mood | Example Prompts |
|------|----------------|
| Hungry | "I'm hungry, feed me", "I want to eat something filling" |
| Craving | "I'm craving something specific", "I want to eat my favorite food" |
| Healthy | "I want to eat something healthy", "Show me nutritious options" |
| Indulgent | "I want to eat something indulgent", "I deserve something special" |

### Cuisine Examples

| Cuisine | Example Prompts |
|---------|----------------|
| Italian | "I want to eat Italian food", "Show me pizza and pasta" |
| Chinese | "I want to eat Chinese food", "Show me Chinese takeout" |
| Indian | "I want to eat Indian food", "Show me curry and naan" |
| Mexican | "I want to eat Mexican food", "Show me tacos and burritos" |

## Customization

### Adding New Categories

To add new prompt categories, extend the category functions:

```typescript
function getNewCategoryPrompts(context: SearchPromptContext): SearchPrompt[] {
  return [
    { placeholder: "I want to eat new category food", category: "newcategory", urgency: "medium", mood: "curious" },
    { placeholder: "Show me new category options", category: "newcategory", urgency: "medium", mood: "curious" }
  ];
}
```

### Adding New Moods

```typescript
function getNewMoodPrompts(context: SearchPromptContext): SearchPrompt[] {
  const { userPreferences } = context;
  const mood = userPreferences?.mood || 'hungry';
  
  const moodPrompts = {
    // ... existing moods
    newmood: [
      { placeholder: "I want to eat new mood food", category: "any", urgency: "medium", mood: "newmood" },
      { placeholder: "Show me new mood options", category: "any", urgency: "medium", mood: "newmood" }
    ]
  };
  
  return moodPrompts[mood] || moodPrompts.hungry;
}
```

## Performance Considerations

- Prompts are generated on-demand with minimal computation
- No external API calls required
- Random selection is lightweight
- Context calculations are minimal
- Can be cached for 30-minute intervals

## Testing

Create a test component to see different prompts:

```typescript
import { getMultipleSearchPrompts } from '@/utils/dynamicSearchPrompts';

// Test different contexts
const testContexts = [
  { hour: 7, isWeekend: false }, // Early morning
  { hour: 12, isWeekend: false }, // Lunch time
  { hour: 19, isWeekend: true }, // Weekend evening
  { hour: 23, isWeekend: false }, // Late night
];

testContexts.forEach(context => {
  const prompt = getDynamicSearchPrompt(context);
  console.log(`${context.hour}:00 - ${prompt.placeholder}`);
});
``` 