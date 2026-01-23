import { v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { requireAdmin } from "../utils/auth";

export const getAudienceSelectionData = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.sessionToken);

        const users = await ctx.db.query("users").collect();
        const waitlist = await ctx.db.query("waitlist").collect();

        // Get unique roles
        const roles = new Set<string>();
        users.forEach(u => {
            if (u.roles) u.roles.forEach(r => roles.add(r));
        });

        const pendingWaitlist = waitlist.filter(w => !w.onboardingCompletedAt);

        return {
            roles: Array.from(roles),
            totalUsers: users.length,
            totalWaitlist: waitlist.length,
            totalPendingWaitlist: pendingWaitlist.length,
        };
    },
});

export const searchRecipients = query({
    args: {
        query: v.string(),
        sessionToken: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.sessionToken);

        if (!args.query) return [];

        const searchStr = args.query.toLowerCase();

        const users = await ctx.db.query("users").collect();
        return users.filter(u =>
            u.name.toLowerCase().includes(searchStr) ||
            u.email.toLowerCase().includes(searchStr)
        ).slice(0, 10).map(u => ({
            id: u._id,
            name: u.name,
            email: u.email
        }));
    },
});

export const getRecipientEmails = query({
    args: {
        type: v.union(v.literal("all"), v.literal("roles"), v.literal("individuals"), v.literal("waitlist"), v.literal("waitlist_pending")),
        values: v.optional(v.array(v.string())),
        sessionToken: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        await requireAdmin(ctx, args.sessionToken);

        if (args.type === "all") {
            const users = await ctx.db.query("users").collect();
            return users.map(u => u.email);
        }

        if (args.type === "roles" && args.values) {
            const roles = args.values;
            const users = await ctx.db.query("users").collect();
            return users
                .filter(u => u.roles?.some(r => roles.includes(r)))
                .map(u => u.email);
        }

        if (args.type === "individuals" && args.values) {
            const emails: string[] = [];
            for (const idOrEmail of args.values) {
                if (idOrEmail.includes("@")) {
                    emails.push(idOrEmail);
                } else {
                    const user = await ctx.db.get(idOrEmail as Id<"users">);
                    if (user && "email" in user) emails.push((user as Doc<"users">).email);
                }
            }
            return emails;
        }

        if (args.type === "waitlist") {
            const waitlist = await ctx.db.query("waitlist").collect();
            return waitlist.map(w => w.email);
        }

        if (args.type === "waitlist_pending") {
            const waitlist = await ctx.db.query("waitlist").collect();
            return waitlist.filter(w => !w.onboardingCompletedAt).map(w => w.email);
        }

        return [];
    },
});
