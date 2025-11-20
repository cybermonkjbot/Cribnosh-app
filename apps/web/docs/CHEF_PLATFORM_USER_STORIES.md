# Chef Platform - User Stories

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft

## Overview

This document contains all user stories for the chef platform, organized by feature area. Each user story follows the format: "As a [user type], I want to [action] so that [benefit]."

## 2.1 Onboarding & Compliance

### US-001: Chef Registration
**As a** new chef  
**I want to** register with basic information  
**So that** I can start the onboarding process

**Acceptance Criteria**:
- Can create account with email, name, password
- Basic profile info can be entered (name, location)
- Email verification is sent
- Account is created with 'chef' role
- Redirected to onboarding dashboard after registration

**Priority**: P0 (Critical)

---

### US-002: Course Enrollment
**As a** new chef  
**I want to** be automatically enrolled in the 13-module compliance course after registration  
**So that** I can start learning about platform requirements immediately

**Acceptance Criteria**:
- Course appears in dashboard immediately after registration
- Can start first module immediately
- Course progress is tracked from the start
- Enrollment date is recorded

**Priority**: P0 (Critical)

---

### US-003: Course Progress
**As a** chef  
**I want to** track my progress through each module  
**So that** I know what I've completed and what's remaining

**Acceptance Criteria**:
- Progress bar shows overall course completion percentage
- Each module shows completion status (not started, in progress, completed)
- Quiz scores are visible for completed modules
- Time spent per module is tracked
- Last accessed date/time is shown
- Can resume from where I left off

**Priority**: P0 (Critical)

---

### US-004: Course Completion
**As a** chef  
**I want to** receive a certificate upon completing all 13 modules  
**So that** I have proof of compliance training completion

**Acceptance Criteria**:
- Certificate is automatically generated when all modules are completed
- Certificate is downloadable as PDF
- Certificate is stored in my profile
- Certificate includes:
  - Chef name
  - Completion date
  - Course name
  - Unique certificate ID
  - Platform branding

**Priority**: P0 (Critical)

---

### US-005: Document Upload
**As a** chef  
**I want to** upload required documents gradually at my own pace  
**So that** I'm not overwhelmed and can complete onboarding flexibly

**Acceptance Criteria**:
- Can upload documents one at a time
- See which documents are required vs optional
- Drag-and-drop file upload interface
- Support for PDF, JPG, PNG file types
- File size validation (max 10MB)
- Preview document before submission
- Upload progress indicator
- Success confirmation after upload

**Priority**: P0 (Critical)

---

### US-006: Document Verification
**As a** chef  
**I want to** know when my documents are verified  
**So that** I can proceed with the next steps in onboarding

**Acceptance Criteria**:
- Receive notification when document status changes
- See verification status for each document (pending, verified, rejected)
- If rejected, see specific feedback on why
- Can re-upload rejected documents
- Verified documents show verification date
- Document checklist updates automatically

**Priority**: P0 (Critical)

---

### US-007: Onboarding Checklist
**As a** chef  
**I want to** see what I need to complete before receiving orders  
**So that** I know exactly what's required and can prioritize tasks

**Acceptance Criteria**:
- Clear checklist showing:
  - Course completion status
  - Document upload status (required vs optional)
  - Profile completion status
  - Bank account setup status
- Each item shows:
  - Status (not started, in progress, completed)
  - Priority (required vs optional)
  - Next action needed
- Progress percentage shown
- Can click items to navigate to relevant section

**Priority**: P0 (Critical)

---

## 2.2 Profile & Kitchen Management

### US-008: Profile Creation
**As a** chef  
**I want to** create my personal profile with bio, specialties, and location  
**So that** customers can learn about me and my cooking style

**Acceptance Criteria**:
- Can enter:
  - Full name
  - Bio/description (max 500 characters)
  - Specialties (multiple tags/cuisines)
  - Location (city, coordinates)
  - Profile image
- Can save profile as draft
- Can preview profile before publishing
- Can edit profile anytime
- Profile completion indicator shows progress

**Priority**: P0 (Critical)

---

### US-009: Kitchen Profile
**As a** chef  
**I want to** create my kitchen profile with details and images  
**So that** customers can see my kitchen setup and trust my food preparation

**Acceptance Criteria**:
- Can add:
  - Kitchen name
  - Full address
  - Kitchen type (home/commercial)
  - Up to 10 kitchen images
  - Featured video
- Can set kitchen as primary
- Kitchen verification badge (when verified)
- Can update kitchen details anytime

**Priority**: P0 (Critical)

---

### US-010: Availability Settings
**As a** chef  
**I want to** set when I'm available to receive orders  
**So that** I only receive orders during times I can fulfill them

**Acceptance Criteria**:
- Can set availability for each day of the week
- Can set time ranges per day (e.g., 10:00-14:00, 17:00-21:00)
- Can set maximum orders per day
- Can set advance booking days (how far ahead customers can order)
- Can mark specific dates as unavailable (holidays, etc.)
- Calendar view shows availability visually
- Can copy availability from one week to another

**Priority**: P1 (High)

---

### US-011: Go Online/Offline
**As a** chef  
**I want to** toggle my availability to receive orders  
**So that** I can control when I'm actively taking orders

**Acceptance Criteria**:
- Toggle button clearly visible in dashboard
- When offline: No new orders received, status shown to customers
- When online: Can receive orders based on availability settings
- Status change is immediate
- Can see current status at a glance
- Notification when going online/offline

**Priority**: P0 (Critical)

---

### US-012: Profile Updates
**As a** chef  
**I want to** update my profile and kitchen details anytime  
**So that** I can keep my information current and accurate

**Acceptance Criteria**:
- Can edit all profile fields
- Can edit all kitchen details
- Changes save immediately
- Can preview changes before saving
- Edit history is tracked (optional)
- No approval needed for updates

**Priority**: P1 (High)

---

## 2.3 Content Creation

### US-013: Create Recipe
**As a** chef  
**I want to** create recipes with ingredients, instructions, and images  
**So that** I can share my cooking knowledge and attract customers

**Acceptance Criteria**:
- Can create recipe with:
  - Title
  - Description
  - Cuisine type
  - Difficulty level
  - Prep time and cook time
  - Number of servings
  - Ingredients list (with quantities and units)
  - Step-by-step instructions
  - Up to 10 images
  - Tags
- Can save as draft
- Can publish immediately
- Recipe appears in recipe library after creation
- Can link recipe to specific meal

**Priority**: P1 (High)

---

### US-014: Edit Recipe
**As a** chef  
**I want to** edit my published recipes  
**So that** I can update them with improvements or corrections

**Acceptance Criteria**:
- Can edit all recipe fields
- Changes reflect immediately when saved
- Can update published recipes without unpublishing
- Edit history is visible (optional)
- Can revert to previous version (optional)

**Priority**: P1 (High)

---

### US-015: Write Story
**As a** chef  
**I want to** write stories about my cooking journey  
**So that** I can connect with customers and build my brand

**Acceptance Criteria**:
- Rich text editor with formatting options
- Can add images to story
- Can save as draft
- Can publish immediately
- Story appears in content library
- Can add tags and categories
- Can schedule publication date

**Priority**: P2 (Medium)

---

### US-016: Upload Video
**As a** chef  
**I want to** upload cooking videos to showcase my meals  
**So that** customers can see my cooking process and quality

**Acceptance Criteria**:
- Can upload video files (MP4, MOV)
- Max file size: 500MB
- Max duration: 30 minutes
- Thumbnail is auto-generated or can be uploaded
- Video processes and appears in video library
- Can add title, description, tags
- Can link video to recipe or meal
- Video upload progress is shown

**Priority**: P1 (High)

---

### US-017: Content Library
**As a** chef  
**I want to** see all my content (recipes, stories, videos) in one place  
**So that** I can easily manage and organize my content

**Acceptance Criteria**:
- Unified view showing all content types
- Can filter by:
  - Content type (recipe, story, video)
  - Status (draft, published, archived)
  - Date created
  - Tags
- Can search content by title or description
- Can sort by date, popularity, title
- Status indicators clearly visible
- Can perform bulk actions (publish, archive, delete)

**Priority**: P1 (High)

---

### US-018: Link Content to Meals
**As a** chef  
**I want to** link recipes/videos to specific meals I sell  
**So that** customers can see related content when viewing meals

**Acceptance Criteria**:
- Can link recipe to meal from recipe editor
- Can link video to meal from video editor
- Can link content to meal from meal editor
- Linked content appears on meal detail page
- Can unlink content from meals
- Can see which meals are linked to each piece of content

**Priority**: P2 (Medium)

---

## 2.4 Order Management

### US-019: View Orders
**As a** chef  
**I want to** see all incoming orders in my dashboard  
**So that** I can manage and fulfill orders efficiently

**Acceptance Criteria**:
- Orders list shows:
  - Order number
  - Customer name
  - Order items with quantities
  - Order total
  - Order status
  - Order time
  - Delivery address
- Can filter by:
  - Status (pending, accepted, preparing, ready, delivered, cancelled)
  - Date range
  - Customer
- Can search orders by order number or customer name
- Real-time updates when new orders arrive
- Order notifications for new orders

**Priority**: P0 (Critical)

---

### US-020: Accept/Reject Orders
**As a** chef  
**I want to** accept or reject incoming orders  
**So that** I can control which orders I fulfill

**Acceptance Criteria**:
- Can accept order with one click
- Can reject order with reason selection
- Customer is notified immediately of decision
- Order status updates in real-time
- Rejected orders are logged with reason
- Can see order details before accepting/rejecting
- Time limit for response (optional)

**Priority**: P0 (Critical)

---

### US-021: Update Order Status
**As a** chef  
**I want to** update order status as I prepare it  
**So that** customers know the progress of their order

**Acceptance Criteria**:
- Can update status to:
  - Preparing
  - Ready
  - Out for Delivery
  - Delivered
- Status updates are sent to customer
- Can add notes with status update
- Can set estimated ready time
- Status timeline is visible
- Can see order history with all status changes

**Priority**: P0 (Critical)

---

### US-022: Live Orders
**As a** chef  
**I want to** see orders placed during my live stream in real-time  
**So that** I can handle orders while streaming

**Acceptance Criteria**:
- Live order notifications appear during stream
- Orders are integrated into streaming interface
- Can see order details without leaving stream
- Can accept/reject orders from stream interface
- Order queue shows all live orders
- Customer information is visible

**Priority**: P1 (High)

---

### US-023: Order History
**As a** chef  
**I want to** view my order history and analytics  
**So that** I can track my business performance

**Acceptance Criteria**:
- Can view all past orders
- Can filter by date range, status, customer
- Analytics show:
  - Total orders
  - Revenue trends
  - Popular items
  - Average order value
  - Order acceptance rate
  - Average preparation time
- Can export order data
- Charts and graphs visualize data

**Priority**: P1 (High)

---

## 2.5 Financial Management

### US-024: View Earnings
**As a** chef  
**I want to** see my total earnings and pending payouts  
**So that** I can track my income and plan finances

**Acceptance Criteria**:
- Dashboard shows:
  - Total earnings (all time)
  - Available balance (ready for payout)
  - Pending payouts
  - Earnings breakdown by period (daily, weekly, monthly)
- Can see earnings by:
  - Order
  - Meal/item
  - Date range
- Visual charts show earnings trends
- Can export earnings reports

**Priority**: P0 (Critical)

---

### US-025: Add Bank Account
**As a** chef  
**I want to** add my UK bank account for payouts  
**So that** I can receive my earnings

**Acceptance Criteria**:
- Can enter:
  - Account holder name
  - Account number (8 digits)
  - Sort code (6 digits, format: XX-XX-XX)
  - Bank name
- Format validation on entry
- Account name verification (via Stripe)
- Verification status is shown
- Can add multiple bank accounts
- Can set primary account
- Secure storage of bank details

**Priority**: P0 (Critical)

---

### US-026: Request Payout
**As a** chef  
**I want to** request payouts to my bank account  
**So that** I can access my earnings

**Acceptance Criteria**:
- Can request payout if balance is above minimum (£10)
- Can select bank account
- Can enter amount or select "All Available"
- Confirmation screen before submission
- Receives confirmation with estimated processing time
- Payout status is tracked
- Notification when payout completes

**Priority**: P0 (Critical)

---

### US-027: View Transactions
**As a** chef  
**I want to** see my transaction history  
**So that** I can track all financial activity

**Acceptance Criteria**:
- List of all transactions:
  - Earnings from orders
  - Payouts
  - Platform fees
  - Refunds
- Each transaction shows:
  - Date and time
  - Amount
  - Type
  - Status
  - Related order (if applicable)
- Can filter by type, date range
- Can search transactions
- Can export transaction history

**Priority**: P1 (High)

---

### US-028: Tax Information
**As a** chef  
**I want to** view my tax year summaries and download tax documents  
**So that** I can file my taxes accurately

**Acceptance Criteria**:
- Can view tax year summaries (April 6 - April 5)
- Summary shows:
  - Total earnings
  - Platform fees
  - Net earnings
  - Monthly breakdown
- Can download tax documents as PDF
- Documents are HMRC-compatible format
- Can select different tax years
- Tax documents are generated automatically

**Priority**: P1 (High)

---

## 2.6 Live Streaming

### US-029: Go Live
**As a** chef  
**I want to** start a live cooking stream  
**So that** customers can watch me cook and place orders

**Acceptance Criteria**:
- Can start stream with one click
- Can set stream title and description
- Can upload thumbnail image
- Stream starts immediately
- Customers can watch stream
- Customers can place orders during stream
- Stream quality is good
- Can see viewer count

**Priority**: P1 (High)

---

### US-030: Live Dashboard
**As a** chef  
**I want to** see viewer count and live orders during my stream  
**So that** I can engage with viewers and manage orders

**Acceptance Criteria**:
- Real-time viewer count
- Live order notifications
- Order queue visible
- Chat messages visible
- Can interact with orders without leaving stream
- Stream controls accessible
- Stream analytics visible

**Priority**: P1 (High)

---

### US-031: End Stream
**As a** chef  
**I want to** end my live stream and optionally save it  
**So that** I can finish streaming and preserve the content

**Acceptance Criteria**:
- Can end stream with one click
- Confirmation before ending
- Option to save stream as video post
- Stream recording is stored
- Stream analytics summary is shown
- Stream appears in stream history

**Priority**: P1 (High)

---

## 2.7 Customer Support

### US-032: Contact Support
**As a** chef  
**I want to** contact customer support when I have issues  
**So that** I can get help and resolve problems

**Acceptance Criteria**:
- Can open support chat from dashboard
- Support chat interface is accessible
- Can create support case
- AI assistant provides initial help
- Can escalate to human agent
- Can attach files/screenshots
- Chat history is saved

**Priority**: P1 (High)

---

### US-033: Track Support Cases
**As a** chef  
**I want to** track the status of my support requests  
**So that** I know when issues are being addressed

**Acceptance Criteria**:
- Can see all support cases
- Each case shows:
  - Status (open, in progress, resolved, closed)
  - Subject
  - Created date
  - Last updated
  - Assigned agent
- Can view case details and conversation
- Can add messages to case
- Receive notifications on case updates

**Priority**: P1 (High)

---

### US-034: Support History
**As a** chef  
**I want to** view my past support interactions  
**So that** I can reference previous solutions and track support quality

**Acceptance Criteria**:
- Can view all past support chats
- Can view all past support cases
- Can search support history
- Can filter by date, status, category
- Can see resolution details
- Can rate support interactions

**Priority**: P2 (Medium)

---

## Priority Legend

- **P0 (Critical)**: Must have for MVP
- **P1 (High)**: Important for launch
- **P2 (Medium)**: Nice to have, can be added post-launch
- **P3 (Low)**: Future enhancement

## Story Status

- **Draft**: Story is defined but not yet reviewed
- **Ready**: Story is ready for development
- **In Progress**: Story is being developed
- **Testing**: Story is in QA/testing
- **Done**: Story is complete and deployed

