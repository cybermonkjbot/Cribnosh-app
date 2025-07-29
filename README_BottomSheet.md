# Bottom Sheet Component

A reusable bottom sheet component built with `@gorhom/bottom-sheet` that follows the project's design patterns and conventions.

## Features

- ✅ TypeScript support with proper type definitions
- ✅ Dark/Light theme support using the project's color scheme
- ✅ Customizable snap points
- ✅ Pan down to close functionality
- ✅ Customizable backdrop
- ✅ Handle indicator styling
- ✅ Background styling
- ✅ Performance optimized with useMemo and useCallback

## Installation

The component uses `@gorhom/bottom-sheet` which is already installed in the project along with its required dependencies:
- `react-native-gesture-handler`
- `react-native-reanimated`

## Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetBase } from '../components/BottomSheet';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Text>Open Bottom Sheet</Text>
      </TouchableOpacity>

      {isOpen && (
        <BottomSheetBase
          snapPoints={['25%', '50%', '90%']}
          index={1}
          onChange={(index) => {
            if (index === -1) setIsOpen(false);
          }}
        >
          <Text>Your content here</Text>
        </BottomSheetBase>
      )}
    </View>
  );
}
```

### Advanced Usage

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetBase } from '../components/BottomSheet';

export function AdvancedExample() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('Sheet index changed to:', index);
    if (index === -1) setIsOpen(false);
  }, []);

  const customSnapPoints = ['20%', '40%', '80%'];

  return (
    <View>
      <TouchableOpacity onPress={() => setIsOpen(true)}>
        <Text>Open Custom Bottom Sheet</Text>
      </TouchableOpacity>

      {isOpen && (
        <BottomSheetBase
          snapPoints={customSnapPoints}
          index={1}
          onChange={handleSheetChanges}
          enablePanDownToClose={true}
          handleIndicatorStyle={{
            backgroundColor: '#ff0000',
            width: 50,
            height: 6,
          }}
          backgroundStyle={{
            backgroundColor: '#f0f0f0',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
          containerStyle={{
            paddingHorizontal: 20,
          }}
        >
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              Custom Styled Bottom Sheet
            </Text>
            <Text style={{ marginTop: 10 }}>
              This bottom sheet has custom styling for the handle indicator,
              background, and container.
            </Text>
          </View>
        </BottomSheetBase>
      )}
    </View>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Content to render inside the bottom sheet |
| `snapPoints` | `string[]` | `['25%', '50%', '90%']` | Array of snap points (heights) |
| `index` | `number` | `1` | Initial snap point index |
| `onChange` | `(index: number) => void` | - | Callback when snap point changes |
| `enablePanDownToClose` | `boolean` | `true` | Enable closing by panning down |
| `backdropComponent` | `React.FC<BottomSheetBackdropProps>` | - | Custom backdrop component |
| `handleIndicatorStyle` | `any` | - | Custom styles for the handle indicator |
| `backgroundStyle` | `any` | - | Custom styles for the background |
| `containerStyle` | `any` | - | Custom styles for the content container |

## Snap Points

Snap points define the different heights the bottom sheet can snap to. They can be:
- **Percentage strings**: `'25%'`, `'50%'`, `'90%'`
- **Pixel values**: `'300px'`, `'500px'`
- **Mixed**: `['25%', '300px', '90%']`

## Styling

The component automatically adapts to the current theme (light/dark) using the project's color scheme. You can override any styling by passing custom style props.

### Default Styles

- **Handle Indicator**: 40px wide, 4px tall, rounded corners
- **Background**: Rounded top corners (20px radius)
- **Content Container**: Flex: 1, 16px horizontal padding

## Performance

The component is optimized for performance with:
- `useMemo` for snap points and styles
- `useCallback` for event handlers
- Proper TypeScript types to prevent unnecessary re-renders

## Example Component

See `BottomSheetExample.tsx` for a complete working example of how to use the component.

## Dependencies

- `@gorhom/bottom-sheet`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-safe-area-context`

All dependencies are already installed in the project. 