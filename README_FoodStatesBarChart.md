# FoodStatesBarChart Component

A React Native component that displays a horizontal bar chart with food states, custom icons, colored bars, and monetary values. 

## Features

- **Horizontal Bar Chart**: Multiple bars with customizable heights
- **Custom Icons**: SVG-based icons above each bar
- **Total Reference**: Black reference bar with bill icon and total value
- **Color-coded Bars**: Each bar can have a different color
- **Monetary Values**: Labels below each bar showing amounts
- **Horizontal Scrolling**: Supports multiple bars with scroll functionality
- **Responsive Sizing**: Customizable width and height
- **Absolute Positioning**: Positioned exactly as per design specifications

## Usage

```tsx
import { FoodStatesBarChart } from '@/components/ui/FoodStatesBarChart';

// Basic usage with default data
<FoodStatesBarChart />

// Custom data configuration
<FoodStatesBarChart 
  data={[
    {
      id: 'dining',
      label: '£120',
      value: 120,
      color: '#FF6B6B',
      icon: <DiningIcon />
    },
    {
      id: 'groceries',
      label: '£85',
      value: 85,
      color: '#4ECDC4',
      icon: <GroceriesIcon />
    }
  ]}
  totalValue={250}
  totalLabel="£250"
  width={350}
  height={280}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `BarData[]` | `[]` | Array of bar data objects |
| `totalValue` | `number` | `133` | Total reference value |
| `totalLabel` | `string` | `"£133"` | Total reference label |
| `width` | `number` | `280` | Width of the chart container |
| `height` | `number` | `224` | Height of the chart container |

## BarData Interface

```tsx
interface BarData {
  id: string;           // Unique identifier
  label: string;        // Display label (e.g., "£98")
  value: number;        // Numeric value for bar height
  color: string;        // Bar color (CSS color value)
  icon: React.ReactNode; // SVG icon component
}
```

## Design Specifications

### Positioning
- Container: `position: absolute`, `width: 280px`, `height: 224px`
- Position: `left: 21px`, `top: 914px`

### Total Reference Bar
- **Width**: `70px`
- **Height**: `183px`
- **Color**: `#000000` (black)
- **Border Radius**: `10px` (top corners only)
- **Icon**: Bill/receipt icon in white
- **Label**: Poppins-Bold, `15px`, white text

### Chart Bars
- **Width**: `70px` each
- **Height**: Proportional to value (max 183px)
- **Border Radius**: `10px` (top corners only)
- **Gap**: `10px` between bars
- **Colors**: Customizable per bar
- **Labels**: Poppins-Bold, `15px`, white text

### Icons
- **Size**: `20px × 20px`
- **Color**: White (`#FFFFFF`)
- **Position**: Above each bar
- **Type**: SVG components for crisp rendering

## Default Data

If no data is provided, the component uses these default values:

```tsx
[
  {
    id: 'guilty',
    label: '£98',
    value: 98,
    color: '#9F43CC', // Purple
    icon: <GuiltyIcon />
  },
  {
    id: 'transport',
    label: '£75',
    value: 75,
    color: '#EBA10F', // Orange
    icon: <TransportIcon />
  },
  {
    id: 'food',
    label: '£33',
    value: 33,
    color: '#2B87E3', // Blue
    icon: <FoodIcon />
  }
]
```

## Built-in Icons

The component includes several pre-built SVG icons:

- **BillIcon**: Receipt/bill outline
- **GuiltyIcon**: Devil/monster face with horns
- **TransportIcon**: Bus with wheels
- **FoodIcon**: Carrot shape

## Dependencies

- `react-native-svg`: For SVG rendering (already installed in project)
- `Poppins-Bold` font: Must be loaded via `useFonts` hook

## Demo

See `app/food-states-bar-chart-demo.tsx` for interactive examples and demonstrations of different configurations.

## Notes

- The component uses horizontal scrolling for multiple bars
- Bar heights are calculated proportionally based on the maximum value
- Icons are SVG components for crisp, scalable graphics
- The component is positioned absolutely as specified in the design
- All monetary values are displayed as strings to support currency symbols
- The total reference bar provides context for the chart values 