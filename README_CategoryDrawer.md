# Category Full Drawer Components

This directory contains a comprehensive set of components for creating full-screen category drawers in the CribNosh app. The components are designed to be modular, reusable, and follow the exact design specifications from the provided mockups.

## Components Overview

### Core Components

1. **CategoryFullDrawer** - Main container component for category drawers
2. **CategoryFullHeader** - Header with drag handle, back button, title, segmented control, and search
3. **CategoryFullContent** - Scrollable content area
4. **CategoryFullFilterChips** - Horizontal scrollable filter chips
5. **CategoryFoodItemCard** - Individual food item card
6. **CategoryFoodItemsGrid** - Grid layout for displaying food items

### Pre-built Implementations

1. **TakeawayCategoryDrawer** - For general takeaway categories with sections
2. **TooFreshToWasteDrawer** - Special implementation for "Too Fresh to Waste" category
3. **CategoryDrawerDemo** - Demo component showcasing all variations

## Usage Examples

### Basic Category Drawer

```tsx
import { CategoryFullDrawer } from '@/components/ui';

function MyCategoryScreen() {
  const handleBack = () => {
    // Handle back navigation
  };

  return (
    <CategoryFullDrawer
      categoryName="My Category"
      onBack={handleBack}
    >
      <Text>Your custom content here</Text>
    </CategoryFullDrawer>
  );
}
```

### Takeaway Category with Food Items

```tsx
import { TakeawayCategoryDrawer } from '@/components/ui';

function TakeawayScreen() {
  const foodItems = [
    {
      id: '1',
      title: 'Chicken Burger',
      description: '100 gr chicken + tomato + cheese Lettuce',
      price: 20.00,
      imageUrl: 'https://example.com/image.jpg',
    },
    // ... more items
  ];

  return (
    <TakeawayCategoryDrawer
      categoryName="All Available Takeaway's"
      onBack={() => navigation.goBack()}
      allAvailableItems={foodItems}
      bestRatedItems={foodItems}
      onAddToCart={(id) => console.log('Added:', id)}
      onItemPress={(id) => console.log('Pressed:', id)}
    />
  );
}
```

### Too Fresh to Waste Category

```tsx
import { TooFreshToWasteDrawer } from '@/components/ui';

function TooFreshScreen() {
  const freshItems = [
    {
      id: '1',
      name: 'Salmon Fillet',
      origin: 'African',
      price: 20.00,
    },
    // ... more items
  ];

  return (
    <TooFreshToWasteDrawer
      onBack={() => navigation.goBack()}
      items={freshItems}
      onAddToCart={(id) => console.log('Added:', id)}
      onItemPress={(id) => console.log('Pressed:', id)}
    />
  );
}
```

### Custom Category with Filters

```tsx
import { CategoryFullDrawer, CategoryFoodItemsGrid } from '@/components/ui';

function CustomCategoryScreen() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  const filterChips = [
    { id: 'vegan', label: 'Vegan', icon: 'leaf' },
    { id: 'spicy', label: 'Spicy', icon: 'flame' },
    { id: 'keto', label: 'Keto', icon: 'egg' },
  ];

  return (
    <CategoryFullDrawer
      categoryName="Custom Category"
      categoryDescription="This is a custom category with special content"
      onBack={() => navigation.goBack()}
      filterChips={filterChips}
      activeFilters={activeFilters}
      onFilterChange={(filterId) => {
        setActiveFilters(prev => 
          prev.includes(filterId) 
            ? prev.filter(id => id !== filterId)
            : [...prev, filterId]
        );
      }}
    >
      <CategoryFoodItemsGrid
        title="Featured Items"
        items={foodItems}
        onAddToCart={handleAddToCart}
        onItemPress={handleItemPress}
      />
    </CategoryFullDrawer>
  );
}
```

## Component Props

### CategoryFullDrawer

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `categoryName` | `string` | - | The main category title |
| `categoryDescription` | `string` | - | Optional description text |
| `onBack` | `() => void` | - | Back button handler |
| `selectedSegment` | `'forYou' \| 'all'` | `'forYou'` | Active segmented control option |
| `onSegmentChange` | `(segment: 'forYou' \| 'all') => void` | - | Segment change handler |
| `onSearch` | `(query: string) => void` | - | Search input handler |
| `searchPlaceholder` | `string` | `"Search Stans Kitchens"` | Search placeholder text |
| `filterChips` | `FilterChip[]` | `[]` | Array of filter chip options |
| `onFilterChange` | `(filterId: string) => void` | - | Filter change handler |
| `activeFilters` | `string[]` | `[]` | Currently active filter IDs |
| `children` | `React.ReactNode` | - | Content to render inside the drawer |

### CategoryFoodItemCard

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | - | Unique item identifier |
| `title` | `string` | - | Food item title |
| `description` | `string` | - | Food item description |
| `price` | `number` | - | Item price |
| `imageUrl` | `string` | - | Optional image URL |
| `onAddToCart` | `(id: string) => void` | - | Add to cart handler |
| `onPress` | `(id: string) => void` | - | Item press handler |

### CategoryFoodItemsGrid

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Section title |
| `items` | `FoodItem[]` | - | Array of food items |
| `onAddToCart` | `(id: string) => void` | - | Add to cart handler |
| `onItemPress` | `(id: string) => void` | - | Item press handler |
| `showShadow` | `boolean` | `false` | Whether to show red shadow effect |

## Styling

The components use the following color scheme:

- **Primary Green**: `#094327`
- **CribNosh Red**: `#FF3B30`
- **Background**: `#FAFFFA`
- **Text Dark**: `#0D0D0D`
- **Text Gray**: `#3B3B3B`

## Design Features

1. **Drag Handle** - Visual indicator for draggable drawer
2. **Segmented Control** - "For you" vs "All" toggle
3. **Search Bar** - Integrated search functionality
4. **Filter Chips** - Horizontal scrollable filters with icons
5. **Food Cards** - Consistent card design with images, titles, descriptions, prices, and add buttons
6. **Responsive Layout** - Adapts to different screen sizes
7. **Shadow Effects** - Optional red shadow effects for emphasis

## Demo

Use the `CategoryDrawerDemo` component to test all variations:

```tsx
import { CategoryDrawerDemo } from '@/components/ui';

function TestScreen() {
  return <CategoryDrawerDemo />;
}
```

## Integration Notes

- Components are designed to work with React Navigation
- Use Modal or BottomSheet for presentation
- Components handle their own state management
- Follow Expo and React Native best practices
- Supports both light and dark themes through the app's color scheme 