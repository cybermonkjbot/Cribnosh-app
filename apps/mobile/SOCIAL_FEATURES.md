# Social Features — Consumer Mobile App

> Platform Role: Primary consumer-facing social experience

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Nosh Heaven is an easter egg** | Discovered via pull-down gesture (`PullToNoshHeavenTrigger`), search, or embedded content hooks — not a nav tab. Intentional discovery mechanic. |
| **No customer→creator DMs** | Intentional. Customer comms are order-based or support-based only. |
| **No consumer→consumer social graph** | The follow system is consumer→creator. Customers don't follow each other. |
| **No content creation for consumers** | Customers are consumers, not creators. Camera modal is for capturing, not publishing. |
| **Kitchen screens = creator profiles** | The "kitchen" IS the creator's public profile. The naming may be simplified in a future rename (kitchen = creator). |
| **Going live is done from camera screen** | The `camera-modal.tsx` is the entry point for going live. Not a separate screen. |

---

## ✅ What's Built

### Nosh Heaven (TikTok-style content feed)
| Feature | Status |
|---------|--------|
| Vertical video player (swipe) | ✅ `NoshHeavenPlayer.tsx` |
| Video feed from backend (`customerGetVideoFeed`) | ✅ Wired via Convex action |
| Like / unlike video (optimistic UI) | ✅ |
| Share video (native share sheet + backend record) | ✅ |
| View tracking (watch duration, completion rate) | ✅ |
| Add to cart from video (if meal is linked) | ✅ |
| "Pull harder" discovery trigger | ✅ `PullToNoshHeavenTrigger.tsx` |
| Feature-flagged by `ENABLE_COMMUNITY_FEED` | ✅ |
| Error boundary | ✅ `NoshHeavenErrorBoundary` |

### Social Graph & Connections
| Feature | Status |
|---------|--------|
| Follow / unfollow creators | ✅ Backend wired, available in hooks |
| User connections (family, referral, group-order) | ✅ `useConnections.ts` |
| Family profiles | ✅ `app/family-profile/` |
| Referral system | ✅ |

### Social Dining
| Feature | Status |
|---------|--------|
| Group orders | ✅ `app/(tabs)/orders/group/` |
| Shared ordering via link | ✅ `app/shared-link/`, `app/shared-ordering/` |
| Treat a friend | ✅ `app/treat/` |

### Live Sessions (Consumer)
| Feature | Status |
|---------|--------|
| Live viewer screen | ✅ `app/live/` (feature-flagged: `mobile_live_sessions`) |
| Live comments | ✅ `LiveComments.tsx` |
| Live viewer count | ✅ `LiveViewersIndicator.tsx` |

### Other Social & Engagement
| Feature | Status |
|---------|--------|
| NoshPoints | ✅ Profile |
| Streaks | ✅ Profile |
| Play to Win | ✅ `app/play-to-win/` |
| Order reviews | ✅ Post-order flow |
| Claimed offers | ✅ `app/claim-offer.tsx` |
| Notifications (orders / system) | ✅ `useNotifications.ts` |
| In-app support chat | ✅ `useSupport.ts`, `useSupportChat.ts` |

---

## 🔴 Missing — Genuine Gaps

### 1. Non-Video Content in Nosh Heaven
**Impact: Medium** — The feed is video-only today.

The PRD intent is for Nosh Heaven to surface **mixed content**: videos AND other discoverable items (recipes, live sessions in progress, special offers). Currently only video posts are surfaced. The `customerGetVideoFeed` action needs extending to support mixed content types.

### 2. Nosh Heaven Entry Points (Embedded in Other Screens)
**Impact: Medium** — Discovery relies on pull gesture only right now.

The "easter egg" mechanic means Nosh Heaven should surface contextually — e.g.:
- A video thumbnail embedded on a kitchen/creator profile that, when tapped, opens NoshHeaven scrolled to that video
- A recipe card on a kitchen screen that links into NoshHeaven
- A search result that deeplinks into the feed

These contextual entry points aren't built yet. Without them, discovery relies solely on the pull gesture.

### 3. Go Live Mode in Camera Screen
**Impact: High (Creator feature)** — The `camera-modal.tsx` currently only handles photo capture. The "Go Live" mode (video streaming) needs to be added as a mode within the same camera screen. The live session backend (`liveSessions.ts`) is fully built.

### 4. Video Comments UI
**Impact: Medium** — Full backend exists (nested replies, likes, flags).
- No comment sheet attached to the Nosh Heaven player
- Comment count is displayed (`commentsCount`) but tapping it does nothing

### 5. Kitchen / Creator Profile: Follow Button + Social Stats
**Impact: Medium** — Kitchen screens (`KitchenMainScreen.tsx`) are the creator profiles.
- No follow/unfollow button on these screens
- No follower count displayed
- Backend `getUserFollowStats` is ready

### 6. Follower/Following List Screen
**Impact: Low** — Backend queries fully built, no UI to browse them.

### 7. Social Notifications
**Impact: Medium** — "X followed you", "Y liked your video" — no in-app notification screen. Backend side also missing triggers (see Convex SOCIAL_FEATURES.md).

---

## 🗓 Build Priority

| Priority | Feature |
|----------|---------|
| P0 | Go Live mode in camera screen |
| P0 | Mixed content (recipes, live) in Nosh Heaven feed |
| P1 | Contextual Nosh Heaven entry points (from kitchen screens, search) |
| P1 | Follow button + stats on kitchen/creator screens |
| P1 | Video comments sheet in Nosh Heaven |
| P2 | Social notifications screen |
| P3 | Followers/following management screen |
