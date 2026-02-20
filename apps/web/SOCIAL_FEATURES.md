# Social Features — Web App

> Platform Role: Marketing, discovery, web ordering, creator web dashboard, admin tooling

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Web is not the primary social surface** | Mobile app owns social interaction. Web is discovery, conversion, and creator tooling. |
| **Kitchen pages = creator profiles** | `/food-creator/[username]` and kitchen detail pages are the same concept. The "kitchen" IS the creator. Naming may be simplified going forward. |
| **No Nosh Heaven on web** | Nosh Heaven is a mobile-native experience (gesture-driven). Web gets a recipe/video gallery instead. |
| **Creator web dashboard exists** | `/food-creator/(dashboard)/*` has a full creator management UI — meals, orders, earnings, content, live, support. |

---

## ✅ What's Built

### Public / Marketing Surface
| Feature | Route | Status |
|---------|-------|--------|
| Creator/kitchen public profile pages | `/food-creator/[username]` | ✅ |
| Chef stories / blog (read only) | `/by-us` | ✅ |
| City discovery pages | `/cities/*`, `/launch/*` | ✅ |
| Referral mechanics | `/referral/*` | ✅ |
| Waitlist | `/waitlist/*` | ✅ |
| Web checkout & orders | `/orders/*`, `/cart`, `/checkout` | ✅ |
| Social media links | `/us-on-social-media` | ✅ |

### Creator Web Dashboard (`/food-creator/(dashboard)/`)
| Feature | Status |
|---------|--------|
| Dashboard overview | ✅ |
| Meals management | ✅ |
| Order management | ✅ |
| Earnings & payouts | ✅ |
| Profile & settings | ✅ |
| Live session control | ✅ `/live` — go live from web dashboard |
| Content management | ✅ `/content` |
| Support chat | ✅ |

### Admin / Staff Portal
| Feature | Status |
|---------|--------|
| Video moderation & report resolution | ✅ |
| Blog/stories CRUD | ✅ |
| User management | ✅ |
| Notification management | ✅ |
| Activity feed (ops-only) | ✅ |

---

## 🔴 Missing — Genuine Gaps on the Public Surface

### 1. Social Proof on Creator Profile Pages
**Impact: High** — `/food-creator/[username]` is the main conversion page.
- No follower count
- No aggregate rating / review count displayed
- No video content grid or recipe preview on the page
- No "Follow" button (web users can browse but not follow)

### 2. Video / Content Gallery Page
**Impact: High** — Videos are published but not browsable on web.
- No `/videos` or `/explore` page
- Creator profile pages would benefit from a content grid linking to videos and recipes

### 3. Recipe Discovery Page
**Impact: Medium** — Recipe backend exists; no public browsing page.
- No `/recipes` page for SEO or discovery

### 4. Story Engagement (Likes)
**Impact: Low-Medium** — Stories (`/by-us`) display correctly but are read-only.
- No "like" button (backend schema has `likes` count)
- No comment section (backend `videoComments` pattern could be adapted)

### 5. Referral Social Sharing UX
**Impact: Medium** — `/referral/*` mechanics exist but no shareable card or native share prompt.

---

## 🟡 Intentionally Not on Web

| Feature | Reason |
|---------|--------|
| **Nosh Heaven feed** | Mobile-native gesture experience. Web gets content gallery, not TikTok-style feed. |
| **DM inbox** | Not in scope for web. |
| **Social notifications** | Mobile push handles this. |
| **Live stream watching** | Mobile-first. |
| **Group orders** | Mobile app only. |
| **Play to Win** | Mobile game. |

---

## 🗓 Build Priority

| Priority | Feature | Route |
|----------|---------|-------|
| P0 | Follower count + aggregate rating on creator profiles | `/food-creator/[username]` |
| P0 | Content grid (videos, recipes) on creator profiles | `/food-creator/[username]` |
| P1 | Public video/explore gallery | `/explore` or `/videos` |
| P1 | Recipe browsing page | `/recipes` |
| P2 | Story likes | `/by-us/[slug]` |
| P3 | Story comments | `/by-us/[slug]` |
| P3 | Referral share card with OG image | `/referral/*` |
