# Food Creator Platform - User Journeys

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft

## Overview

This document maps out complete user journeys for food creators using the platform, from initial onboarding through daily operations, financial management, and support interactions.

## Journey 1: New Food Creator Onboarding Journey

**Goal**: First-time food creator registration to first order received  
**Duration**: 0-30+ days  
**User Type**: New food creator signing up for the first time

### Phase 1: Discovery & Registration (Day 0)

**User Actions**:
1. Food Creator discovers platform through marketing, referral, or search
2. Clicks "Cook on Cribnosh" or "Apply to Cook" button
3. Views information about becoming a chef
4. Decides to register

**System Actions**:
- Display registration form
- Collect basic information:
  - Full name
  - Email address
  - Password
  - Location (city)
  - Phone number (optional)

**User Actions**:
5. Fills registration form
6. Submits registration
7. Receives email verification

**System Actions**:
- Create user account
- Assign 'chef' role
- Send email verification
- Create food creator profile record
- Initialize onboarding state

**Success Criteria**:
- Account created successfully
- Email verification sent
- Food Creator redirected to onboarding dashboard

**Pain Points to Address**:
- Clear value proposition
- Simple registration process
- Immediate feedback on registration

---

### Phase 2: Initial Access (Day 0)

**User Actions**:
1. Clicks email verification link
2. Logs into platform for first time
3. Views onboarding dashboard

**System Actions**:
- Verify email
- Display onboarding dashboard with:
  - Welcome message
  - Course enrollment notification
  - Document upload section (optional for now)
  - Profile setup prompts
  - Onboarding checklist

**User Actions**:
4. Reviews onboarding checklist
5. Understands what needs to be completed

**Success Criteria**:
- Food Creator understands next steps
- Clear path forward is visible
- No confusion about requirements

**Pain Points to Address**:
- Overwhelming amount of information
- Unclear priorities
- Too many steps at once

---

### Phase 3: Course Enrollment (Day 0-7)

**User Actions**:
1. Clicks "Start Compliance Course"
2. Views course overview
3. Sees 13 modules listed
4. Starts Module 1

**System Actions**:
- Auto-enroll food creator in compliance course
- Display course modules
- Track enrollment date
- Initialize progress tracking

**User Actions**:
5. Reads module content
6. Watches videos (if applicable)
7. Takes quiz
8. Receives feedback on quiz
9. Completes Module 1
10. Moves to next module
11. Repeats for remaining modules

**System Actions**:
- Track module progress
- Record quiz scores
- Track time spent
- Update completion status
- Allow pause and resume

**Success Criteria**:
- Food Creator completes all 13 modules
- Average completion time: 7-14 days
- Quiz pass rate: 70%+

**Pain Points to Address**:
- Long course duration
- Boring content
- Difficult quizzes
- No progress visibility

---

### Phase 4: Profile Setup (Day 0-14, parallel with course)

**User Actions**:
1. Clicks "Complete Profile"
2. Fills personal information:
   - Bio/description
   - Specialties/cuisines
   - Profile image
3. Creates kitchen profile:
   - Kitchen name
   - Address
   - Kitchen images
4. Sets initial availability preferences

**System Actions**:
- Save profile information
- Validate required fields
- Upload images
- Update profile completion status
- Update onboarding checklist

**Success Criteria**:
- Profile is 80%+ complete
- Kitchen information added
- Basic availability set

**Pain Points to Address**:
- Unclear what information is needed
- Image upload issues
- Too many fields to fill

---

### Phase 5: Document Upload (Day 0-30, gradual)

**User Actions**:
1. Views document checklist
2. Sees which documents are required vs optional
3. Uploads ID document (required)
4. Waits for verification
5. Uploads health permit (can do later)
6. Uploads insurance (can do later)
7. Uploads tax information (can do later)

**System Actions**:
- Display document requirements
- Accept document uploads
- Validate file types and sizes
- Queue documents for verification
- Verify documents (automated + manual)
- Update verification status
- Send notifications on status changes

**User Actions**:
8. Receives notification when ID is verified
9. Continues with other documents at own pace

**Success Criteria**:
- ID document verified within 2-3 business days
- All required documents uploaded within 21 days
- Clear feedback on document status

**Pain Points to Address**:
- Slow verification process
- Unclear rejection reasons
- Document upload failures
- Unclear which documents are required

---

### Phase 6: Course Completion (Day 7-30)

**User Actions**:
1. Completes final module
2. Takes final quiz
3. Receives completion notification
4. Views completion certificate
5. Downloads certificate

**System Actions**:
- Mark course as completed
- Generate certificate
- Store certificate in profile
- Update onboarding checklist
- Send completion notification

**Success Criteria**:
- Certificate generated successfully
- Certificate is downloadable
- Course completion recorded

**Pain Points to Address**:
- Certificate generation delays
- Certificate format issues

---

### Phase 7: Pre-Order Readiness (Day 14-30)

**User Actions**:
1. Reviews onboarding checklist
2. Sees all required items completed:
   - Course: Complete
   - Basic Profile: Complete
   - ID Document: Verified
3. Sees optional items can be completed later
4. Clicks "Go Online" button

**System Actions**:
- Check onboarding completion status
- Enable "Go Online" with limited functionality
- Show what's still needed for full activation
- Allow food creator to go online but with restrictions

**User Actions**:
5. Goes online
6. Can view platform but may have limited order capacity

**Success Criteria**:
- Food Creator can go online
- Clear indication of remaining requirements
- No blocking issues

**Pain Points to Address**:
- Unclear what "limited functionality" means
- Frustration with restrictions

---

### Phase 8: Full Activation (Day 30+)

**User Actions**:
1. Completes remaining optional documents
2. Adds bank account details
3. Verifies bank account
4. Sees all requirements met

**System Actions**:
- Verify all documents
- Verify bank account
- Update food creator status to "fully activated"
- Enable full platform functionality
- Remove restrictions

**User Actions**:
5. "Go Online" button is fully enabled
6. Can now receive orders without restrictions

**Success Criteria**:
- All critical documents verified
- Bank account verified
- Full platform access granted

**Pain Points to Address**:
- Bank account verification delays
- Unclear activation status

---

### Phase 9: First Order (Day 30+)

**User Actions**:
1. Goes online
2. Waits for first order
3. Receives first order notification
4. Reviews order details
5. Accepts order
6. Prepares meal
7. Updates order status to "Preparing"
8. Updates order status to "Ready"
9. Marks order as "Delivered" or "Ready for Pickup"
10. Receives payment notification

**System Actions**:
- Send order notification
- Display order details
- Process order acceptance
- Track order status
- Process payment
- Add earnings to food creator balance
- Send payment notification

**Success Criteria**:
- First order received and fulfilled
- Payment processed correctly
- Positive experience for chef

**Pain Points to Address**:
- Anxiety about first order
- Unclear order process
- Payment delays

---

## Journey 2: Daily Food Creator Operations Journey

**Goal**: Typical day for an active food creator  
**Duration**: Single day  
**User Type**: Active food creator with completed onboarding

### Step 1: Morning Check-in (8:00 AM)

**User Actions**:
1. Opens app/website
2. Logs into dashboard
3. Reviews overnight orders
4. Checks earnings from previous day
5. Reviews any support messages

**System Actions**:
- Display dashboard with:
  - Overnight orders
  - Earnings summary
  - Notifications
  - Support messages

**Success Criteria**:
- Quick overview of overnight activity
- Clear earnings display
- Easy access to orders

---

### Step 2: Go Online (9:00 AM)

**User Actions**:
1. Reviews availability settings
2. Adjusts if needed
3. Clicks "Go Online" toggle
4. Confirms status change

**System Actions**:
- Update food creator status to "online"
- Start accepting orders based on availability
- Display online status to customers
- Send confirmation notification

**Success Criteria**:
- Status changes immediately
- Orders can now be received
- Clear online indicator

---

### Step 3: Order Management (9:00 AM - 8:00 PM)

**User Actions**:
1. Receives new order notification
2. Reviews order details:
   - Customer information
   - Order items
   - Special instructions
   - Delivery address
   - Order total
3. Decides to accept or reject
4. Accepts order
5. Updates status to "Preparing"
6. Prepares meal
7. Updates status to "Ready"
8. Marks as "Out for Delivery" or "Ready for Pickup"
9. Repeats for additional orders throughout the day

**System Actions**:
- Send order notification
- Display order details
- Process accept/reject decision
- Update order status
- Notify customer of status changes
- Track order timeline
- Process payment when order completes

**Success Criteria**:
- Smooth order processing
- Clear status updates
- Customer satisfaction

**Pain Points to Address**:
- Too many notifications
- Unclear order details
- Difficult status updates

---

### Step 4: Content Creation (During downtime, 2:00 PM)

**User Actions**:
1. Has some downtime between orders
2. Decides to create new recipe
3. Opens recipe editor
4. Enters recipe details:
   - Title
   - Description
   - Ingredients
   - Instructions
   - Images
5. Saves as draft
6. Later publishes recipe

**System Actions**:
- Save recipe draft
- Process recipe publication
- Add to content library
- Make available to customers

**Success Criteria**:
- Recipe created and published
- Appears in content library
- Available to customers

---

### Step 5: Live Streaming (Optional, 6:00 PM)

**User Actions**:
1. Decides to go live
2. Clicks "Go Live" button
3. Sets stream title and description
4. Starts streaming
5. Cooks while streaming
6. Sees viewer count
7. Receives live orders
8. Accepts/rejects orders during stream
9. Engages with chat
10. Ends stream after 1-2 hours
11. Optionally saves stream as video

**System Actions**:
- Start live stream
- Display viewer count
- Process live orders
- Show order notifications
- Record stream (if requested)
- End stream
- Save as video (if requested)

**Success Criteria**:
- Successful live stream
- Orders received during stream
- Good viewer engagement

**Pain Points to Address**:
- Technical issues with streaming
- Managing orders while streaming
- Poor stream quality

---

### Step 6: End of Day (9:00 PM)

**User Actions**:
1. Reviews day's orders
2. Checks earnings for the day
3. Goes offline
4. Reviews any pending tasks
5. Plans for next day

**System Actions**:
- Update status to offline
- Stop accepting new orders
- Display day's summary:
  - Orders fulfilled
  - Earnings
  - Pending tasks

**Success Criteria**:
- Clear end-of-day summary
- Easy to go offline
- Good overview of day's work

---

## Journey 3: Financial Management Journey

**Goal**: Food Creator managing earnings and payouts  
**Duration**: Ongoing  
**User Type**: Active food creator with earnings

### Step 1: View Earnings (Weekly)

**User Actions**:
1. Navigates to Earnings dashboard
2. Views earnings overview:
   - Total earnings
   - Available balance
   - Pending payouts
3. Reviews transaction history
4. Checks earnings breakdown by period

**System Actions**:
- Display earnings dashboard
- Calculate totals
- Show transaction history
- Generate charts and graphs

**Success Criteria**:
- Clear earnings display
- Easy to understand breakdown
- Accurate calculations

---

### Step 2: Add Bank Account (First time)

**User Actions**:
1. Clicks "Add Bank Account"
2. Enters UK bank details:
   - Account holder name
   - Account number
   - Sort code
   - Bank name
3. Submits for verification

**System Actions**:
- Validate bank details format
- Initiate verification process
- Store bank details securely
- Queue for verification

**User Actions**:
4. Waits for verification (1-2 business days)
5. Receives verification notification

**System Actions**:
- Verify account via Stripe Financial Connections
- Update verification status
- Send notification

**Success Criteria**:
- Bank account added successfully
- Verification completed
- Secure storage

**Pain Points to Address**:
- Slow verification
- Verification failures
- Unclear verification process

---

### Step 3: Request Payout (Monthly)

**User Actions**:
1. Sees available balance above minimum (£10)
2. Clicks "Request Payout"
3. Selects bank account
4. Enters amount (or selects "All Available")
5. Reviews payout details
6. Confirms payout request

**System Actions**:
- Validate payout amount
- Check minimum threshold
- Process payout request
- Initiate payout via Stripe
- Update balance
- Send confirmation

**User Actions**:
7. Receives confirmation with estimated processing time
8. Waits for payout to process

**System Actions**:
- Track payout status
- Process payout (1-3 business days)
- Update status when complete
- Send completion notification

**Success Criteria**:
- Payout requested successfully
- Money received in bank account
- Clear status tracking

**Pain Points to Address**:
- Slow payout processing
- Unclear processing times
- Payout failures

---

### Step 4: Tax Management (Yearly)

**User Actions**:
1. Navigates to Tax section
2. Selects tax year
3. Views tax year summary:
   - Total earnings
   - Platform fees
   - Net earnings
   - Monthly breakdown
4. Downloads tax document
5. Uses for self-assessment or HMRC reporting

**System Actions**:
- Generate tax year summary
- Calculate totals
- Generate PDF document
- Make available for download

**Success Criteria**:
- Accurate tax summary
- Downloadable document
- HMRC-compatible format

**Pain Points to Address**:
- Incorrect calculations
- Missing information
- Unclear tax requirements

---

## Journey 4: Support Interaction Journey

**Goal**: Food Creator needing help from support  
**Duration**: 1-24 hours  
**User Type**: Food Creator with an issue

### Step 1: Identify Issue

**User Actions**:
1. Encounters problem (e.g., payment issue, order question)
2. Tries to resolve on own
3. Cannot resolve
4. Decides to contact support

**System Actions**:
- Display help resources
- Show FAQs
- Provide self-service options

**Success Criteria**:
- Easy to find help
- Clear path to support

---

### Step 2: Initiate Support

**User Actions**:
1. Navigates to Support section
2. Clicks "Contact Support"
3. Support chat opens
4. Describes issue to AI assistant

**System Actions**:
- Open support chat
- Initialize AI assistant
- Process initial query
- Provide automated responses

**User Actions**:
5. AI provides initial help
6. Either issue is resolved or needs human agent

**System Actions**:
- Attempt to resolve with AI
- Escalate to human if needed

**Success Criteria**:
- Quick initial response
- AI resolves common issues
- Easy escalation

**Pain Points to Address**:
- Unhelpful AI responses
- Difficult to reach human
- Long wait times

---

### Step 3: Escalate to Human (if needed)

**User Actions**:
1. AI cannot resolve issue
2. Requests human agent
3. Waits for agent assignment

**System Actions**:
- Create support case
- Assign to available agent
- Notify food creator of assignment
- Send agent context

**User Actions**:
4. Receives notification that agent is available
5. Agent introduces themselves

**Success Criteria**:
- Quick agent assignment
- Clear communication
- Agent has context

**Pain Points to Address**:
- Long wait for agent
- Agent doesn't have context
- Poor communication

---

### Step 4: Communication

**User Actions**:
1. Explains issue to agent
2. Provides additional details
3. Attaches screenshots/documents if needed
4. Answers agent's questions

**System Actions**:
- Facilitate chat communication
- Store attachments
- Track conversation
- Update case status

**User Actions**:
5. Agent provides solution or escalates further
6. Issue is resolved or in progress

**Success Criteria**:
- Clear communication
- Issue resolution
- Good agent response time

**Pain Points to Address**:
- Slow agent responses
- Unclear solutions
- Multiple escalations needed

---

### Step 5: Resolution

**User Actions**:
1. Issue is resolved
2. Confirms resolution with agent
3. Receives satisfaction survey
4. Provides feedback

**System Actions**:
- Mark case as resolved
- Close support case
- Send satisfaction survey
- Store feedback
- Update case history

**Success Criteria**:
- Issue fully resolved
- Food Creator satisfied
- Case properly closed

**Pain Points to Address**:
- Premature case closure
- Issue not fully resolved
- No follow-up

---

## Journey Metrics

### Onboarding Journey Metrics
- **Time to First Order**: < 30 days average
- **Course Completion Rate**: 75%+ within 14 days
- **Document Upload Rate**: 90%+ within 7 days
- **Onboarding Completion Rate**: 80%+ within 30 days

### Daily Operations Metrics
- **Order Acceptance Rate**: 85%+
- **Average Order Fulfillment Time**: < 60 minutes
- **Daily Active Chefs**: 60%+ of registered chefs
- **Content Creation Rate**: 5+ items per food creator per month

### Financial Management Metrics
- **Payout Request Frequency**: 2+ per month per chef
- **Payout Processing Time**: < 3 business days
- **Tax Document Generation**: 100% for active chefs
- **Payment Processing Success**: 99%+

### Support Metrics
- **First Response Time**: < 2 hours
- **Resolution Time**: < 24 hours
- **Customer Satisfaction**: 4.5+ / 5.0
- **Self-Service Resolution**: 60%+

## Pain Points Summary

### Common Pain Points Across Journeys
1. **Information Overload**: Too much information at once
2. **Unclear Processes**: Unclear what to do next
3. **Slow Verification**: Long wait times for document/bank verification
4. **Technical Issues**: Platform bugs or performance issues
5. **Poor Communication**: Unclear notifications and messages
6. **Complex Workflows**: Too many steps to complete tasks

### Mitigation Strategies
1. **Progressive Disclosure**: Show information gradually
2. **Clear Guidance**: Step-by-step instructions and tooltips
3. **Status Transparency**: Clear status updates and timelines
4. **Quality Assurance**: Thorough testing and bug fixes
5. **User-Friendly Language**: Clear, simple messaging
6. **Streamlined Processes**: Reduce steps where possible

