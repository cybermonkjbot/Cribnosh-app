# ProfileScreenBackground Component

A React Native component that creates a profile screen background with a red base, rounded top corners, and two blurred circular light sources for visual depth.

## Features

- **Red Background**: Primary background color (#FF3B30) with 97% opacity
- **Rounded Top Corners**: 40px border radius on top corners only
- **Blurred Light Sources**: Two circular blurred elements for visual depth
- **Box Shadow**: Subtle shadow effect for depth
- **Content Overlay**: Supports child components as content
- **Customizable Size**: Adjustable width and height
- **Responsive Design**: Adapts to different screen sizes

## Usage

```tsx
import { ProfileScreenBackground } from '@/components/ui/ProfileScreenBackground';

// Basic usage
<ProfileScreenBackground>
  <YourProfileContent />
</ProfileScreenBackground>

// Custom size
<ProfileScreenBackground width={350} height={800}>
  <YourProfileContent />
</ProfileScreenBackground>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `375` | Width of the background |
| `height` | `number` | `1283` | Height of the background |
| `children` | `React.ReactNode` | `undefined` | Content to display over the background |

## Design Specifications

### Background
- **Color**: `#FF3B30` (red)
- **Opacity**: `0.97` (97%)
- **Border Radius**: `40px` (top corners only)
- **Position**: `relative`

### Box Shadow
- **Color**: `#000000` (black)
- **Offset**: `40px` horizontal, `44px` vertical
- **Blur**: `84px`
- **Opacity**: `0.15` (15%)

### Light Sources

#### Top-Right Blur
- **Position**: `left: 271px`, `top: 203px`
- **Size**: `200px × 200px`
- **Color**: `#FF9900` (orange)
- **Blur**: `27.5px`

#### Top-Left Blur
- **Position**: `left: -58px`, `top: 82px`
- **Size**: `200px × 200px`
- **Color**: `#FF5E00` (orange-red)
- **Blur**: `27.5px`

## Implementation Details

### Blur Effect
Since React Native doesn't support CSS `filter: blur()`, the component uses:
- Multiple shadow layers with different opacities
- Reduced opacity on the blur elements
- Shadow radius to simulate blur effect

### Shadow Implementation
- **iOS**: Uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`
- **Android**: Uses `elevation` property

### Content Overlay
The component provides a `contentContainer` that:
- Has `zIndex: 1` to appear above the background
- Uses `flex: 1` to fill available space
- Supports any React components as children

## Example with Profile Content

```tsx
<ProfileScreenBackground>
  <View style={styles.profileContent}>
    <View style={styles.avatar} />
    <Text style={styles.name}>John Doe</Text>
    <Text style={styles.subtitle}>Premium Member</Text>
    
    <View style={styles.stats}>
      <Text style={styles.statNumber}>1,234</Text>
      <Text style={styles.statLabel}>Points</Text>
    </View>
  </View>
</ProfileScreenBackground>
```

## Styling Tips

### Text Colors
Use white or light colors for text on the red background:
```tsx
const styles = StyleSheet.create({
  text: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
```

### Content Positioning
The background supports flexbox for content layout:
```tsx
const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
```

## Dependencies

- `expo-linear-gradient`: For potential gradient enhancements (already installed)
- No additional font dependencies required

## Demo

See `app/profile-screen-background-demo.tsx` for interactive examples and demonstrations of different configurations.

## Notes

- The component uses absolute positioning for the background elements
- Blur effects are simulated using shadows and opacity
- The background is designed to be a full-screen component
- Content should be styled with appropriate contrast for readability
- The component is optimized for profile screens and similar full-screen layouts 