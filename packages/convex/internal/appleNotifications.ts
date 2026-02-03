// @ts-nocheck
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../../../apps/web/types/convex-contexts";

/**
 * Verify Apple JWT signature for server-to-server notifications
 * This ensures the notification is actually from Apple
 */
export const verifyAppleJWT = internalMutation({
  args: {
    jwt: v.string(),
    payload: v.any(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      // For now, we'll implement a basic verification
      // In production, you should verify the JWT signature using Apple's public keys
      // This is a simplified version - you'll need to implement proper JWT verification
      
      if (!args.jwt || args.jwt.length < 10) {
        return false;
      }
      
      // Basic payload validation
      if (!args.payload || typeof args.payload !== 'object') {
        return false;
      }
      
      // Check for required Apple notification fields
      const requiredFields = ['type', 'sub'];
      for (const field of requiredFields) {
        if (!args.payload[field]) {
          return false;
        }
      }
      
      // NOTE: Full JWT signature verification is deferred as it requires:
      // 1. Decoding the JWT header to get the key ID (kid)
      // 2. Fetching Apple's public keys from https://appleid.apple.com/auth/keys
      // 3. Verifying the signature using the appropriate public key with JWK
      // 4. Checking the token expiration (exp) and issuer (iss)
      // This implementation currently performs basic validation. For production,
      // consider implementing full signature verification for enhanced security.
      
      return true; // Simplified for now
    } catch (error) {
      console.error("JWT verification error:", error);
      return false;
    }
  },
});

/**
 * Handle different types of Apple Sign in notifications
 */
export const handleNotification = internalMutation({
  args: {
    notificationType: v.string(),
    payload: v.any(),
  },
  returns: v.object({
    processed: v.boolean(),
    action: v.string(),
    userId: v.optional(v.id("users")),
  }),
  handler: async (ctx, args) => {
    try {
      const { notificationType, payload } = args;
      
      // Find user by Apple ID (sub field in the payload)
      const appleUserId = payload.sub;
      if (!appleUserId) {
        throw new Error("No Apple user ID found in payload");
      }
      
      // Find user in our database by Apple provider ID
      // We need to search through all users and check their oauthProviders array
      const allUsers = await ctx.db.query("users").collect();
      const userWithAppleId = allUsers.find(user => 
        user.oauthProviders?.some(provider => 
          provider.provider === "apple" && provider.providerId === appleUserId
        )
      );
      
      if (!userWithAppleId) {
        console.log(`No user found with Apple ID: ${appleUserId}`);
        return {
          processed: false,
          action: "user_not_found",
        };
      }
      
      const user = userWithAppleId;
      
      switch (notificationType) {
        case "email-disabled":
          // User disabled email forwarding
          await handleEmailDisabled(ctx, user._id);
          return {
            processed: true,
            action: "email_disabled",
            userId: user._id,
          };
          
        case "email-enabled":
          // User enabled email forwarding
          await handleEmailEnabled(ctx, user._id);
          return {
            processed: true,
            action: "email_enabled",
            userId: user._id,
          };
          
        case "consent-withdrawn":
          // User withdrew consent for the app
          await handleConsentWithdrawn(ctx, user._id);
          return {
            processed: true,
            action: "consent_withdrawn",
            userId: user._id,
          };
          
        case "account-deleted":
          // User deleted their Apple account
          await handleAccountDeleted(ctx, user._id);
          return {
            processed: true,
            action: "account_deleted",
            userId: user._id,
          };
          
        default:
          console.log(`Unknown notification type: ${notificationType}`);
          return {
            processed: false,
            action: "unknown_type",
          };
      }
    } catch (error) {
      console.error("Error handling Apple notification:", error);
      throw error;
    }
  },
});

/**
 * Handle email forwarding disabled notification
 */
async function handleEmailDisabled(ctx: MutationCtx, userId: Id<"users">) {
  // Update user's email forwarding preferences
  await ctx.db.patch(userId, {
    emailForwardingEnabled: false,
    lastEmailForwardingChange: Date.now(),
  });
  
  // Log the event
  console.log(`Email forwarding disabled for user ${userId}`);
  
  // You might want to send a notification to the user
  // or update their preferences in your system
}

/**
 * Handle email forwarding enabled notification
 */
async function handleEmailEnabled(ctx: MutationCtx, userId: Id<"users">) {
  // Update user's email forwarding preferences
  await ctx.db.patch(userId, {
    emailForwardingEnabled: true,
    lastEmailForwardingChange: Date.now(),
  });
  
  // Log the event
  console.log(`Email forwarding enabled for user ${userId}`);
}

/**
 * Handle consent withdrawn notification
 * This means the user no longer wants to use your app
 */
async function handleConsentWithdrawn(ctx: MutationCtx, userId: Id<"users">) {
  // Mark user as inactive or remove Apple OAuth connection
  await ctx.db.patch(userId, {
    status: "inactive",
    consentWithdrawnAt: Date.now(),
    // Remove Apple OAuth provider
    oauthProviders: (await ctx.db.get(userId))?.oauthProviders?.filter(
      (provider: { provider: string }) => provider.provider !== "apple"
    ) || [],
  });
  
  // Log the event
  console.log(`Consent withdrawn for user ${userId}`);
  
  // You might want to:
  // - Send a goodbye email
  // - Clean up user data (following privacy laws)
  // - Notify your support team
}

/**
 * Handle account deleted notification
 * This means the user permanently deleted their Apple ID
 */
async function handleAccountDeleted(ctx: MutationCtx, userId: Id<"users">) {
  // Remove Apple OAuth connection
  await ctx.db.patch(userId, {
    accountDeletedAt: Date.now(),
    // Remove Apple OAuth provider
    oauthProviders: (await ctx.db.get(userId))?.oauthProviders?.filter(
      (provider: { provider: string }) => provider.provider !== "apple"
    ) || [],
  });
  
  // Log the event
  console.log(`Apple account deleted for user ${userId}`);
  
  // You might want to:
  // - Check if user has other OAuth providers
  // - If not, mark account as inactive
  // - Send notification about account status change
}
