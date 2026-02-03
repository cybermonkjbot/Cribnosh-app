// @ts-nocheck
// convex/actions/agora.ts
"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export const generateAgoraToken = action({
  args: {
    channelName: v.string(),
    uid: v.number(),
    role: v.union(v.literal("publisher"), v.literal("subscriber")),
  },
  handler: async (ctx, args) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    
    if (!appId || !appCertificate) {
      throw new Error("Agora credentials not configured");
    }

    const role = args.role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      args.channelName,
      args.uid,
      role,
      privilegeExpiredTs
    );

    return token;
  },
});
