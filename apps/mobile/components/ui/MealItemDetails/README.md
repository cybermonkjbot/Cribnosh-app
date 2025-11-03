# MealItemDetails Modular Components

The `MealItemDetails` component has been refactored into multiple smaller, reusable components for better maintainability, testability, and code organization. This modular approach follows React best practices and makes the codebase more scalable.

## Component Architecture

```
MealItemDetails/
├── index.ts              # Exports all sub-components
├── MealHeader.tsx        # Header with back button and favorite
├── MealImage.tsx         # Food image display
├── KitchenInfo.tsx       # Kitchen name and avatar
├── MealTitle.tsx         # Large meal title
├── MealDescription.tsx   # Meal description text
├── DietCompatibilityBar.tsx # Progress bar and percentage
├── NutritionalInfo.tsx   # Calories, macros, and diet message
├── MealIngredients.tsx   # Ingredients section
├── AddToCartButton.tsx   # Bottom button with quantity
└── README.md            # This documentation
```

## Individual Components

### 1. MealHeader
**Purpose**: Handles the top header with navigation and favorites

```typescript
interface MealHeaderProps {
  onBack: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}
```

**Features**:
- Drag handle for drawer interface
- Back button with chevron and label
- Heart icon for favorites (filled/outline based on state)

**Usage**:
```tsx
<MealHeader 
  onBack={() => router.back()} 
  onFavorite={handleFavorite}
  isFavorite={isFavorite}
/>
```

### 2. MealImage
**Purpose**: Displays the meal image with fallback

```typescript
interface MealImageProps {
  imageUrl?: string;
  title: string;
}
```

**Features**:
- Remote image support via URL
- Fallback to default packaging image
- Rounded corners and proper sizing
- Cover resize mode for best display

**Usage**:
```tsx
<MealImage 
  imageUrl="https://example.com/meal.jpg"
  title="Delicious Meal"
/>
```

### 3. KitchenInfo
**Purpose**: Shows kitchen branding information

```typescript
interface KitchenInfoProps {
  kitchenName: string;
  kitchenAvatar?: string;
}
```

**Features**:
- Kitchen avatar with placeholder
- Kitchen name in CribNosh red color
- Proper spacing and alignment

**Usage**:
```tsx
<KitchenInfo 
  kitchenName="Stan's Kitchen"
  kitchenAvatar="https://example.com/avatar.jpg"
/>
```

### 4. MealTitle
**Purpose**: Large, prominent meal title display

```typescript
interface MealTitleProps {
  title: string;
}
```

**Features**:
- Uses Protest Strike font for impact
- Large 70px font size
- CribNosh green color (#094327)

**Usage**:
```tsx
<MealTitle title="Shawarma" />
```

### 5. MealDescription
**Purpose**: Descriptive text about the meal

```typescript
interface MealDescriptionProps {
  description: string;
}
```

**Features**:
- Uses Lato font for readability
- Proper line height and letter spacing
- Multi-line text support

**Usage**:
```tsx
<MealDescription description="Delicious authentic meal..." />
```

### 6. DietCompatibilityBar
**Purpose**: Visual representation of diet compatibility

```typescript
interface DietCompatibilityBarProps {
  compatibility: number; // percentage 0-100
}
```

**Features**:
- Animated progress bar
- Percentage display
- Color gradient from green to red
- "Nosh Sentiment Bar" label

**Usage**:
```tsx
<DietCompatibilityBar compatibility={75} />
```

### 7. NutritionalInfo
**Purpose**: Comprehensive nutritional breakdown

```typescript
interface NutritionalInfoProps {
  calories: number;
  fat: string;
  protein: string;
  carbs: string;
  dietMessage: string;
}
```

**Features**:
- Calories with fire icon
- Macro nutrients with colored circles
- Visual progress indicators
- Diet impact message
- "Your Diet, Considered" section

**Usage**:
```tsx
<NutritionalInfo 
  calories={850}
  fat="25g"
  protein="35g"
  carbs="45g"
  dietMessage="Great for muscle building"
/>
```

### 8. MealIngredients
**Purpose**: Lists meal ingredients

```typescript
interface MealIngredientsProps {
  ingredients: string[];
}
```

**Features**:
- Title section for ingredients
- Expandable list support (future enhancement)

**Usage**:
```tsx
<MealIngredients ingredients={['Chicken', 'Rice', 'Spices']} />
```

### 9. AddToCartButton
**Purpose**: Action button for adding items to cart

```typescript
interface AddToCartButtonProps {
  quantity: number;
  onAddToCart: () => void;
}
```

**Features**:
- Quantity badge with CribNosh styling
- Full-width action button
- Positioned at bottom of screen
- CribNosh red background

**Usage**:
```tsx
<AddToCartButton 
  quantity={2}
  onAddToCart={handleAddToCart}
/>
```

## Main Component Usage

The main `MealItemDetails` component orchestrates all sub-components:

```tsx
import { MealItemDetails } from '@/components/ui/MealItemDetails';

<MealItemDetails
  mealId="meal-123"
  onBack={() => router.back()}
  mealData={{
    title: 'Butter Chicken',
    description: 'Authentic Indian butter chicken...',
    // ... other properties
  }}
  onAddToCart={(id, qty) => handleAddToCart(id, qty)}
/>
```

## Benefits of Modular Architecture

### 1. **Maintainability**
- Each component has a single responsibility
- Easy to locate and fix bugs
- Clear separation of concerns

### 2. **Reusability**
- Components can be used independently
- Easy to compose different layouts
- Reduces code duplication

### 3. **Testability**
- Each component can be tested in isolation
- Easier to write unit tests
- Better test coverage

### 4. **Scalability**
- Easy to add new features to specific components
- Consistent styling across components
- Simplified refactoring

### 5. **Development Experience**
- Smaller files are easier to work with
- Clear component boundaries
- Better IDE support and autocomplete

## Styling Consistency

All components follow the CribNosh design system:

- **Colors**: CribNosh red (#FF3B30), green (#094327)
- **Fonts**: Poppins, Protest Strike, Lato, SF Pro
- **Spacing**: Consistent margins and padding
- **Typography**: Proper font weights and sizes

## Future Enhancements

Potential improvements for the modular components:

1. **Animation Support**: Add micro-interactions
2. **Accessibility**: Enhanced ARIA labels and screen reader support
3. **Theming**: Support for light/dark modes
4. **Localization**: Multi-language support
5. **Customization**: More styling props for flexibility

## Import Structure

```tsx
// Import individual components
import { MealHeader, MealImage } from '@/components/ui/MealItemDetails';

// Import all components
import * as MealComponents from '@/components/ui/MealItemDetails';

// Import main component
import { MealItemDetails } from '@/components/ui/MealItemDetails';
```

This modular approach makes the MealItemDetails system more robust, maintainable, and developer-friendly while preserving the exact design specifications and functionality. 