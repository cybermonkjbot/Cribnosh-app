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

export const updateKitchen = mutation(
  async (
    { db },
    args: {
      kitchenId: Id<'kitchens'>;
      address?: string;
      images?: string[];
      inspectionDates?: string[];
    }
  ) => {
    const kitchen = await db.get(args.kitchenId);
    if (!kitchen) {
      throw new Error("Kitchen not found");
    }

    const updates: any = {};
    if (args.address !== undefined) {
      updates.address = args.address;
    }
    if (args.images !== undefined) {
      updates.images = args.images;
    }
    if (args.inspectionDates !== undefined) {
      updates.inspectionDates = args.inspectionDates;
    }

    await db.patch(args.kitchenId, updates);
    return args.kitchenId;
  }
);
