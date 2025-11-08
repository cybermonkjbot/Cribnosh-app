"use node";
import { v } from 'convex/values';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action } from '../_generated/server';

export const applyReferralRewardToNewUser = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Fetch user via query
    const user = await ctx.runQuery(api.queries.users.getById, { userId: args.userId });
    if (!user) throw new Error("User not found");
    if (!user.referrerId) throw new Error("No referrer found for this user");
    // Update rewards via mutation
    await ctx.runMutation(api.mutations.users.applyReferralReward, { userId: args.userId });
    return { success: true };
  },
});

export const activateReferralProgram = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.mutations.users.setReferralProgramActive, { userId: args.userId });
    return { success: true };
  },
});

export const loginAndCreateSession = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    if (!user) return { error: 'Invalid credentials' };
    
    // Only allow staff or admin
    if (!user.roles?.includes('staff') && !user.roles?.includes('admin')) {
      return { error: 'Not a staff user' };
    }
    
    // Check if user has a password set
    if (!user.password) {
      return { error: 'No password set for this account. Please use password reset.' };
    }
    
    try {
      // Check password (assume user.password is a scrypt hash: salt:hash)
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        console.error('Invalid password format for user:', args.email);
        return { error: 'Invalid credentials' };
      }
      
      const hash = scryptSync(args.password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return { error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Error during password verification for user:', args.email, error);
      return { error: 'Invalid credentials' };
    }
    // Generate and set session token atomically using Convex mutation
    // This is more performant and uses base64url encoding for better security
    const ONE_YEAR_DAYS = 365;
    const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: ONE_YEAR_DAYS,
    });
    return { sessionToken: sessionResult.sessionToken };
  }
});

export const createUserWithHashedPassword = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    roles: v.optional(v.array(v.union(v.literal('user'), v.literal('admin'), v.literal('moderator'), v.literal('chef'), v.literal('staff')))),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))),
  },
  handler: async (ctx, args): Promise<Id<'users'>> => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(args.password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    // Call the mutation to create the user
    const userId: Id<'users'> = await ctx.runMutation(api.mutations.users.create, {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      roles: args.roles,
      status: args.status,
    });
    return userId;
  },
});
// Add any other business logic actions here as needed 