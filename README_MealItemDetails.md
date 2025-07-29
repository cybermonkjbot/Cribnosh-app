# MealItemDetails Component

A comprehensive meal details drawer component that displays detailed information about any meal item in the CribNosh app. This component matches the exact design specifications provided, including all visual elements, colors, typography, and layout.

## Features

- **Drawer-style Interface**: Full-screen drawer with rounded top corners and drag handle
- **Detailed Meal Information**: Displays meal image, title, description, and kitchen info
- **Nutritional Breakdown**: Shows calories, fat, protein, and carbs with visual indicators
- **Diet Compatibility**: Progress bar showing how well the meal fits the user's diet
- **Interactive Elements**: Add to cart functionality with quantity selection
- **Responsive Design**: Adapts to different screen sizes while maintaining design fidelity

## Props

### Required Props

- `mealId: string` - Unique identifier for the meal
- `onBack: () => void` - Callback function when the back button is pressed

### Optional Props

- `mealData?: MealData` - Configuration object for meal information (uses defaults if not provided)
- `onAddToCart?: (mealId: string, quantity: number) => void` - Callback when add to cart is pressed

### MealData Interface

```typescript
interface MealData {
  title: string;              // Meal name (e.g., "Shawarma")
  description: string;        // Meal description text
  price: number;             // Price in cents or smallest currency unit
  imageUrl?: string;         // URL for meal image (uses placeholder if not provided)
  kitchenName: string;       // Name of the kitchen/restaurant
  kitchenAvatar?: string;    // URL for kitchen avatar (uses placeholder if not provided)
  calories: number;          // Calorie count
  fat: string;              // Fat content (e.g., "18g")
  protein: string;          // Protein content (e.g., "12g")
  carbs: string;           // Carbohydrate content (e.g., "230g")
  dietCompatibility: number; // Percentage (0-100) of diet compatibility
  dietMessage: string;      // Message about diet impact
  ingredients: string[];    // Array of ingredient names
}
```

## Usage Examples

### Basic Usage

```tsx
import { MealItemDetails } from '@/components/ui/MealItemDetails';

function MyComponent() {
  const handleBack = () => {
    // Handle closing the drawer
    console.log('Closing meal details');
  };

  const handleAddToCart = (mealId: string, quantity: number) => {
    console.log(`Adding ${quantity} of ${mealId} to cart`);
  };

  return (
    <MealItemDetails
      mealId="meal-123"
      onBack={handleBack}
      onAddToCart={handleAddToCart}
    />
  );
}
```

### With Custom Meal Data

```tsx
import { MealItemDetails } from '@/components/ui/MealItemDetails';

function MyComponent() {
  const mealData = {
    title: 'Butter Chicken',
    description: 'Authentic Indian butter chicken with aromatic spices and creamy sauce.',
    price: 1599,
    imageUrl: 'https://example.com/butter-chicken.jpg',
    kitchenName: "Raj's Indian Kitchen",
    kitchenAvatar: 'https://example.com/raj-avatar.jpg',
    calories: 850,
    fat: '25g',
    protein: '35g',
    carbs: '45g',
    dietCompatibility: 85,
    dietMessage: 'Great for muscle building',
    ingredients: [
      'Chicken Breast',
      'Tomato Sauce',
      'Heavy Cream',
      'Butter',
      'Garam Masala',
      'Ginger',
      'Garlic',
      'Basmati Rice'
    ]
  };

  return (
    <MealItemDetails
      mealId="butter-chicken-001"
      onBack={() => {/* handle back */}}
      mealData={mealData}
      onAddToCart={(id, qty) => {/* handle cart */}}
    />
  );
}
```

### Integration with Navigation

```tsx
import { router } from 'expo-router';
import { MealItemDetails } from '@/components/ui/MealItemDetails';

function DetailScreen() {
  return (
    <MealItemDetails
      mealId="meal-456"
      onBack={() => router.back()}
      onAddToCart={(mealId, quantity) => {
        // Add to cart logic
        addToCart(mealId, quantity);
        // Show success message
        Alert.alert('Success', `Added ${quantity} item(s) to cart!`);
      }}
    />
  );
}
```

## Design System Compliance

This component follows the CribNosh design system:

- **Colors**: Uses CribNosh red (#FF3B30) for primary actions and branding
- **Typography**: Implements exact font families and weights as specified
- **Spacing**: Matches pixel-perfect spacing from the design
- **Components**: Follows existing UI patterns in the app

## Testing

To test this component, you can use the demo screen:

```bash
# Navigate to the demo screen
/app/meal-details-demo.tsx
```

The demo includes sample data and interactive functionality to showcase all features of the component.

## Notes

- The component uses a default food image if no `imageUrl` is provided
- Quantity starts at 2 as specified in the design
- Progress bar gradient and nutritional circles match the exact design specifications
- All fonts, colors, and spacing are pixel-perfect implementations of the provided CSS 