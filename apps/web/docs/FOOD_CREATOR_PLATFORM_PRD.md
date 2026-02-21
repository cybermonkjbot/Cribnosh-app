# Food Creator Platform - Product Requirements Document (PRD)

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft
- **Owner**: Product Team

## Executive Summary

The Food Creator Platform is a comprehensive system that enables food creators to sell meals, manage their business, create content, and interact with customers through live streaming and order management. This document outlines all features, requirements, and technical specifications for the food creator/creator platform.

## 1. Product Overview

### 1.1 Vision
Enable home food creators to monetize their cooking skills by providing a complete platform for selling meals, creating content, and building their culinary brand.

### 1.2 Target Users
- Food creators looking to sell meals and takeaways
- Food creators wanting to share recipes and stories
- Culinary entrepreneurs building a food business from home

### 1.3 Key Value Propositions
- Complete business management tools
- Flexible onboarding with gradual documentation
- Multiple revenue streams (orders, content, live streaming)
- Integrated payment and payout system
- Content creation and marketing tools

## 2. Core Features

### 2.1 Food Creator Onboarding & Compliance

#### 2.1.1 13-Module Compliance Course
**Description**: Progressive course system introducing food creators to cooking from home for platform compliance.

**Requirements**:
- Automatic enrollment upon food creator registration
- 13 distinct modules covering:
  - Food Safety & Hygiene
  - UK Food Regulations
  - Kitchen Setup & Equipment
  - Allergen Management
  - Temperature Control
  - Cross-Contamination Prevention
  - Personal Hygiene
  - Food Storage & Handling
  - Waste Management
  - Pest Control
  - Emergency Procedures
  - Record Keeping
  - Platform Policies & Guidelines
- Each module contains:
  - Educational content (text, images, videos)
  - Interactive quizzes
  - Completion tracking
- Progress saved automatically
- Ability to pause and resume
- Certificate upon completion of all modules

**Success Criteria**:
- 80%+ completion rate within 30 days
- Average completion time: 7-14 days
- Quiz pass rate: 70%+ (with retakes allowed)

#### 2.1.2 Gradual Documentation Upload
**Description**: "Let them in" approach - food creators can start with minimal docs, complete required documentation at their own pace before receiving orders.

**Requirements**:
- Minimum required for account creation:
  - Email verification
  - Basic profile information
- Required before receiving orders:
  - ID document (verified)
  - Basic profile completion
  - Course completion
- Optional (can complete later):
  - Health permit
  - Insurance documents
  - Tax registration
  - Kitchen certification
- Document upload interface with:
  - Drag-and-drop functionality
  - File type validation (PDF, JPG, PNG)
  - File size limits (10MB per document)
  - Preview before submission
- Document status tracking:
  - Pending upload
  - Uploaded (pending verification)
  - Verified
  - Rejected (with feedback)
  - Expired (if applicable)

**Success Criteria**:
- 90%+ of food creators upload at least one document within 7 days
- Average time to complete all required documents: 14-21 days

#### 2.1.3 Course Progress Tracking
**Description**: Track completion status, quiz results, and certification.

**Requirements**:
- Real-time progress tracking per module
- Overall course completion percentage
- Quiz scores and attempts
- Time spent per module
- Last accessed date/time
- Completion certificate generation
- Certificate storage in profile

#### 2.1.4 Document Management
**Description**: Upload, verify, and manage required documentation.

**Requirements**:
- Document types supported:
  - Government-issued ID (passport, driving license)
  - Health permit/certificate
  - Insurance documents
  - Tax registration (UTR number, VAT if applicable)
  - Kitchen certification/inspection reports
- Document verification workflow:
  - Automated checks (format, clarity)
  - Manual review by admin team
  - Verification status updates
  - Rejection with specific feedback
- Document expiry tracking (if applicable)
- Renewal reminders
- Secure document storage

### 2.2 Food Creator Profile & Kitchen Management

#### 2.2.1 Personal Profile
**Description**: Food Creator's personal information and branding.

**Requirements**:
- Profile fields:
  - Full name
  - Bio/description (max 500 characters)
  - Specialties (tags/cuisines)
  - Profile image (square, min 400x400px)
  - Location (city, coordinates)
  - Social media links (optional)
- Profile visibility settings
- Profile completion indicator
- Edit history tracking

#### 2.2.2 Kitchen Profile
**Description**: Kitchen details and certification information.

**Requirements**:
- Kitchen information:
  - Kitchen name
  - Address (full address for delivery)
  - Kitchen type (home kitchen, commercial kitchen)
  - Certification status
  - Inspection dates
  - Kitchen images (up to 10 images)
  - Featured video
- Kitchen verification badge
- Kitchen rating and reviews
- Kitchen operating hours

#### 2.2.3 Availability Management
**Description**: Set when food creator is available to receive orders.

**Requirements**:
- Availability settings:
  - Days of week (Monday-Sunday)
  - Time ranges per day
  - Maximum orders per day
  - Advance booking days (how far in advance customers can order)
  - Special dates (holidays, closed dates)
- Availability calendar view
- Quick toggle for temporary unavailability
- Automatic availability based on order capacity

#### 2.2.4 Status Controls
**Description**: Go online/offline, go live for streaming.

**Requirements**:
- Online/Offline toggle:
  - When offline: No new orders received
  - When online: Can receive orders based on availability
  - Status visible to customers
- Go Live functionality:
  - Start live streaming session
  - Customers can watch and order
  - Live status indicator
  - End stream option

### 2.3 Content Creation

#### 2.3.1 Recipes
**Description**: Create, edit, and manage recipe collections.

**Requirements**:
- Recipe fields:
  - Title
  - Description
  - Cuisine type
  - Difficulty level (beginner, intermediate, advanced)
  - Prep time
  - Cook time
  - Servings
  - Ingredients (with quantities and units)
  - Instructions (step-by-step)
  - Images (up to 10 images)
  - Tags
  - Nutritional information (optional)
- Recipe status: Draft, Published, Archived
- Recipe categories/collections
- Link recipes to meals
- Recipe analytics (views, saves, shares)

#### 2.3.2 Stories
**Description**: Write and publish stories about cooking, cuisine, personal journey.

**Requirements**:
- Story editor:
  - Rich text editor
  - Image insertion
  - Formatting options (bold, italic, headings, lists)
  - Link insertion
- Story fields:
  - Title
  - Content
  - Featured image
  - Tags
  - Publication date
- Story status: Draft, Published, Archived
- Story analytics (views, likes, comments)

#### 2.3.3 Video Posts
**Description**: Upload cooking videos, tutorials, meal showcases (existing functionality).

**Requirements**:
- Video upload:
  - Supported formats: MP4, MOV
  - Max file size: 500MB
  - Max duration: 30 minutes
  - Thumbnail generation
- Video metadata:
  - Title
  - Description
  - Tags
  - Cuisine type
  - Difficulty level
  - Link to recipe (optional)
  - Link to meal (optional)
- Video status: Draft, Published, Archived
- Video analytics (views, likes, comments, shares)

#### 2.3.4 Content Library
**Description**: Manage all content in one place.

**Requirements**:
- Unified content view:
  - All recipes, stories, and videos
  - Filter by type, status, date
  - Search functionality
  - Sort options
- Bulk actions:
  - Publish multiple items
  - Archive multiple items
  - Delete multiple items
- Content statistics dashboard
- Content performance metrics

### 2.4 Order Management

#### 2.4.1 Order Dashboard
**Description**: View incoming orders, order history, order status tracking.

**Requirements**:
- Order list view:
  - Active orders (pending, preparing, ready)
  - Order history (completed, cancelled)
  - Filter by status, date, customer
  - Search functionality
- Order details:
  - Customer information
  - Order items with quantities
  - Special instructions
  - Delivery address
  - Order total
  - Payment status
  - Order timeline
- Real-time order updates
- Order notifications

#### 2.4.2 Order Processing
**Description**: Accept/reject orders, update order status.

**Requirements**:
- Order actions:
  - Accept order
  - Reject order (with reason)
  - Update status (preparing, ready, out for delivery)
  - Mark as completed
  - Cancel order (with reason)
- Status workflow:
  - Pending → Accepted/Rejected
  - Accepted → Preparing → Ready → Out for Delivery → Delivered
- Time estimates:
  - Estimated prep time
  - Estimated ready time
  - Actual completion time
- Customer notifications on status changes

#### 2.4.3 Live Order Management
**Description**: Handle orders placed during live streaming sessions.

**Requirements**:
- Real-time order notifications during live stream
- Live order overlay in streaming interface
- Quick accept/reject actions
- Order queue management
- Integration with live streaming platform

#### 2.4.4 Order Analytics
**Description**: Track order volume, revenue, popular items.

**Requirements**:
- Analytics dashboard:
  - Total orders (daily, weekly, monthly)
  - Revenue trends
  - Popular items
  - Average order value
  - Order acceptance rate
  - Average preparation time
  - Customer ratings
- Exportable reports
- Date range filters
- Comparison periods

### 2.5 Financial Management

#### 2.5.1 Earnings Dashboard
**Description**: View total earnings, pending payouts, transaction history.

**Requirements**:
- Earnings overview:
  - Total earnings (all time)
  - Available balance (ready for payout)
  - Pending payouts
  - Earnings breakdown by period (daily, weekly, monthly)
- Earnings breakdown:
  - By order
  - By meal/item
  - By date range
- Visual charts and graphs
- Exportable earnings reports

#### 2.5.2 Bank Account Setup
**Description**: Add and verify UK bank account details.

**Requirements**:
- Bank account fields:
  - Account holder name
  - Account number (8 digits)
  - Sort code (6 digits, format: XX-XX-XX)
  - Bank name
- Account verification:
  - Format validation
  - Account name verification (via Stripe Financial Connections)
  - Verification status tracking
- Multiple bank accounts support (primary/secondary)
- Secure storage of bank details

#### 2.5.3 Payout Requests
**Description**: Request payouts to bank account.

**Requirements**:
- Payout rules:
  - Minimum payout amount: £10
  - Processing time: 1-3 business days
  - Payout frequency: On-demand (no limits)
- Payout request flow:
  - Select bank account
  - Enter amount (or select "All Available")
  - Confirm request
  - Receive confirmation
- Payout status tracking:
  - Pending
  - Processing
  - Completed
  - Failed (with reason)
- Payout history
- Payout notifications

#### 2.5.4 Tax Management
**Description**: View earnings breakdown, tax year summaries, download tax documents.

**Requirements**:
- Tax year summaries:
  - Total earnings per tax year (April 6 - April 5)
  - Breakdown by month
  - Platform fees deducted
  - Net earnings
- Tax documents:
  - Annual earnings statement
  - Monthly breakdowns
  - Downloadable PDF reports
  - HMRC-compatible format
- Tax information:
  - UTR number (if provided)
  - VAT registration (if applicable)
  - Self-employment status
- Tax year selection
- Export functionality

#### 2.5.5 Payment Processing
**Description**: Automatic payment from customer orders to food creator account.

**Requirements**:
- Payment flow:
  - Customer pays for order
  - Platform fee deducted
  - Food Creator earnings added to balance
  - Automatic payout eligibility
- Payment tracking:
  - Per-order payment details
  - Platform fee breakdown
  - Net earnings per order
- Payment disputes handling
- Refund processing

### 2.6 Live Streaming

#### 2.6.1 Go Live
**Description**: Start live cooking sessions where customers can watch and order.

**Requirements**:
- Live stream setup:
  - Stream title
  - Stream description
  - Thumbnail image
  - Scheduled start time (optional)
- Stream controls:
  - Start stream
  - End stream
  - Pause/resume
  - Stream quality settings
- Stream features:
  - Live chat
  - Viewer count
  - Order notifications
  - Stream recording (optional)

#### 2.6.2 Live Order Integration
**Description**: Receive orders in real-time during live streams.

**Requirements**:
- Real-time order notifications
- Order overlay in streaming interface
- Quick order actions (accept/reject)
- Order queue display
- Customer information display

#### 2.6.3 Viewer Engagement
**Description**: See viewer count, chat interactions, order notifications.

**Requirements**:
- Real-time viewer count
- Live chat moderation
- Order notifications
- Viewer engagement metrics
- Stream analytics

#### 2.6.4 Stream Management
**Description**: End stream, save stream as video post.

**Requirements**:
- End stream functionality
- Save stream as video post option
- Stream recording storage
- Stream analytics summary
- Stream history

### 2.7 Customer Support

#### 2.7.1 Support Chat
**Description**: Direct messaging with customer support team.

**Requirements**:
- Chat interface:
  - Real-time messaging
  - File attachments
  - Message history
  - Typing indicators
- AI assistant:
  - Initial triage
  - Common question answers
  - Escalation to human agent
- Human agent support:
  - Agent assignment
  - Response time tracking
  - Resolution tracking

#### 2.7.2 Support Cases
**Description**: Create and track support tickets for issues.

**Requirements**:
- Case creation:
  - Issue category
  - Priority level
  - Description
  - Attachments
- Case tracking:
  - Status (open, in progress, resolved, closed)
  - Agent assignment
  - Response history
  - Resolution notes
- Case history
- Case search

#### 2.7.3 Help Center
**Description**: Access FAQs, guides, platform documentation.

**Requirements**:
- Help articles:
  - Getting started guides
  - Feature documentation
  - Troubleshooting guides
  - Video tutorials
- Search functionality
- Category organization
- Article ratings and feedback

#### 2.7.4 Issue Resolution
**Description**: Track status of support requests.

**Requirements**:
- Resolution tracking
- Satisfaction surveys
- Follow-up support
- Escalation process

## 3. Technical Requirements

### 3.1 Database Schema Extensions

#### 3.1.1 chefCourses
Track course enrollment, progress, and completion.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  courseId: string, // "compliance-course-v1"
  enrollmentDate: number,
  completionDate: number | null,
  progress: {
    moduleId: string,
    completed: boolean,
    quizScore: number | null,
    attempts: number,
    lastAccessed: number,
    timeSpent: number // in seconds
  }[],
  certificateId: Id<"certificates"> | null,
  status: "enrolled" | "in_progress" | "completed" | "expired"
}
```

#### 3.1.2 chefDocuments
Store uploaded documents with verification status.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  documentType: "id" | "health_permit" | "insurance" | "tax" | "kitchen_cert" | "other",
  fileName: string,
  fileStorageId: Id<"_storage">,
  fileUrl: string,
  uploadedAt: number,
  verifiedAt: number | null,
  verifiedBy: Id<"users"> | null, // admin user
  status: "pending" | "verified" | "rejected" | "expired",
  rejectionReason: string | null,
  expiresAt: number | null,
  metadata: {
    documentNumber: string | null,
    issueDate: number | null,
    expiryDate: number | null
  }
}
```

#### 3.1.3 chefRecipes
Recipe management with ingredients, instructions, images.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  title: string,
  description: string,
  cuisine: string,
  difficulty: "beginner" | "intermediate" | "advanced",
  prepTime: number, // in minutes
  cookTime: number, // in minutes
  servings: number,
  ingredients: {
    name: string,
    quantity: number,
    unit: string,
    notes: string | null
  }[],
  instructions: {
    step: number,
    instruction: string,
    imageStorageId: Id<"_storage"> | null
  }[],
  images: Id<"_storage">[],
  tags: string[],
  nutritionalInfo: {
    calories: number | null,
    protein: number | null,
    carbs: number | null,
    fat: number | null
  } | null,
  linkedMealId: Id<"meals"> | null,
  status: "draft" | "published" | "archived",
  publishedAt: number | null,
  views: number,
  saves: number,
  shares: number,
  createdAt: number,
  updatedAt: number
}
```

#### 3.1.4 chefStories
Story/blog posts by chefs.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  title: string,
  content: string, // HTML or markdown
  featuredImageStorageId: Id<"_storage"> | null,
  tags: string[],
  status: "draft" | "published" | "archived",
  publishedAt: number | null,
  views: number,
  likes: number,
  comments: number,
  createdAt: number,
  updatedAt: number
}
```

#### 3.1.5 chefPayouts
Payout requests and transaction history.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  bankAccountId: Id<"chefBankAccounts">,
  amount: number, // in pence
  currency: "gbp",
  status: "pending" | "processing" | "completed" | "failed",
  requestedAt: number,
  processedAt: number | null,
  completedAt: number | null,
  failedAt: number | null,
  failureReason: string | null,
  stripePayoutId: string | null,
  transactionId: string | null,
  metadata: any
}
```

#### 3.1.6 chefTaxRecords
Tax year summaries and documents.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  taxYear: string, // "2023-2024"
  totalEarnings: number, // in pence
  platformFees: number, // in pence
  netEarnings: number, // in pence
  breakdown: {
    month: string, // "2023-04"
    earnings: number,
    fees: number,
    net: number,
    orderCount: number
  }[],
  documentStorageId: Id<"_storage"> | null,
  generatedAt: number,
  utrNumber: string | null,
  vatRegistered: boolean
}
```

#### 3.1.7 chefBankAccounts
Bank account information for payouts.

**Schema**:
```typescript
{
  chefId: Id<"chefs">,
  accountHolderName: string,
  accountNumber: string, // encrypted
  sortCode: string, // encrypted, format: "XX-XX-XX"
  bankName: string,
  isPrimary: boolean,
  verified: boolean,
  verifiedAt: number | null,
  stripeAccountId: string | null, // Stripe Financial Connections account
  createdAt: number,
  lastUsedAt: number | null
}
```

### 3.2 API Endpoints

#### 3.2.1 Course Management
- `GET /api/food creator/courses` - Get food creator's course enrollment and progress
- `GET /api/food creator/courses/{courseId}/modules` - Get course modules
- `GET /api/food creator/courses/{courseId}/modules/{moduleId}` - Get module content
- `POST /api/food creator/courses/{courseId}/modules/{moduleId}/complete` - Mark module as complete
- `POST /api/food creator/courses/{courseId}/modules/{moduleId}/quiz` - Submit quiz answers
- `GET /api/food creator/courses/{courseId}/certificate` - Get completion certificate

#### 3.2.2 Document Management
- `GET /api/food creator/documents` - Get all food creator documents
- `POST /api/food creator/documents` - Upload new document
- `GET /api/food creator/documents/{documentId}` - Get document details
- `DELETE /api/food creator/documents/{documentId}` - Delete document
- `GET /api/food creator/documents/requirements` - Get document requirements checklist

#### 3.2.3 Recipe Management
- `GET /api/food creator/recipes` - Get all food creator recipes
- `POST /api/food creator/recipes` - Create new recipe
- `GET /api/food creator/recipes/{recipeId}` - Get recipe details
- `PUT /api/food creator/recipes/{recipeId}` - Update recipe
- `DELETE /api/food creator/recipes/{recipeId}` - Delete recipe
- `POST /api/food creator/recipes/{recipeId}/publish` - Publish recipe
- `POST /api/food creator/recipes/{recipeId}/archive` - Archive recipe

#### 3.2.4 Story Management
- `GET /api/food creator/stories` - Get all food creator stories
- `POST /api/food creator/stories` - Create new story
- `GET /api/food creator/stories/{storyId}` - Get story details
- `PUT /api/food creator/stories/{storyId}` - Update story
- `DELETE /api/food creator/stories/{storyId}` - Delete story
- `POST /api/food creator/stories/{storyId}/publish` - Publish story

#### 3.2.5 Payout Management
- `GET /api/food creator/earnings` - Get earnings dashboard data
- `GET /api/food creator/payouts` - Get payout history
- `POST /api/food creator/payouts/request` - Request new payout
- `GET /api/food creator/payouts/{payoutId}` - Get payout details
- `GET /api/food creator/bank-accounts` - Get bank accounts
- `POST /api/food creator/bank-accounts` - Add new bank account
- `PUT /api/food creator/bank-accounts/{accountId}` - Update bank account
- `DELETE /api/food creator/bank-accounts/{accountId}` - Delete bank account
- `POST /api/food creator/bank-accounts/{accountId}/verify` - Verify bank account

#### 3.2.6 Tax Management
- `GET /api/food creator/tax-records` - Get tax records
- `GET /api/food creator/tax-records/{taxYear}` - Get tax year summary
- `GET /api/food creator/tax-records/{taxYear}/download` - Download tax document

#### 3.2.7 Status Management
- `POST /api/food creator/status/online` - Go online
- `POST /api/food creator/status/offline` - Go offline
- `GET /api/food creator/status` - Get current status
- `POST /api/food creator/live/start` - Start live stream
- `POST /api/food creator/live/end` - End live stream

### 3.3 Integration Points

#### 3.3.1 Stripe Connect
- Stripe Connect for food creator payouts
- UK bank account verification via Financial Connections
- Payout processing
- Payment tracking

#### 3.3.2 Document Verification Service
- Third-party document verification (if applicable)
- Automated checks
- Manual review workflow

#### 3.3.3 Course Content Delivery
- Content management system for course modules
- Video hosting for course content
- Quiz system
- Certificate generation

## 4. Non-Functional Requirements

### 4.1 Performance
- Page load time: < 2 seconds
- API response time: < 500ms (p95)
- Real-time updates: < 1 second latency
- File upload: Support up to 500MB videos

### 4.2 Security
- Encrypted storage of sensitive data (bank details, documents)
- Role-based access control
- Secure file uploads
- API authentication and authorization
- GDPR compliance for data handling

### 4.3 Scalability
- Support 10,000+ active chefs
- Handle 100,000+ orders per day
- Support concurrent live streams
- Efficient database queries and indexing

### 4.4 Usability
- Mobile-responsive design
- Intuitive navigation
- Clear error messages
- Helpful tooltips and guides
- Accessibility compliance (WCAG 2.1 AA)

### 4.5 Reliability
- 99.9% uptime
- Graceful error handling
- Data backup and recovery
- Transaction integrity

## 5. Success Metrics

### 5.1 Onboarding Metrics
- Onboarding completion rate: 80%+ within 30 days
- Course completion rate: 75%+ within 14 days
- Document upload rate: 90%+ within 7 days
- Time to first order: < 30 days average

### 5.2 Engagement Metrics
- Active food creator rate: 60%+ monthly active
- Content creation rate: 5+ items per food creator per month
- Order acceptance rate: 85%+
- Average orders per food creator: 20+ per month

### 5.3 Financial Metrics
- Payout request frequency: 2+ per month per food creator
- Average payout amount: £200+
- Payment processing success rate: 99%+
- Tax document generation: 100% for active chefs

### 5.4 Support Metrics
- Support case resolution time: < 24 hours
- First response time: < 2 hours
- Customer satisfaction: 4.5+ / 5.0
- Self-service resolution rate: 60%+

## 6. Future Enhancements

### 6.1 Advanced Features
- Multi-language support
- Advanced analytics and insights
- Marketing tools (promotions, discounts)
- Inventory management
- Supplier integration
- Team management (for larger operations)

### 6.2 Integration Enhancements
- Social media integration
- Email marketing tools
- Accounting software integration
- POS system integration
- Delivery partner APIs

### 6.3 Mobile App
- Native iOS and Android apps
- Push notifications
- Offline mode
- Mobile-optimized workflows

## 7. Open Questions

1. **Course Content**: Specific topics and content for each of the 13 modules
2. **Document Requirements**: Exact list of required vs optional documents
3. **Tax Handling**: Automatic tax calculation or manual reporting
4. **Content Types**: Integration level between recipes, stories, and videos
5. **Payout Minimums**: Final minimum payout amount and processing times
6. **Order Limits**: Restrictions before full documentation completion
7. **Course Retakes**: Policy on module and quiz retakes
8. **Document Expiry**: Renewal requirements and frequency

## 8. Appendix

### 8.1 Glossary
- **Food Creator**: Home cook selling meals on the platform
- **Course**: 13-module compliance training program
- **Document**: Required paperwork for food creator verification
- **Payout**: Transfer of earnings to food creator's bank account
- **Live Stream**: Real-time cooking session with order capability

### 8.2 References
- UK Food Safety Regulations
- Stripe Connect Documentation
- Platform Terms of Service
- Food Creator Agreement Template

