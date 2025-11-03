import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import OpenAI from 'openai';

// Initialize OpenAI client lazily
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Create a new channel
export const createChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const channelId = await ctx.db.insert('channels', {
      name: args.name,
      description: args.description,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      isActive: true,
    });

    return { channelId };
  },
});

// Send a message to a channel
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
    
    // Insert the message
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

    // Schedule AI response generation
    await ctx.scheduler.runAfter(1000, generateAIResponse as any, {
      channelId: args.channelId,
      userMessageId: messageId,
    });

    return { messageId };
  },
});

// Internal function to generate AI response
export const generateAIResponse = internalMutation({
  args: {
    channelId: v.id('channels'),
    userMessageId: v.id('aiMessages'),
  },
  handler: async (ctx, args) => {
    try {
      // Get the user's message
      const userMessage = await ctx.db.get(args.userMessageId);
      if (!userMessage) {
        console.error('User message not found');
        return;
      }

      // Get recent message history (last 10 messages)
      const recentMessages = await ctx.db
        .query('aiMessages')
        .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
        .order('desc')
        .take(10);

      // Reverse to get chronological order
      const messages = recentMessages.reverse();

      // Build conversation context
      const conversationContext = messages.map((msg) => ({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add system prompt
      const systemPrompt = {
        role: 'system',
        content: `You are CribNosh AI, a helpful assistant for the CribNosh food platform. You help users with food-related questions, meal planning, cooking tips, and platform features. Be friendly, informative, and culturally aware. Keep responses concise but helpful.`,
      };

      const messagesWithSystem = [systemPrompt, ...conversationContext];

      // Generate AI response using OpenAI
      const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messagesWithSystem as any,
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        console.error('No AI response generated');
        return;
      }

      // Insert AI response message
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
