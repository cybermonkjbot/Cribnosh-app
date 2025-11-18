import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { query } from '../_generated/server';

// Get all connections for a user
export const getConnectionsByUser = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('user_connections')
      .withIndex('by_user', q => q.eq('user_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    return connections;
  },
});

// Get inferred colleagues from shared company
export const getColleaguesByCompany = query({
  args: { 
    user_id: v.id('users'),
    company: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user to check their company
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return [];
    }
    
    // Get all users with the same company (excluding self)
    const allUsers = await ctx.db.query('users').collect();
    const colleagues = allUsers.filter(u => 
      u._id !== args.user_id && 
      (u as any).company === args.company
    );
    
    return colleagues;
  },
});

// Check if two users are connected
export const areUsersConnected = query({
  args: {
    user_id_1: v.id('users'),
    user_id_2: v.id('users'),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query('user_connections')
      .withIndex('by_user_connected', q => 
        q.eq('user_id', args.user_id_1).eq('connected_user_id', args.user_id_2)
      )
      .filter(q => q.eq(q.field('status'), 'active'))
      .first();
    
    return connection !== null;
  },
});

// Get all user connections aggregated from all sources
export const getAllUserConnections = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    const connections: Array<{
      user_id: Id<'users'>;
      user_name: string;
      connection_type: string;
      source: string;
      metadata?: any;
    }> = [];
    
    // 1. Family members from familyProfiles
    const familyProfiles = await ctx.db
      .query('familyProfiles')
      .withIndex('by_user', q => q.eq('userId', args.user_id))
      .collect();
    
    for (const profile of familyProfiles) {
      for (const memberUserId of profile.member_user_ids) {
        const member = await ctx.db.get(memberUserId);
        if (member) {
          const familyMember = profile.family_members.find(m => m.user_id === memberUserId);
          connections.push({
            user_id: memberUserId,
            user_name: member.name,
            connection_type: 'family',
            source: 'family_profile',
            metadata: {
              relationship: familyMember?.relationship,
              family_profile_id: profile._id,
            },
          });
        }
      }
    }
    
    // 2. Referrals (users who were invited by this user)
    const referrals = await ctx.db
      .query('referrals')
      .withIndex('by_referrer', q => q.eq('referrerId', args.user_id))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();
    
    for (const referral of referrals) {
      if (referral.referredUserId) {
        const referredUser = await ctx.db.get(referral.referredUserId);
        if (referredUser) {
          connections.push({
            user_id: referral.referredUserId,
            user_name: referredUser.name,
            connection_type: 'referral',
            source: 'referral',
            metadata: {
              referral_id: referral._id,
              completed_at: referral.completedAt,
            },
          });
        }
      }
    }
    
    // 2b. Reverse referrals (users who referred this user)
    const reverseReferrals = await ctx.db
      .query('referrals')
      .withIndex('by_referred_user', q => q.eq('referredUserId', args.user_id))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();
    
    for (const referral of reverseReferrals) {
      const referrerUser = await ctx.db.get(referral.referrerId);
      if (referrerUser) {
        connections.push({
          user_id: referral.referrerId,
          user_name: referrerUser.name,
          connection_type: 'referral',
          source: 'referral_reverse',
          metadata: {
            referral_id: referral._id,
            completed_at: referral.completedAt,
          },
        });
      }
    }
    
    // 3. Treats (both directions)
    // User treated others
    const treatsGiven = await ctx.db
      .query('treats')
      .withIndex('by_treater', q => q.eq('treater_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'claimed'))
      .collect();
    
    for (const treat of treatsGiven) {
      if (treat.treated_user_id) {
        const treatedUser = await ctx.db.get(treat.treated_user_id);
        if (treatedUser) {
          connections.push({
            user_id: treat.treated_user_id,
            user_name: treatedUser.name,
            connection_type: 'treat',
            source: 'treat',
            metadata: {
              treat_id: treat._id,
              direction: 'given',
              claimed_at: treat.claimed_at,
            },
          });
        }
      }
    }
    
    // User was treated by others
    const treatsReceived = await ctx.db
      .query('treats')
      .withIndex('by_treated_user', q => q.eq('treated_user_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'claimed'))
      .collect();
    
    for (const treat of treatsReceived) {
      const treaterUser = await ctx.db.get(treat.treater_id);
      if (treaterUser) {
        connections.push({
          user_id: treat.treater_id,
          user_name: treaterUser.name,
          connection_type: 'treat',
          source: 'treat',
          metadata: {
            treat_id: treat._id,
            direction: 'received',
            claimed_at: treat.claimed_at,
          },
        });
      }
    }
    
    // 4. Group order participants
    const groupOrders = await ctx.db
      .query('group_orders')
      .withIndex('by_creator', q => q.eq('created_by', args.user_id))
      .collect();
    
    // Also get group orders where user is a participant
    const allGroupOrders = await ctx.db.query('group_orders').collect();
    const participantGroupOrders = allGroupOrders.filter(go => 
      go.participants.some(p => p.user_id === args.user_id)
    );
    
    const allRelevantGroupOrders = [...groupOrders, ...participantGroupOrders];
    
    for (const groupOrder of allRelevantGroupOrders) {
      for (const participant of groupOrder.participants) {
        if (participant.user_id !== args.user_id) {
          // Check if already added
          const exists = connections.some(c => c.user_id === participant.user_id && c.source === 'group_order');
          if (!exists) {
            const participantUser = await ctx.db.get(participant.user_id);
            if (participantUser) {
              connections.push({
                user_id: participant.user_id,
                user_name: participantUser.name,
                connection_type: 'group_order',
                source: 'group_order',
                metadata: {
                  group_order_id: groupOrder._id,
                  group_order_title: groupOrder.title,
                },
              });
            }
          }
        }
      }
    }
    
    // 5. Manual connections from user_connections
    const manualConnections = await ctx.db
      .query('user_connections')
      .withIndex('by_user', q => q.eq('user_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    for (const connection of manualConnections) {
      const connectedUser = await ctx.db.get(connection.connected_user_id);
      if (connectedUser) {
        connections.push({
          user_id: connection.connected_user_id,
          user_name: connectedUser.name,
          connection_type: connection.connection_type === 'colleague' ? 'colleague_manual' : 'friend',
          source: 'manual_connection',
          metadata: {
            connection_id: connection._id,
            company: connection.company,
          },
        });
      }
    }
    
    // 6. Inferred colleagues from shared company
    const user = await ctx.db.get(args.user_id);
    const userCompany = (user as any)?.company;
    if (user && userCompany) {
      const allUsers = await ctx.db.query('users').collect();
      const inferredColleagues = allUsers.filter(u => 
        u._id !== args.user_id && 
        (u as any).company === userCompany
      );
      
      for (const colleague of inferredColleagues) {
        // Check if already added as manual connection
        const exists = connections.some(c => 
          c.user_id === colleague._id && 
          (c.connection_type === 'colleague_manual' || c.connection_type === 'colleague_inferred')
        );
        if (!exists) {
          connections.push({
            user_id: colleague._id,
            user_name: colleague.name,
            connection_type: 'colleague_inferred',
            source: 'company_match',
            metadata: {
              company: (colleague as any).company,
            },
          });
        }
      }
    }
    
    // Deduplicate by user_id, keeping the first occurrence
    const uniqueConnections = new Map<string, typeof connections[0]>();
    for (const conn of connections) {
      const key = conn.user_id;
      if (!uniqueConnections.has(key)) {
        uniqueConnections.set(key, conn);
      }
    }
    
    const finalConnections = Array.from(uniqueConnections.values());
    return finalConnections;
  },
});

