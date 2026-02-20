# Social Features — Food Creator App

> Platform Role: Creator business management, content publishing, audience tools
> See: `apps/web/docs/FOOD_CREATOR_PLATFORM_IMPLEMENTATION_PHASES.md`

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Going live is from the camera screen** | The camera modal (shared with consumer app) is the Go Live entry point, not a separate screen. Live dashboard exists for managing an ongoing stream. |
| **No creator→customer DMs** | Intentional. Comms are order-based or via Cribnosh support only. Creators don't message customers directly. |
| **Content features are Phase 3** | Recipe editor, story editor, video upload, and content library are all explicitly planned in Phase 3 of the PRD — not gaps. |
| **Live streaming tools are Phase 5** | Full Go Live controls and live order overlay are Phase 5. The live *dashboard* (viewer count + order notifications) is already complete. |

---

## ✅ What's Built

### Operations (Phases 1–2 — Complete)
| Feature | Status |
|---------|--------|
| 13-module compliance course (TikTok-style vertical video) | ✅ |
| Quiz system + auto-certificate generation | ✅ |
| Document upload & verification | ✅ |
| Personal profile & kitchen profile editing | ✅ |
| Availability calendar (time ranges, blackout dates) | ✅ |
| Online/offline status toggle | ✅ |
| Order list, order details, status updates | ✅ |
| Earnings dashboard & transaction history | ✅ |
| Bank account management | ✅ |
| Payout requests | ✅ |
| Tax summaries & PDF export | ✅ |
| **Live dashboard** — viewer count + order notifications | ✅ Recently completed |
| Food safety compliance | ✅ |
| Help & support (chat with Cribnosh support) | ✅ |

---

## 🔵 Planned — Phase 3 (Content Creation)

Not gaps — explicitly scheduled:

| Feature | PRD Ref |
|---------|---------|
| Recipe editor (ingredients, steps, images, nutrition) | §2.3.1 |
| Story editor (rich text, images, scheduling) | §2.3.2 |
| Video upload & publish flow | §2.3.3 — backend fully built |
| Content library (unified view, filter, bulk actions) | §2.3.4 |
| Link recipes/videos to meals | §2.3 |
| Per-content analytics (views, saves, shares) | §2.3 |

---

## 🔵 Planned — Phase 5 (Enhanced / Social)

| Feature | PRD Ref |
|---------|---------|
| **Go Live mode in camera screen** | §2.6.1 |
| Live order overlay during stream | §2.6.2 |
| Stream-to-video (save recording as post) | §2.6.4 |
| Advanced analytics dashboard | §5.2 |

---

## 🔴 Missing — Genuine Gaps (Not Covered by Phase Plan)

### 1. Follower Notifications
When someone follows the creator or likes their content, no in-app notification is generated. The notifications backend exists; the social event triggers don't fire yet (see Convex SOCIAL_FEATURES.md).

### 2. Followers Overview
No screen to see follower count, new followers, or follower growth over time. Backend `getUserFollowStats` is ready. This should be added to Phase 3 alongside the content creation features.

### 3. Comment Management
Once video posting is in Phase 3, creators will need a screen to view/reply to/moderate comments on their content. Not in the phase plan but should be added to Phase 3.

### 4. Certificate Display & Sharing
Auto-generation is complete but there's no screen to view or share the certificate. Listed as an immediate next step in `IMPLEMENTATION_PROGRESS.md`.

---

## 🗓 Build Order (aligned with phase plan)

| Priority | Feature |
|----------|---------|
| Immediate | Certificate display & share screen |
| Phase 3 | Recipe editor → Story editor → Video upload → Content library |
| Phase 3 (add) | Per-post analytics, followers overview, comment management |
| Phase 5 | Go Live (camera screen) → Live order overlay → Stream recording |
| Phase 5 (add) | Follower notifications |
