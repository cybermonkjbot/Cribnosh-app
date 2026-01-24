"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { action } from "../_generated/server";

export const sendBroadcast = action({
    args: {
        subject: v.string(),
        html: v.string(),
        recipientEmails: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { subject, html, recipientEmails } = args;

        if (recipientEmails.length === 0) {
            return { success: false, message: "No recipients selected" };
        }

        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Chunk recipients into batches of 100 (Resend limit)
        const CHUNK_SIZE = 100;
        for (let i = 0; i < recipientEmails.length; i += CHUNK_SIZE) {
            const batch = recipientEmails.slice(i, i + CHUNK_SIZE);

            try {
                const { data, error } = await resend.batch.send(
                    batch.map((email: string) => ({
                        from: "CribNosh <noreply@cribnosh.com>",
                        to: email,
                        subject: subject,
                        html: html,
                    }))
                );

                if (error) {
                    console.error("Batch error:", error);
                    results.failed += batch.length;
                    results.errors.push(error.message);
                } else if (data) {
                    results.sent += batch.length;
                }
            } catch (err: any) {
                console.error("Critical batch error:", err);
                results.failed += batch.length;
                results.errors.push(err.message || "Unknown error");
            }
        }

        // Log the broadcast action
        // await ctx.runMutation(internal.mutations.adminLogs.create, {
        //     action: "email_broadcast",
        //     details: {
        //         subject,
        //         recipientCount: recipientEmails.length,
        //         sent: results.sent,
        //         failed: results.failed
        //     }
        // });

        return {
            success: results.failed === 0,
            sent: results.sent,
            failed: results.failed,
            errors: results.errors
        };
    },
});
