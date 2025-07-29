# Multi-Step Loader Components

A React Native implementation of the Aceternity Multi-Step Loader with smooth animations using Reanimated v3+.

## Components

### `MultiStepLoader`

The main progress indicator component that displays multiple steps with animated transitions.

#### Props

- `totalSteps: number` - Total number of steps in the loader
- `currentStep: number` - Current active step (1-based indexing)
- `className?: string` - Optional additional styling classes

#### Usage

```tsx
import { MultiStepLoader } from './components/ui/MultiStepLoader';

const [currentStep, setCurrentStep] = useState(1);

<MultiStepLoader
  totalSteps={5}
  currentStep={currentStep}
  className="w-full"
/>
```

### `MultiStepLoaderDemo`

A comprehensive demo component showcasing all features with interactive controls.

#### Usage

```tsx
import { MultiStepLoaderDemo } from './components/ui/MultiStepLoaderDemo';

<MultiStepLoaderDemo />
```

### `PullToRefreshExample`

A practical example showing how to integrate the loader with pull-to-refresh functionality.

#### Props

- `children?: React.ReactNode` - Optional content to render inside the scroll view

#### Usage

```tsx
import { PullToRefreshExample } from './components/ui/PullToRefreshExample';

<PullToRefreshExample>
  {/* Your content here */}
</PullToRefreshExample>
```

## Features

### Animations

- **Smooth Color Transitions**: Steps animate from grey (`zinc-200`) to green (`green-500`)
- **Pulse Effect**: Current step has a subtle pulsing animation
- **Timing**: 300ms duration for color transitions, 1000ms for pulse cycles

### Styling

- **Responsive**: Uses flex layout for equal-width segments
- **Pill Shape**: Rounded corners for modern appearance
- **Spacing**: Small margins between segments
- **Height**: 16px (h-4) total height
- **Container**: Light grey background with padding

### Behavior

- **1-based Indexing**: Steps are numbered starting from 1
- **Active States**: Previous and current steps are highlighted
- **Inactive States**: Future steps remain grey
- **Smooth Transitions**: All state changes are animated

## Integration Examples

### Basic Usage

```tsx
const [currentStep, setCurrentStep] = useState(1);

const handleStepChange = (newStep: number) => {
  setCurrentStep(newStep);
};

<MultiStepLoader
  totalSteps={5}
  currentStep={currentStep}
/>
```

### With Pull-to-Refresh

```tsx
const [refreshing, setRefreshing] = useState(false);
const [currentStep, setCurrentStep] = useState(1);

const onRefresh = useCallback(async () => {
  setRefreshing(true);
  
  // Simulate loading steps
  for (let step = 1; step <= 5; step++) {
    await new Promise(resolve => setTimeout(resolve, 800));
    setCurrentStep(step);
  }
  
  setRefreshing(false);
  setCurrentStep(1);
}, []);

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {refreshing && (
    <MultiStepLoader totalSteps={5} currentStep={currentStep} />
  )}
  {/* Your content */}
</ScrollView>
```

### Custom Styling

```tsx
<MultiStepLoader
  totalSteps={3}
  currentStep={2}
  className="w-64 h-6 bg-blue-100"
/>
```

## Technical Details

### Dependencies

- `react-native-reanimated` (v3+)
- `nativewind` for styling
- React Native core components

### Performance

- Uses `useSharedValue` for optimal performance
- Animations run on the UI thread
- Minimal re-renders with proper dependency management

### Accessibility

- Components are properly structured for screen readers
- High contrast colors for visibility
- Appropriate touch targets

## Customization

### Colors

To customize colors, modify the `interpolateColor` values in `StepSegment`:

```tsx
const backgroundColor = interpolateColor(
  animatedValue.value,
  [0, 1],
  ['#your-inactive-color', '#your-active-color']
);
```

### Timing

Adjust animation durations in the `useEffect` hooks:

```tsx
// Color transition duration
withTiming(isActive ? 1 : 0, { duration: 300 })

// Pulse animation duration
withTiming(1, { duration: 1000 })
```

### Sizing

Modify the className in `StepSegment`:

```tsx
className="flex-1 h-4 rounded-full mx-0.5" // Change h-4 for different heights
``` 