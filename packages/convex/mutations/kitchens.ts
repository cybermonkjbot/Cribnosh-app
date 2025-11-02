import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";

export const createKitchen = mutation(
  async (
    { db },
    args: {
      owner_id: string | Id<'users'>;
      address: string;
      certified: boolean;
      inspectionDates?: string[];
      images?: string[];
    }
  ) => {
    // Convert owner_id to Id<'users'> if needed
    const ownerId = (typeof args.owner_id === 'string') ? (args.owner_id as Id<'users'>) : args.owner_id;
    const id = await db.insert("kitchens", { ...args, owner_id: ownerId });
    return id;
  }
);
