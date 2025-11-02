# Monorepo Structure Plan

## Overview
This project is being restructured as a monorepo with a shared Convex backend used by both:
- **Mobile App** (Expo/React Native) - Root level
- **Web App** (Next.js) - `cribnoshWeb/` directory

## Current Structure
```
Cribnosh-app/
├── app/                    # Mobile app (Expo Router)
├── components/             # Mobile app components
├── convex/                 # Convex backend (mobile app)
├── cribnoshWeb/           # Web app (Next.js)
│   ├── app/                # Next.js app router
│   ├── components/         # Web app components
│   └── convex/            # Convex backend (web app) - IDENTICAL to root
└── package.json           # Mobile app dependencies
```

## Target Monorepo Structure
```
Cribnosh-app/
├── apps/
│   ├── mobile/            # Mobile app (Expo/React Native)
│   │   ├── app/          # Expo Router
│   │   ├── components/   # Mobile components
│   │   └── package.json
│   └── web/              # Web app (Next.js)
│       ├── app/          # Next.js app router
│       ├── components/   # Web components
│       └── package.json
├── packages/
│   └── convex/           # Shared Convex backend
│       ├── schema.ts
│       ├── mutations/
│       ├── queries/
│       ├── actions/
│       └── convex.config.ts
├── package.json          # Root workspace config
└── convex.json           # Convex configuration (at root)
```

## Consolidation Strategy

### Phase 1: Workspace Setup
1. Create root `package.json` with workspace configuration
2. Move mobile app to `apps/mobile/`
3. Keep web app in `cribnoshWeb/` temporarily (rename to `apps/web/` later)

### Phase 2: Convex Backend Consolidation
1. **Analysis**: Both Convex backends are identical (confirmed)
2. Move `convex/` to root level (keep the mobile app's version as it's currently working)
3. Update `convex.json` at root
4. Update both apps to reference root `convex/` directory
5. Remove `cribnoshWeb/convex/` directory

### Phase 3: Project Cleanup
1. Rename `cribnoshWeb/` to `apps/web/`
2. Update all import paths in both apps
3. Update workspace scripts
4. Consolidate shared dependencies

## Implementation Steps

### Step 1: Root Workspace Configuration
- Create root `package.json` with workspaces
- Configure scripts for both apps
- Set up shared dev dependencies

### Step 2: Convex Backend Migration
- Move `convex/` to root (if needed, or keep at root)
- Update `convex.json` paths
- Update import paths in both apps:
  - Mobile: `import { api } from "../../convex/_generated/api"`
  - Web: `import { api } from "../../../convex/_generated/api"` (after moving to apps/web/)

### Step 3: Update App Configurations
- Mobile app: Update `app.json` and any Convex client configs
- Web app: Update `next.config.mjs` and Convex client configs
- Both: Update environment variables and `.env` files

### Step 4: Dependency Consolidation
- Move shared dependencies to root `package.json`
- Keep app-specific dependencies in their respective `package.json` files
- Consolidate Convex-related dependencies

## Benefits
1. **Single Source of Truth**: One Convex backend for both platforms
2. **Code Sharing**: Shared types, utilities, and business logic
3. **Easier Development**: Run both apps with shared backend in one repo
4. **Simplified Deployment**: Single Convex deployment serves both platforms
5. **Better Consistency**: Same data model and API across platforms

## Convex Configuration
- **Location**: Root level `convex/` directory
- **Functions**: `convex/mutations/`, `convex/queries/`, `convex/actions/`
- **Schema**: `convex/schema.ts` (shared)
- **Config**: `convex/convex.config.ts` (shared)
- **Deployment**: Single Convex project for both apps

## Notes
- Both apps currently have identical Convex backends, making consolidation straightforward
- The mobile app's Convex backend is currently working, so we'll use that as the base
- The web app will reference the root Convex backend after consolidation
- Both apps can share the same Convex deployment URL

