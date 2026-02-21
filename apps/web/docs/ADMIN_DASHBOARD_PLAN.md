# Admin Dashboard - Content Management Plan

## Overview
This document outlines the plan for creating a comprehensive admin dashboard to manage all content types on the CribNosh platform.

## Current State

### Existing Admin Pages
- ✅ **Dashboard** (`/admin`) - Overview and metrics
- ✅ **Users** (`/admin/users`) - User management
- ✅ **Content** (`/admin/content`) - Basic content management
  - ✅ Blog Posts (`/admin/content/blog`)
  - ✅ Recipes (`/admin/content/recipes`)
  - ✅ Static Pages (`/admin/content/pages`)
- ✅ **Food Creators** (`/admin/food-creators`) - Food Creator/kitchen management
- ❌ **Videos (Nosh Heaven)** - Video posts management
- ❌ **Stories** - Story content management
- ❌ **Meals/Dishes** - Meal management
- ❌ **Live Sessions** - Live streaming sessions
- ❌ **Comments** - Video comments and engagement
- ❌ **Reviews** - User reviews management

## Content Types to Manage

### 1. Videos (Nosh Heaven) - `videoPosts`
**Table**: `videoPosts`
**Location**: `/admin/content/videos`

**Fields to Manage**:
- Creator/Kitchen association
- Live session association

### 2. Stories - `stories`
**Table**: `stories` (if exists) or part of `content` table
**Location**: `/admin/content/stories`

**Fields to Manage**:
- Title, Content
- Author
- Featured image

### 3. Meals/Dishes - `meals`
**Table**: `meals`
**Location**: `/admin/content/meals`

**Fields to Manage**:
- Name, Description
- Food Creator/Kitchen association
- Featured status
- Reviews and ratings

### 4. Live Sessions - `liveSessions`
**Table**: `liveSessions`
**Location**: `/admin/content/live-sessions`

**Fields to Manage**:
- Session ID
- Food Creator/Kitchen
- Status (scheduled, live, ended)

### 6. Reviews - `reviews`
**Table**: `reviews`
**Location**: `/admin/content/reviews`

**Fields to Manage**:
- Review text
- Reviewer
- Associated meal/food creator
- Response from food creator
- Timestamp

**Features Needed**:
- List all reviews with filters
- Approve/Reject reviews
- View review details
- Respond to reviews (as admin)
- View review analytics
- Bulk approval/rejection

**Convex Functions**:
- `queries.reviews.getAll`
- `queries.reviews.getByFood Creator`
- `queries.reviews.getByMealId`
- `mutations.reviews.updateReview`
- `mutations.reviews.deleteReview`

---

## Implementation Plan

### Phase 1: Core Infrastructure
1. **Create shared components**:
   - `ContentList` - Reusable list component with filters, search, pagination
   - `ContentEditor` - Reusable editor for creating/editing content
   - `ContentFilters` - Reusable filter component
   - `StatusBadge` - Status indicator component
   - `ImageUpload` - Image upload component with preview
   - `VideoUpload` - Video upload component with progress

2. **Update sidebar navigation**:
   - Add new content management items to Content section
   - Add badges for pending/flagged content counts

### Phase 2: Video Management (Priority 1)
1. Create `/admin/content/videos/page.tsx`
2. Implement video list with filters
3. Implement video upload (using Convex storage)
4. Implement video editing
5. Implement moderation features
6. Add to sidebar navigation

### Phase 3: Meals Management (Priority 2)
1. Create `/admin/content/meals/page.tsx`
2. Implement meal list with filters
3. Implement meal creation/editing
4. Implement image upload (multiple images)
5. Implement pricing management
6. Add to sidebar navigation

### Phase 4: Stories Management (Priority 3)
1. Create `/admin/content/stories/page.tsx`
2. Implement story list
3. Implement story editor
4. Add to sidebar navigation

### Phase 5: Live Sessions Management (Priority 4)
1. Create `/admin/content/live-sessions/page.tsx`
2. Implement live session list
3. Implement session monitoring
4. Implement moderation tools
5. Add to sidebar navigation

### Phase 6: Comments & Reviews Management (Priority 5)
1. Create `/admin/content/comments/page.tsx`
2. Create `/admin/content/reviews/page.tsx`
3. Implement moderation interfaces
4. Add to sidebar navigation

## File Structure

```
apps/web/
├── app/
│   └── admin/
│       └── content/
│           ├── page.tsx (existing - general content)
│           ├── blog/
│           │   └── page.tsx (existing)
│           ├── recipes/
│           │   └── page.tsx (existing)
│           ├── pages/
│           │   └── page.tsx (existing)
│           ├── videos/
│           │   └── page.tsx (NEW)
│           ├── meals/
│           │   └── page.tsx (NEW)
│           ├── stories/
│           │   └── page.tsx (NEW)
│           ├── live-sessions/
│           │   └── page.tsx (NEW)
│           ├── comments/
│           │   └── page.tsx (NEW)
│           └── reviews/
│               └── page.tsx (NEW)
└── components/
    └── admin/
        ├── content/
        │   ├── ContentList.tsx (NEW - shared)
        │   ├── ContentEditor.tsx (NEW - shared)
        │   ├── ContentFilters.tsx (NEW - shared)
        │   ├── VideoUpload.tsx (NEW)
        │   ├── ImageUpload.tsx (NEW)
        │   └── StatusBadge.tsx (NEW)
        └── ... (existing components)
```

## Design Guidelines

### Consistent UI Patterns
- Use glass-morphism design (matching existing admin pages)
- Consistent color scheme: Primary `#F23E2E` (CribNosh red)
- Use shadcn/ui components
- Responsive design (mobile-first)
- Loading states and skeletons
- Error handling with toast notifications

### Common Features Across All Pages
1. **Search & Filters**:
   - Search by title/name
   - Filter by status
   - Filter by date range
   - Filter by creator/author
   - Filter by category/cuisine

2. **List View**:
   - Table or card layout
   - Sortable columns
   - Pagination
   - Bulk selection
   - Quick actions (edit, delete, publish)

3. **Detail/Edit View**:
   - Form with validation
   - Image/video preview
   - Save draft functionality
   - Publish button
   - Delete confirmation

4. **Analytics**:
   - View counts
   - Engagement metrics
   - Performance charts

## Next Steps

1. ✅ Create this plan document
2. ⏳ Review and approve plan
3. ⏳ Create shared components
4. ⏳ Implement Videos page (Priority 1)
5. ⏳ Implement Meals page (Priority 2)
6. ⏳ Implement remaining pages
7. ⏳ Update sidebar navigation
8. ⏳ Testing and refinement

## Notes

- All pages should use the existing admin authentication system
- Use Convex queries/mutations for data operations
- Follow existing code patterns and conventions
- Ensure proper error handling and loading states
- Add proper TypeScript types
- Include accessibility features

