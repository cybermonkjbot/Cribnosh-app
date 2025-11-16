/**
 * Helper query to list users for testing
 */
import { query } from "../_generated/server";

export const listUsersForTesting = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .take(10);
    
    return users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
    }));
  },
});

