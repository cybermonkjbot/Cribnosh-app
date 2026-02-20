# Social Features — Backend (Convex)

> Package: `packages/convex` | Single source of truth for all social data and logic

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Follow graph is consumer→creator only** | Consumers follow creators/kitchens. Not consumer↔consumer or creator↔creator. |
| **DMs scope = creator↔Cribnosh support only** | Customer→creator DMs are intentionally out of scope. The chat system serves support workflows. |
| **Stories = long-form chef articles** | Not ephemeral Instagram-style stories. Chef-written editorial content with a slug and published state. |
| **Activity feed is ops-only** | `activityFeed.ts` is admin/monitoring only. The user-facing social feed query doesn't exist yet. |
| **Block is stored in user preferences object** | Lightweight MVP block. Would need a dedicated table at scale. |
| **`ENABLE_COMMUNITY_FEED` feature flag** | Nosh Heaven video feed is gated — can be toggled off independently of the rest of the platform. |

---

## ✅ Built & Production-Ready

### Follow System
| Query / Mutation | Connected to UI? |
|-----------------|-----------------|
| `getUserFollowers` — paginated with follow-back detection | ❌ No UI screen |
| `getUserFollowing` — paginated | ❌ No UI screen |
| `isFollowing` — check follow status | ❌ No follow button rendered |
| `getUserFollowStats` — followers/following/video counts | ❌ No public profile screen |
| `searchUsers` — with block/follow status | ❌ No discovery screen |
| `getSuggestedUsers` — cuisine + mutual follow matching | ❌ No discovery screen |
| `followUser` / `unfollowUser` | ❌ No button in any app |
| `blockUser` / `unblockUser` | ❌ No block UI |

### Connections
| Feature | Connected? |
|---------|-----------|
| Family member connections | ✅ Family profile UI |
| Referral connections | ✅ Referral routes |
| Group order participant connections | ✅ Group order UI |
| Treat/gift connections | ✅ Treat flow |
| Manual friend connections | ❌ No dedicated UI |

### Video Posts
| Feature | Connected? |
|---------|-----------|
| Upload / publish / delete | ✅ Food creator app (recent) |
| Like / unlike | ✅ Nosh Heaven player |
| Share (internal + external) | ✅ Nosh Heaven + native share sheet |
| View tracking (watch time, completion) | ✅ Nosh Heaven player |
| Flag / report video | ❌ No report button in apps |
| Admin: resolve report | ✅ Admin web portal |
| `customerGetVideoFeed` action | ✅ Nosh Heaven |
| `customerLikeVideo`, `customerUnlikeVideo` | ✅ Nosh Heaven |
| `customerShareVideo` | ✅ Nosh Heaven |
| `customerRecordVideoView` | ✅ Nosh Heaven |

### Video Comments
| Feature | Connected? |
|---------|-----------|
| Add comment / nested replies | ❌ No comment UI |
| Edit / delete comment | ❌ |
| Like / unlike comment | ❌ |
| Flag comment | ❌ |

### Messaging (Chats)
| Feature | Connected? | Notes |
|---------|-----------|-------|
| Create conversation | ✅ | Support chat only |
| Send / edit / delete message | ✅ | Support chat only |
| Mark messages read | ✅ | |
| Emoji reactions | ❌ | No UI |
| Pin messages | ❌ | No UI |
| Group chats | ❌ | No consumer group chat |

### Live Sessions
| Feature | Connected? |
|---------|-----------|
| Start / end session | ✅ Food creator web dashboard + camera (partial) |
| Viewer count | ✅ Mobile consumer viewer + creator dashboard |
| Live comments | ✅ `LiveComments.tsx` |
| Live order overlay | ✅ Creator dashboard |
| Session recording / save as video | ❌ No UI trigger |

### Stories (Long-form chef articles)
| Feature | Connected? |
|---------|-----------|
| Create / update / publish / archive | ✅ Admin portal |
| Public read | ✅ `/by-us` web page |
| Likes / comments on stories | ⬜ Schema flags exist | ❌ Not wired — no `storyLikes` table |

### Reviews & Ratings
| Feature | Connected? |
|---------|-----------|
| Order reviews | ✅ Post-order mobile flow |
| Chef ratings | ✅ Backend |
| Rating display on creator profile | ❌ Not rendered on kitchen/profile screens |

### Notifications
| Feature | Connected? |
|---------|-----------|
| User notifications (orders, system) | ✅ Mobile `useNotifications.ts` |
| Social notifications (follow, like, comment events) | ❌ Triggers not wired on social mutations |
| Push notification dispatch | ✅ Orders / support |
| Notification settings | ✅ Mobile settings |

### Gamification
| Feature | Connected? |
|---------|-----------|
| NoshPoints | ✅ Mobile profile |
| Streaks | ✅ Mobile profile |
| Play to Win | ✅ Mobile |
| Leaderboard | ❌ No UI |

---

## 🔴 Backend Gaps — Needs Building

### 1. Mixed Content Feed Query (`getFollowingFeed`)
The Nosh Heaven feed currently serves `videoPosts` only via `customerGetVideoFeed`. A proper social feed query should return mixed content — videos, recipes, and live sessions — from creators the user follows, ranked by recency/relevance. `activityFeed.ts` is admin-only and can't be reused here.

### 2. Social Notification Triggers
Social mutations don't fire notifications. These need wiring:
- `followUser` → create "X followed you" notification for the followed creator
- `likeVideo` → create "X liked your video" notification for the video creator
- `addComment` (videoComments) → create "X commented on your video" notification

All three receivers are creators, consistent with the consumer→creator follow direction.

### 3. Story Engagement Tables
Stories have likes/comments counts in the PRD schema but:
- No `storyLikes` table or mutation exists
- No `storyComments` table (separate from `videoComments`)

### 4. Creator Profile Aggregate Query
A single query for public creator profile pages that returns: follower count, average rating, review count, published video count, published recipe count, live status. Currently requires multiple separate queries.

### 5. Trending / Explore Query
For the web `/explore` page and Nosh Heaven discovery improvements:
- `getTopCreators` (by followers, by recent activity)
- `getTrendingContent` (by views/likes in a time window)

---

## 🗓 Build Priority

| Priority | Item |
|----------|------|
| P0 | Social notification triggers (follow, like, comment) |
| P0 | Mixed content feed query (videos + recipes + live) |
| P1 | Creator profile aggregate query |
| P1 | Story likes + comments tables and mutations |
| P2 | Trending / explore queries |
| P3 | Dedicated `userBlocks` table (replace preferences-based block) |
