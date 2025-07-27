Core Experience
The Nosh Heaven feature transforms the CribNosh Home screen into an immersive, TikTok-style video browsing experience. It's a hidden, magical interaction that users discover by scrolling to the bottom of the main feed.
🔄 User Journey Flow
1. Discovery Phase
User scrolls through the main Home feed (Order Again, Cuisines, etc.)
When they reach the bottom of the scroll, a special trigger appears
Message: "Pull Harder to Enter Nosh Heaven 🍽️" with progress bar
User must intentionally pull down beyond the scroll limit (90% threshold)
2. Entry Transition
On sufficient pull, the entire screen transitions to Nosh Heaven mode
Main Home feed is replaced with a full-screen video player
Smooth animation with scale/fade effects
Full-screen takeover - no tabs or other UI visible
3. Nosh Heaven Experience
Vertical swipe navigation between meal videos (like TikTok/Reels)
Each video is a full-screen meal showcase with:
Video background (autoplay, looping)
Meal title and compact description
Kitchen name and price
"Order now" button
Interactive elements (like, comment, share, kitchen profile)
Fixed CribNosh logo at top-left
Auto-hiding "Swipe down to exit" message
4. Exit Experience
Swipe down from top to exit Nosh Heaven
Returns to Home feed (scrolled to top)
Smooth transition back to normal browsing
�� Video Experience
Loading & Performance
Preloading system - Next 2 videos are preloaded for instant playback
Loading states - Spinner and "Loading video..." for non-preloaded content
Error handling - Retry button for failed video loads
Instant playback - Preloaded videos skip loading states entirely
Video Features
Autoplay when visible
Looping short meal clips
Pause/play based on visibility
Full-screen video background
Overlay content for meal information
�� UI/UX Design
Pull-to-Enter Trigger
Always visible at bottom of scroll (not covered by tabs)
Progress bar shows pull intensity
Intentional activation - requires 90% pull threshold
Visual feedback - scales and animates during pull
Sparkle effects and food icons for magical feel
Nosh Heaven Player
True full-screen - z-index 99999, hidden status bar
Fixed branding - CribNosh logo top-left
Action buttons - Like, comment, share, kitchen profile
Compact layout - Meal info positioned above bottom tabs
Auto-hide messages - Exit instruction fades after 3 seconds
Interactive Elements
Custom heart icon - Animated like button with gradient
Kitchen profile - Circular avatar with kitchen info
Order button - Prominent CTA for meal ordering
Share functionality - Social sharing capabilities
⚡ Technical Implementation
Core Components
PullToNoshHeavenTrigger - Detects overscroll, shows progress, triggers entry
NoshHeavenPlayer - Full-screen video player with FlatList paging
MealVideoCard - Individual video card with overlays and interactions
Performance Optimizations
Preloading - Next videos loaded in background
Memoization - Optimized re-renders
FlatList optimization - Efficient video list rendering
Defensive programming - Crash-proof error handling
Animation & Gestures
Reanimated for smooth animations
Gesture handling for pull detection
Shared values for progress tracking
Worklet patterns for performance
�� Key Features
Intentional Discovery
Hidden feature - Not obvious, requires exploration
Deliberate activation - 90% pull threshold prevents accidents
Magical feel - Sparkles, animations, smooth transitions
Immersive Experience
Full-screen takeover - Complete focus on video content
No distractions - Hidden status bar, auto-hide messages
Smooth navigation - Instant video switching
Performance Focus
Preloading - Instant video playback
Optimized rendering - Smooth 60fps experience
Error resilience - Graceful handling of failures
🚀 Expected User Behavior
Discovery - Users find the feature by exploring the app
Engagement - Immersive video browsing increases time spent
Conversion - Direct "Order now" buttons drive meal purchases
Social - Share functionality increases app virality
Retention - Unique experience encourages return visits
This feature transforms CribNosh from a traditional food ordering app into an engaging, social video platform that combines the best of TikTok's entertainment with practical food discovery and ordering.