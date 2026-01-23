# 📜 Cribnosh: Early 2025 Engineering & Evolution Report
**Reporting Period**: July 25, 2025 – October 31, 2025
**Document Version**: 2.0 (Expanded Retrospective)

---

## 📑 Table of Contents
1. [Executive Summary: Genesis & Rapid Scaling](#executive-summary)
2. [Technical Architecture: Native Integration & Performance](#technical-architecture)
3. [Key Feature Pillars: Group Ordering & Social](#key-features)
4. [Chronological Engineering Log](#chronological-engineering-log)

---

## 🏛️ Executive Summary: Genesis & Rapid Scaling
This report covers the genesis of the Cribnosh mobile platform, starting from the **initial commit on July 25, 2025**. The period from July to October was defined by rapid feature velocity, establishing the core social and logistic pillars of the application.

### **Strategic Timeline**
- **July**: Project Initialization & Core UI Architecture (NativeWind + Reanimated).
- **August**: The "Social Commerce" pivot with Group Ordering and Live Streaming.
- **September**: Deep linking infrastructure and Authentication hardening.
- **October**: API integration and Location services.

---

## 🏗️ Technical Architecture

### **1. The "Shake-to-Eat" Interaction Model**
In July (`16a95ed`), we introduced a novel interaction model leveraging device accelerometers.
- **Sustained Shake Detection**: Built a custom sensor hook requiring 3 seconds of continuous motion to trigger "Surprise Me" actions, differentiating our discovery logic from competitors.

### **2. Deep Linking & Routing Architecture**
September saw a complete overhaul of our routing logic to support **Universal Deep Links**.
- **Contextual Routing**: Users can now click a link for a specific meal, chef, or group order session and be routed to the exact screen state, even after a fresh install/login flow (`355908c`).

### **3. Performance & Animation**
We migrated our animation engine to **Reanimated 3** and adopted **NativeWind** for styling (`66d0d9f`), significantly reducing the JS-thread overhead for complex UI transitions like the "Live Viewer" and "Cart Sheet".

---

## ⚙️ Key Feature Pillars

### **Collaborative Carts (August 2025)**
The "Group Order" engine allows a host to initiate a session and invite friends via link.
- **Real-Time Sync**: Cart additions from multiple users are synced instantly.
- **Payment Splitting**: Laid the groundwork for split payments and "Payment Link" sharing (`07914fd`).

### **Live Cooking & Media (July-August 2025)**
We integrated **Expo AV** and **Expo Camera** to support the "Kitchen Live" feature.
- **Live Viewer**: Users can watch chefs cook in real-time.
- **Media Library**: seamless integration for chefs to upload food photos and story updates directly from their device gallery.

---

## 📅 Chronological Engineering Log
*Exhaustive list of major commits from Project Start (July 2025) to October 2025*

### **July 2025: Genesis & Core UI**
- **2025-07-25**: Initial commit ([d2e4ddb])
- **2025-07-25**: feat: add Collapsible component for expandable sections ([213517c])
- **2025-07-25**: Refactor components to integrate NativeWind for styling ([f09c2f7])
- **2025-07-25**: feat: add UI components and integrate react-native-svg ([9482464])
- **2025-07-25**: feat: Update UI components to use Poppins font and enhance Button props ([3e98507])
- **2025-07-25**: feat: Add HearEmoteIcon component and integrate it into UiTestPage ([17e86bb])
- **2025-07-25**: feat: Enhance HearEmoteIcon with animated outline and improved like functionality ([bcf4073])
- **2025-07-25**: feat: Add GroupTotalSpendCard and SwipeButton components; update UiTestPage to include them ([3d92ca1])
- **2025-07-25**: feat: Integrate GroupOrderMember component into UiTestPage; add MessageIcon and update styles ([1dce29a])
- **2025-07-26**: feat: Update KitchenNameCard to enhance avatar handling and props; streamline styling with NativeWind ([66d0d9f])
- **2025-07-27**: feat: Add KitchenNameCard, BigPackaging, Heading, and SvgHeading components ([b7bb4ee])
- **2025-07-27**: feat: Refactor KitchenNameCard to use NativeWind for styling; improve avatar handling and props ([784f30e])
- **2025-07-27**: feat: Add UI components for order management and live viewer indicators ([66b8388])
- **2025-07-27**: feat: Add CompactMealSelection and LiveComments components; integrate LiveCommentItem for displaying comments ([1d713c7])
- **2025-07-27**: feat: Update CompactMealSelection styling to use Tailwind CSS classes; remove unused styles ([4d6b0eb])
- **2025-07-27**: feat: Integrate expo-av and @gorhom/bottom-sheet dependencies; update layout and tab navigation structure ([6ebf5e7])
- **2025-07-27**: feat: Enhance MainScreen with performance monitoring and debugging capabilities ([3b16099])
- **2025-07-27**: feat: Refactor layout components and enhance UI elements ([fe6954e])
- **2025-07-27**: fix: Update image URIs across multiple components for consistency and improved visuals ([4fd6eee])
- **2025-07-28**: feat: Enhance app configuration with new fonts and expo-sensors integration ([fc55d0e])
- **2025-07-28**: feat: Update ingredient structure in MainScreen and MealIngredients component ([e0f2b6b])
- **2025-07-28**: - Introduced sustained shake detection requiring continuous shaking for 3 seconds to trigger actions, reducing accidental activations. ([16a95ed])
- **2025-07-29**: feat: Enhance ProfileScreen and UI components with animations and new features ([6b9aeb6])
- **2025-07-29**: feat: Refactor ProfileScreen with enhanced animations and improved state management ([b1d6528])
- **2025-07-29**: feat: Remove outdated README files for BottomSheet, OnTheStove, and various UI components ([7671b5a])
- **2025-07-29**: Moved test files ([d2d6282])
- **2025-07-29**: Fixed introduce import errors ([1151001])
- **2025-07-29**: feat: Enhance animation handling and state management across UI components ([b7c3bcb])
- **2025-07-29**: refactor: Update Reanimated configuration for improved logging and strict mode handling ([4fc2e1c])
- **2025-07-29**: refactor: Simplify ProfileScreen animations and state management ([fab68ab])

### **August 2025: Group Ordering & Live Streams**
- **2025-08-03**: Ask friend to pay share sheet ([b357397])
- **2025-08-07**: Refactor code structure for improved readability and maintainability ([85862dc])
- **2025-08-08**: refactor: Standardize component naming and improve code formatting feat: Add RandomImage component ([f911c5f])
- **2025-08-09**: Group order activation ([535f977])
- **2025-08-09**: Merge branch 'cart' into expr ([70a0a17])
- **2025-08-09**: group order modal continuation ([08f128a])
- **2025-08-10**: Cart screen routing added to the kitchen >> add to cart button ([59803d8])
- **2025-08-14**: Merge pull request #1 from cybermonkjbot/expr ([44fcc9a])
- **2025-08-25**: Update dependencies and enhance UI components ([aa53787])
- **2025-08-26**: kitchen live screens 30% ([5d3ccc3])
- **2025-08-26**: payment link modal ([07914fd])
- **2025-08-26**: Remove unused font assets from app.json to streamline configuration ([6697675])
- **2025-08-27**: Add user, family, and group order icons to BottomSearchDrawer ([fb74e01])
- **2025-08-27**: Enhance group order functionality and UI ([7cfba22])
- **2025-08-27**: Enhance group order screen with user invitation functionality ([a88b1a9])
- **2025-08-27**: Added choose friends screen and payment link screens, and also linked from the carts screen ([3edef08])
- **2025-08-28**: Livescreen 50% ([51e1fc9])
- **2025-08-28**: livescreen 70% done ([c83b7e0])
- **2025-08-28**: Enhance app configuration and UI components ([7ce5ca2])
- **2025-08-28**: Refactor Apple Sign-In error handling for improved user experience ([76763b5])
- **2025-08-28**: Implement comprehensive error handling for Google Sign-In and enhance UI components ([a819cc0])
- **2025-08-28**: Optimize ProfileScreen and UI components for improved performance and spacing ([3298a3d])
- **2025-08-28**: Update AIChatDrawer and GeneratingSuggestionsLoader for improved animations and UI consistency ([0f52672])
- **2025-08-28**: Enhance OrdersScreen and SignIn components for improved user experience ([360e548])
- **2025-08-28**: Merge pull request #2 from cybermonkjbot/cart ([c270d4b])
- **2025-08-28**: Implement sheet animation and gesture handling in ProfileScreen ([f3e7041])
- **2025-08-29**: livescreen 55% ([4b7c3ff])
- **2025-08-29**: Merge branch 'main' into expr ([70fe91e])
- **2025-08-29**: Merge pull request #3 from cybermonkjbot/expr ([38c9c9d])
- **2025-08-28**: Refactor Cart and OnTheWay components for improved navigation and UI consistency ([8d6ec30])
- **2025-08-29**: Add expo-maps dependency and update hidden sections naming ([12787c8])
- **2025-08-29**: share live icon added ([59300ee])
- **2025-08-29**: Refactor layout and enhance LiveComments component for improved user experience ([f73c1ac])
- **2025-08-29**: Enhance OnTheStoveBottomSheet and LiveContent components for improved loading state and UI consistency ([8e6912a])
- **2025-08-30**: Enhance app configuration and UI components for improved functionality and user experience ([784e53e])
- **2025-08-30**: Add expo-media-library dependency and enhance CameraModalScreen for media handling ([fd4cec9])
- **2025-08-31**: Refactor CameraModalScreen to streamline media handling and UI interactions ([c263b3e])

### **September 2025: Auth, Payments & Deep Linking**
- **2025-09-03**: auth and payment added ([c22a9e1])
- **2025-09-03**: shared-ordering flow ([471334b])
- **2025-09-04**: shared-link flow ([c9f14d7])
- **2025-09-04**: shared ordering flow completed ([15c6887])
- **2025-09-05**: Merge pull request #4 from cybermonkjbot/expr ([e5eb57d])
- **2025-09-05**: Merge pull request #5 from cybermonkjbot/shared-ordering ([ddf4e3b])
- **2025-09-11**: deep-linking 50% ([ebce43a])
- **2025-09-12**: deep-linking 60% completed ([32766ec])
- **2025-09-15**: Refactor deep link handling and remove debug deep link component ([355908c])
- **2025-09-15**: Refactor deep link validation logic for improved clarity and functionality ([a039bc5])
- **2025-09-15**: Merge pull request #6 from cybermonkjbot/deep-linking ([05c58c5])
- **2025-09-19**: Update app configuration and dependencies ([d452a1d])
- **2025-09-20**: Update app configuration and dependencies for Expo SDK 54 ([ed145aa])
- **2025-09-20**: Enhance gesture handling and configuration for improved performance ([e71eac8])
- **2025-09-20**: Updated to New Reanimated API to fix a few broken animations ([4e6de41])
- **2025-09-20**: Refactor imports to use SafeAreaView from react-native-safe-area-context ([eaf52ca])
- **2025-09-20**: Simplify Reanimated scroll handler and add error handling ([5a80ecf])
- **2025-09-20**: header component fixes and linear padding constant ([6eb0728])
- **2025-09-24**: phone-auth ([0212ac7])
- **2025-09-25**: auth contd ([5139775])
- **2025-09-30**: Update dependencies and enhance BottomSheet integration ([655116e])

### **October 2025: Logic & API Integration**
- **2025-10-08**: Toast notification aation added ([fddfff6])
- **2025-10-09**: feat: Clean up debugging code and fix linter errors ([7d000f1])
- **2025-10-22**: feat: Complete Custom Orders integration with API endpoints ([a1e95d2])
- **2025-10-22**: search endpoints added ([655fdb8])
- **2025-10-23**: Merge branch 'main' into customer-api-integration ([b50927d])
- **2025-10-23**: Merge pull request #7 from cybermonkjbot/customer-api-integration ([17702f6])
- **2025-10-25**: refactor: Update app.json owner and clean up _layout.tsx ([74f0158])
- **2025-10-25**: feat: Enhance location features and UI updates ([fc45505])
- **2025-10-29**: feat: Update app configuration and build settings ([1703044])
