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
        // Break the type inference chain to avoid "Type instantiation is excessively deep" errors
        const seedTemplatesMutation = api.mutations.seedTemplates.seedTemplates as any;
        const result = await ctx.runMutation(seedTemplatesMutation, {});
        console.log(`Templates seeded: ${result.createdCount} created, ${result.updatedCount} updated.`);
        return result;
    },
});
