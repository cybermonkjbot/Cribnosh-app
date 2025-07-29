# StackedProgressCards Component

A React Native component that displays two stacked cards with progress indicators, designed to match the provided CSS specifications.

## Features

- **Two Stacked Cards**: Bottom card (Calories Data) and top card (Nosh Points)
- **Gradient Background**: The bottom card uses a linear gradient from green to dark green
- **Semi-transparent Background**: The top card uses a semi-transparent background with blur effect
- **Progress Bars**: Both cards feature customizable progress bars with yellow fill
- **Arrow Icon**: The top card includes a white arrow icon
- **Customizable**: Progress values, labels, and styling can be customized
- **Absolute Positioning**: Positioned exactly as per the design specifications

## Usage

```tsx
import { StackedProgressCards } from '../components/ui/StackedProgressCards';

// Basic usage with default values
<StackedProgressCards />

// Custom progress values and labels
<StackedProgressCards 
  caloriesProgress={65}
  noshPointsProgress={78}
  caloriesLabel="Calories Burned"
  noshPointsLabel="Reward Points"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `caloriesProgress` | `number` | `23` | Progress percentage for calories card (0-100) |
| `noshPointsProgress` | `number` | `40` | Progress percentage for nosh points card (0-100) |
| `caloriesLabel` | `string` | `"Saving Progress"` | Label text for the calories card |
| `noshPointsLabel` | `string` | `"Nosh Points"` | Label text for the nosh points card |

## Design Specifications

### Positioning
- Container: `position: absolute`, `width: 342px`, `height: 150px`
- Position: `left: 13px`, `top: 267px`

### Bottom Card (Calories Data)
- Size: `333px × 92px`
- Position: `left: 7px`, `top: 0px`
- Background: Linear gradient from `rgba(12, 168, 93, 0.5)` to `rgba(5, 66, 37, 0.5)`
- Border radius: `14px`

### Top Card (Nosh Points)
- Size: `342px × 110px`
- Position: `left: 0px`, `top: 40px`
- Background: `rgba(9, 67, 39, 0.3)` with shadow
- Border radius: `14px`

### Progress Bars
- Background: `#000000` (black)
- Fill color: `#EBA10F` (yellow)
- Height: `25px`
- Border radius: `10px`

### Typography
- Font family: `Mukta-ExtraBold`
- Font size: `15px`
- Line height: `25px`
- Color: `#E6FFE8` (light green)

## Dependencies

- `expo-linear-gradient`: For gradient backgrounds
- `Mukta-ExtraBold` font: Must be loaded via `useFonts` hook

## Demo

See `app/stacked-progress-cards-demo.tsx` for interactive examples and demonstrations of different configurations.

## Notes

- The component uses absolute positioning as specified in the design
- Progress values are clamped between 0-100%
- The arrow icon is created using CSS transforms on View elements
- Backdrop blur effects are applied where supported 