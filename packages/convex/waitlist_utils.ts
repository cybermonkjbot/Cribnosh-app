// @ts-nocheck
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

export interface WaitlistArgs {
    email: string;
    name?: string;
    phone?: string;
    location?: string;
    referralCode?: string;
    source?: string;
    addedBy?: Id<"users">;
    addedByName?: string;
    joinedAt?: number;
}

export interface WaitlistResult {
    success: boolean;
    waitlistId: Id<"waitlist">;
    isExisting: boolean;
    userId?: Id<"users">;
    token?: string;
}

/**
 * Internal logic for adding to waitlist, safe to call from other mutations.
 */
export async function addToWaitlistInternal(
    ctx: MutationCtx,
    args: WaitlistArgs
): Promise<WaitlistResult> {
    // Check if email already exists in waitlist
    const existing = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

    // Check if user exists with this email
    const existingUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("email"), args.email))
        .first();

    if (existing || existingUser) {
        return {
            success: true,
            waitlistId: existing?._id ?? ("existing_user" as Id<"waitlist">),
            isExisting: true,
            userId: existingUser?._id,
            // existing entries might not have a token if created before this change
            // we could generate one here if needed, but for now let's assume new flow only
            token: existing?.token,
        };
    }

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const waitlistId = await ctx.db.insert("waitlist", {
        email: args.email,
        name: args.name,
        phone: args.phone,
        location: args.location,
        referralCode: args.referralCode,
        referrer: args.referralCode ? await ctx.db
            .query("waitlist")
            .filter((q) => q.eq(q.field("referralCode"), args.referralCode))
            .first()
            .then((entry: Doc<"waitlist"> | null) => entry?._id) : undefined,
        status: "active",
        joinedAt: args.joinedAt || Date.now(),
        source: args.source || "website",
        priority: "normal",
        addedBy: args.addedBy,
        addedByName: args.addedByName,
        token: token,
    });

    return {
        success: true,
        waitlistId,
        isExisting: false,
        userId: undefined,
        token,
    };
}
