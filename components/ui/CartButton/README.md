# CartButton Component

A unified, flexible cart button component that handles both "Add to Cart" and "View Cart" functionality with multiple variations and customization options.

## 🎯 Overview

The `CartButton` component merges the functionality of the previous `AddToCartButton` and `KitchenCartButton` components into a single, versatile component that can be used throughout the app for all cart-related interactions.

## ✨ Features

- **Two Variants**: `add` (for adding items) and `view` (for viewing cart)
- **Flexible Positioning**: Supports both relative and absolute positioning
- **Customizable Styling**: Full control over colors, text, and icons
- **Safe Area Support**: Automatic handling of device safe areas
- **Responsive Design**: Adapts to different screen sizes
- **Platform Optimized**: Uses platform-specific font families

## 🚀 Usage

### Basic Add to Cart Button

```tsx
import { CartButton } from '../components/ui/CartButton';

<CartButton
  quantity={2}
  onPress={() => console.log('Add to cart')}
  variant="add"
  position="absolute"
/>
```

### Basic View Cart Button

```tsx
<CartButton
  quantity={5}
  onPress={() => console.log('View cart')}
  variant="view"
  position="absolute"
  showIcon={true}
/>
```

### Custom Styled Button

```tsx
<CartButton
  quantity={3}
  onPress={handleViewCart}
  variant="view"
  position="relative"
  backgroundColor="#4CAF50"
  textColor="#FFFFFF"
  quantityBadgeColor="#FFFFFF"
  quantityTextColor="#4CAF50"
  buttonText="Custom Cart"
  showIcon={false}
/>
```

## 📋 Props

### Common Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `quantity` | `number` | ✅ | - | Number of items to display in the badge |
| `onPress` | `() => void` | ✅ | - | Function called when button is pressed |

### Variant Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `'add' \| 'view'` | ❌ | `'add'` | Button variant type |

### Layout Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `position` | `'absolute' \| 'relative'` | ❌ | `'relative'` | Positioning type |
| `bottom` | `number` | ❌ | Auto | Bottom position (for absolute) |
| `left` | `number` | ❌ | Auto | Left position (for absolute) |
| `right` | `number` | ❌ | Auto | Right position (for absolute) |

### Styling Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backgroundColor` | `string` | ❌ | `'#FF3B30'` | Button background color |
| `textColor` | `string` | ❌ | `'#E6FFE8'` | Button text color |
| `quantityBadgeColor` | `string` | ❌ | `'#E6FFE8'` | Quantity badge background |
| `quantityTextColor` | `string` | ❌ | `'#FF3B30'` | Quantity badge text color |

### Content Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `buttonText` | `string` | ❌ | Auto | Custom button text |
| `showIcon` | `boolean` | ❌ | `true` | Show shopping bag icon |

### Container Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `containerStyle` | `StyleProp<ViewStyle>` | ❌ | - | Additional container styles |

## 🎨 Variants

### Add Variant (`variant="add"`)

- **Purpose**: Adding items to cart
- **Default Text**: "Add to Cart"
- **Layout**: Floating container with safe area support
- **Positioning**: Absolute positioning with white background container
- **Badge Position**: Left-aligned within button

### View Variant (`variant="view"`)

- **Purpose**: Viewing cart contents
- **Default Text**: "Items in cart"
- **Layout**: Inline button with icon
- **Positioning**: Flexible positioning within parent
- **Badge Position**: Left-aligned with centered text

## 📱 Positioning Examples

### Absolute Positioning (Add Variant)

```tsx
// Floating at bottom with safe area
<CartButton
  quantity={2}
  onPress={handleAddToCart}
  variant="add"
  position="absolute"
/>
```

### Absolute Positioning (View Variant)

```tsx
// Custom positioned within container
<CartButton
  quantity={5}
  onPress={handleViewCart}
  variant="view"
  position="absolute"
  bottom={30}
  left={25}
  right={25}
/>
```

### Relative Positioning

```tsx
// Inline within layout
<CartButton
  quantity={3}
  onPress={handleViewCart}
  variant="view"
  position="relative"
/>
```

## 🎨 Styling Examples

### Default Styling

```tsx
<CartButton
  quantity={2}
  onPress={handlePress}
  variant="view"
/>
```

### Custom Colors

```tsx
<CartButton
  quantity={2}
  onPress={handlePress}
  variant="view"
  backgroundColor="#4CAF50"
  textColor="#FFFFFF"
  quantityBadgeColor="#FFFFFF"
  quantityTextColor="#4CAF50"
/>
```

### Custom Text

```tsx
<CartButton
  quantity={2}
  onPress={handlePress}
  variant="view"
  buttonText="Checkout Now"
  showIcon={false}
/>
```

## 🔧 Implementation Details

### Safe Area Handling

The component automatically handles safe areas when using the `add` variant with absolute positioning:

```tsx
// Automatically adds padding for safe areas
const insets = useSafeAreaInsets();
const paddingBottom = Math.max(insets.bottom, 80);
```

### Platform-Specific Fonts

Uses platform-optimized font families:

```tsx
const fontFamily = Platform.select({
  ios: 'Poppins-Bold, Arial Black, Arial',
  android: 'Poppins-Bold, Arial Black, Arial',
  default: 'Arial Black, Arial'
});
```

### Responsive Design

The component adapts to different screen sizes and maintains proper proportions across devices.

## 📁 File Structure

```
components/ui/
├── CartButton.tsx          # Main component
├── CartButton/
│   └── README.md          # This documentation
└── index.ts               # Exports
```

## 🔄 Migration from Old Components

### From AddToCartButton

```tsx
// Old
<AddToCartButton 
  quantity={quantity}
  onAddToCart={handleAddToCart}
/>

// New
<CartButton
  quantity={quantity}
  onPress={handleAddToCart}
  variant="add"
  position="absolute"
/>
```

### From KitchenCartButton

```tsx
// Old
<KitchenCartButton
  cartItems={cartItems}
  onPress={onCartPress}
/>

// New
<CartButton
  quantity={cartItems}
  onPress={onCartPress}
  variant="view"
  position="absolute"
  showIcon={true}
/>
```

## 🧪 Testing

Use the demo page to test different configurations:

```tsx
// Navigate to: app/cart-button-demo.tsx
```

The demo includes examples of:
- Both variants
- Custom styling
- Absolute positioning
- Different configurations

## 🎯 Best Practices

1. **Use appropriate variants**: Use `add` for adding items, `view` for viewing cart
2. **Handle safe areas**: The component handles this automatically for `add` variant
3. **Customize thoughtfully**: Use custom colors sparingly to maintain consistency
4. **Position correctly**: Use absolute positioning for floating buttons, relative for inline
5. **Provide meaningful text**: Override default text when needed for clarity

## 🔮 Future Enhancements

- [ ] Animation support for quantity changes
- [ ] Haptic feedback integration
- [ ] Loading states
- [ ] Disabled states
- [ ] Accessibility improvements
- [ ] RTL support 