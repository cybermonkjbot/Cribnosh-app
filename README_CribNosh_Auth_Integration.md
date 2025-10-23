# CribNosh Authentication Integration

This document explains how to integrate the CribNosh authentication system with your mobile app using the provided hooks and components.

## 🚀 Overview

The authentication system integrates with your existing [CribNosh API](https://cribnosh.co.uk/api/docs) and provides:

- **Email/Password Registration & Login**
- **OAuth Integration** (Google/Apple)
- **OTP Authentication** (Email & Phone)
- **Token Management** (JWT Bearer tokens)
- **Toast Notifications**
- **Navigation Handling**

## 📁 Files Created

### Core Hooks

- `hooks/useCribNoshAuth.ts` - Main authentication hook
- `hooks/useCribNoshOAuth.ts` - OAuth integration hook

### Components

- `components/CribNoshRegisterForm.tsx` - Registration form component

### Examples

- `examples/CribNoshAuthIntegration.tsx` - Usage examples

## 🔧 Integration Steps

### 1. Replace Mock API with Real Implementation

The hooks currently use mock implementations. To integrate with your actual API:

```typescript
// In hooks/useCribNoshAuth.ts
const API_BASE_URL = "https://cribnosh.com/api"; // Your actual API URL
```

### 2. Add Secure Token Storage

Replace the localStorage implementation with secure storage:

```typescript
// Install: expo install expo-secure-store
import * as SecureStore from 'expo-secure-store';

private async loadToken() {
  this.token = await SecureStore.getItemAsync('cribnosh_token');
}

private async saveToken(token: string) {
  this.token = token;
  await SecureStore.setItemAsync('cribnosh_token', token);
}

private async clearToken() {
  this.token = null;
  await SecureStore.deleteItemAsync('cribnosh_token');
}
```

### 3. Integrate with Existing SignInScreen

Update your existing `SignInScreen` component:

```typescript
// In your SignInScreen component
import { useCribNoshOAuth } from "../hooks/useCribNoshOAuth";

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onGoogleSignIn,
  onAppleSignIn,
  // ... other props
}) => {
  const { handleGoogleSignIn, handleAppleSignIn } = useCribNoshOAuth();

  // Use the OAuth handlers
  const handleGoogle = (idToken: string) => {
    handleGoogleSignIn(idToken);
  };

  const handleApple = (identityToken: string) => {
    handleAppleSignIn(identityToken);
  };

  // ... rest of component
};
```

### 4. Add Registration Flow

Use the registration form component:

```typescript
import { CribNoshRegisterForm } from '../components/CribNoshRegisterForm';

// In your registration screen
export const RegisterScreen: React.FC = () => {
  return <CribNoshRegisterForm />;
};
```

## 🎯 API Endpoints Used

Based on your [API documentation](https://cribnosh.co.uk/api/docs):

| Endpoint              | Method | Purpose                |
| --------------------- | ------ | ---------------------- |
| `/api/auth/register`  | POST   | User registration      |
| `/api/auth/login`     | POST   | User login             |
| `/api/auth/logout`    | POST   | User logout            |
| `/api/auth/oauth`     | POST   | OAuth authentication   |
| `/api/auth/otp`       | POST   | Email OTP verification |
| `/api/auth/phone-otp` | POST   | Phone OTP verification |

## 🔐 Authentication Methods

### Bearer Token Authentication

```typescript
headers: {
  'Authorization': 'Bearer {jwt_token}'
}
```

### Cookie Authentication

```typescript
// Automatically handled by the browser/app
cookie: "convex-auth-token={session_token}";
```

## 📱 Usage Examples

### Basic Registration

```typescript
import { useCribNoshAuth } from "../hooks/useCribNoshAuth";

const { register, isLoading, error } = useCribNoshAuth();

const handleRegister = async () => {
  try {
    await register({
      email: "user@example.com",
      password: "password123",
      name: "John Doe",
      confirmPassword: "password123",
      phone_number: "+1234567890",
    });
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
```

### OAuth Integration

```typescript
import { useCribNoshOAuth } from "../hooks/useCribNoshOAuth";

const { handleGoogleSignIn, handleAppleSignIn } = useCribNoshOAuth();

// In your Google sign-in handler
const onGoogleSignIn = (idToken: string) => {
  handleGoogleSignIn(idToken);
};

// In your Apple sign-in handler
const onAppleSignIn = (identityToken: string) => {
  handleAppleSignIn(identityToken);
};
```

### OTP Authentication

```typescript
const { sendOTP, verifyOTP } = useCribNoshAuth();

// Send OTP
await sendOTP("user@example.com");

// Verify OTP
await verifyOTP("user@example.com", "123456");
```

## 🎨 User Schema

The authentication system works with your API's user schema:

```typescript
interface CribNoshUser {
  _id: string;
  email: string;
  name: string;
  roles: string[];
  status: "active" | "inactive" | "pending";
  phone_number?: string;
  created_at: string;
  last_login: string;
}
```

## 🚨 Error Handling

The hooks provide comprehensive error handling:

- **Validation Errors**: Password mismatch, email format, etc.
- **API Errors**: Network issues, server errors, authentication failures
- **Toast Notifications**: User-friendly error messages
- **State Management**: Loading states, error states, success states

## 🔄 Navigation Flow

The hooks handle navigation automatically:

- **Registration Success** → Navigate to `/(tabs)`
- **Login Success** → Navigate to `/(tabs)`
- **Logout** → Navigate to `/` (sign-in screen)

## 🧪 Testing

Use the provided examples in `examples/CribNoshAuthIntegration.tsx` to test:

- Registration flow
- Login flow
- OAuth integration
- OTP authentication
- Error handling

## 📋 Next Steps

1. **Replace mock implementations** with real API calls
2. **Add secure token storage** using Expo SecureStore
3. **Integrate with existing components** (SignInScreen, etc.)
4. **Test thoroughly** on different platforms
5. **Add error boundaries** for better error handling
6. **Implement offline support** if needed

## 🔗 Related Documentation

- [CribNosh API Documentation](https://cribnosh.co.uk/api/docs)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native Toast Context](../lib/ToastContext.tsx)

## 💡 Tips

- **Always validate** user input on the client side
- **Handle network errors** gracefully
- **Provide clear feedback** to users
- **Test on real devices** for OAuth flows
- **Use TypeScript** for better type safety
- **Follow your existing** design patterns and conventions
