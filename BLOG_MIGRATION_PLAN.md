# Blog Database Migration & Staff Editor Plan

## Overview
Migrate the hardcoded blog from `/apps/web/lib/byus/posts.ts` to a Convex database-backed system with a rich text editor for staff to create and manage blog posts.

## Current State Analysis

### Existing Infrastructure
1. **Database Schema**: 
   - `blogPosts` table exists in Convex schema (lines 2556-2579)
   - `content` table also exists with `type: "blog"` support
   - Current mutations use `content` table, not `blogPosts` table

2. **Admin Interface**: 
   - `/apps/web/app/admin/content/blog/page.tsx` - Basic blog management (textareas, no rich editor)
   - Uses `content` table via `api.queries.content.getBlogPosts`

3. **Public Blog Page**: 
   - `/apps/web/app/by-us/page.tsx` - Reads from hardcoded `/apps/web/lib/byus/posts.ts`
   - Contains 20+ posts with rich structure (sections, images, videos, callouts, etc.)

4. **Convex File Storage**: 
   - Already configured and working
   - Examples: `/apps/web/app/api/upload-avatar/route.ts`, `/apps/web/app/api/images/chef/profile/route.ts`
   - Uses `api.mutations.documents.generateUploadUrl`

### Hardcoded Blog Structure
The current posts have:
- Title, slug, coverImage, date, author (name + avatar)
- Categories array
- Description (excerpt)
- Body (array of paragraphs)
- Optional headings array
- Optional sections with:
  - Paragraphs, bullets, checklists, proTips
  - Callouts (note/warning/tip)
  - Images with alt text
  - Videos with thumbnails

## Migration Plan

### Phase 1: Database Schema Alignment
**Goal**: Standardize on one table structure

**Decision**: Use `blogPosts` table (already in schema) instead of `content` table
- More specific to blog needs
- Better indexing for blog-specific queries
- Cleaner separation of concerns

**Tasks**:
1. Update schema to support rich content structure:
   - Add `body` field (array of strings for paragraphs)
   - Add `sections` field (array of content sections)
   - Add `headings` field (array of heading objects)
   - Add `coverImage` field (separate from `featuredImage`)
   - Add `author` object (name + avatar) instead of just string
   - Add `categories` array
   - Add `date` field (string format like "August 2025")
   - Support for video content

2. Create migration mutations to:
   - Migrate existing `content` table blog posts to `blogPosts` table
   - Handle data transformation

### Phase 2: Rich Text Editor Implementation
**Goal**: Provide staff with a powerful, user-friendly editor

**Editor Choice**: **TipTap** (recommended)
- Modern, extensible, React-friendly
- Great image handling
- Supports custom extensions (callouts, sections, etc.)
- Good mobile support
- Active community

**Alternative**: Lexical (Meta's editor, more complex but very powerful)

**Tasks**:
1. Install TipTap dependencies:
   ```bash
   bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-underline
   ```

2. Create rich text editor component:
   - Location: `/apps/web/components/admin/blog-editor.tsx`
   - Features:
     - Bold, italic, underline
     - Headings (H1-H6)
     - Lists (ordered, unordered)
     - Links
     - Image insertion with Convex upload
     - Video embedding
     - Custom blocks:
       - Callouts (note/warning/tip)
       - Sections with titles
       - Bullet lists
       - Checklists
       - Pro tips
     - Live preview
     - Auto-save drafts

3. Create image upload handler:
   - Component: `/apps/web/components/admin/blog-image-upload.tsx`
   - Uses Convex `generateUploadUrl` mutation
   - Handles image optimization
   - Returns Convex storage URL

4. Create blog post form component:
   - Location: `/apps/web/components/admin/blog-post-form.tsx`
   - Fields:
     - Title
     - Slug (auto-generated, editable)
     - Cover image (upload)
     - Categories (multi-select)
     - Excerpt/Description
     - Rich content editor
     - SEO fields (title, description)
     - Status (draft/published/archived)
     - Publish date

### Phase 3: Staff Portal Integration
**Goal**: Allow staff to create/edit blog posts from staff portal

**Tasks**:
1. Create staff blog management page:
   - Location: `/apps/web/app/staff/blog/page.tsx`
   - List view of all posts (with filters)
   - Create new post button
   - Edit existing posts

2. Create staff blog editor page:
   - Location: `/apps/web/app/staff/blog/[id]/page.tsx` (edit)
   - Location: `/apps/web/app/staff/blog/new/page.tsx` (create)
   - Uses the rich text editor component
   - Auto-saves drafts
   - Preview functionality

3. Add navigation link:
   - Update `/apps/web/components/admin/glass-sidebar.tsx` or staff navigation
   - Add "Blog" link to staff menu

4. Update Convex mutations:
   - Create/update mutations for `blogPosts` table
   - Support rich content structure
   - Handle image/video storage references

### Phase 4: Data Migration
**Goal**: Migrate hardcoded posts to database

**Tasks**:
1. Create migration script:
   - Location: `/apps/web/scripts/migrate-blog-posts.ts`
   - Reads from `/apps/web/lib/byus/posts.ts`
   - Transforms to `blogPosts` schema
   - Uploads images to Convex storage
   - Creates blog posts via Convex mutations

2. Handle image migration:
   - Images currently in `/apps/web/public/blog/` and `/apps/web/public/backgrounds/`
   - Upload to Convex storage
   - Update references in blog posts

3. Run migration:
   - Test on dev environment first
   - Verify all posts migrated correctly
   - Check image references work

### Phase 5: Public Blog Page Update
**Goal**: Update public blog to read from database

**Tasks**:
1. Create Convex query:
   - Location: `/packages/convex/queries/content.ts` or new `queries/blog.ts`
   - Query `blogPosts` table
   - Filter by status: 'published'
   - Support filtering by category
   - Support search

2. Update public blog page:
   - Location: `/apps/web/app/by-us/page.tsx`
   - Replace hardcoded `POSTS` import with Convex query
   - Transform database format to display format
   - Maintain existing UI/UX

3. Create individual blog post page:
   - Location: `/apps/web/app/by-us/[slug]/page.tsx`
   - Display full blog post with all sections
   - Render rich content (images, videos, callouts, etc.)

### Phase 6: Testing & Refinement
**Goal**: Ensure everything works smoothly

**Tasks**:
1. Test editor functionality:
   - Create new post
   - Edit existing post
   - Image uploads
   - Video embeds
   - All formatting options

2. Test public display:
   - Blog listing page
   - Individual post pages
   - Image loading
   - Video playback
   - All content types render correctly

3. Test migration:
   - Verify all posts migrated
   - Check image references
   - Ensure no broken links

4. Performance optimization:
   - Image lazy loading
   - Content caching
   - Query optimization

## Technical Implementation Details

### Database Schema Updates

```typescript
// packages/convex/schema.ts
blogPosts: defineTable({
  title: v.string(),
  slug: v.string(),
  content: v.string(), // Rich HTML/JSON from editor
  excerpt: v.string(),
  body: v.optional(v.array(v.string())), // Paragraphs array
  sections: v.optional(v.array(v.object({
    id: v.string(),
    title: v.string(),
    paragraphs: v.optional(v.array(v.string())),
    bullets: v.optional(v.array(v.string())),
    checklist: v.optional(v.array(v.string())),
    proTips: v.optional(v.array(v.string())),
    callout: v.optional(v.object({
      variant: v.union(v.literal("note"), v.literal("warning"), v.literal("tip")),
      text: v.string()
    })),
    image: v.optional(v.string()),
    imageAlt: v.optional(v.string()),
    video: v.optional(v.string()),
    videoThumbnail: v.optional(v.string())
  }))),
  headings: v.optional(v.array(v.object({
    id: v.string(),
    text: v.string()
  }))),
  author: v.object({
    name: v.string(),
    avatar: v.string()
  }),
  categories: v.array(v.string()),
  date: v.string(), // Format: "August 2025"
  coverImage: v.optional(v.string()), // Convex storage URL
  featuredImage: v.optional(v.string()), // Convex storage URL
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
  tags: v.array(v.string()),
  seoTitle: v.optional(v.string()),
  seoDescription: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### Editor Component Structure

```typescript
// components/admin/blog-editor.tsx
- TipTap Editor instance
- Toolbar with formatting buttons
- Image upload button (opens modal)
- Video embed button
- Custom block buttons (callout, section, etc.)
- Live preview toggle
- Auto-save indicator
```

### Image Upload Flow

1. User clicks image button in editor
2. File picker opens
3. File selected → upload to Convex
4. Get storage URL
5. Insert image into editor at cursor
6. Image displays in editor

### Migration Script Flow

1. Read `POSTS` array from `posts.ts`
2. For each post:
   - Transform structure to match schema
   - Upload images to Convex
   - Update image references
   - Create blog post via mutation
3. Log progress and errors
4. Generate migration report

## File Structure

```
apps/web/
├── app/
│   ├── admin/content/blog/page.tsx (existing, update)
│   ├── staff/
│   │   ├── blog/
│   │   │   ├── page.tsx (new - list view)
│   │   │   ├── new/page.tsx (new - create)
│   │   │   └── [id]/page.tsx (new - edit)
│   ├── by-us/
│   │   ├── page.tsx (update - use Convex)
│   │   └── [slug]/page.tsx (new - individual post)
├── components/
│   ├── admin/
│   │   ├── blog-editor.tsx (new)
│   │   ├── blog-image-upload.tsx (new)
│   │   └── blog-post-form.tsx (new)
├── lib/
│   └── byus/
│       └── posts.ts (keep for reference, mark as deprecated)
└── scripts/
    └── migrate-blog-posts.ts (new)

packages/convex/
├── mutations/
│   ├── content.ts (update or create blog.ts)
│   └── blog.ts (new - blog-specific mutations)
├── queries/
│   ├── content.ts (update or create blog.ts)
│   └── blog.ts (new - blog-specific queries)
└── schema.ts (update blogPosts table)
```

## Dependencies to Add

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-underline": "^2.x"
}
```

## Success Criteria

1. ✅ Staff can create new blog posts with rich formatting
2. ✅ Staff can upload images that are stored in Convex
3. ✅ Staff can edit existing blog posts
4. ✅ All hardcoded posts migrated to database
5. ✅ Public blog page displays posts from database
6. ✅ Individual blog post pages work correctly
7. ✅ All images load correctly
8. ✅ All content types (callouts, sections, videos) render properly
9. ✅ SEO fields work correctly
10. ✅ Draft/published status works correctly

## Timeline Estimate

- Phase 1: 2-3 hours (schema updates)
- Phase 2: 8-10 hours (editor implementation)
- Phase 3: 4-5 hours (staff portal integration)
- Phase 4: 3-4 hours (data migration)
- Phase 5: 3-4 hours (public page updates)
- Phase 6: 4-5 hours (testing & refinement)

**Total**: ~24-31 hours

## Risks & Mitigations

1. **Risk**: TipTap learning curve
   - **Mitigation**: Use starter kit, follow documentation closely

2. **Risk**: Image migration complexity
   - **Mitigation**: Test image upload flow thoroughly before migration

3. **Risk**: Data loss during migration
   - **Mitigation**: Keep original `posts.ts` file, test on dev first

4. **Risk**: Performance with many posts
   - **Mitigation**: Implement pagination, optimize queries

5. **Risk**: Editor compatibility issues
   - **Mitigation**: Test on multiple browsers/devices

## Next Steps

1. Review and approve this plan
2. Set up development branch
3. Begin Phase 1 (schema updates)
4. Iterate through phases sequentially
5. Test thoroughly before production deployment

