import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getAvailableAgents = query({
  args: {},
  handler: async (ctx) => {
    // Get all users with support agent role
    const allUsers = await ctx.db.query('users').collect();
    const agents = allUsers.filter((user: any) => {
      // Check if user has support agent role
      const roles = user.roles || [];
      return roles.includes('support') || 
             roles.includes('support_agent') || 
             roles.includes('staff') ||
             roles.includes('admin');
    });

    // Get active support cases count for each agent to determine availability
    const agentsWithAvailability = await Promise.all(
      agents.map(async (agent: any) => {
        // Query all support cases and filter by agent
        const allCases = await ctx.db.query('supportCases').collect();
        const activeCases = allCases.filter((c: any) => c.assigned_agent_id === agent._id);
        
        const openCases = activeCases.filter((c: any) => c.status === 'open');
        
        return {
          _id: agent._id,
          name: agent.name || 'Support Agent',
          email: agent.email,
          avatar: agent.avatar,
          activeCases: openCases.length,
          isAvailable: openCases.length < 10, // Available if less than 10 active cases
        };
      })
    );

    // Sort by availability (available first) and then by active cases count
    return agentsWithAvailability.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return a.activeCases - b.activeCases;
    });
  },
});

export const assignAgentToCase = query({
  args: { caseId: v.id('supportCases') },
  handler: async (ctx, args) => {
    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      return null;
    }

    // If already assigned, return the agent
    if (supportCase.assigned_agent_id) {
      const agent = await ctx.db.get(supportCase.assigned_agent_id);
      return agent;
    }

    // Get available agents
    const availableAgents = await getAvailableAgents.handler(ctx, {});
    
    if (availableAgents.length === 0) {
      return null;
    }

    // Select the first available agent (least busy)
    const selectedAgent = availableAgents[0];
    
    // Assign agent (this should be done via mutation, but we return the agent for assignment)
    return selectedAgent;
  },
});

export const getAgentInfo = query({
  args: { agentId: v.id('users') },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return null;
    }

    // Get active cases count
    const allCases = await ctx.db.query('supportCases').collect();
    const activeCases = allCases.filter((c: any) => c.assigned_agent_id === args.agentId);
    
    const openCases = activeCases.filter((c: any) => c.status === 'open');

    return {
      _id: agent._id,
      name: agent.name || 'Support Agent',
      email: agent.email,
      avatar: agent.avatar,
      activeCases: openCases.length,
      isOnline: true, // TODO: Implement actual online status tracking
    };
  },
});

