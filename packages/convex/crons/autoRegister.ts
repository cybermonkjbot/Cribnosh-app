import { internal } from "../_generated/api";

export default async function autoRegisterCrons(ctx: any) {
  try {
    await ctx.runMutation(internal.internal.registerMaintenanceCrons.registerMaintenanceCrons, {});
  } catch (error) {
    console.error('Failed to register maintenance crons:', error);
  }
}