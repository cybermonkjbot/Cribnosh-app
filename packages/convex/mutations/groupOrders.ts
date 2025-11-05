import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';

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
    const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const shareExpiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.app';
    const shareLink = `${baseUrl}/group-order/${shareToken}`;
    
    // Get user info for creator
    const creator = await ctx.db.get(args.created_by);
    const userName = creator?.name || 'User';
    
    const groupOrderId_doc = await ctx.db.insert('group_orders', {
      group_order_id: groupOrderId,
      created_by: args.created_by,
      chef_id: args.chef_id,
      restaurant_name: args.restaurant_name,
      title: args.title || `${userName}'s group order from ${args.restaurant_name}`,
      status: 'active',
      participants: [],
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
    
    // Calculate discount (25% for group orders with 2+ participants)
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
    
    // Automatically create connection between joiner and all existing participants
    // This tracks group order relationships
    const now = Date.now();
    for (const existingParticipant of groupOrder.participants) {
      // Create bidirectional connections (joiner -> existing, existing -> joiner)
      // Check if connection already exists
      const existingConnection1 = await ctx.db
        .query('user_connections')
        .withIndex('by_user_connected', q => 
          q.eq('user_id', args.user_id).eq('connected_user_id', existingParticipant.user_id)
        )
        .first();
      
      if (!existingConnection1 || existingConnection1.status !== 'active') {
        // Create connection: joiner -> existing participant
        if (existingConnection1) {
          await ctx.db.patch(existingConnection1._id, {
            status: 'active',
            updated_at: now,
          });
        } else {
          await ctx.db.insert('user_connections', {
            user_id: args.user_id,
            connected_user_id: existingParticipant.user_id,
            connection_type: 'friend', // Group order participants are friends
            status: 'active',
            created_at: now,
          });
        }
        
        // Create reverse connection: existing participant -> joiner
        const existingConnection2 = await ctx.db
          .query('user_connections')
          .withIndex('by_user_connected', q => 
            q.eq('user_id', existingParticipant.user_id).eq('connected_user_id', args.user_id)
          )
          .first();
        
        if (existingConnection2) {
          await ctx.db.patch(existingConnection2._id, {
            status: 'active',
            updated_at: now,
          });
        } else {
          await ctx.db.insert('user_connections', {
            user_id: existingParticipant.user_id,
            connected_user_id: args.user_id,
            connection_type: 'friend',
            status: 'active',
            created_at: now,
          });
        }
      }
    }
    
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
      customer_id: groupOrder.created_by,
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
      estimated_prep_time_minutes: 30,
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
    
    const mainOrder = await ctx.db.get(mainOrderId);
    
    return {
      success: true,
      main_order_id: mainOrderId,
      order_id: mainOrder?.order_id,
    };
  },
});

