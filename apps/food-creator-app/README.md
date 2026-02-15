# Cribnosh Food Creator App

Chef platform mobile application for managing meals, orders, earnings, and content.

## Overview

This is the mobile app for chefs using the Cribnosh platform. It allows chefs to:
- Complete onboarding and compliance courses
- Manage their profile and kitchen details
- Create and manage recipes, stories, and videos
- Handle orders and update order status
- Manage earnings and request payouts
- Go live and stream cooking sessions
- Interact with customer support

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **State Management**: Convex (direct integration)
- **Styling**: NativeWind (Tailwind CSS)
- **Language**: TypeScript
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (package manager)
- Expo CLI
- Convex account

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
cd apps/chef-app
bun install
```

### Environment Variables

The `.env` file is already configured with:
```env
EXPO_PUBLIC_CONVEX_URL=https://wandering-finch-293.convex.cloud
```

### Start Development

```bash
# From root directory
npm run chef:dev

# Or from app directory
cd apps/chef-app
bun run start
```

### Running on Devices

- **iOS**: `bun run ios` or `npm run chef:ios`
- **Android**: `bun run android` or `npm run chef:android`
- **Web**: `bun run web` or `npm run chef:web`

## Project Structure

```
chef-app/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Entry screen
│   └── (tabs)/            # Tab navigation (to be created)
│       └── chef/          # Chef platform screens
├── components/            # Reusable components
│   ├── ui/               # UI components (40+ copied)
│   └── ...               # Other components
├── lib/                  # Library utilities
│   ├── convexClient.ts   # Convex client setup
│   └── ToastContext.tsx  # Toast notifications
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── utils/                # Utility functions (11 files)
├── types/                # TypeScript types
├── constants/            # App constants
└── assets/               # Images, fonts, etc.
```

## Convex Integration

This app uses Convex directly (no REST API endpoints):

- **Queries**: Use `useQuery` from `convex/react` for reactive data
- **Mutations**: Use `useMutation` from `convex/react` for updates
- **Actions**: Use `getConvexClient()` for complex operations
- **Session**: Managed via SecureStore

Example:
```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Reactive query
const chef = useQuery(api.queries.foodCreators.getByUserId, { userId });

// Mutation
const updateProfile = useMutation(api.mutations.foodCreators.updateProfile);
```

## Development

### Code Style

- TypeScript only
- Function declarations (no classes)
- Descriptive variable names
- Prettier formatting
- ESLint for linting

### Component Patterns

- Use existing UI components from `components/ui`
- Follow mobile app patterns
- Use Convex hooks for data fetching
- Implement proper loading and error states

## Current Status

✅ **Setup Complete**
- App structure created
- Dependencies installed (2471 packages)
- Configuration files set up
- Components copied (40+)
- Utilities copied (11 files)
- Assets configured
- Environment variables set
- Monorepo integrated

## Next Steps

1. Create chef authentication context
2. Build chef dashboard screen
3. Implement onboarding flow
4. Add navigation structure
5. Create chef-specific hooks
6. Build profile management
7. Implement content creation
8. Add order management
9. Build financial features

## Scripts

- `start` / `dev`: Start Expo dev server (port 8083)
- `android`: Run on Android
- `ios`: Run on iOS
- `web`: Run on web
- `lint`: Run ESLint
- `type-check`: TypeScript type checking

## Related Documentation

All planning documentation is in `apps/web/docs/`:
- [PRD](../web/docs/CHEF_PLATFORM_PRD.md)
- [User Stories](../web/docs/CHEF_PLATFORM_USER_STORIES.md)
- [User Journeys](../web/docs/CHEF_PLATFORM_USER_JOURNEYS.md)
- [UI/UX Plan](../web/docs/CHEF_PLATFORM_UI_UX_PLAN.md)
- [API Design](../web/docs/CHEF_PLATFORM_API_DESIGN.md)
- [Schema Design](../web/docs/CHEF_PLATFORM_SCHEMA_DESIGN.md)
- [Implementation Phases](../web/docs/CHEF_PLATFORM_IMPLEMENTATION_PHASES.md)

## License

Private - Cribnosh Platform
