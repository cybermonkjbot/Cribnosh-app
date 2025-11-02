"use node";

import { action } from "../_generated/server";
import { DRIP_SCHEDULE } from "../../../apps/web/lib/email/dripSchedule";
import { sendBroadcastEmail } from "../../../apps/web/lib/email/sendBroadcastEmail";
import { api } from "../_generated/api";

// Types for user and sent email
import type { Id } from "../_generated/dataModel";

interface User {
  _id: Id<"users">;
  email: string;
  name?: string;
  createdAt?: number;
  joinedAt?: number;
  lastLogin?: number;
}

interface SentEmail {
  templateId: string;
  sentAt: number;
}

export const runDripScheduler = action({
  args: {},
  handler: async (ctx, _args) => {
    // Get all users
    const users: User[] = await ctx.runQuery(api.queries.users.getAllUsers, {});
    const now = Date.now();
    const results = [];

    for (const user of users) {
      // Get sent emails for this user
      const sent: SentEmail[] = await ctx.runQuery(api.queries.dripEmails.getForUser, { userId: user._id });
      const sentTemplateIds = new Set(sent.map((e) => e.templateId));
      const createdAt = user.createdAt || user.joinedAt || user.lastLogin || now;
      const daysSinceSignup = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

      for (const { day, templateId } of DRIP_SCHEDULE) {
        if (daysSinceSignup >= day && !sentTemplateIds.has(templateId)) {
          try {
            await sendBroadcastEmail({
              user: { email: user.email, name: user.name },
              templateId,
            });
            await ctx.runMutation(api.mutations.dripEmails.add, {
              userId: user._id,
              templateId,
              sentAt: now,
            });
            results.push({ user: user.email, templateId, status: "sent" });
          } catch (err) {
            results.push({ user: user.email, templateId, status: "error", error: String(err) });
          }
        }
      }
    }
    return results;
  },
});
