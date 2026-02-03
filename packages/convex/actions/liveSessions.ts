// @ts-nocheck
 "use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const generateViewerToken = action({
  args: {
    channelName: v.string(),
    uid: v.number(),
  },
  returns: v.object({
    token: v.string(),
    appId: v.string(),
    channelName: v.string(),
    uid: v.number(),
    role: v.literal("subscriber"),
  }),
  handler: async (ctx, args): Promise<{
    token: string;
    appId: string;
    channelName: string;
    uid: number;
    role: "subscriber";
  }> => {
    // Call the Agora action to generate a real token
    const token: string = await ctx.runAction(api.actions.agora.generateAgoraToken, {
      channelName: args.channelName,
      uid: args.uid,
      role: "subscriber"
    });

    return {
      token,
      appId: process.env.AGORA_APP_ID || "",
      channelName: args.channelName,
      uid: args.uid,
      role: "subscriber" as const
    };
  },
});

export const generateBroadcasterToken = action({
  args: {
    channelName: v.string(),
    uid: v.number(),
  },
  returns: v.object({
    token: v.string(),
    appId: v.string(),
    channelName: v.string(),
    uid: v.number(),
    role: v.literal("publisher"),
  }),
  handler: async (ctx, args): Promise<{
    token: string;
    appId: string;
    channelName: string;
    uid: number;
    role: "publisher";
  }> => {
    // Call the Agora action to generate a real token
    const token: string = await ctx.runAction(api.actions.agora.generateAgoraToken, {
      channelName: args.channelName,
      uid: args.uid,
      role: "publisher"
    });

    return {
      token,
      appId: process.env.AGORA_APP_ID || "",
      channelName: args.channelName,
      uid: args.uid,
      role: "publisher" as const
    };
  },
}); 