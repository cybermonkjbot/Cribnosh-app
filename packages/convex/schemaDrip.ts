// @ts-nocheck
import { defineTable, defineSchema } from "convex/server";
import { v } from "convex/values";

// Add this to your main schema.ts after review
export const dripEmails = defineTable({
  userId: v.id("users"),
  templateId: v.string(),
  sentAt: v.number(), // Unix timestamp (ms)
});

// Example usage:
// export default defineSchema({ ...existing tables..., dripEmails })
