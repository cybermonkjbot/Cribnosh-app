# CaloriesNoshPointsCards Component

A premium UI component that displays two stacked cards showing calories data and nosh points with progress bars, featuring gradient backgrounds and backdrop blur effects.

## Features

- **Exact Design Match**: Implements the precise styling from the provided CSS specification
- **Stacked Layout**: Two cards positioned with the calories card behind the nosh points card
- **Gradient Backgrounds**: 
  - Calories card: Green gradient (`rgba(12, 168, 93, 0.5)` to `rgba(5, 66, 37, 0.5)`)
  - Nosh Points card: Semi-transparent green background with shadow
- **Backdrop Blur**: 27.5px blur effect for modern glass morphism
- **Progress Bars**: Yellow progress bars (`#EBA10F`) on black tracks (`#000000`)
- **Arrow Icon**: White arrow icon positioned in the top-right of the nosh points card
- **Typography**: Mukta font family with exact sizing and positioning

## Props

### Required Props
None - all props are optional with sensible defaults.

### Optional Props
- `caloriesProgress?: number` - Progress percentage for calories (0-100, default: 23)
- `noshPointsProgress?: number` - Progress percentage for nosh points (0-100, default: 40)

## Usage

### Basic Usage
```tsx
import CaloriesNoshPointsCards from '../components/ui/CaloriesNoshPointsCards';

<CaloriesNoshPointsCards />
```

### With Custom Progress Values
```tsx
<CaloriesNoshPointsCards 
  caloriesProgress={45}
  noshPointsProgress={78}
/>
```

### In a Screen Layout
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import CaloriesNoshPointsCards from '../components/ui/CaloriesNoshPointsCards';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <CaloriesNoshPointsCards 
        caloriesProgress={30}
        noshPointsProgress={65}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
```

## Design Specifications

### Dimensions
- **Container**: 342px × 150px
- **Calories Card**: 333px × 92px
- **Nosh Points Card**: 342px × 110px
- **Progress Bar**: 280.79px × 25px

### Colors
- **Text**: `#E6FFE8` (light green)
- **Progress Fill**: `#EBA10F` (yellow)
- **Progress Track**: `#000000` (black)
- **Arrow Icon**: `#E6FFE8` (white)

### Typography
- **Font Family**: Mukta
- **Font Weight**: 800 (Extra Bold)
- **Font Size**: 15px
- **Line Height**: 25px

### Effects
- **Backdrop Blur**: 27.5px
- **Border Radius**: 14px
- **Shadow**: 0px 4px 55px rgba(0, 0, 0, 0.25)

## Testing

### Demo Pages
1. **Simple Demo**: `app/calories-nosh-points-demo.tsx`
2. **Interactive Example**: `components/CaloriesNoshPointsExample.tsx`

### Testing Instructions
1. Navigate to the demo page in your app
2. Verify the cards appear with the correct positioning and styling
3. Test the interactive example to see progress updates
4. Confirm the gradient backgrounds and blur effects render correctly
5. Check that the progress bars update smoothly

## Dependencies

- `expo-linear-gradient` - For gradient backgrounds
- `expo-blur` - For backdrop blur effects
- `react-native` - Core React Native components

## Browser Support Notes

The backdrop-filter blur effect has minimal browser support and may not work on all web browsers. The component gracefully degrades on unsupported platforms. 