import { v } from 'convex/values';
import { mutation } from '../_generated/server';

/**
 * Create a special offer
 */
export const createSpecialOffer = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    call_to_action_text: v.string(),
    offer_type: v.union(
      v.literal("limited_time"),
      v.literal("seasonal"),
      v.literal("promotional"),
      v.literal("referral")
    ),
    discount_type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_delivery")
    ),
    discount_value: v.number(),
    target_audience: v.union(
      v.literal("all"),
      v.literal("new_users"),
      v.literal("existing_users"),
      v.literal("group_orders")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    starts_at: v.number(),
    ends_at: v.number(),
    badge_text: v.optional(v.string()),
    max_discount: v.optional(v.number()),
    min_order_amount: v.optional(v.number()),
    min_participants: v.optional(v.number()),
    background_image_url: v.optional(v.string()),
    background_color: v.optional(v.string()),
    text_color: v.optional(v.string()),
    action_type: v.optional(v.union(
      v.literal("navigate"),
      v.literal("external_link"),
      v.literal("group_order")
    )),
    action_target: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const offerId = `offer_${now}_${Math.random().toString(36).substring(2, 10)}`;
    
    const offerDoc = {
      offer_id: offerId,
      title: args.title,
      description: args.description,
      call_to_action_text: args.call_to_action_text,
      offer_type: args.offer_type,
      discount_type: args.discount_type,
      discount_value: args.discount_value,
      target_audience: args.target_audience,
      status: args.status,
      is_active: args.status === 'active',
      starts_at: args.starts_at,
      ends_at: args.ends_at,
      badge_text: args.badge_text,
      max_discount: args.max_discount,
      min_order_amount: args.min_order_amount,
      min_participants: args.min_participants,
      background_image_url: args.background_image_url,
      background_color: args.background_color,
      text_color: args.text_color,
      action_type: args.action_type || 'navigate',
      action_target: args.action_target || '',
      click_count: 0,
      conversion_count: 0,
      created_at: now,
      updated_at: now,
    };

    const id = await ctx.db.insert('special_offers', offerDoc);
    return id;
  },
});

/**
 * Increment click count for an offer
 */
export const incrementClickCount = mutation({
  args: {
    offer_id: v.string(),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db
      .query('special_offers')
      .withIndex('by_offer_id', q => q.eq('offer_id', args.offer_id))
      .first();

    if (!offer) {
      throw new Error('Offer not found');
    }

    await ctx.db.patch(offer._id, {
      click_count: (offer.click_count || 0) + 1,
      updated_at: Date.now(),
    });
  },
});

/**
 * Increment conversion count for an offer
 */
export const incrementConversionCount = mutation({
  args: {
    offer_id: v.string(),
  },
  handler: async (ctx, args) => {
    const offer = await ctx.db
      .query('special_offers')
      .withIndex('by_offer_id', q => q.eq('offer_id', args.offer_id))
      .first();

    if (!offer) {
      throw new Error('Offer not found');
    }

    await ctx.db.patch(offer._id, {
      conversion_count: (offer.conversion_count || 0) + 1,
      updated_at: Date.now(),
    });
  },
});

