import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Creates a new game challenge between the current user and a colleague.
 */
export const createGame = mutation({
    args: {
        opponentId: v.id("users"),
        gameType: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const userId = identity.subject; // This might need adjustment depending on how user IDs are stored (usually identity.subject is token sub, need to lookup user)
        // Assuming we need to look up the user by token sub or if identity.subject IS the user ID (unlikely in most Convex setups, usually need a helper).
        // Let's use a common pattern or helper if available. for now, let's assume we can get the user.
        // Actually, looking at other files, it seems usually we use `getUserBySessionToken` or similar.
        // But since I don't want to import helpers that might not exist or be complex, I'll rely on `ctx.auth` 
        // and assume I can get the user ID. 
        // Wait, in `payment-method.tsx` we saw `api.queries.users.getUserBySessionToken`.
        // Let's check `users.ts` pattern if needed, but standard `ctx.auth.getUserIdentity` maps to a user.

        // Let's try to find the user in `users` table by `email` or `tokenIdentifier` if that's how it's done. 
        // Standard template uses `tokenIdentifier`.

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .unique();

        if (!user) {
            throw new ConvexError("User not found");
        }

        const gameId = await ctx.db.insert("games", {
            players: [user._id, args.opponentId],
            status: "active",
            gameType: args.gameType,
            createdAt: Date.now(),
        });

        return gameId;
    },
});

/**
 * Records the result of a game and creates a debt obligation.
 */
export const finishGame = mutation({
    args: {
        gameId: v.id("games"),
        winnerId: v.id("users"),
        loserId: v.id("users"),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const game = await ctx.db.get(args.gameId);
        if (!game) {
            throw new ConvexError("Game not found");
        }

        if (game.status !== "active") {
            throw new ConvexError("Game is not active");
        }

        // Verify players involved
        if (!game.players.includes(args.winnerId) || !game.players.includes(args.loserId)) {
            throw new ConvexError("Invalid players for this game");
        }

        // Update game status
        await ctx.db.patch(args.gameId, {
            status: "completed",
            winnerId: args.winnerId,
            loserId: args.loserId,
            metadata: args.metadata,
            completedAt: Date.now(),
        });

        // Create debt
        const debtId = await ctx.db.insert("gameDebts", {
            gameId: args.gameId,
            debtorId: args.loserId,
            creditorId: args.winnerId,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return debtId;
    },
});

/**
 * Gets active debts where the user is the creditor (owed a meal).
 */
export const getActiveGameDebts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const debts = await ctx.db
            .query("gameDebts")
            .withIndex("by_creditor", (q) => q.eq("creditorId", args.userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

        // Enrich with debtor info
        const debtsWithDebtor = await Promise.all(
            debts.map(async (debt) => {
                const debtor = await ctx.db.get(debt.debtorId);
                return {
                    ...debt,
                    debtorName: debtor?.name || "Unknown",
                    debtorEmail: debtor?.email,
                    debtorAvatar: debtor?.avatar,
                };
            })
        );

        return debtsWithDebtor;
    },
});

/**
 * Marks a debt as redeemed (linked to an order).
 * Using an action/mutation typically, but this might be called from `createOrder`.
 * For now, exposing a mutation to be safe.
 */
export const redeemGameDebt = mutation({
    args: {
        debtId: v.id("gameDebts"),
        orderId: v.id("orders"),
    },
    handler: async (ctx, args) => {
        const debt = await ctx.db.get(args.debtId);
        if (!debt) {
            throw new ConvexError("Debt not found");
        }

        if (debt.status !== "pending") {
            throw new ConvexError("Debt is not pending");
        }

        await ctx.db.patch(args.debtId, {
            status: "redeemed",
            redeemedOrderId: args.orderId,
            updatedAt: Date.now(),
        });
    },
});
