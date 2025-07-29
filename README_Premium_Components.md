# Premium UI Components

This directory contains reusable premium UI components designed for a polished and professional user experience.

## Components Overview

### 🎨 GradientBackground
A reusable gradient background component with customizable colors and direction.

**Props:**
- `children`: React nodes to render inside the gradient
- `colors`: Array of color strings (default: light pink to orange)
- `style`: Additional styles
- `start`: Gradient start point (default: top)
- `end`: Gradient end point (default: bottom)

**Usage:**
```tsx
<GradientBackground colors={['#FFF5F5', '#FFE8D6']}>
  <YourContent />
</GradientBackground>
```

### 📱 PremiumHeader
A premium header component with title and optional info button.

**Props:**
- `title`: Header title text
- `onInfoPress`: Function called when info button is pressed
- `showInfoButton`: Whether to show the info button (default: true)
- `style`: Additional styles
- `titleColor`: Color of the title text

**Usage:**
```tsx
<PremiumHeader 
  title="Orders" 
  onInfoPress={() => console.log('Info pressed')}
/>
```

### 🏷️ PremiumTabs
A premium tab navigation component with smooth animations.

**Props:**
- `tabs`: Array of tab objects with `key` and `label`
- `activeTab`: Currently active tab key
- `onTabPress`: Function called when a tab is pressed
- `style`: Additional styles
- `activeColor`: Color of active tab text
- `inactiveColor`: Color of inactive tab text
- `indicatorColor`: Color of the active tab indicator

**Usage:**
```tsx
<PremiumTabs
  tabs={[
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'past', label: 'Past' }
  ]}
  activeTab="ongoing"
  onTabPress={(tabKey) => setActiveTab(tabKey)}
/>
```

### 🍔 BurgerIcon
A custom burger icon component with layered design.

**Usage:**
```tsx
<BurgerIcon />
```

### 📋 OrderCard
A premium order card component with enhanced styling and interactions.

**Props:**
- `time`: Order time string
- `description`: Order description
- `price`: Order price
- `icon`: Optional icon component
- `onPress`: Function called when card is pressed
- `style`: Additional styles
- `showSeparator`: Whether to show separator line

**Usage:**
```tsx
<OrderCard
  time="19:18, 6th June"
  description="Keto Diet, Burger from Mr.s Burger"
  price="£28"
  icon={<BurgerIcon />}
  onPress={() => handleOrderPress(orderId)}
/>
```

### 📄 SectionHeader
A premium section header component with title and optional subtitle.

**Props:**
- `title`: Section title
- `subtitle`: Optional subtitle
- `style`: Additional styles
- `titleColor`: Color of title text
- `subtitleColor`: Color of subtitle text

**Usage:**
```tsx
<SectionHeader 
  title="June 2025" 
  subtitle="Your order history"
/>
```

### 🚫 EmptyState
A premium empty state component for when there's no content to display.

**Props:**
- `title`: Empty state title
- `subtitle`: Optional subtitle
- `icon`: Ionicons icon name
- `style`: Additional styles
- `titleColor`: Color of title text
- `subtitleColor`: Color of subtitle text
- `iconColor`: Color of the icon

**Usage:**
```tsx
<EmptyState
  title="No Orders"
  subtitle="Your orders will appear here"
  icon="receipt-outline"
/>
```

### ⏳ LoadingState
A premium loading state component with skeleton animations.

**Props:**
- `style`: Additional styles
- `itemCount`: Number of skeleton items to show (default: 3)

**Usage:**
```tsx
<LoadingState itemCount={5} />
```

## Design System

### Colors
- Primary Green: `#166534`
- Text Primary: `#11181C`
- Text Secondary: `#687076`
- Accent Red: `#DC2626`
- Background Gradient: `#FFF5F5` to `#FFE8D6`

### Typography
- Title: 28px, bold, -0.5 letter spacing
- Section Header: 18px, bold, -0.3 letter spacing
- Body: 16px, 500 weight
- Caption: 14px, 500 weight

### Spacing
- Container padding: 20px
- Card padding: 16px vertical, 4px horizontal
- Component margins: 8px, 16px, 24px

### Shadows
- Card shadow: 0 2px 3.84px rgba(0, 0, 0, 0.1)
- Elevation: 5 (Android)

## Best Practices

1. **Consistency**: Use these components consistently across the app
2. **Accessibility**: All components support proper accessibility features
3. **Performance**: Components are optimized for React Native performance
4. **Customization**: Use the style props for custom styling when needed
5. **Reusability**: These components are designed to be reused across different screens

## Future Enhancements

- Add animation libraries for smoother transitions
- Implement dark mode support
- Add more icon variants
- Create theme provider for consistent theming
- Add unit tests for all components 