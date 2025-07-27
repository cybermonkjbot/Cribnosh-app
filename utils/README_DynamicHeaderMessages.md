# Dynamic Header Messages Utility

A comprehensive utility for generating contextual header messages based on time of day, meal times, special occasions, and user preferences.

## Features

### 🕐 Time-Based Messages
- **Early Morning (5-8 AM)**: "Rise and shine!" messages
- **Morning (8-12 PM)**: "Fresh start, fresh food!" messages  
- **Afternoon (12-5 PM)**: "Afternoon energy boost!" messages
- **Evening (5-9 PM)**: "Evening vibes!" messages
- **Night (9-11 PM)**: "Night owl special!" messages
- **Late Night (11 PM-5 AM)**: "Late night adventures!" messages

### 🍽️ Meal-Specific Messages
- **Breakfast**: "What's for breakfast?" with morning greetings
- **Brunch**: "Brunch time! What's cooking?" for weekend late mornings
- **Lunch**: "Lunch break calling!" for midday meals
- **Dinner**: "Dinner time! What's on the menu?" for evening meals
- **Late Night**: "Late night cravings?" for midnight snacks

### 🎉 Special Occasions
- **New Year**: "New year, new flavors!"
- **Valentine's Day**: "Love is in the air!"
- **Christmas**: "Christmas cheer!"
- **Birthday**: "Birthday celebration!"

### 🎯 Random Food Messages
- "What will you eat?"
- "Nosh is ready!"
- "Time to feast!"
- "Hungry? We've got you!"
- And many more motivational food messages

## Usage

### Basic Usage

```typescript
import { getCompleteDynamicHeader } from '@/utils/dynamicHeaderMessages';

// Get a complete dynamic header message
const message = getCompleteDynamicHeader('Joshua');
console.log(message);
// Output: {
//   greeting: "Good morning, Joshua",
//   mainMessage: "What's for\nbreakfast?",
//   subMessage: "Start your day right with a delicious meal"
// }

// Get a message with subtitle (explicitly enabled)
const messageWithSubtitle = getCompleteDynamicHeader('Joshua', true);
console.log(messageWithSubtitle);
// Output: {
//   greeting: "Good morning, Joshua",
//   mainMessage: "What's for\nbreakfast?",
//   subMessage: "Start your day right with a delicious meal"
// }
```

### Custom Time Context

```typescript
import { getDynamicHeaderMessage } from '@/utils/dynamicHeaderMessages';

// Create custom time context
const customContext = {
  hour: 19, // 7 PM
  minute: 30,
  isWeekend: false,
  specialOccasion: 'valentines'
};

const message = getDynamicHeaderMessage('Sarah', customContext);
// Output: {
//   greeting: "Happy Valentine's, Sarah",
//   mainMessage: "Love is in\nthe air!",
//   subMessage: "Romantic meals for two"
// }
```

### Random Food Messages

```typescript
import { getRandomFoodMessage } from '@/utils/dynamicHeaderMessages';

const randomMessage = getRandomFoodMessage();
// Output: "What will you eat?" (randomly selected)
```

## API Reference

### Functions

#### `getCompleteDynamicHeader(userName: string = "there", showSubtitle: boolean = false): HeaderMessage`
Returns a complete dynamic header message with greeting, main message, and optional sub-message. Includes 30% chance of using a random food message. The `showSubtitle` parameter controls whether the sub-message is included (default: false).

#### `getDynamicHeaderMessage(userName: string, context?: Partial<TimeContext>, showSubtitle: boolean = false): HeaderMessage`
Returns a contextual header message based on the provided time context or current time. The `showSubtitle` parameter controls whether the sub-message is included (default: false).

#### `getRandomFoodMessage(): string`
Returns a random motivational food message from a curated list.

#### `getCurrentTimeContext(): TimeContext`
Returns the current time context including hour, minute, and weekend status.

### Interfaces

#### `HeaderMessage`
```typescript
interface HeaderMessage {
  greeting: string;      // Personalized greeting
  mainMessage: string;   // Main header message
  subMessage?: string;   // Optional descriptive text
}
```

#### `TimeContext`
```typescript
interface TimeContext {
  hour: number;                    // Hour of day (0-23)
  minute: number;                  // Minute of hour (0-59)
  isWeekend: boolean;              // Whether it's weekend
  isHoliday?: boolean;             // Optional holiday flag
  specialOccasion?: string;        // Special occasion identifier
}
```

## Integration with Header Component

The utility is integrated into the main Header component:

```typescript
// In Header.tsx
const [dynamicMessage, setDynamicMessage] = useState(() => 
  getCompleteDynamicHeader(userName, showSubtitle)
);

// Update message every 5 minutes
useEffect(() => {
  const updateMessage = () => {
    setDynamicMessage(getCompleteDynamicHeader(userName, showSubtitle));
  };
  
  const interval = setInterval(updateMessage, 5 * 60 * 1000);
  updateMessage(); // Initial update
  
  return () => clearInterval(interval);
}, [userName, showSubtitle]);
```

## Message Examples

### Time-Based Examples

| Time | Greeting | Main Message | Sub Message |
|------|----------|--------------|-------------|
| 6 AM | "Early bird, Joshua" | "Rise and\nshine!" | "Fresh meals to start your day" |
| 8 AM | "Good morning, Joshua" | "What's for\nbreakfast?" | "Start your day right with a delicious meal" |
| 12 PM | "Good afternoon, Joshua" | "Lunch break\ncalling!" | "Time to fuel up for the rest of your day" |
| 7 PM | "Good evening, Joshua" | "Dinner time!\nWhat's on the menu?" | "End your day with something special" |
| 11 PM | "Hey Joshua" | "Late night\ncravings?" | "We've got you covered, even at this hour" |

### Weekend Examples

| Context | Greeting | Main Message | Sub Message |
|---------|----------|--------------|-------------|
| Weekend 10 AM | "Happy weekend, Joshua" | "Weekend\nvibes!" | "Time to treat yourself" |
| Weekend 2 PM | "Weekend mode, Joshua" | "Relax and\nenjoy!" | "No rush, just great food" |

### Special Occasions

| Occasion | Greeting | Main Message | Sub Message |
|----------|----------|--------------|-------------|
| Valentine's | "Happy Valentine's, Sarah" | "Love is in\nthe air!" | "Romantic meals for two" |
| Christmas | "Merry Christmas, Joshua" | "Christmas\ncheer!" | "Festive feasts await" |
| Birthday | "Happy Birthday, Alex" | "Birthday\ncelebration!" | "Let's make it special" |

## Customization

### Adding New Message Types

To add new message types, extend the message functions:

```typescript
// Add new meal time
function getMealMessages(mealTime: string, userName: string): HeaderMessage {
  const messages = {
    // ... existing messages
    'tea-time': {
      greeting: `Good afternoon, ${userName}`,
      mainMessage: "Tea time!\nWhat's brewing?",
      subMessage: "Perfect time for a warm drink and snack"
    }
  };
  return messages[mealTime] || messages.snack;
}
```

### Adding New Special Occasions

```typescript
function getSpecialOccasionMessages(occasion: string, userName: string): HeaderMessage {
  const messages = {
    // ... existing messages
    'anniversary': {
      greeting: `Happy Anniversary, ${userName}`,
      mainMessage: "Anniversary\ncelebration!",
      subMessage: "Make it memorable with special dining"
    }
  };
  return messages[occasion] || defaultMessage;
}
```

## Performance Considerations

- Messages are cached and updated every 5 minutes
- Random message selection is lightweight
- Time context calculations are minimal
- No external API calls required

## Testing

Use the `DynamicHeaderDemo` component to test different scenarios:

```typescript
import { DynamicHeaderDemo } from '@/components/ui/DynamicHeaderDemo';

// In your test screen
<DynamicHeaderDemo />
```

This demo allows you to:
- Test different times of day
- Change user names
- Toggle subtitle visibility
- See random food messages
- Test special occasions
- Compare different message types 