# OnTheStove Bottom Sheet Component

## Overview
The `OnTheStoveBottomSheet` is a persistent bottom sheet component that displays live cooking information and allows users to pre-order meals. It can be completely hidden and shown as needed.

## Features
- **Persistent Design**: Stays visible but can be completely hidden
- **Blur Background**: Uses expo-blur for a modern glass effect
- **Animated Transitions**: Smooth spring animations for show/hide
- **Interactive Elements**: 
  - Quantity selector for meal items
  - Share live functionality
  - Treat someone functionality
- **Customizable Content**: Configurable meal data, descriptions, and images

## Props

### Required Props
- `isVisible: boolean` - Controls the visibility of the bottom sheet
- `onToggleVisibility: () => void` - Callback to toggle visibility

### Optional Props
- `onShareLive?: () => void` - Callback for share live button
- `onTreatSomeone?: () => void` - Callback for treat someone button
- `mealData?: MealData` - Configuration for the meal being displayed

### MealData Interface
```typescript
interface MealData {
  title: string;           // Meal title (e.g., "Nigerian Jollof")
  price: string;           // Price display (e.g., "£ 16")
  imageSource: any;        // Image source for the meal
  description: string;     // Description text
  kitchenName: string;     // Kitchen name
}
```

## Usage Example

```tsx
import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import OnTheStoveBottomSheet from './components/OnTheStoveBottomSheet';

const MyComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  const mealData = {
    title: 'Nigerian Jollof',
    price: '£ 16',
    imageSource: require('../assets/images/cribnoshpackaging.png'),
    description: 'Minnies Kitchen is Preparing the Nigerian Jollof Rice Pack Live and you can order before it\'s ready.',
    kitchenName: 'Minnies Kitchen',
  };

  return (
    <View>
      <Pressable onPress={() => setIsVisible(!isVisible)}>
        <Text>Toggle Bottom Sheet</Text>
      </Pressable>

      <OnTheStoveBottomSheet
        isVisible={isVisible}
        onToggleVisibility={() => setIsVisible(false)}
        onShareLive={() => console.log('Share live')}
        onTreatSomeone={() => console.log('Treat someone')}
        mealData={mealData}
      />
    </View>
  );
};
```

## Design Specifications

The component follows the exact design specifications provided:

### Layout
- **Width**: 384px (main container)
- **Height**: 357px (main container)
- **Position**: Bottom of screen with rounded top corners
- **Background**: Semi-transparent green (`rgba(250, 255, 250, 0.9)`)
- **Border Radius**: 35px top corners

### Blur Effect
- **Intensity**: 27.5px blur
- **Background**: Light tint
- **Dimensions**: 377px × 349px

### Typography
- **Title**: Inter font, 30px, bold, green (#094327)
- **Description**: SF Pro font, 17px, bold, green (#094327)
- **Button Text**: Lato font, 15px, bold

### Colors
- **Primary Green**: #094327
- **Light Green**: #E6FFE8
- **Background**: rgba(250, 255, 250, 0.9)
- **Button Background**: rgba(0, 0, 0, 0.3)

### Interactive Elements
- **Drag Handle**: 85px × 5px, light gray (#EDEDED)
- **Quantity Selector**: Integrated with CompactMealSelection component
- **Action Buttons**: Two buttons with different styles and icons

## Dependencies
- `expo-blur` - For blur effects
- `react-native` - Core React Native components
- `CompactMealSelection` - For meal display and quantity selection
- `Button` - UI component for action buttons

## Notes
- The component uses absolute positioning to overlay the entire screen
- Backdrop press dismisses the bottom sheet
- Smooth spring animations for show/hide transitions
- Fully responsive to screen dimensions
- Supports custom meal data and callbacks 