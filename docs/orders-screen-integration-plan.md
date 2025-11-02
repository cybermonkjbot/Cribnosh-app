# Orders Screen Integration Plan

## Overview
This document outlines the complete integration plan for the Orders screen based on the provided design specification. The screen includes ongoing/past order tabs, group order support, special offers banner, and comprehensive order details.

---

## Table of Contents
1. [Database Schema Updates](#database-schema-updates)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Convex Queries & Mutations](#convex-queries--mutations)
4. [Frontend Integration](#frontend-integration)
5. [Real-time Updates](#real-time-updates)
6. [Data Transformation](#data-transformation)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Phases](#implementation-phases)

---

## 1. Database Schema Updates

### 1.1 Group Orders Table (NEW)
**File**: `packages/convex/schema.ts`

```typescript
group_orders: defineTable({
  group_order_id: v.string(), // e.g., "GRP-2024-001"
  created_by: v.id('users'),
  chef_id: v.id('chefs'),
  restaurant_name: v.string(),
  
  // Group order metadata
  title: v.string(), // e.g., "Team Lunch from Pizza Palace"
  status: v.union(
    v.literal("active"),      // Order is open for participants
    v.literal("closed"),     // Order closed, waiting for chef confirmation
    v.literal("confirmed"),  // Chef confirmed, preparing
    v.literal("preparing"),
    v.literal("ready"),
    v.literal("on_the_way"),
    v.literal("delivered"),
    v.literal("cancelled")
  ),
  
  // Participants
  participants: v.array(v.object({
    user_id: v.id('users'),
    user_name: v.string(),
    user_initials: v.string(),
    user_color: v.optional(v.string()), // For avatar color
    avatar_url: v.optional(v.string()),
    joined_at: v.number(),
    order_items: v.array(v.object({
      dish_id: v.id('meals'),
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
      special_instructions: v.optional(v.string()),
    })),
    total_contribution: v.number(), // Amount this user contributed
    payment_status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
  })),
  
  // Order totals
  total_amount: v.number(),
  discount_percentage: v.optional(v.number()), // e.g., 25 for 25% off
  discount_amount: v.optional(v.number()),
  final_amount: v.number(),
  
  // Delivery information
  delivery_address: v.optional(v.object({
    street: v.string(),
    city: v.string(),
    postcode: v.string(),
    country: v.string(),
  })),
  delivery_time: v.optional(v.string()),
  estimated_delivery_time: v.optional(v.string()), // e.g., "25-30 min"
  
  // Sharing and invitations
  share_token: v.optional(v.string()), // Unique token for sharing
  share_link: v.optional(v.string()),
  share_expires_at: v.optional(v.number()),
  
  // Timestamps
  created_at: v.number(),
  updated_at: v.number(),
  closed_at: v.optional(v.number()), // When order was closed for new participants
  expires_at: v.optional(v.number()), // Auto-expire if no activity
  
  // Linking to main order
  main_order_id: v.optional(v.id('orders')), // Links to orders table when confirmed
})
  .index("by_creator", ["created_by"])
  .index("by_chef", ["chef_id"])
  .index("by_status", ["status"])
  .index("by_share_token", ["share_token"])
  .index("by_group_order_id", ["group_order_id"]),
```

### 1.2 Special Offers/Campaigns Table (NEW)
**File**: `packages/convex/schema.ts`

```typescript
special_offers: defineTable({
  offer_id: v.string(), // e.g., "OFFER-2024-001"
  title: v.string(), // e.g., "Group Orders Special"
  description: v.string(), // e.g., "Save up to 25% when ordering together"
  call_to_action_text: v.string(), // e.g., "Start Group Order"
  
  // Offer type and badge
  offer_type: v.union(
    v.literal("limited_time"),
    v.literal("seasonal"),
    v.literal("promotional"),
    v.literal("referral")
  ),
  badge_text: v.optional(v.string()), // e.g., "LIMITED TIME"
  
  // Discount information
  discount_type: v.union(
    v.literal("percentage"), // e.g., 25% off
    v.literal("fixed_amount"), // e.g., £5 off
    v.literal("free_delivery")
  ),
  discount_value: v.number(), // Percentage or fixed amount
  max_discount: v.optional(v.number()), // Maximum discount cap
  
  // Targeting
  target_audience: v.union(
    v.literal("all"),
    v.literal("new_users"),
    v.literal("existing_users"),
    v.literal("group_orders")
  ),
  
  // Eligibility
  min_order_amount: v.optional(v.number()),
  min_participants: v.optional(v.number()), // For group orders
  
  // Status and scheduling
  status: v.union(
    v.literal("draft"),
    v.literal("active"),
    v.literal("paused"),
    v.literal("expired"),
    v.literal("cancelled")
  ),
  is_active: v.boolean(),
  
  // Visual assets
  background_image_url: v.optional(v.string()),
  background_color: v.optional(v.string()), // e.g., "#dc2626" (Cribnosh red)
  text_color: v.optional(v.string()),
  
  // Schedule
  starts_at: v.number(),
  ends_at: v.number(),
  
  // Tracking
  click_count: v.optional(v.number()),
  conversion_count: v.optional(v.number()),
  
  // Navigation
  action_type: v.union(
    v.literal("navigate"), // Navigate to screen
    v.literal("external_link"), // External URL
    v.literal("group_order") // Start group order
  ),
  action_target: v.string(), // Route or URL
  
  created_at: v.number(),
  updated_at: v.number(),
})
  .index("by_status", ["status", "is_active"])
  .index("by_dates", ["starts_at", "ends_at"])
  .index("by_target", ["target_audience"]),
```

### 1.3 Update Orders Table
**File**: `packages/convex/schema.ts`

Add fields to existing `orders` table:

```typescript
// In orders table definition, add:
is_group_order: v.optional(v.boolean()),
group_order_id: v.optional(v.id('group_orders')), // Link to group_orders table
participant_count: v.optional(v.number()), // Number of participants in group order
```

---

## 2. Backend API Endpoints

### 2.1 Orders Endpoints (Update Existing)

#### 2.1.1 GET /customer/orders
**File**: `apps/web/app/api/customer/orders/route.ts`

**Current State**: Returns all orders, client-side filtering for ongoing/past
**Updates Needed**:
- Add `status` query parameter filter: `?status=ongoing|past|all`
- Add `order_type` filter: `?order_type=individual|group|all`
- Enhance response to include group order participant info when applicable

**Request Query Parameters**:
```typescript
{
  page?: number;
  limit?: number;
  status?: "ongoing" | "past" | "all"; // NEW
  order_type?: "individual" | "group" | "all"; // NEW
  sort_by?: "date" | "amount" | "status";
  sort_order?: "asc" | "desc";
}
```

**Response Format**:
```typescript
{
  success: true,
  data: {
    orders: Array<{
      _id: string;
      order_id: string;
      customer_id: string;
      chef_id: string;
      order_date: string;
      total_amount: number;
      order_status: "pending" | "confirmed" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";
      payment_status: string;
      
      // Group order info (if applicable)
      is_group_order?: boolean;
      group_order?: {
        group_order_id: string;
        participants: Array<{
          user_id: string;
          user_name: string;
          user_initials: string;
          user_color?: string;
          total_contribution: number;
        }>;
        total_participants: number;
      };
      
      // Order items with enhanced info
      order_items: Array<{
        dish_id: string;
        name: string;
        quantity: number;
        price: number;
      }>;
      
      // Estimated times
      estimated_prep_time_minutes?: number;
      estimated_delivery_time?: string; // e.g., "25-30 min"
      
      // Timestamps
      createdAt: number;
      updatedAt?: number;
    }>;
    total: number;
    limit: number;
    offset: number;
  }
}
```

**Implementation Notes**:
- Status filter logic:
  - `ongoing`: `order_status` IN ["pending", "confirmed", "preparing", "ready", "on_the_way"]
  - `past`: `order_status` IN ["delivered", "cancelled"]
- If `is_group_order` is true, join with `group_orders` table to fetch participant info

#### 2.1.2 GET /customer/orders/{order_id}
**File**: `apps/web/app/api/customer/orders/[order_id]/route.ts`

**Updates Needed**:
- Include group order participant details when applicable
- Include estimated delivery time in readable format

### 2.2 Group Orders Endpoints (NEW)

#### 2.2.1 POST /customer/group-orders
**File**: `apps/web/app/api/customer/group-orders/route.ts` (NEW)

Create a new group order.

**Request Body**:
```typescript
{
  chef_id: string;
  restaurant_name: string;
  title: string; // Optional, defaults to "{User}'s group order from {Restaurant}"
  delivery_address?: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  delivery_time?: string; // ISO date string
  expires_in_hours?: number; // Default: 24
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    group_order_id: string;
    share_token: string;
    share_link: string; // e.g., "https://cribnosh.app/group-order/{share_token}"
    expires_at: number; // Timestamp
  }
}
```

#### 2.2.2 GET /customer/group-orders/{group_order_id}
**File**: `apps/web/app/api/customer/group-orders/[group_order_id]/route.ts` (NEW)

Get group order details including all participants and their contributions.

#### 2.2.3 POST /customer/group-orders/{group_order_id}/join
**File**: `apps/web/app/api/customer/group-orders/[group_order_id]/join/route.ts` (NEW)

Join an existing group order via share link.

**Request Body**:
```typescript
{
  share_token?: string; // If joining via share link
  order_items: Array<{
    dish_id: string;
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
}
```

#### 2.2.4 POST /customer/group-orders/{group_order_id}/close
**File**: `apps/web/app/api/customer/group-orders/[group_order_id]/close/route.ts` (NEW)

Close the group order for new participants and convert to regular order.

#### 2.2.5 GET /customer/group-orders/{group_order_id}/share
**File**: `apps/web/app/api/customer/group-orders/[group_order_id]/share/route.ts` (NEW)

Generate or regenerate share link for group order.

### 2.3 Special Offers Endpoints (NEW)

#### 2.3.1 GET /customer/offers/active
**File**: `apps/web/app/api/customer/offers/active/route.ts` (NEW)

Get active special offers for the current user.

**Query Parameters**:
```typescript
{
  target?: "all" | "new_users" | "existing_users" | "group_orders";
  location?: string; // Optional location-based offers
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    offers: Array<{
      offer_id: string;
      title: string;
      description: string;
      call_to_action_text: string;
      offer_type: "limited_time" | "seasonal" | "promotional" | "referral";
      badge_text?: string; // e.g., "LIMITED TIME"
      discount_type: "percentage" | "fixed_amount" | "free_delivery";
      discount_value: number;
      background_image_url?: string;
      background_color?: string;
      text_color?: string;
      action_type: "navigate" | "external_link" | "group_order";
      action_target: string;
      starts_at: number;
      ends_at: number;
    }>;
  }
}
```

**Implementation Notes**:
- Filter by:
  - `status === "active" && is_active === true`
  - Current time between `starts_at` and `ends_at`
  - User eligibility based on `target_audience`
- Return offers sorted by priority/date

---

## 3. Convex Queries & Mutations

### 3.1 Orders Queries (Update Existing)

#### 3.1.1 Update `listByCustomer`
**File**: `packages/convex/queries/orders.ts`

Add status and type filtering:

```typescript
export const listByCustomer = query({
  args: { 
    customer_id: v.string(),
    status: v.optional(v.union(
      v.literal("ongoing"),
      v.literal("past"),
      v.literal("all")
    )),
    order_type: v.optional(v.union(
      v.literal("individual"),
      v.literal("group"),
      v.literal("all")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query('orders')
      .withIndex('by_customer', q => q.eq('customer_id', args.customer_id));
    
    const allOrders = await query.collect();
    
    // Apply status filter
    let filtered = allOrders;
    if (args.status && args.status !== "all") {
      const ongoingStatuses = ["pending", "confirmed", "preparing", "ready", "on_the_way"];
      if (args.status === "ongoing") {
        filtered = filtered.filter(o => ongoingStatuses.includes(o.order_status));
      } else if (args.status === "past") {
        filtered = filtered.filter(o => 
          o.order_status === "delivered" || o.order_status === "cancelled"
        );
      }
    }
    
    // Apply order type filter
    if (args.order_type && args.order_type !== "all") {
      filtered = filtered.filter(o => {
        if (args.order_type === "group") {
          return o.is_group_order === true;
        } else {
          return o.is_group_order !== true;
        }
      });
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    // Pagination
    const offset = args.offset || 0;
    const limit = args.limit || 20;
    const paginated = filtered.slice(offset, offset + limit);
    
    // Enrich with group order data if applicable
    const enriched = await Promise.all(paginated.map(async (order) => {
      if (order.is_group_order && order.group_order_id) {
        const groupOrder = await ctx.db.get(order.group_order_id);
        return {
          ...order,
          group_order_details: groupOrder ? {
            participants: groupOrder.participants.map(p => ({
              user_id: p.user_id,
              user_name: p.user_name,
              user_initials: p.user_initials,
              user_color: p.user_color,
              total_contribution: p.total_contribution,
            })),
            total_participants: groupOrder.participants.length,
          } : null,
        };
      }
      return order;
    }));
    
    return enriched;
  },
});
```

### 3.2 Group Orders Queries (NEW)

**File**: `packages/convex/queries/groupOrders.ts` (NEW)

```typescript
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get group order by ID
export const getById = query({
  args: { group_order_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .filter(q => q.eq(q.field('group_order_id'), args.group_order_id))
      .first();
  },
});

// Get group order by share token
export const getByShareToken = query({
  args: { share_token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .withIndex('by_share_token', q => q.eq('share_token', args.share_token))
      .first();
  },
});

// Get active group orders for a user (as creator or participant)
export const getActiveByUser = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    // Get orders where user is creator
    const asCreator = await ctx.db
      .query('group_orders')
      .withIndex('by_creator', q => q.eq('created_by', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Get orders where user is participant
    const allActive = await ctx.db
      .query('group_orders')
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    const asParticipant = allActive.filter(go => 
      go.participants.some(p => p.user_id === args.user_id)
    );
    
    return [...asCreator, ...asParticipant];
  },
});
```

### 3.3 Group Orders Mutations (NEW)

**File**: `packages/convex/mutations/groupOrders.ts` (NEW)

```typescript
import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import crypto from 'crypto';

// Create group order
export const create = mutation({
  args: {
    created_by: v.id('users'),
    chef_id: v.id('chefs'),
    restaurant_name: v.string(),
    title: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    delivery_time: v.optional(v.string()),
    expires_in_hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresInHours = args.expires_in_hours || 24;
    const expiresAt = now + (expiresInHours * 60 * 60 * 1000);
    
    // Generate unique IDs
    const groupOrderId = `GRP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const shareToken = crypto.randomBytes(24).toString('hex');
    const shareExpiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.app';
    const shareLink = `${baseUrl}/group-order/${shareToken}`;
    
    // Get user info for creator
    const creator = await ctx.db.get(args.created_by);
    
    const groupOrderId_doc = await ctx.db.insert('group_orders', {
      group_order_id: groupOrderId,
      created_by: args.created_by,
      chef_id: args.chef_id,
      restaurant_name: args.restaurant_name,
      title: args.title || `${creator?.name || 'User'}'s group order from ${args.restaurant_name}`,
      status: 'active',
      participants: [], // Creator will be added as first participant separately
      total_amount: 0,
      final_amount: 0,
      delivery_address: args.delivery_address,
      delivery_time: args.delivery_time,
      share_token: shareToken,
      share_link: shareLink,
      share_expires_at: shareExpiresAt,
      created_at: now,
      updated_at: now,
      expires_at: expiresAt,
    });
    
    return {
      group_order_id: groupOrderId,
      share_token: shareToken,
      share_link: shareLink,
      expires_at: expiresAt,
      _id: groupOrderId_doc,
    };
  },
});

// Join group order
export const join = mutation({
  args: {
    group_order_id: v.id('group_orders'),
    user_id: v.id('users'),
    order_items: v.array(v.object({
      dish_id: v.id('meals'),
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
      special_instructions: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const groupOrder = await ctx.db.get(args.group_order_id);
    if (!groupOrder) {
      throw new Error('Group order not found');
    }
    
    if (groupOrder.status !== 'active') {
      throw new Error('Group order is no longer accepting participants');
    }
    
    // Check if user already joined
    const existingParticipant = groupOrder.participants.find(
      p => p.user_id === args.user_id
    );
    if (existingParticipant) {
      throw new Error('User already joined this group order');
    }
    
    // Get user info
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Calculate user's contribution
    const totalContribution = args.order_items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    // Generate user initials and color
    const userInitials = user.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471'];
    const userColor = colors[groupOrder.participants.length % colors.length];
    
    // Add participant
    const newParticipant = {
      user_id: args.user_id,
      user_name: user.name || 'User',
      user_initials: userInitials,
      user_color: userColor,
      joined_at: Date.now(),
      order_items: args.order_items,
      total_contribution: totalContribution,
      payment_status: 'pending' as const,
    };
    
    // Update group order
    const updatedParticipants = [...groupOrder.participants, newParticipant];
    const newTotalAmount = updatedParticipants.reduce(
      (sum, p) => sum + p.total_contribution, 
      0
    );
    
    // Calculate discount (if applicable - 25% for group orders with 2+ participants)
    const discountPercentage = updatedParticipants.length >= 2 ? 25 : 0;
    const discountAmount = discountPercentage > 0 
      ? (newTotalAmount * discountPercentage) / 100 
      : 0;
    const finalAmount = newTotalAmount - discountAmount;
    
    await ctx.db.patch(args.group_order_id, {
      participants: updatedParticipants,
      total_amount: newTotalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      updated_at: Date.now(),
    });
    
    return {
      success: true,
      participant: newParticipant,
      group_order: {
        total_amount: newTotalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        participant_count: updatedParticipants.length,
      },
    };
  },
});

// Close group order and convert to regular order
export const close = mutation({
  args: {
    group_order_id: v.id('group_orders'),
    closed_by: v.id('users'),
  },
  handler: async (ctx, args) => {
    const groupOrder = await ctx.db.get(args.group_order_id);
    if (!groupOrder) {
      throw new Error('Group order not found');
    }
    
    if (groupOrder.created_by !== args.closed_by) {
      throw new Error('Only the creator can close the group order');
    }
    
    if (groupOrder.participants.length === 0) {
      throw new Error('Cannot close empty group order');
    }
    
    const now = Date.now();
    
    // Create main order from group order
    const orderItems = groupOrder.participants.flatMap(p => 
      p.order_items.map(item => ({
        dish_id: item.dish_id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }))
    );
    
    const mainOrderId = await ctx.db.insert('orders', {
      order_id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      customer_id: groupOrder.created_by, // Main order owner
      chef_id: groupOrder.chef_id,
      order_date: new Date().toISOString(),
      total_amount: groupOrder.final_amount,
      order_status: 'pending',
      payment_status: 'pending',
      order_items: orderItems,
      delivery_address: groupOrder.delivery_address,
      delivery_time: groupOrder.delivery_time,
      is_group_order: true,
      group_order_id: args.group_order_id,
      participant_count: groupOrder.participants.length,
      estimated_prep_time_minutes: 30, // Default, should be calculated
      createdAt: now,
      updatedAt: now,
    });
    
    // Update group order status
    await ctx.db.patch(args.group_order_id, {
      status: 'confirmed',
      main_order_id: mainOrderId,
      closed_at: now,
      updated_at: now,
    });
    
    return {
      success: true,
      main_order_id: mainOrderId,
      order_id: (await ctx.db.get(mainOrderId))?.order_id,
    };
  },
});
```

### 3.4 Special Offers Queries (NEW)

**File**: `packages/convex/queries/specialOffers.ts` (NEW)

```typescript
import { v } from 'convex/values';
import { query } from '../_generated/server';

// Get active offers for user
export const getActiveOffers = query({
  args: {
    user_id: v.optional(v.id('users')),
    target_audience: v.optional(v.union(
      v.literal('all'),
      v.literal('new_users'),
      v.literal('existing_users'),
      v.literal('group_orders')
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Query active offers
    let offers = await ctx.db
      .query('special_offers')
      .withIndex('by_status', q => 
        q.eq('status', 'active').eq('is_active', true)
      )
      .filter(q => 
        q.and(
          q.lte(q.field('starts_at'), now),
          q.gte(q.field('ends_at'), now)
        )
      )
      .collect();
    
    // Filter by target audience if specified
    if (args.target_audience && args.target_audience !== 'all') {
      offers = offers.filter(o => 
        o.target_audience === args.target_audience || 
        o.target_audience === 'all'
      );
    }
    
    // Sort by priority (could add priority field later)
    offers.sort((a, b) => b.created_at - a.created_at);
    
    return offers;
  },
});
```

---

## 4. Frontend Integration

### 4.1 Mobile App Updates

#### 4.1.1 Orders Screen Component
**File**: `apps/mobile/app/(tabs)/orders/index.tsx`

**Updates Needed**:

1. **Remove mock data dependency**:
   - Remove hardcoded `ongoingOrders` and `pastOrders` arrays
   - Fully rely on API data

2. **Update API calls**:
   ```typescript
   // Replace existing queries with:
   const {
     data: ordersData,
     isLoading: ordersLoading,
     error: ordersError,
   } = useGetOrdersQuery(
     {
       page: 1,
       limit: 20,
       status: activeTab === "ongoing" ? "ongoing" : "past", // NEW
       order_type: "all", // or filter by type
     },
     {
       skip: false,
     }
   );
   
   // Add special offers query
   const {
     data: offersData,
     isLoading: offersLoading,
   } = useGetActiveOffersQuery(
     { target_audience: "group_orders" },
     { skip: false }
   );
   ```

3. **Data transformation**:
   - Update `convertApiOrderToOrder` to handle group order participants
   - Map API response to UI format with participant avatars

4. **Status mapping**:
   ```typescript
   const statusMap: Record<string, OrderStatus> = {
     pending: "preparing",
     confirmed: "preparing",
     preparing: "preparing",
     ready: "ready",
     on_the_way: "on-the-way", // Map API format
     delivered: "delivered",
     cancelled: "cancelled",
   };
   ```

5. **Estimated time formatting**:
   - Use `estimated_delivery_time` from API
   - Format as "25-30 min" or similar

6. **Campaign banner integration**:
   ```typescript
   // Use active offer from API instead of hardcoded
   const activeOffer = offersData?.data?.offers?.[0];
   
   {activeOffer && (
     <OrdersCampaignBanner 
       offer={activeOffer}
       onPress={() => {
         if (activeOffer.action_type === "group_order") {
           router.push("/orders/group");
         } else if (activeOffer.action_type === "navigate") {
           router.push(activeOffer.action_target);
         }
       }}
     />
   )}
   ```

#### 4.1.2 OrderCard Component
**File**: `apps/mobile/components/ui/OrderCard.tsx`

**Updates Needed**:
- Already supports `groupOrder` prop
- Ensure it correctly displays participant avatars from API data
- Verify status badge colors match design (yellow for "Preparing", blue for "On the way")

#### 4.1.3 OrdersCampaignBanner Component
**File**: `apps/mobile/components/ui/OrdersCampaignBanner.tsx`

**Updates Needed**:
- Accept `offer` prop from API
- Dynamically render offer title, description, badge text
- Use offer's background image/color

#### 4.1.4 API Store Updates
**File**: `apps/mobile/store/customerApi.ts`

**Add new endpoints**:

```typescript
// Add to endpoints object:

// Get active offers
getActiveOffers: builder.query<GetActiveOffersResponse, GetActiveOffersParams>({
  query: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.target) searchParams.append('target', params.target);
    return {
      url: `/customer/offers/active${searchParams.toString() ? `?${searchParams}` : ''}`,
      method: 'GET',
    };
  },
  providesTags: ['Offers'],
}),

// Create group order
createGroupOrder: builder.mutation<CreateGroupOrderResponse, CreateGroupOrderRequest>({
  query: (data) => ({
    url: '/customer/group-orders',
    method: 'POST',
    body: data,
  }),
  invalidatesTags: ['Orders', 'GroupOrders'],
}),

// Join group order
joinGroupOrder: builder.mutation<JoinGroupOrderResponse, JoinGroupOrderRequest>({
  query: ({ group_order_id, ...data }) => ({
    url: `/customer/group-orders/${group_order_id}/join`,
    method: 'POST',
    body: data,
  }),
  invalidatesTags: ['Orders', 'GroupOrders'],
}),

// Get group order details
getGroupOrder: builder.query<GetGroupOrderResponse, string>({
  query: (groupOrderId) => ({
    url: `/customer/group-orders/${groupOrderId}`,
    method: 'GET',
  }),
  providesTags: ['GroupOrders'],
}),
```

#### 4.1.5 Type Definitions
**File**: `apps/mobile/types/customer.ts`

**Add new types**:

```typescript
// Group Order Types
export interface GroupOrder {
  group_order_id: string;
  created_by: string;
  chef_id: string;
  restaurant_name: string;
  title: string;
  status: "active" | "closed" | "confirmed" | "preparing" | "ready" | "on_the_way" | "delivered" | "cancelled";
  participants: GroupOrderParticipant[];
  total_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  final_amount: number;
  share_token?: string;
  share_link?: string;
  estimated_delivery_time?: string;
  created_at: number;
}

export interface GroupOrderParticipant {
  user_id: string;
  user_name: string;
  user_initials: string;
  user_color?: string;
  avatar_url?: string;
  total_contribution: number;
  payment_status: "pending" | "paid" | "failed";
}

// Special Offer Types
export interface SpecialOffer {
  offer_id: string;
  title: string;
  description: string;
  call_to_action_text: string;
  offer_type: "limited_time" | "seasonal" | "promotional" | "referral";
  badge_text?: string;
  discount_type: "percentage" | "fixed_amount" | "free_delivery";
  discount_value: number;
  background_image_url?: string;
  background_color?: string;
  text_color?: string;
  action_type: "navigate" | "external_link" | "group_order";
  action_target: string;
  starts_at: number;
  ends_at: number;
}
```

---

## 5. Real-time Updates

### 5.1 Order Status Updates

**Implementation Options**:

1. **Polling** (Simplest):
   - Poll order status every 30 seconds for ongoing orders
   - Use React Query's `refetchInterval`

2. **WebSockets** (Recommended):
   - Set up WebSocket connection for real-time updates
   - Listen to order status change events
   - Update order cards in real-time

3. **Server-Sent Events (SSE)**:
   - Alternative to WebSockets
   - Simpler implementation for one-way updates

**Recommended Implementation**:

```typescript
// In OrdersScreen component
useEffect(() => {
  if (activeTab === "ongoing" && ordersData?.data?.orders?.length > 0) {
    // Poll every 30 seconds for ongoing orders
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }
}, [activeTab, ordersData, refetch]);
```

### 5.2 Group Order Updates

- Listen for participant join/leave events
- Update participant avatars in real-time
- Update total amount and discount when participants join

---

## 6. Data Transformation

### 6.1 API Response to UI Format

**Function**: `convertApiOrderToOrder`

**Updates**:

```typescript
const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
  const statusMap: Record<string, OrderStatus> = {
    pending: "preparing",
    confirmed: "preparing",
    preparing: "preparing",
    ready: "ready",
    on_the_way: "on-the-way",
    delivered: "delivered",
    cancelled: "cancelled",
  };

  // Format timestamp
  const timestamp = apiOrder.createdAt 
    ? new Date(apiOrder.createdAt).getTime()
    : Date.now();
  const date = new Date(timestamp);
  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const day = date.getDate();
  const monthName = date.toLocaleString('en-GB', { month: 'long' });
  const formattedTime = `${time} • ${day}${getOrdinalSuffix(day)} ${monthName}`;

  // Format estimated time
  let estimatedTime = "TBD";
  if (apiOrder.estimated_prep_time_minutes) {
    const mins = apiOrder.estimated_prep_time_minutes;
    estimatedTime = `${mins}-${mins + 5} min`;
  } else if (apiOrder.estimated_delivery_time) {
    estimatedTime = apiOrder.estimated_delivery_time;
  }

  const baseOrder: Order = {
    id: apiOrder._id || apiOrder.id,
    time: formattedTime,
    description: apiOrder.order_items 
      ? `${apiOrder.order_items.map((item: any) => item.name || item.dish_name).join(", ")} from ${apiOrder.kitchen_name || apiOrder.restaurant_name || "Kitchen"}`
      : "Order",
    price: `£${((apiOrder.total_amount || apiOrder.total || 0) / 100).toFixed(2)}`,
    status: statusMap[apiOrder.order_status || apiOrder.status] || "preparing",
    estimatedTime,
    kitchenName: apiOrder.kitchen_name || apiOrder.restaurant_name,
    orderNumber: `#${apiOrder.order_id || apiOrder.id}`,
    items: apiOrder.order_items?.map((item: any) => item.name || item.dish_name) || [],
    orderType: apiOrder.is_group_order ? "group" : "individual",
  };

  // Add group order info if applicable
  if (apiOrder.is_group_order && apiOrder.group_order) {
    baseOrder.groupOrder = {
      id: apiOrder.group_order.group_order_id || apiOrder.group_order.id,
      users: apiOrder.group_order.participants?.map((p: any) => ({
        id: p.user_id,
        name: p.user_name,
        initials: p.user_initials || p.user_name.charAt(0).toUpperCase(),
        color: p.user_color,
        avatar: p.avatar_url,
      })) || [],
      totalUsers: apiOrder.group_order.total_participants || apiOrder.group_order.participants?.length || 0,
      isActive: apiOrder.order_status !== "delivered" && apiOrder.order_status !== "cancelled",
    };
  }

  return baseOrder;
};

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
```

---

## 7. Testing Strategy

### 7.1 Backend Testing

1. **API Endpoint Tests**:
   - Test order filtering (ongoing vs past)
   - Test group order creation and joining
   - Test special offers retrieval
   - Test authorization (users can only see their orders)

2. **Database Tests**:
   - Verify group order participant updates
   - Verify discount calculations
   - Verify share token generation

### 7.2 Frontend Testing

1. **Component Tests**:
   - Test order card rendering with group order participants
   - Test status badge display
   - Test campaign banner with dynamic offer data

2. **Integration Tests**:
   - Test order list fetching and filtering
   - Test tab switching (ongoing/past)
   - Test empty states

### 7.3 E2E Testing

1. **User Flows**:
   - Create individual order → appears in ongoing tab
   - Create group order → share link → join → appears in ongoing tab
   - Order status changes → UI updates
   - Order delivered → moves to past tab

---

## 8. Implementation Phases

### Phase 1: Database & Backend Foundation (Week 1)
- [ ] Create `group_orders` table schema
- [ ] Create `special_offers` table schema
- [ ] Update `orders` table with group order fields
- [ ] Create Convex queries for group orders
- [ ] Create Convex mutations for group orders
- [ ] Create Convex queries for special offers

### Phase 2: API Endpoints (Week 1-2)
- [ ] Update `GET /customer/orders` with status/type filtering
- [ ] Create `POST /customer/group-orders`
- [ ] Create `GET /customer/group-orders/{id}`
- [ ] Create `POST /customer/group-orders/{id}/join`
- [ ] Create `POST /customer/group-orders/{id}/close`
- [ ] Create `GET /customer/offers/active`

### Phase 3: Frontend Integration (Week 2-3)
- [ ] Update mobile API store with new endpoints
- [ ] Update Orders screen to use filtered API calls
- [ ] Remove mock data dependency
- [ ] Update data transformation functions
- [ ] Integrate special offers API into campaign banner
- [ ] Add group order participant display
- [ ] Test real-time updates (polling or WebSocket)

### Phase 4: Polish & Testing (Week 3-4)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty states
- [ ] Test all user flows
- [ ] Performance optimization
- [ ] Accessibility improvements

### Phase 5: Real-time Updates (Week 4-5)
- [ ] Implement WebSocket/SSE for order status updates
- [ ] Implement real-time group order participant updates
- [ ] Add notification system for status changes

---

## Additional Considerations

### Error Handling
- Handle network failures gracefully
- Show retry buttons for failed requests
- Cache order data for offline viewing

### Performance
- Implement pagination for large order lists
- Lazy load order details
- Optimize image loading for avatars

### Accessibility
- Ensure screen reader compatibility
- Add proper ARIA labels
- Test keyboard navigation

### Localization
- Support multiple date formats
- Support multiple currencies (though design shows £)
- Support multiple languages

---

## Notes

1. **Order ID Format**: Current implementation uses `order_id` string field. Ensure consistency between `order_id` (string) and `_id` (Convex document ID).

2. **Status Consistency**: Ensure status values match between frontend (`on-the-way`) and backend (`on_the_way`). Create mapping function.

3. **Time Formatting**: Design shows "19:18 • 6th June". Implement date formatting utility to match exactly.

4. **Participant Colors**: Use consistent color palette for participant avatars. Consider using user's profile color if available.

5. **Discount Calculation**: Group order discount (25%) should only apply when 2+ participants join. Document this in business logic.

6. **Share Link Expiration**: Group order share links expire after 30 days or when order is closed. Handle expired link errors gracefully.

---

## Conclusion

This integration plan provides a comprehensive roadmap for implementing the Orders screen with full backend and frontend integration. Follow the phases sequentially, testing at each step to ensure quality.

For questions or clarifications, refer to the existing codebase patterns and the design specification provided.

