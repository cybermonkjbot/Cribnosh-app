# Cribnosh Driver App

A separate Expo app for drivers to manage meal delivery orders, built with the same design language as the customer app.

## 🚚 Features

- **Driver Authentication** - Secure phone/email login with OTP verification
- **Dashboard** - Overview of earnings, ratings, and available orders
- **Order Management** - Accept/decline orders, view order details, update order status
- **Real-time Tracking** - Live location updates for customers
- **Earnings Tracking** - Monitor daily/weekly/monthly earnings and request payouts
- **Profile Management** - Update driver information, documents, and bank details

## 🏗️ Architecture

### API Integration
The app uses web API endpoints from `apps/web/app/api`:
- **Authentication**: `/api/auth/phone-signin`, `/api/auth/login`, `/api/auth/me`
- **Driver Endpoints**: `/api/delivery/drivers` (GET, POST), `/api/driver/profile/me` (GET, PUT)
- **Order Endpoints**: `/api/orders/[order_id]` (GET), `/api/orders/[order_id]/status` (POST)
- **Driver-Specific**: `/api/driver/orders`, `/api/driver/earnings`, `/api/driver/payouts/request`

### Authentication
- Uses X-Session-Token header for authentication
- Session token stored in SecureStore as `cribnosh_session_token`
- Matches mobile app authentication pattern

### Components
The app uses local components:
- `ThemedText` - Consistent text styling
- `ThemedView` - Theme-aware view components
- `Colors` - Brand color system
- `SkeletonComponents` - Loading skeletons (SkeletonOrderCard, SkeletonStatCard, SkeletonListItem)

### Project Structure
```
driver-app/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Welcome/login screen
│   ├── login.tsx          # Driver authentication
│   ├── phone-auth.tsx     # Phone authentication
│   ├── email-auth.tsx     # Email authentication
│   ├── otp-auth.tsx       # OTP verification
│   ├── register.tsx       # Driver registration
│   ├── dashboard.tsx      # Main driver dashboard
│   ├── orders.tsx         # Order management
│   ├── order-details.tsx  # Individual order details
│   ├── active-order.tsx   # Active order tracking
│   ├── earnings.tsx        # Earnings overview
│   ├── documents.tsx       # Document management
│   └── profile/           # Profile screens
├── components/            # Reusable components
│   └── SkeletonComponents.tsx  # Loading skeletons
├── contexts/              # React contexts
│   ├── EnhancedDriverAuthContext.tsx  # Auth context
│   └── DriverAuthContext.tsx  # Deprecated auth context
├── store/                 # RTK Query API store
│   └── driverApi.ts       # API endpoints
├── services/              # Service modules
│   ├── LocationService.ts # Location tracking
│   └── callingService.ts  # WebRTC calling
├── lib/                   # Library utilities
│   ├── convexApi.ts       # Convex API client
│   └── convex.ts          # Convex client
├── constants/             # Constants
│   ├── api.ts             # API configuration
│   └── Colors.ts           # Color constants
├── types/                 # TypeScript types
│   └── api.ts             # API types
├── assets/                # Images and icons
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Convex account

### Installation

1. **Install dependencies:**
   ```bash
   cd driver-app
   npm install
   ```

2. **Set up Convex:**
   ```bash
   npx convex dev
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Add your Convex URL and API base URL
   # EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   # EXPO_PUBLIC_API_BASE_URL=https://cribnosh.com/api
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

## 📱 Screens

### Welcome Screen (`index.tsx`)
- Driver onboarding
- Login/Register options
- Feature highlights

### Authentication (`login.tsx`, `phone-auth.tsx`, `email-auth.tsx`, `otp-auth.tsx`, `register.tsx`)
- Phone number authentication with OTP
- Email/password login
- Driver registration with documents
- Session token-based authentication

### Dashboard (`dashboard.tsx`)
- Driver status toggle (online/offline)
- Earnings and rating stats
- Available orders list
- Quick order actions

### Order Management (`orders.tsx`, `order-details.tsx`)
- List of assigned orders
- Order status updates
- Customer communication
- Navigation to delivery location

### Profile (`profile.tsx`)
- Driver information
- Document management
- Earnings history
- Settings

## 🎨 Design System

The app follows the same design system as the customer app:

### Colors
- **Primary**: `#9C1314` (Brand red)
- **Accent**: `#10B981` (Success green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

### Typography
- **Title**: 32px, bold
- **Subtitle**: 20px, bold
- **Default**: 16px, regular
- **Caption**: 14px, regular

### Components
- Consistent button styles
- Card-based layouts
- Icon usage (Ionicons)
- Safe area handling

## 🔧 Development

### Adding New Screens
1. Create screen file in `app/` directory
2. Add route to `_layout.tsx`
3. Use shared components for consistency
4. Follow design system guidelines

### Backend Integration
- **Web API Endpoints**: Uses endpoints from `apps/web/app/api`
- **RTK Query**: API calls via `store/driverApi.ts` with session token authentication
- **Convex**: Real-time queries and live updates via `lib/convexApi.ts`
- **Location Tracking**: Real-time location updates via LocationService
- **WebRTC Calling**: Customer-driver communication via callingService

### Testing
```bash
# Run tests
npm test

# Test on device
npm run ios
npm run android
```

## 📦 Deployment

### Development Build
```bash
expo build:android
expo build:ios
```

### Production Build
```bash
expo build:android --release-channel production
expo build:ios --release-channel production
```

## 🤝 Contributing

1. Follow the design system guidelines
2. Use shared components when possible
3. Maintain consistency with customer app
4. Test on both iOS and Android
5. Update documentation for new features

## 📄 License

Same as main Cribnosh project.
