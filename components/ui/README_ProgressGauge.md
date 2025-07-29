# ProgressGauge Component

A React Native component that displays a semi-circular progress gauge with 15 segments, a percentage display, and a motivational message.

## Features

- **Semi-circular Gauge**: 15 segments arranged in a 180-degree arc
- **Progress Visualization**: Filled segments in dark green, unfilled in white
- **Percentage Display**: Large, prominent percentage text
- **Motivational Message**: Customizable text below the gauge
- **Responsive Sizing**: Customizable size while maintaining proportions
- **SVG Rendering**: Crisp, scalable graphics using react-native-svg
- **Absolute Positioning**: Positioned exactly as per design specifications

## Usage

```tsx
import { ProgressGauge } from '../components/ui/ProgressGauge';

// Basic usage with default values
<ProgressGauge progress={67.2} />

// Custom configuration
<ProgressGauge 
  progress={75}
  percentage={75}
  message="Great job! Keep it up!"
  size={300}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | `67.2` | Progress value (0-100) that determines filled segments |
| `percentage` | `number` | `67.2` | Display percentage (can be different from progress) |
| `message` | `string` | `"You should treat yourself a nice dinner"` | Motivational message below the gauge |
| `size` | `number` | `346` | Width of the component (height scales proportionally) |

## Design Specifications

### Positioning
- Container: `position: absolute`, `width: 346px`, `height: 160px`
- Position: `left: 13px`, `top: 598px`

### Gauge Segments
- **Total Segments**: 15
- **Filled Color**: `#094327` (dark green)
- **Unfilled Color**: `#F6F6F6` (white)
- **Shape**: Semi-circular arc (180 degrees)
- **Rendering**: SVG paths for crisp graphics

### Percentage Display
- **Font**: `Inter-Bold`
- **Size**: `38px`
- **Line Height**: `46px`
- **Color**: `#FFFFFF` (white)
- **Position**: Centered below the gauge

### Message Text
- **Font**: `Inter`
- **Size**: `12px`
- **Line Height**: `15px`
- **Color**: `#EAEAEA` (light gray)
- **Position**: Below the percentage display

## Segment Calculation

The component automatically calculates how many segments should be filled based on the progress value:

```tsx
const totalSegments = 15;
const filledSegments = Math.round((progress / 100) * totalSegments);
```

For example:
- `progress: 67.2` → `filledSegments: 10` (10 out of 15 segments filled)
- `progress: 100` → `filledSegments: 15` (all segments filled)
- `progress: 0` → `filledSegments: 0` (no segments filled)

## Dependencies

- `react-native-svg`: For SVG rendering (already installed in project)
- `Inter` and `Inter-Bold` fonts: Must be loaded via `useFonts` hook

## Demo

See `app/progress-gauge-demo.tsx` for interactive examples and demonstrations of different configurations.

## Notes

- The component uses SVG paths to create the semi-circular segments
- Each segment is a rounded rectangle that follows the arc
- The gauge is positioned absolutely as specified in the design
- Progress values are automatically clamped to 0-100 range
- The component is fully responsive and can be resized while maintaining proportions 