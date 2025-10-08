# Custom Toast Notification System

A comprehensive toast notification system designed specifically for the CribNosh app, featuring beautiful animations, multiple variants, and seamless integration with the customer API.

## Features

### 🎨 **Design Variants**

- **Default**: Clean, solid background with brand colors
- **Glass**: Translucent glass effect with blur
- **Gradient**: Beautiful gradient backgrounds matching app theme

### 🎯 **Toast Types**

- **Success**: Green theme for positive actions
- **Error**: Red theme for errors and failures
- **Info**: Blue theme for informational messages
- **Warning**: Orange theme for warnings

### 📱 **Positions**

- **Top**: Default position at top of screen
- **Center**: Centered on screen
- **Bottom**: Positioned at bottom of screen

### ⚡ **Animations**

- Smooth slide-in/out animations
- Scale effects for modern feel
- Spring animations for natural motion
- Auto-dismiss with customizable duration

## Components

### 1. CustomToast Component (`components/ui/CustomToast.tsx`)

The core toast component with:

- Multiple design variants
- Smooth animations using React Native Reanimated
- Customizable positioning
- Action buttons support
- Haptic feedback integration

### 2. CustomToastContext (`lib/CustomToastContext.tsx`)

Context provider with:

- Toast state management
- Predefined toast methods
- API-specific helpers
- Cart and order notifications

### 3. useCustomerToast Hook (`hooks/useCustomerToast.ts`)

Specialized hook for customer API integration:

- API error handling
- Success notifications
- Cart operations
- Authentication messages
- Network status updates

## Usage

### Basic Usage

```tsx
import { useCustomToast } from '../lib/CustomToastContext';

const MyComponent = () => {
  const { showSuccess, showError, showInfo, showWarning } = useCustomToast();

  const handleSuccess = () => {
    showSuccess('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    showError('Error!', 'Something went wrong');
  };

  return (
    // Your component JSX
  );
};
```

### Customer API Integration

```tsx
import { useCustomerToast } from '../hooks/useCustomerToast';

const MyComponent = () => {
  const {
    handleApiErrorWithToast,
    showCartItemAdded,
    showAuthRequired
  } = useCustomerToast();

  const handleAddToCart = async () => {
    try {
      const result = await addToCart(item);
      showCartItemAdded(result.data.dish_name);
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to add to cart');
    }
  };

  return (
    // Your component JSX
  );
};
```

### Toast Variants

```tsx
// Default variant
showSuccess("Success", "Message", 3000, "default");

// Glass variant
showError("Error", "Message", 4000, "glass");

// Gradient variant
showInfo("Info", "Message", 3000, "gradient");
```

## Integration with MainScreen

The MainScreen component now includes:

### ✅ **API Error Handling**

- Automatic error detection for cuisines and chefs APIs
- User-friendly error messages with context
- Fallback to mock data when APIs fail

### ✅ **Success Notifications**

- Toast notifications when data loads successfully
- Cart item addition confirmations
- Authentication requirement messages

### ✅ **Enhanced UX**

- Loading states with visual feedback
- Error recovery suggestions
- Seamless offline/online transitions

## API-Specific Methods

### Cart Operations

```tsx
showCartItemAdded(itemName); // Item added to cart
showCartItemRemoved(itemName); // Item removed from cart
```

### Order Management

```tsx
showOrderCreated(orderId); // Order placed successfully
showOrderUpdate(status); // Order status update
```

### Authentication

```tsx
showAuthRequired(action); // Sign in required
showAuthExpired(); // Session expired
showAuthSuccess(userName); // Welcome back message
```

### Network Status

```tsx
showNetworkError(); // Connection issues
showOfflineMode(); // Offline mode active
showBackOnline(); // Back online
```

## Styling

The toast system uses the app's design system:

### Colors

- **Primary**: `#094327` (Dark green)
- **Secondary**: `#0B9E58` (Green)
- **Accent**: `#FF6B35` (Orange)
- **Error**: `#FF3B30` (Red)

### Typography

- **Title**: 16px, weight 700
- **Message**: 14px, weight 400
- **Action**: 14px, weight 600

### Animations

- **Duration**: 300ms slide-in, 250ms slide-out
- **Easing**: Spring animations for natural feel
- **Scale**: 0.8 to 1.0 for modern effect

## Demo Component

Use `ToastDemo.tsx` to test all toast variants and functionality:

```tsx
import { ToastDemo } from "../components/ui/ToastDemo";

// Add to your screen for testing
<ToastDemo />;
```

## Best Practices

1. **Use appropriate toast types** for different scenarios
2. **Keep messages concise** and actionable
3. **Provide context** in error messages
4. **Use glass variant** for subtle notifications
5. **Use gradient variant** for important updates
6. **Handle API errors** with specific context
7. **Show success feedback** for user actions

## Future Enhancements

- [ ] Swipe-to-dismiss gestures
- [ ] Queue management for multiple toasts
- [ ] Custom toast layouts
- [ ] Sound notifications
- [ ] Accessibility improvements
- [ ] Toast persistence across app restarts
