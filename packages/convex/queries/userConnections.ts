import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

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
      u.company === args.company
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
    console.log(`[getAllUserConnections] Starting for user_id: ${args.user_id}`);
    const connections: Array<{
      user_id: Id<'users'>;
      user_name: string;
      connection_type: string;
      source: string;
      metadata?: any;
    }> = [];
    
    // 1. Family members from familyProfiles
    console.log(`[getAllUserConnections] Step 1: Fetching family members...`);
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
    console.log(`[getAllUserConnections] Step 1 complete: Found ${connections.length} family members`);
    
    // 2. Referrals (users who were invited by this user)
    console.log(`[getAllUserConnections] Step 2: Fetching forward referrals (users invited by this user)...`);
    const referrals = await ctx.db
      .query('referrals')
      .withIndex('by_referrer', q => q.eq('referrerId', args.user_id))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();
    
    const forwardReferralCount = connections.length;
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
    const forwardReferralsAdded = connections.length - forwardReferralCount;
    console.log(`[getAllUserConnections] Step 2 complete: Found ${referrals.length} referral records, added ${forwardReferralsAdded} forward referrals`);
    
    // 2b. Reverse referrals (users who referred this user)
    console.log(`[getAllUserConnections] Step 2b: Fetching reverse referrals (users who referred this user)...`);
    const reverseReferrals = await ctx.db
      .query('referrals')
      .withIndex('by_referred_user', q => q.eq('referredUserId', args.user_id))
      .filter(q => q.eq(q.field('status'), 'completed'))
      .collect();
    
    console.log(`[getAllUserConnections] Step 2b: Found ${reverseReferrals.length} reverse referral records`);
    const reverseReferralCount = connections.length;
    for (const referral of reverseReferrals) {
      const referrerUser = await ctx.db.get(referral.referrerId);
      if (referrerUser) {
        console.log(`[getAllUserConnections] Step 2b: Adding reverse referral - referrer: ${referrerUser.name} (${referral.referrerId})`);
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
      } else {
        console.log(`[getAllUserConnections] Step 2b: Warning - referrer user not found for referral ${referral._id}, referrerId: ${referral.referrerId}`);
      }
    }
    const reverseReferralsAdded = connections.length - reverseReferralCount;
    console.log(`[getAllUserConnections] Step 2b complete: Added ${reverseReferralsAdded} reverse referrals`);
    
    // 3. Treats (both directions)
    console.log(`[getAllUserConnections] Step 3: Fetching treats (both directions)...`);
    // User treated others
    const treatsGiven = await ctx.db
      .query('treats')
      .withIndex('by_treater', q => q.eq('treater_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'claimed'))
      .collect();
    
    const treatsGivenCount = connections.length;
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
    const treatsGivenAdded = connections.length - treatsGivenCount;
    console.log(`[getAllUserConnections] Step 3a: Found ${treatsGiven.length} treats given, added ${treatsGivenAdded} connections`);
    
    // User was treated by others
    const treatsReceived = await ctx.db
      .query('treats')
      .withIndex('by_treated_user', q => q.eq('treated_user_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'claimed'))
      .collect();
    
    const treatsReceivedCount = connections.length;
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
    const treatsReceivedAdded = connections.length - treatsReceivedCount;
    console.log(`[getAllUserConnections] Step 3b: Found ${treatsReceived.length} treats received, added ${treatsReceivedAdded} connections`);
    console.log(`[getAllUserConnections] Step 3 complete: Total treats connections added: ${treatsGivenAdded + treatsReceivedAdded}`);
    
    // 4. Group order participants
    console.log(`[getAllUserConnections] Step 4: Fetching group order participants...`);
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
    console.log(`[getAllUserConnections] Step 4: Found ${groupOrders.length} created group orders, ${participantGroupOrders.length} participant group orders (${allRelevantGroupOrders.length} total)`);
    
    const groupOrderCount = connections.length;
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
    const groupOrderConnectionsAdded = connections.length - groupOrderCount;
    console.log(`[getAllUserConnections] Step 4 complete: Added ${groupOrderConnectionsAdded} group order connections`);
    
    // 5. Manual connections from user_connections
    console.log(`[getAllUserConnections] Step 5: Fetching manual connections...`);
    const manualConnections = await ctx.db
      .query('user_connections')
      .withIndex('by_user', q => q.eq('user_id', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    const manualConnectionsCount = connections.length;
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
    const manualConnectionsAdded = connections.length - manualConnectionsCount;
    console.log(`[getAllUserConnections] Step 5 complete: Found ${manualConnections.length} manual connections, added ${manualConnectionsAdded} connections`);
    
    // 6. Inferred colleagues from shared company
    console.log(`[getAllUserConnections] Step 6: Fetching inferred colleagues from shared company...`);
    const user = await ctx.db.get(args.user_id);
    if (user && user.company) {
      console.log(`[getAllUserConnections] Step 6: User has company: ${user.company}`);
      const allUsers = await ctx.db.query('users').collect();
      const inferredColleagues = allUsers.filter(u => 
        u._id !== args.user_id && 
        u.company === user.company
      );
      console.log(`[getAllUserConnections] Step 6: Found ${inferredColleagues.length} potential colleagues with same company`);
      
      const inferredColleaguesCount = connections.length;
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
              company: colleague.company,
            },
          });
        }
      }
      const inferredColleaguesAdded = connections.length - inferredColleaguesCount;
      console.log(`[getAllUserConnections] Step 6 complete: Added ${inferredColleaguesAdded} inferred colleagues`);
    } else {
      console.log(`[getAllUserConnections] Step 6: Skipped - user has no company`);
    }
    
    // Deduplicate by user_id, keeping the first occurrence
    console.log(`[getAllUserConnections] Deduplication: Starting with ${connections.length} total connections`);
    const uniqueConnections = new Map<string, typeof connections[0]>();
    const duplicates: string[] = [];
    for (const conn of connections) {
      const key = conn.user_id;
      if (!uniqueConnections.has(key)) {
        uniqueConnections.set(key, conn);
      } else {
        duplicates.push(`${conn.user_id} (${conn.user_name}, source: ${conn.source})`);
      }
    }
    
    const finalConnections = Array.from(uniqueConnections.values());
    console.log(`[getAllUserConnections] Deduplication complete: ${finalConnections.length} unique connections (removed ${connections.length - finalConnections.length} duplicates)`);
    if (duplicates.length > 0) {
      console.log(`[getAllUserConnections] Duplicates removed: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`);
    }
    
    // Summary by source
    const summaryBySource = finalConnections.reduce((acc: Record<string, number>, conn) => {
      acc[conn.source] = (acc[conn.source] || 0) + 1;
      return acc;
    }, {});
    console.log(`[getAllUserConnections] Final summary by source:`, JSON.stringify(summaryBySource, null, 2));
    
    // Summary by connection type
    const summaryByType = finalConnections.reduce((acc: Record<string, number>, conn) => {
      acc[conn.connection_type] = (acc[conn.connection_type] || 0) + 1;
      return acc;
    }, {});
    console.log(`[getAllUserConnections] Final summary by type:`, JSON.stringify(summaryByType, null, 2));
    
    console.log(`[getAllUserConnections] Complete: Returning ${finalConnections.length} connections for user ${args.user_id}`);
    return finalConnections;
  },
});

