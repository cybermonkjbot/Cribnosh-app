import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { internal, api } from '../_generated/api';
import { Agent } from '@convex-dev/agent';
import { openai } from '@ai-sdk/openai';
import { components } from '../_generated/api';
import type { Id } from '../_generated/dataModel';

// Initialize AI Agent for CribNosh
const cribnoshAgent = new Agent(components.agent, {
  name: 'CribNosh AI Assistant',
  languageModel: openai('gpt-4o-mini'),
  instructions: `You are CribNosh AI, a helpful assistant for the CribNosh food platform. You help users with:
- Food-related questions and meal planning
- Cooking tips and recipe suggestions
- Platform features and navigation
- Meal recommendations based on preferences and semantic search
- Dietary restrictions and allergy information

Be friendly, informative, and culturally aware. Keep responses concise but helpful. 

When users ask about meals or food preferences:
- Use semantic understanding to match their intent with available meals
- Provide specific dish names, descriptions, and prices when recommending
- Explain why certain meals match their preferences (cuisine, dietary needs, etc.)
- Mention chef information when relevant
- If meal recommendations are provided in the context, reference them naturally in your response

Always be helpful and aim to connect users with the perfect meals for their needs.`,
  maxSteps: 5,
});

// Create a new channel (also creates an agent thread)
export const createChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Create agent thread
    const threadResult = await cribnoshAgent.createThread(ctx);
    
    // Extract thread ID from the result
    // The result could be a string, an object with _id, or an object with threadId
    let threadIdString: string;
    if (typeof threadResult === 'string') {
      threadIdString = threadResult;
    } else if (threadResult && typeof threadResult === 'object') {
      // Try threadId first (as shown in error), then _id, then use the object itself
      threadIdString = (threadResult as any).threadId || (threadResult as any)._id || String(threadResult);
    } else {
      threadIdString = String(threadResult);
    }

    // Create channel and link to thread
    const channelId = await ctx.db.insert('channels', {
      name: args.name,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      isActive: true,
      threadId: threadIdString, // Store thread ID for agent communication
    });

    return { channelId, threadId: threadIdString };
  },
});

// Send a message to a channel (uses agent for AI responses)
export const sendMessage = mutation({
  args: {
    channelId: v.id('channels'),
    authorId: v.id('users'),
    content: v.string(),
  },
  returns: v.object({
    messageId: v.id('aiMessages'),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get channel to retrieve thread ID
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    // Get or create thread ID
    let threadId = (channel as { threadId?: string }).threadId;
    if (!threadId) {
      // Create thread if it doesn't exist (for backward compatibility)
      const threadResult = await cribnoshAgent.createThread(ctx);
      
      // Extract thread ID from the result
      let threadIdString: string;
      if (typeof threadResult === 'string') {
        threadIdString = threadResult;
      } else if (threadResult && typeof threadResult === 'object') {
        // Try threadId first (as shown in error), then _id, then use the object itself
        threadIdString = (threadResult as any).threadId || (threadResult as any)._id || String(threadResult);
      } else {
        threadIdString = String(threadResult);
      }
      
      threadId = threadIdString;
      
      await ctx.db.patch(args.channelId, {
        threadId,
      } as any);
    }
    
    // Insert the user message
    const messageId = await ctx.db.insert('aiMessages', {
      channelId: args.channelId,
      authorId: args.authorId,
      content: args.content,
      createdAt: now,
      messageType: 'user',
    });

    // Update channel's last message time
    await ctx.db.patch(args.channelId, {
      lastMessageAt: now,
    });

    // Schedule AI response generation using agent
    await ctx.scheduler.runAfter(100, internal.aiChat.generateAIResponseWithAgent, {
      channelId: args.channelId,
      threadId,
      userMessageId: messageId,
      userMessage: args.content,
    });

    return { messageId };
  },
});

// Internal function to generate AI response using agent
export const generateAIResponseWithAgent = internalMutation({
  args: {
    channelId: v.id('channels'),
    threadId: v.string(),
    userMessageId: v.id('aiMessages'),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Use agent to generate response
      const result = await cribnoshAgent.generateText(ctx, args.threadId, {
        prompt: args.userMessage,
      });

      const aiResponse = result.text;
      if (!aiResponse) {
        console.error('No AI response generated');
        return;
      }

      // Insert AI response message (for backward compatibility with existing queries)
      const aiMessageId = await ctx.db.insert('aiMessages', {
        channelId: args.channelId,
        authorId: undefined, // AI messages don't have an author
        content: aiResponse,
        createdAt: Date.now(),
        messageType: 'ai',
      });

      // Update channel's last message time
      await ctx.db.patch(args.channelId, {
        lastMessageAt: Date.now(),
      });

      return { aiMessageId };
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Insert error message
      await ctx.db.insert('aiMessages', {
        channelId: args.channelId,
        authorId: undefined,
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        createdAt: Date.now(),
        messageType: 'ai',
      });
    }
  },
});

// Legacy function for backward compatibility (deprecated - use generateAIResponseWithAgent)
export const generateAIResponse = internalMutation({
  args: {
    channelId: v.id('channels'),
    userMessageId: v.id('aiMessages'),
  },
  handler: async (ctx, args) => {
    // Get channel to find thread
    const channel = await ctx.db.get(args.channelId);
    if (!channel) {
      console.error('Channel not found');
      return;
    }

    const threadId = (channel as { threadId?: string }).threadId;
    if (!threadId) {
      console.error('Thread ID not found for channel');
      return;
    }

    // Get user message
    const userMessage = await ctx.db.get(args.userMessageId);
    if (!userMessage) {
      console.error('User message not found');
      return;
    }

    // Call the new agent-based function
    return await generateAIResponseWithAgent(ctx, {
      channelId: args.channelId,
      threadId,
      userMessageId: args.userMessageId,
      userMessage: userMessage.content,
    });
  },
});

// Get or create user using the main user system
export const getOrCreateUser = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUser) {
      return { userId: existingUser._id, isNew: false };
    }

    // User doesn't exist - they need to be created through the main user system
    throw new Error('User not found. Please create an account first.');
  },
});

// Get or create a default channel
export const getOrCreateDefaultChannel = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Look for existing default channel
    let defaultChannel = await ctx.db
      .query('channels')
      .filter((q) => q.eq(q.field('name'), 'general'))
      .first();

    if (!defaultChannel) {
      // Create default channel
      const channelId = await ctx.db.insert('channels', {
        name: 'general',
        description: 'General discussion channel',
        createdBy: args.userId,
        createdAt: Date.now(),
        isActive: true,
      });
      defaultChannel = await ctx.db.get(channelId);
    }

    return { channelId: defaultChannel!._id };
  },
});
