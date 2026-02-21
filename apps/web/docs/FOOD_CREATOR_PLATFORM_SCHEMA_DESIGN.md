# Food Creator Platform - Database Schema Design

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft
- **Database**: Convex

## Overview

This document defines the database schema extensions needed for the food creator platform, including tables for courses, documents, recipes, stories, payouts, and tax records.

## Schema Extensions

### 1. chefCourses

Tracks course enrollment, progress, and completion for chefs.

```typescript
chefCourses: defineTable({
  chefId: v.id("chefs"),
  courseId: v.string(), // e.g., "compliance-course-v1"
  courseName: v.string(), // e.g., "Home Cooking Compliance Course"
  enrollmentDate: v.number(),
  completionDate: v.optional(v.number()),
  status: v.union(
    v.literal("enrolled"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("expired")
  ),
  progress: v.array(v.object({
    moduleId: v.string(), // e.g., "module-1-food-safety"
    moduleName: v.string(),
    moduleNumber: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    quizScore: v.optional(v.number()), // 0-100
    quizAttempts: v.number(),
    lastAccessed: v.number(),
    timeSpent: v.number(), // in seconds
    quizAnswers: v.optional(v.array(v.object({
      questionId: v.string(),
      answer: v.any(),
      isCorrect: v.boolean(),
      attemptNumber: v.number(),
      answeredAt: v.number()
    })))
  })),
  certificateId: v.optional(v.id("certificates")),
  totalTimeSpent: v.number(), // in seconds
  lastAccessed: v.number(),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_course", ["courseId"])
  .index("by_status", ["status"])
  .index("by_food creator_course", ["chefId", "courseId"])
```

**Indexes**:
- `by_food creator`: Get all courses for a food creator
- `by_course`: Get all enrollments for a course
- `by_status`: Filter by completion status
- `by_food creator_course`: Get specific course enrollment

---

### 2. certificates

Stores completion certificates for courses.

```typescript
certificates: defineTable({
  chefId: v.id("chefs"),
  courseId: v.string(),
  courseName: v.string(),
  certificateNumber: v.string(), // Unique certificate ID
  issuedAt: v.number(),
  chefName: v.string(),
  documentStorageId: v.optional(v.id("_storage")), // PDF certificate
  documentUrl: v.optional(v.string()),
  expiresAt: v.optional(v.number()), // If certificates expire
  status: v.union(
    v.literal("active"),
    v.literal("expired"),
    v.literal("revoked")
  ),
  createdAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_course", ["courseId"])
  .index("by_certificate_number", ["certificateNumber"])
```

**Indexes**:
- `by_food creator`: Get all certificates for a food creator
- `by_course`: Get all certificates for a course
- `by_certificate_number`: Verify certificate by number

---

### 3. chefDocuments

Stores uploaded documents with verification status.

```typescript
chefDocuments: defineTable({
  chefId: v.id("chefs"),
  documentType: v.union(
    v.literal("id"),
    v.literal("health_permit"),
    v.literal("insurance"),
    v.literal("tax"),
    v.literal("kitchen_cert"),
    v.literal("other")
  ),
  documentName: v.string(), // User-friendly name
  fileName: v.string(), // Original filename
  fileStorageId: v.id("_storage"),
  fileUrl: v.string(),
  fileSize: v.number(), // in bytes
  mimeType: v.string(), // e.g., "application/pdf", "image/jpeg"
  uploadedAt: v.number(),
  verifiedAt: v.optional(v.number()),
  verifiedBy: v.optional(v.id("users")), // Admin user who verified
  status: v.union(
    v.literal("pending"), // Uploaded, awaiting verification
    v.literal("verified"),
    v.literal("rejected"),
    v.literal("expired")
  ),
  rejectionReason: v.optional(v.string()),
  rejectionDetails: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  isRequired: v.boolean(), // Required for receiving orders
  metadata: v.optional(v.object({
    documentNumber: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    expiryDate: v.optional(v.number()),
    issuingAuthority: v.optional(v.string()),
    additionalInfo: v.optional(v.any())
  })),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_type", ["documentType"])
  .index("by_status", ["status"])
  .index("by_food creator_type", ["chefId", "documentType"])
  .index("by_verification", ["status", "verifiedAt"])
```

**Indexes**:
- `by_food creator`: Get all documents for a food creator
- `by_type`: Filter by document type
- `by_status`: Filter by verification status
- `by_food creator_type`: Get specific document type for food creator
- `by_verification`: Get documents pending verification

---

### 4. chefRecipes

Recipe management with ingredients, instructions, and images.

```typescript
chefRecipes: defineTable({
  chefId: v.id("chefs"),
  title: v.string(),
  description: v.optional(v.string()),
  cuisine: v.string(),
  difficulty: v.union(
    v.literal("beginner"),
    v.literal("intermediate"),
    v.literal("advanced")
  ),
  prepTime: v.number(), // in minutes
  cookTime: v.number(), // in minutes
  totalTime: v.number(), // prepTime + cookTime
  servings: v.number(),
  ingredients: v.array(v.object({
    name: v.string(),
    quantity: v.number(),
    unit: v.string(), // e.g., "g", "ml", "cups", "tbsp"
    notes: v.optional(v.string()), // e.g., "chopped", "optional"
    order: v.number() // Display order
  })),
  instructions: v.array(v.object({
    step: v.number(),
    instruction: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    timeEstimate: v.optional(v.number()) // in minutes
  })),
  images: v.array(v.object({
    storageId: v.id("_storage"),
    url: v.string(),
    isPrimary: v.boolean(),
    order: v.number()
  })),
  tags: v.array(v.string()),
  nutritionalInfo: v.optional(v.object({
    calories: v.optional(v.number()),
    protein: v.optional(v.number()), // in grams
    carbs: v.optional(v.number()), // in grams
    fat: v.optional(v.number()), // in grams
    fiber: v.optional(v.number()), // in grams
    sugar: v.optional(v.number()), // in grams
    sodium: v.optional(v.number()) // in mg
  })),
  linkedMealId: v.optional(v.id("meals")),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
  publishedAt: v.optional(v.number()),
  views: v.number(),
  saves: v.number(), // How many users saved this recipe
  shares: v.number(),
  likes: v.number(),
  comments: v.number(),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_status", ["status"])
  .index("by_cuisine", ["cuisine"])
  .index("by_food creator_status", ["chefId", "status"])
  .index("by_published", ["publishedAt"])
  .index("by_views", ["views"])
  .index("by_meal", ["linkedMealId"])
```

**Indexes**:
- `by_food creator`: Get all recipes for a food creator
- `by_status`: Filter by publication status
- `by_cuisine`: Filter by cuisine type
- `by_food creator_status`: Get recipes by food creator and status
- `by_published`: Get published recipes sorted by date
- `by_views`: Get popular recipes
- `by_meal`: Get recipe linked to a meal

---

### 5. chefStories

Story/blog posts by chefs.

```typescript
chefStories: defineTable({
  chefId: v.id("chefs"),
  title: v.string(),
  content: v.string(), // HTML or markdown
  excerpt: v.optional(v.string()), // Short summary for previews
  featuredImageStorageId: v.optional(v.id("_storage")),
  featuredImageUrl: v.optional(v.string()),
  images: v.optional(v.array(v.object({
    storageId: v.id("_storage"),
    url: v.string(),
    caption: v.optional(v.string())
  }))),
  tags: v.array(v.string()),
  category: v.optional(v.string()), // e.g., "cooking-tips", "personal-journey"
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("archived")
  ),
  publishedAt: v.optional(v.number()),
  scheduledPublishAt: v.optional(v.number()), // For scheduled posts
  views: v.number(),
  likes: v.number(),
  comments: v.number(),
  shares: v.number(),
  readingTime: v.optional(v.number()), // in minutes
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_status", ["status"])
  .index("by_food creator_status", ["chefId", "status"])
  .index("by_published", ["publishedAt"])
  .index("by_category", ["category"])
  .index("by_views", ["views"])
```

**Indexes**:
- `by_food creator`: Get all stories for a food creator
- `by_status`: Filter by publication status
- `by_food creator_status`: Get stories by food creator and status
- `by_published`: Get published stories sorted by date
- `by_category`: Filter by category
- `by_views`: Get popular stories

---

### 6. chefBankAccounts

Bank account information for payouts.

```typescript
chefBankAccounts: defineTable({
  chefId: v.id("chefs"),
  accountHolderName: v.string(),
  accountNumber: v.string(), // Encrypted
  sortCode: v.string(), // Encrypted, format: "XX-XX-XX"
  bankName: v.string(),
  accountType: v.optional(v.union(
    v.literal("checking"),
    v.literal("savings")
  )),
  isPrimary: v.boolean(),
  verified: v.boolean(),
  verifiedAt: v.optional(v.number()),
  verificationMethod: v.optional(v.union(
    v.literal("stripe_financial_connections"),
    v.literal("manual"),
    v.literal("micro_deposit")
  )),
  stripeAccountId: v.optional(v.string()), // Stripe Financial Connections account ID
  lastUsedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_primary", ["chefId", "isPrimary"])
  .index("by_verified", ["verified"])
```

**Indexes**:
- `by_food creator`: Get all bank accounts for a food creator
- `by_primary`: Get primary bank account for a food creator
- `by_verified`: Filter by verification status

---

### 7. chefPayouts

Payout requests and transaction history.

```typescript
chefPayouts: defineTable({
  chefId: v.id("chefs"),
  bankAccountId: v.id("chefBankAccounts"),
  amount: v.number(), // in pence
  currency: v.literal("gbp"),
  status: v.union(
    v.literal("pending"), // Requested, awaiting processing
    v.literal("processing"), // Being processed by payment provider
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  requestedAt: v.number(),
  processedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  failedAt: v.optional(v.number()),
  cancelledAt: v.optional(v.number()),
  failureReason: v.optional(v.string()),
  failureCode: v.optional(v.string()),
  stripePayoutId: v.optional(v.string()),
  transactionId: v.optional(v.string()), // Internal transaction ID
  estimatedArrivalDate: v.optional(v.number()),
  actualArrivalDate: v.optional(v.number()),
  fees: v.optional(v.number()), // Platform fees in pence
  netAmount: v.number(), // amount - fees
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_status", ["status"])
  .index("by_food creator_status", ["chefId", "status"])
  .index("by_requested", ["requestedAt"])
  .index("by_stripe_payout", ["stripePayoutId"])
```

**Indexes**:
- `by_food creator`: Get all payouts for a food creator
- `by_status`: Filter by payout status
- `by_food creator_status`: Get payouts by food creator and status
- `by_requested`: Sort by request date
- `by_stripe_payout`: Look up by Stripe payout ID

---

### 8. chefTaxRecords

Tax year summaries and documents.

```typescript
chefTaxRecords: defineTable({
  chefId: v.id("chefs"),
  taxYear: v.string(), // e.g., "2023-2024" (April 6 - April 5)
  taxYearStart: v.number(), // April 6 timestamp
  taxYearEnd: v.number(), // April 5 timestamp
  totalEarnings: v.number(), // in pence
  platformFees: v.number(), // in pence
  netEarnings: v.number(), // totalEarnings - platformFees
  orderCount: v.number(),
  breakdown: v.array(v.object({
    month: v.string(), // e.g., "2023-04"
    monthStart: v.number(),
    monthEnd: v.number(),
    earnings: v.number(), // in pence
    fees: v.number(), // in pence
    net: v.number(), // in pence
    orderCount: v.number()
  })),
  documentStorageId: v.optional(v.id("_storage")), // PDF tax document
  documentUrl: v.optional(v.string()),
  generatedAt: v.number(),
  utrNumber: v.optional(v.string()), // Unique Taxpayer Reference
  vatRegistered: v.boolean(),
  vatNumber: v.optional(v.string()),
  selfEmployed: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_tax_year", ["taxYear"])
  .index("by_food creator_year", ["chefId", "taxYear"])
```

**Indexes**:
- `by_food creator`: Get all tax records for a food creator
- `by_tax_year`: Filter by tax year
- `by_food creator_year`: Get specific tax year for food creator

---

### 9. chefEarnings

Track earnings per order for efficient calculations.

```typescript
chefEarnings: defineTable({
  chefId: v.id("chefs"),
  orderId: v.id("orders"),
  grossAmount: v.number(), // Order total in pence
  platformFee: v.number(), // Platform fee in pence
  netAmount: v.number(), // grossAmount - platformFee
  currency: v.literal("gbp"),
  orderDate: v.number(),
  paymentStatus: v.union(
    v.literal("pending"),
    v.literal("paid"),
    v.literal("refunded"),
    v.literal("disputed")
  ),
  paidAt: v.optional(v.number()),
  refundedAt: v.optional(v.number()),
  payoutId: v.optional(v.id("chefPayouts")), // If included in a payout
  includedInPayoutAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
})
  .index("by_food creator", ["chefId"])
  .index("by_order", ["orderId"])
  .index("by_food creator_date", ["chefId", "orderDate"])
  .index("by_payment_status", ["paymentStatus"])
  .index("by_payout", ["payoutId"])
```

**Indexes**:
- `by_food creator`: Get all earnings for a food creator
- `by_order`: Get earnings for an order
- `by_food creator_date`: Get earnings by food creator and date range
- `by_payment_status`: Filter by payment status
- `by_payout`: Get earnings included in a payout

---

## Schema Updates to Existing Tables

### food creators Table Extensions

Add the following fields to the existing `chefs` table:

```typescript
// Add to existing food creators table
onboardingStatus: v.optional(v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("course_complete"),
  v.literal("documents_pending"),
  v.literal("ready_for_orders"),
  v.literal("fully_activated")
)),
onboardingCompletedAt: v.optional(v.number()),
courseCompletedAt: v.optional(v.number()),
documentsVerifiedAt: v.optional(v.number()),
bankAccountVerifiedAt: v.optional(v.number()),
isOnline: v.optional(v.boolean()),
lastOnlineAt: v.optional(v.number()),
totalEarnings: v.optional(v.number()), // in pence, cached for performance
availableBalance: v.optional(v.number()), // in pence, ready for payout
pendingPayouts: v.optional(v.number()), // in pence, in pending payouts
```

### users Table Extensions

The existing `users` table already has support for food creator role. No additional fields needed for basic food creator functionality, but consider:

```typescript
// Optional: Add food creator-specific preferences to users table
chefPreferences: v.optional(v.object({
  notificationSettings: v.optional(v.object({
    newOrder: v.boolean(),
    orderUpdate: v.boolean(),
    payout: v.boolean(),
    support: v.boolean()
  })),
  defaultAvailability: v.optional(v.any())
}))
```

---

## Data Relationships

### Food Creator Onboarding Flow
```
food creators (1) ──< (many) chefCourses
food creators (1) ──< (many) chefDocuments
food creators (1) ──< (many) certificates
```

### Content Creation
```
food creators (1) ──< (many) chefRecipes
food creators (1) ──< (many) chefStories
food creators (1) ──< (many) videoPosts (existing)
```

### Financial Management
```
food creators (1) ──< (many) chefBankAccounts
food creators (1) ──< (many) chefPayouts
food creators (1) ──< (many) chefEarnings
food creators (1) ──< (many) chefTaxRecords
chefPayouts (many) ──< (many) chefEarnings
chefBankAccounts (1) ──< (many) chefPayouts
```

### Order Integration
```
orders (1) ──< (1) chefEarnings
food creators (1) ──< (many) orders (existing)
```

---

## Data Validation Rules

### chefCourses
- `progress` array must contain exactly 13 modules for compliance course
- `quizScore` must be between 0-100 if present
- `completionDate` must be after `enrollmentDate` if present

### chefDocuments
- `fileSize` must be <= 10MB (10,485,760 bytes)
- `mimeType` must be one of: "application/pdf", "image/jpeg", "image/png"
- `expiresAt` must be after `uploadedAt` if present

### chefRecipes
- `prepTime` and `cookTime` must be >= 0
- `servings` must be > 0
- `ingredients` array must not be empty
- `instructions` array must not be empty
- At least one image required for published recipes

### chefPayouts
- `amount` must be >= 1000 (minimum £10.00)
- `amount` must not exceed available balance
- `status` transitions must be valid:
  - pending → processing → completed/failed
  - pending → cancelled

### chefBankAccounts
- `accountNumber` must be exactly 8 digits
- `sortCode` must be exactly 6 digits (format: "XX-XX-XX")
- Only one primary account per food creator

---

## Migration Strategy

### Phase 1: Create New Tables
1. Create `chefCourses` table
2. Create `certificates` table
3. Create `chefDocuments` table

### Phase 2: Content Tables
4. Create `chefRecipes` table
5. Create `chefStories` table

### Phase 3: Financial Tables
6. Create `chefBankAccounts` table
7. Create `chefPayouts` table
8. Create `chefEarnings` table
9. Create `chefTaxRecords` table

### Phase 4: Update Existing Tables
10. Add new fields to `chefs` table
11. Migrate existing data if applicable

### Phase 5: Indexes and Optimization
12. Create all indexes
13. Add data validation
14. Performance testing

---

## Security Considerations

### Encryption
- `accountNumber` and `sortCode` in `chefBankAccounts` must be encrypted at rest
- Use Convex encryption or external encryption service

### Access Control
- Food Creators can only access their own records
- Admins can access all records for verification
- Document URLs should be signed/expiring

### Data Retention
- Keep tax records for 7 years (UK requirement)
- Keep payout records indefinitely
- Archive old courses/documents after expiry

---

## Performance Considerations

### Caching
- Cache `totalEarnings`, `availableBalance`, `pendingPayouts` on `chefs` table
- Update cache on earnings/payout changes
- Recalculate periodically for accuracy

### Indexes
- All foreign key relationships indexed
- Date-based queries indexed
- Status filters indexed

### Query Optimization
- Use pagination for large result sets
- Limit query results to necessary fields
- Use compound indexes for common query patterns

---

## Future Enhancements

### Potential Additional Tables
- `chefNotifications`: Notification preferences and history
- `chefAnalytics`: Aggregated analytics data
- `chefSubscriptions`: Subscription/promotion management
- `chefInventory`: Inventory tracking (future feature)

### Schema Evolution
- Version fields for schema migrations
- Soft deletes for audit trails
- Audit logs for sensitive operations

