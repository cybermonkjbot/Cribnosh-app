"use node";

import { api } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Action to seed or update email templates in the database.
 * This is useful after updating the DEFAULT_TEMPLATES in seedTemplates.ts.
 */
export const seedAllTemplates = action({
    args: {},
    handler: async (ctx) => {
        console.log("Seeding email templates...");
        const result = await ctx.runMutation(api.mutations.seedTemplates.seedTemplates, {});
        console.log(`Templates seeded: ${result.createdCount} created, ${result.updatedCount} updated.`);
        return result;
    },
});
