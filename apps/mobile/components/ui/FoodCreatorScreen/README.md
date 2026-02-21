# KitchenMainScreen Component

A comprehensive kitchen main screen component that displays restaurant information with a beautiful animated background, food illustrations, and an interactive bottom sheet.

## Overview

The `KitchenMainScreen` component is built using a modular architecture, breaking down the complex UI into multiple reusable parts:

- **KitchenMainScreen**: Main container component
- **BackgroundElements**: Animated background with colored ellipses
- **FoodIllustrations**: SVG-based food illustrations (sushi and noodles)
- **KitchenIntroCard**: Restaurant header card with avatar and details
- **KitchenBottomSheet**: Bottom sheet with kitchen information
- **KitchenBottomSheetHeader**: Header section with title and action buttons
- **KitchenBottomSheetContent**: Menu categories grid
- **KitchenCartButton**: Shopping cart button with item count

## Features

- 🎨 Beautiful animated background with blur effects
- 🍣 Custom SVG food illustrations
- 📱 Responsive design with proper positioning
- 🎯 Interactive elements with touch feedback
- 🎪 Modular component architecture
- 🎭 Reusable sub-components
- 🎨 Consistent styling with the app's design system

## Usage

### Basic Usage

```tsx
import { KitchenMainScreen } from '@/components/ui/KitchenMainScreen';

export default function MyScreen() {
  return (
    <KitchenMainScreen
      kitchenName="Stans Kitchen"
      cuisine="African cuisine (Top Rated)"
      deliveryTime="30-45 Mins"
      cartItems={2}
      onCartPress={() => console.log('Cart pressed')}
      onHeartPress={() => console.log('Heart pressed')}
      onSearchPress={() => console.log('Search pressed')}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `kitchenName` | `string` | `"Stans Kitchen"` | Name of the restaurant |
| `cuisine` | `string` | `"African cuisine (Top Rated)"` | Cuisine type and rating |
| `deliveryTime` | `string` | `"30-45 Mins"` | Estimated delivery time |
| `cartItems` | `number` | `2` | Number of items in cart |
| `onCartPress` | `() => void` | `undefined` | Callback when cart button is pressed |
| `onHeartPress` | `() => void` | `undefined` | Callback when heart button is pressed |
| `onSearchPress` | `() => void` | `undefined` | Callback when search button is pressed |

## Component Breakdown

### KitchenMainScreen
Main container that orchestrates all sub-components. Handles the overall layout and positioning.

### BackgroundElements
Creates the animated background with three colored ellipses:
- Pink ellipse (top-left)
- Purple ellipse (center-left)
- Orange ellipse (top-right)

### FoodIllustrations
Renders SVG-based food illustrations:
- **Sushi**: Multiple sushi pieces with nori wrapper
- **Noodles**: Takeout box with noodles and chopsticks
- Both illustrations have blurred versions for depth effect

### KitchenIntroCard
Displays the restaurant header with:
- Avatar (SVG-based)
- Kitchen name and cuisine type
- Play button for video/audio content

### KitchenBottomSheet
Bottom sheet container with:
- Backdrop blur effect
- Dark background with rounded corners
- Organized content sections

### KitchenBottomSheetHeader
Header section containing:
- Drag indicator
- "About This Kitchen" title
- Heart and search action buttons
- Delivery information
- Feature chips (Keto, Late-night cravings)

### KitchenBottomSheetContent
Menu categories section with:
- "Menu's" title
- Horizontal scrollable category grid
- Four categories: Candy, Sushi, Bao, Pastry
- Each category has an icon and label

### KitchenCartButton
Shopping cart button with:
- Item count circle
- "Items in cart" label
- Shopping bag icon
- Red background with proper styling

## Styling

The component uses a consistent color palette:
- Primary: `#FF3B30` (Red)
- Secondary: `#02120A` (Dark Green)
- Background: `#FFF599` (Light Yellow)
- Text: `#F3F4F6` (Light Gray)
- Accent: `#E6FFE8` (Light Green)

## Dependencies

- `react-native-svg`: For SVG illustrations
- `expo-blur`: For blur effects
- `react-native`: Core React Native components

## Customization

Each sub-component can be customized independently:

```tsx
// Custom background colors
<BackgroundElements />

// Custom food illustrations
<FoodIllustrations />

// Custom kitchen intro
<KitchenIntroCard 
  kitchenName="Custom Kitchen"
  cuisine="Custom Cuisine"
/>

// Custom bottom sheet
<KitchenBottomSheet
  deliveryTime="Custom Time"
  cartItems={5}
/>
```

## Performance Considerations

- SVG illustrations are optimized for performance
- Blur effects use native implementations where available
- Components are memoized where appropriate
- Efficient re-rendering with proper prop management

## Accessibility

- All interactive elements have proper touch targets
- Text elements use appropriate font sizes
- Color contrast meets accessibility guidelines
- Screen reader friendly structure

## Demo

See `app/kitchen-main-screen-demo.tsx` for a complete working example. 