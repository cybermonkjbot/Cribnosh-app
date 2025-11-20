# Chef Platform - UI/UX Plan (Mobile App)

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft
- **Platform**: React Native (Expo) Mobile App
- **Data Layer**: Convex (Direct Integration)

## Overview

This document outlines the UI/UX design and implementation plan for the chef platform within the mobile app. All data operations use Convex directly (actions, queries, mutations) - no REST API endpoints.

## Design Principles

### 1. Mobile-First Design
- Touch-optimized interactions
- Thumb-friendly navigation zones
- Responsive layouts for various screen sizes
- Native feel with platform-specific patterns

### 2. Convex Direct Integration
- Use `getConvexClient()` for actions
- Use `useQuery` from `convex/react` for reactive queries
- Use `convex.mutation()` for mutations
- Session token management via SecureStore
- No REST API calls to web app

### 3. Consistent Patterns
- Follow existing mobile app patterns
- Reuse existing UI components where possible
- Maintain design system consistency
- Use existing navigation patterns

### 4. Progressive Disclosure
- Show information gradually
- Avoid overwhelming users
- Clear onboarding flow
- Contextual help and tooltips

---

## Navigation Structure

### Main Navigation

The chef platform will be integrated into the existing tab-based navigation with a new "Chef" tab.

```
(tabs)/
  ├── index.tsx (Home - existing)
  ├── orders/ (Orders - existing)
  ├── profile.tsx (Profile - existing)
  └── chef/ (NEW - Chef Platform)
      ├── _layout.tsx
      ├── index.tsx (Chef Dashboard)
      ├── onboarding/
      │   ├── _layout.tsx
      │   ├── index.tsx (Onboarding Overview)
      │   ├── course/
      │   │   ├── index.tsx (Course List)
      │   │   └── [moduleId].tsx (Module Detail)
      │   └── documents/
      │       └── index.tsx (Document Upload)
      ├── profile/
      │   ├── index.tsx (Chef Profile)
      │   ├── kitchen.tsx (Kitchen Profile)
      │   └── availability.tsx (Availability Settings)
      ├── content/
      │   ├── _layout.tsx
      │   ├── index.tsx (Content Library)
      │   ├── recipes/
      │   │   ├── index.tsx (Recipe List)
      │   │   ├── create.tsx (Create Recipe)
      │   │   └── [recipeId].tsx (Recipe Detail/Edit)
      │   ├── stories/
      │   │   ├── index.tsx (Story List)
      │   │   ├── create.tsx (Create Story)
      │   │   └── [storyId].tsx (Story Detail/Edit)
      │   └── videos/
      │       ├── index.tsx (Video List)
      │       └── [videoId].tsx (Video Detail)
      ├── orders/
      │   ├── index.tsx (Order Dashboard)
      │   └── [orderId].tsx (Order Detail)
      ├── earnings/
      │   ├── index.tsx (Earnings Dashboard)
      │   ├── payouts/
      │   │   ├── index.tsx (Payout History)
      │   │   └── request.tsx (Request Payout)
      │   ├── bank-accounts/
      │   │   ├── index.tsx (Bank Accounts)
      │   │   ├── add.tsx (Add Bank Account)
      │   │   └── [accountId].tsx (Account Detail)
      │   └── tax/
      │       ├── index.tsx (Tax Records)
      │       └── [taxYear].tsx (Tax Year Detail)
      ├── live/
      │   ├── index.tsx (Live Streaming Dashboard)
      │   └── [sessionId].tsx (Active Stream)
      └── support/
          ├── index.tsx (Support Chat)
          └── cases/
              └── [caseId].tsx (Support Case Detail)
```

### Tab Bar Integration

Add "Chef" tab to existing `CustomTabBar` component:

```typescript
// Only show Chef tab if user has chef role
<Tabs.Screen
  name="chef"
  options={{
    title: 'Chef',
    // Show badge if onboarding incomplete or new orders
  }}
/>
```

---

## Screen Designs

### 1. Chef Dashboard (`chef/index.tsx`)

**Purpose**: Main entry point for chefs, showing overview and quick actions

**Layout**:
```
┌─────────────────────────────┐
│  Header: "Chef Dashboard"   │
│  [Profile Avatar] [Settings]│
├─────────────────────────────┤
│  Status Card                │
│  ┌─────────────────────┐   │
│  │ Online/Offline Toggle│   │
│  │ [●] Online          │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  Quick Stats                │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │Today │ │Week  │ │Month ││
│  │Orders│ │Orders│ │Orders││
│  │  5   │ │  23  │ │  89  ││
│  └──────┘ └──────┘ └──────┘│
├─────────────────────────────┤
│  Earnings Summary           │
│  ┌─────────────────────┐   │
│  │ Available: £245.50  │   │
│  │ [Request Payout]    │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  Quick Actions              │
│  ┌──────────┐ ┌──────────┐ │
│  │ Go Live  │ │New Recipe│ │
│  └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ │
│  │New Order │ │  Support │ │
│  └──────────┘ └──────────┘ │
├─────────────────────────────┤
│  Recent Orders              │
│  [Order Card]               │
│  [Order Card]               │
│  [View All Orders →]        │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
// Use Convex queries directly
const chef = useQuery(api.queries.chefs.getByUserId, { userId });
const recentOrders = useQuery(api.queries.orders.getRecentForChef, { chefId });
const earnings = useQuery(api.queries.chefs.getEarningsSummary, { chefId });
```

**Key Features**:
- Online/Offline toggle (prominent)
- Quick stats cards
- Earnings summary with payout CTA
- Quick action buttons
- Recent orders list
- Pull-to-refresh

**Components**:
- `ChefDashboardHeader`
- `StatusToggleCard`
- `QuickStatsCards`
- `EarningsSummaryCard`
- `QuickActionGrid`
- `OrderCard` (reuse existing)

---

### 2. Onboarding Flow

#### 2.1 Onboarding Overview (`chef/onboarding/index.tsx`)

**Purpose**: Show onboarding progress and next steps

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Onboarding       │
├─────────────────────────────┤
│  Progress: 60%              │
│  [████████░░░░░░░░░░]       │
├─────────────────────────────┤
│  Checklist                  │
│  ✓ Complete Profile         │
│  ✓ Upload ID Document       │
│  ⏳ Course (8/13 modules)   │
│  ⏳ Health Permit           │
│  ⏳ Bank Account            │
│  ⏳ Kitchen Profile         │
├─────────────────────────────┤
│  Next Steps                 │
│  [Continue Course →]        │
│  [Upload Documents →]       │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const onboardingStatus = useQuery(
  api.queries.chefs.getOnboardingStatus,
  { chefId }
);
const courseProgress = useQuery(
  api.queries.chefCourses.getProgress,
  { chefId, courseId: "compliance-course-v1" }
);
```

#### 2.2 Course Module List (`chef/onboarding/course/index.tsx`)

**Purpose**: List all course modules with progress

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Compliance Course│
├─────────────────────────────┤
│  Progress: 8/13 modules     │
│  [████████░░░░░░░░░░]       │
├─────────────────────────────┤
│  Module 1: Food Safety      │
│  ✓ Completed (95% quiz)     │
│  ───────────────────────    │
│  Module 2: Hygiene          │
│  ✓ Completed (88% quiz)     │
│  ───────────────────────    │
│  Module 3: UK Regulations   │
│  ⏳ In Progress             │
│  [Continue →]               │
│  ───────────────────────    │
│  Module 4: Kitchen Setup    │
│  ○ Not Started              │
│  ───────────────────────    │
│  ...                        │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const course = useQuery(
  api.queries.chefCourses.getByChefAndCourse,
  { chefId, courseId: "compliance-course-v1" }
);
```

#### 2.3 Module Detail (`chef/onboarding/course/[moduleId].tsx`)

**Purpose**: Display module content and quiz

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Module 3         │
├─────────────────────────────┤
│  [Content ScrollView]       │
│                             │
│  UK Food Regulations        │
│  [Text content]             │
│  [Images]                   │
│  [Videos]                   │
│                             │
│  ───────────────────────    │
│  Quiz: 5 questions          │
│  [Start Quiz]               │
│                             │
│  [Mark Complete]            │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const module = useQuery(
  api.queries.chefCourses.getModuleContent,
  { courseId, moduleId }
);
```

**Actions**:
```typescript
// Mark module complete
const completeModule = useMutation(api.mutations.chefCourses.completeModule);

// Submit quiz
const submitQuiz = useMutation(api.mutations.chefCourses.submitQuiz);
```

#### 2.4 Document Upload (`chef/onboarding/documents/index.tsx`)

**Purpose**: Upload and manage required documents

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Documents        │
├─────────────────────────────┤
│  Required Documents         │
│  ┌─────────────────────┐   │
│  │ ID Document         │   │
│  │ ✓ Verified          │   │
│  │ [View] [Replace]    │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ Health Permit       │   │
│  │ ⏳ Pending Review   │   │
│  │ [View]              │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ Insurance           │   │
│  │ ○ Not Uploaded      │   │
│  │ [Upload Document]   │   │
│  └─────────────────────┘   │
│                             │
│  Optional Documents         │
│  [Tax Registration]         │
│  [Kitchen Certification]    │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const documents = useQuery(
  api.queries.chefDocuments.getByChef,
  { chefId }
);
```

**Actions**:
```typescript
// Upload document
const uploadDocument = useMutation(api.mutations.chefDocuments.upload);

// Delete document
const deleteDocument = useMutation(api.mutations.chefDocuments.delete);
```

---

### 3. Profile Management

#### 3.1 Chef Profile (`chef/profile/index.tsx`)

**Purpose**: View and edit chef profile

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    My Profile       │
├─────────────────────────────┤
│  [Profile Image]            │
│  [Change Photo]             │
│                             │
│  Name: Maria Rodriguez      │
│  [Edit]                     │
│                             │
│  Bio:                       │
│  Passionate chef...         │
│  [Edit]                     │
│                             │
│  Specialties:               │
│  [Italian] [Mediterranean]  │
│  [Edit]                     │
│                             │
│  Location: London, UK       │
│  [Edit]                     │
│                             │
│  [Save Changes]             │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const chef = useQuery(api.queries.chefs.getByUserId, { userId });
```

**Actions**:
```typescript
const updateProfile = useMutation(api.mutations.chefs.updateProfile);
const uploadProfileImage = useMutation(api.mutations.chefs.uploadImage);
```

#### 3.2 Kitchen Profile (`chef/profile/kitchen.tsx`)

**Purpose**: Manage kitchen details

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Kitchen Profile  │
├─────────────────────────────┤
│  Kitchen Name               │
│  [Maria's Home Kitchen]     │
│                             │
│  Address                    │
│  [123 Main St, London]      │
│  [Edit]                     │
│                             │
│  Kitchen Images             │
│  [Image] [Image] [+]        │
│                             │
│  Certification Status       │
│  ✓ Certified                │
│  Last Inspection: 2024-01-15│
│                             │
│  Featured Video             │
│  [Select Video]             │
│                             │
│  [Save Changes]             │
└─────────────────────────────┘
```

#### 3.3 Availability Settings (`chef/profile/availability.tsx`)

**Purpose**: Set availability schedule

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Availability     │
├─────────────────────────────┤
│  Max Orders Per Day: 20     │
│  [Slider]                   │
│                             │
│  Weekly Schedule            │
│  Monday    [10:00-14:00]    │
│            [17:00-21:00]    │
│            [+ Add Time]     │
│  ───────────────────────    │
│  Tuesday   [10:00-14:00]    │
│            [17:00-21:00]    │
│  ───────────────────────    │
│  ...                        │
│                             │
│  Advance Booking: 7 days    │
│  [Slider]                   │
│                             │
│  [Save Schedule]            │
└─────────────────────────────┘
```

---

### 4. Content Creation

#### 4.1 Content Library (`chef/content/index.tsx`)

**Purpose**: View all content (recipes, stories, videos)

**Layout**:
```
┌─────────────────────────────┐
│  Content Library            │
│  [+ Create]                 │
├─────────────────────────────┤
│  [All] [Recipes] [Stories]  │
│  [Videos]                   │
├─────────────────────────────┤
│  Search: [____________]     │
├─────────────────────────────┤
│  [Draft] [Published] [All]  │
├─────────────────────────────┤
│  Recipe: Pasta Carbonara    │
│  Published • 245 views      │
│  [Edit] [Archive]           │
│  ───────────────────────    │
│  Story: My Cooking Journey  │
│  Draft                      │
│  [Edit] [Delete]            │
│  ───────────────────────    │
│  Video: Making Pizza        │
│  Published • 1.2k views     │
│  [Edit] [Archive]           │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const recipes = useQuery(api.queries.chefRecipes.getByChef, { chefId });
const stories = useQuery(api.queries.chefStories.getByChef, { chefId });
const videos = useQuery(api.queries.videoPosts.getByCreator, { creatorId: userId });
```

#### 4.2 Create Recipe (`chef/content/recipes/create.tsx`)

**Purpose**: Create new recipe

**Layout**:
```
┌─────────────────────────────┐
│  ← Cancel    New Recipe     │
│              [Save Draft]   │
├─────────────────────────────┤
│  [ScrollView]               │
│                             │
│  Title: [____________]      │
│                             │
│  Description:               │
│  [Text area]                │
│                             │
│  Cuisine: [Italian ▼]       │
│  Difficulty: [Intermediate▼]│
│                             │
│  Prep Time: [30] min        │
│  Cook Time: [45] min        │
│  Servings: [4]              │
│                             │
│  Images:                    │
│  [Image] [Image] [+]        │
│                             │
│  Ingredients:               │
│  [+ Add Ingredient]         │
│  • 500g pasta               │
│  • 200g bacon               │
│                             │
│  Instructions:              │
│  [+ Add Step]               │
│  1. Boil water...           │
│  2. Cook pasta...           │
│                             │
│  Tags: [pasta] [italian] [+]│
│                             │
│  [Publish] [Save Draft]     │
└─────────────────────────────┘
```

**Actions**:
```typescript
const createRecipe = useMutation(api.mutations.chefRecipes.create);
const uploadImage = useMutation(api.mutations.storage.upload);
```

---

### 5. Order Management

#### 5.1 Order Dashboard (`chef/orders/index.tsx`)

**Purpose**: View and manage orders

**Layout**:
```
┌─────────────────────────────┐
│  Orders                     │
│  [Filter ▼]                 │
├─────────────────────────────┤
│  [Active] [Today] [All]     │
├─────────────────────────────┤
│  Order #1234                │
│  John Doe • 2 items         │
│  £24.50 • 5 min ago         │
│  [Accept] [Reject]          │
│  ───────────────────────    │
│  Order #1233                │
│  Jane Smith • 1 item        │
│  £18.00 • Preparing         │
│  [Update Status]            │
│  ───────────────────────    │
│  Order #1232                │
│  Bob Wilson • 3 items       │
│  £32.00 • Ready             │
│  [Mark Out for Delivery]    │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const orders = useQuery(
  api.queries.orders.getByChef,
  { chefId, status: "active" }
);
```

**Real-time Updates**:
```typescript
// Use Convex reactive queries for real-time order updates
const orders = useQuery(api.queries.orders.getByChef, { chefId });
// Automatically updates when new orders arrive
```

**Actions**:
```typescript
const acceptOrder = useMutation(api.mutations.orders.accept);
const rejectOrder = useMutation(api.mutations.orders.reject);
const updateOrderStatus = useMutation(api.mutations.orders.updateStatus);
```

#### 5.2 Order Detail (`chef/orders/[orderId].tsx`)

**Purpose**: View order details and update status

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Order #1234      │
├─────────────────────────────┤
│  Status: Pending            │
│  [Accept] [Reject]          │
├─────────────────────────────┤
│  Customer: John Doe         │
│  📞 +44 123 456 7890        │
│                             │
│  Delivery Address:          │
│  123 High Street            │
│  London, UK                 │
├─────────────────────────────┤
│  Items:                     │
│  • Pasta Carbonara x2       │
│    £12.00 each              │
│  • Tiramisu x1              │
│    £8.50                    │
│                             │
│  Subtotal: £32.50           │
│  Delivery: £3.00            │
│  Total: £35.50              │
├─────────────────────────────┤
│  Special Instructions:      │
│  "Extra cheese please"      │
├─────────────────────────────┤
│  Timeline:                  │
│  • Order placed: 14:30      │
│  • Accepted: 14:32          │
│  • Preparing...             │
│                             │
│  [Update Status]            │
└─────────────────────────────┘
```

---

### 6. Financial Management

#### 6.1 Earnings Dashboard (`chef/earnings/index.tsx`)

**Purpose**: View earnings and financial overview

**Layout**:
```
┌─────────────────────────────┐
│  Earnings                   │
│  [Export]                   │
├─────────────────────────────┤
│  Available Balance          │
│  £245.50                    │
│  [Request Payout]           │
├─────────────────────────────┤
│  Pending: £50.00            │
│  This Month: £1,234.56      │
│  All Time: £12,345.67       │
├─────────────────────────────┤
│  [Chart: Earnings Over Time]│
│                             │
├─────────────────────────────┤
│  Recent Transactions        │
│  +£24.50  Order #1234       │
│  Today 14:30                │
│  ───────────────────────    │
│  +£18.00  Order #1233       │
│  Today 13:15                │
│  ───────────────────────    │
│  -£200.00  Payout           │
│  Yesterday                  │
│                             │
│  [View All Transactions]    │
└─────────────────────────────┘
```

**Data Fetching**:
```typescript
const earnings = useQuery(
  api.queries.chefEarnings.getSummary,
  { chefId, period: "month" }
);
const transactions = useQuery(
  api.queries.chefEarnings.getTransactions,
  { chefId, limit: 10 }
);
```

#### 6.2 Request Payout (`chef/earnings/payouts/request.tsx`)

**Purpose**: Request payout to bank account

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Request Payout   │
├─────────────────────────────┤
│  Available: £245.50         │
│                             │
│  Select Bank Account:       │
│  ┌─────────────────────┐   │
│  │ ● Primary Account   │   │
│  │   ****1234          │   │
│  │   Barclays          │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ ○ Secondary Account │   │
│  │   ****5678          │   │
│  │   HSBC              │   │
│  └─────────────────────┘   │
│  [Add New Account]         │
├─────────────────────────────┤
│  Amount:                    │
│  [£245.50]                  │
│  [All Available]            │
│                             │
│  Min: £10.00                │
│  Processing: 1-3 days       │
├─────────────────────────────┤
│  [Request Payout]           │
└─────────────────────────────┘
```

**Actions**:
```typescript
const requestPayout = useMutation(api.mutations.chefPayouts.request);
```

#### 6.3 Add Bank Account (`chef/earnings/bank-accounts/add.tsx`)

**Purpose**: Add new UK bank account

**Layout**:
```
┌─────────────────────────────┐
│  ← Back    Add Bank Account │
├─────────────────────────────┤
│  Account Holder Name:       │
│  [Maria Rodriguez]          │
│                             │
│  Account Number:            │
│  [12345678]                 │
│                             │
│  Sort Code:                 │
│  [12-34-56]                 │
│                             │
│  Bank Name:                 │
│  [Barclays ▼]               │
│                             │
│  Account Type:              │
│  ○ Checking                 │
│  ○ Savings                  │
│                             │
│  Set as Primary:            │
│  [Toggle]                   │
│                             │
│  [Add Account]              │
│                             │
│  Note: Account verification │
│  required before payouts    │
└─────────────────────────────┘
```

**Actions**:
```typescript
const addBankAccount = useMutation(api.mutations.chefBankAccounts.add);
const verifyBankAccount = useMutation(api.mutations.chefBankAccounts.verify);
```

---

### 7. Live Streaming

#### 7.1 Live Dashboard (`chef/live/index.tsx`)

**Purpose**: Manage live streaming sessions

**Layout**:
```
┌─────────────────────────────┐
│  Live Streaming             │
│  [History]                  │
├─────────────────────────────┤
│  [Go Live Button]           │
│  ┌─────────────────────┐   │
│  │   🎥                │   │
│  │  Start Live Stream  │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  Upcoming Streams           │
│  (None scheduled)           │
│  [Schedule Stream]          │
├─────────────────────────────┤
│  Recent Streams             │
│  Italian Cooking Class      │
│  2 hours ago • 45 viewers   │
│  [View Details]             │
│  ───────────────────────    │
│  Pizza Making Tutorial      │
│  Yesterday • 120 viewers    │
│  [View Details]             │
└─────────────────────────────┘
```

#### 7.2 Active Stream (`chef/live/[sessionId].tsx`)

**Purpose**: Manage active live stream

**Layout**:
```
┌─────────────────────────────┐
│  [Live Indicator]           │
│  Viewers: 25                │
│  [End Stream]               │
├─────────────────────────────┤
│  [Video Preview Area]       │
│                             │
├─────────────────────────────┤
│  Live Orders                │
│  ┌─────────────────────┐   │
│  │ Order #1235         │   │
│  │ John Doe • £24.50   │   │
│  │ [Accept] [Reject]   │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ Order #1236         │   │
│  │ Jane Smith • £18.00 │   │
│  │ [Accept] [Reject]   │   │
│  └─────────────────────┘   │
├─────────────────────────────┤
│  Chat                       │
│  [View Chat]                │
└─────────────────────────────┘
```

**Real-time Data**:
```typescript
// Use Convex reactive queries for real-time updates
const session = useQuery(api.queries.liveSessions.getById, { sessionId });
const liveOrders = useQuery(api.queries.liveOrders.getBySession, { sessionId });
const viewerCount = useQuery(api.queries.liveSessions.getViewerCount, { sessionId });
```

---

## Component Library

### New Components Needed

#### 1. `ChefStatusToggle`
- Online/Offline toggle button
- Visual indicator
- Haptic feedback

#### 2. `OnboardingProgressCard`
- Progress bar
- Checklist items
- Next steps CTA

#### 3. `CourseModuleCard`
- Module title
- Progress indicator
- Completion status
- Quiz score

#### 4. `DocumentUploadCard`
- Document type
- Upload status
- Action buttons
- Preview

#### 5. `EarningsSummaryCard`
- Available balance
- Pending payouts
- Quick stats
- Payout CTA

#### 6. `OrderStatusBadge`
- Status indicator
- Color coding
- Status text

#### 7. `ContentLibraryFilter`
- Type filter (recipes/stories/videos)
- Status filter (draft/published)
- Search input

#### 8. `RecipeEditor`
- Form fields
- Ingredient list
- Instruction steps
- Image upload
- Rich text editor

#### 9. `BankAccountCard`
- Account details (masked)
- Verification status
- Primary indicator
- Action buttons

#### 10. `PayoutRequestForm`
- Amount input
- Bank account selector
- Validation
- Submit button

### Reusable Existing Components

- `Button` - For all CTAs
- `Input` - For form fields
- `Card` - For content cards
- `Modal` - For modals and sheets
- `Avatar` - For profile images
- `Badge` - For status indicators
- `SkeletonLoader` - For loading states
- `EmptyState` - For empty lists
- `Toast` - For notifications
- `QueryStateWrapper` - For query states

---

## Hooks Pattern

### Custom Hooks for Chef Features

#### 1. `useChefOnboarding`
```typescript
export const useChefOnboarding = () => {
  const { chefId } = useChefContext();
  
  const courseProgress = useQuery(
    api.queries.chefCourses.getProgress,
    { chefId, courseId: "compliance-course-v1" }
  );
  
  const documents = useQuery(
    api.queries.chefDocuments.getByChef,
    { chefId }
  );
  
  const completeModule = useMutation(api.mutations.chefCourses.completeModule);
  const uploadDocument = useMutation(api.mutations.chefDocuments.upload);
  
  return {
    courseProgress,
    documents,
    completeModule,
    uploadDocument,
    // ... other methods
  };
};
```

#### 2. `useChefOrders`
```typescript
export const useChefOrders = () => {
  const { chefId } = useChefContext();
  
  const orders = useQuery(
    api.queries.orders.getByChef,
    { chefId, status: "active" }
  );
  
  const acceptOrder = useMutation(api.mutations.orders.accept);
  const rejectOrder = useMutation(api.mutations.orders.reject);
  const updateStatus = useMutation(api.mutations.orders.updateStatus);
  
  return {
    orders,
    acceptOrder,
    rejectOrder,
    updateStatus,
  };
};
```

#### 3. `useChefEarnings`
```typescript
export const useChefEarnings = () => {
  const { chefId } = useChefContext();
  
  const earnings = useQuery(
    api.queries.chefEarnings.getSummary,
    { chefId }
  );
  
  const requestPayout = useMutation(api.mutations.chefPayouts.request);
  const bankAccounts = useQuery(
    api.queries.chefBankAccounts.getByChef,
    { chefId }
  );
  
  return {
    earnings,
    requestPayout,
    bankAccounts,
  };
};
```

#### 4. `useChefContent`
```typescript
export const useChefContent = () => {
  const { chefId } = useChefContext();
  
  const recipes = useQuery(api.queries.chefRecipes.getByChef, { chefId });
  const stories = useQuery(api.queries.chefStories.getByChef, { chefId });
  
  const createRecipe = useMutation(api.mutations.chefRecipes.create);
  const createStory = useMutation(api.mutations.chefStories.create);
  
  return {
    recipes,
    stories,
    createRecipe,
    createStory,
  };
};
```

---

## Convex Integration Pattern

### Direct Convex Usage (No REST APIs)

All data operations use Convex directly:

#### Queries (Reactive)
```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const chef = useQuery(api.queries.chefs.getByUserId, { userId });
```

#### Mutations
```typescript
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

const updateProfile = useMutation(api.mutations.chefs.updateProfile);

await updateProfile({
  chefId,
  name: "New Name",
  // ...
});
```

#### Actions (For Complex Operations)
```typescript
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';

const convex = getConvexClient();
const sessionToken = await getSessionToken();

const result = await convex.action(
  api.actions.chefs.requestPayout,
  {
    sessionToken,
    amount: 10000, // in pence
    bankAccountId: "...",
  }
);
```

---

## State Management

### Context for Chef Data

```typescript
// contexts/ChefContext.tsx
export const ChefContext = createContext<{
  chefId: string | null;
  chef: Chef | null;
  isLoading: boolean;
}>({
  chefId: null,
  chef: null,
  isLoading: true,
});

export const useChefContext = () => {
  const context = useContext(ChefContext);
  if (!context) {
    throw new Error('useChefContext must be used within ChefProvider');
  }
  return context;
};
```

### Local State

- Use `useState` for form inputs
- Use `useReducer` for complex form state
- Use Convex queries for server state (reactive)
- Use Convex mutations for updates

---

## Error Handling

### Pattern
```typescript
try {
  const result = await mutation({ ... });
  showToast({ type: 'success', message: 'Success!' });
} catch (error: any) {
  const errorMessage = error?.message || 'An error occurred';
  showToast({ type: 'error', message: errorMessage });
}
```

### Network Error Handling
```typescript
import { isNetworkError, handleConvexError } from '@/utils/networkErrorHandler';

try {
  // ... operation
} catch (error) {
  if (isNetworkError(error)) {
    handleConvexError(error);
    return;
  }
  // ... other error handling
}
```

---

## Loading States

### Skeleton Loaders
- Use existing `SkeletonBox` component
- Show skeletons while `useQuery` returns `undefined`
- Replace with content when data loads

### Query State Wrapper
```typescript
<QueryStateWrapper
  query={chef}
  loading={<ChefSkeleton />}
  error={<ErrorState />}
  empty={<EmptyState />}
>
  <ChefContent chef={chef} />
</QueryStateWrapper>
```

---

## Navigation Patterns

### Stack Navigation
- Use Expo Router stack navigation
- Modal presentations for forms
- Slide animations for detail screens

### Deep Linking
- Support deep links to specific screens
- Handle navigation from notifications
- Support universal links

### Tab Navigation
- Add Chef tab to main tab bar
- Show badge for notifications
- Handle tab switching

---

## Accessibility

### Requirements
- Screen reader support
- High contrast mode
- Text scaling
- Touch target sizes (min 44x44)
- Semantic labels
- Focus management

### Implementation
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Accept order"
  accessibilityRole="button"
  accessibilityHint="Accepts the order and starts preparation"
>
  <Text>Accept</Text>
</TouchableOpacity>
```

---

## Performance Optimization

### Strategies
1. **Lazy Loading**: Load screens on demand
2. **Image Optimization**: Use optimized image formats
3. **Query Optimization**: Use pagination for lists
4. **Memoization**: Memoize expensive computations
5. **Virtual Lists**: Use `FlatList` for long lists
6. **Code Splitting**: Split chef features into separate bundles

### Implementation
```typescript
// Lazy load heavy components
const RecipeEditor = lazy(() => import('./RecipeEditor'));

// Memoize expensive components
const OrderCard = memo(({ order }) => {
  // ...
});

// Use FlatList for long lists
<FlatList
  data={orders}
  renderItem={({ item }) => <OrderCard order={item} />}
  keyExtractor={(item) => item._id}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
/>
```

---

## Testing Strategy

### Unit Tests
- Test hooks in isolation
- Test utility functions
- Test component logic

### Integration Tests
- Test screen flows
- Test Convex integration
- Test navigation

### E2E Tests
- Test critical user journeys
- Test onboarding flow
- Test order management

---

## Implementation Checklist

### Phase 1: Core Onboarding
- [ ] Chef dashboard screen
- [ ] Onboarding overview screen
- [ ] Course module list
- [ ] Module detail screen
- [ ] Document upload screen
- [ ] Convex queries/mutations for courses
- [ ] Convex queries/mutations for documents

### Phase 2: Profile Management
- [ ] Chef profile screen
- [ ] Kitchen profile screen
- [ ] Availability settings screen
- [ ] Online/offline toggle
- [ ] Convex mutations for profile updates

### Phase 3: Content Creation
- [ ] Content library screen
- [ ] Recipe editor
- [ ] Story editor
- [ ] Content detail screens
- [ ] Convex mutations for content

### Phase 4: Order Management
- [ ] Order dashboard
- [ ] Order detail screen
- [ ] Real-time order updates
- [ ] Order status management
- [ ] Convex queries for orders

### Phase 5: Financial Management
- [ ] Earnings dashboard
- [ ] Payout request screen
- [ ] Bank account management
- [ ] Tax records screen
- [ ] Convex mutations for payouts

### Phase 6: Live Streaming
- [ ] Live dashboard
- [ ] Active stream screen
- [ ] Live order integration
- [ ] Convex queries for live sessions

---

## Success Metrics

### User Experience
- Screen load time < 1 second
- Smooth animations (60fps)
- Zero crashes
- High user satisfaction (4.5+)

### Feature Adoption
- 80%+ onboarding completion
- 70%+ profile completion
- 5+ content items per chef
- 2+ payouts per chef per month

---

## Future Enhancements

### Potential Additions
- Push notifications for orders
- Offline mode support
- Advanced analytics dashboard
- Social sharing features
- Multi-language support
- Dark mode optimization

---

## Conclusion

This UI/UX plan provides a comprehensive guide for implementing the chef platform in the mobile app using Convex directly. All screens, components, and data patterns follow existing app conventions while adding chef-specific functionality.

