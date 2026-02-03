// @ts-nocheck
"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Seed test data for a specific user email
 * This creates/updates a user, chef profile, course enrollment, and test documents
 */
export const seedTestUser = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Starting to seed test data for user: ${args.email}...`);

    // Step 1: Find user (public query that doesn't require auth)
    const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      throw new Error(`User with email ${args.email} does not exist. Please create the user account first through the app, then run this action.`);
    }

    console.log(`Found user: ${user._id} (${user.email})`);

    // Step 2: Find or create chef profile using internal mutation
    console.log(`Finding or creating chef profile...`);
    const chefId = await ctx.runMutation(api.mutations.chefs.createChefForSeed, {
      userId: user._id,
      name: user.name || "Test Chef",
      bio: "Test chef profile for development and testing purposes.",
      specialties: ["British", "Italian", "Mediterranean"],
      location: {
        lat: 51.5074, // London coordinates
        lng: -0.1278,
        city: "London",
      },
      rating: 4.5,
      status: "active",
    });
    
    console.log(`✓ Chef profile ready: ${chefId}`);
    console.log(`✓ Chef automatically enrolled in compliance course during creation`);

    console.log("Test user seeding completed!");
    return {
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      chef: {
        _id: chefId,
      },
      enrollment: {
        courseId: "compliance-course-v1",
        courseName: "Home Cooking Compliance Course",
      },
      message: `Successfully linked content to ${args.email}. You can now test the chef app features.`,
    };
  },
});

