// @ts-nocheck
"use node";
import { v } from "convex/values";
import * as fs from "fs";
import * as path from 'path';
import { Resend } from "resend";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

const BROADCASTS_CONFIG_PATH = path.join(process.cwd(), 'lib', 'email', 'broadcasts-config.json');

interface BroadcastConfig {
  key: string;
  broadcastId: string;
  subject: string;
}

// Configuration validation schema
const configSchema = {
  resendApiKey: v.string(),
  audienceId: v.string(),
  fromEmail: v.string(),
  variables: v.optional(v.object({})), // Template variables
};

// Helper to get broadcast configuration
function getBroadcastConfig(key?: string): BroadcastConfig[] | BroadcastConfig | null {
  if (!fs.existsSync(BROADCASTS_CONFIG_PATH)) {
    throw new Error('Broadcasts configuration not found. Run setup-resend-broadcasts.ts first.');
  }

  const config: BroadcastConfig[] = JSON.parse(fs.readFileSync(BROADCASTS_CONFIG_PATH, 'utf8'));
  
  if (key) {
    const broadcast = config.find(b => b.key === key);
    return broadcast || null;
  }

  return config;
}

// Action to send all prelaunch broadcasts
export const sendAllPrelaunchEmailBroadcasts = action({
  args: configSchema,
  handler: async (ctx, args) => {
    const { resendApiKey, audienceId, fromEmail, variables } = args;
    const resend = new Resend(resendApiKey);

    try {
      const broadcasts = getBroadcastConfig() as BroadcastConfig[];

      // Send each broadcast
      for (const broadcast of broadcasts) {
        await resend.emails.send({
          from: fromEmail,
          subject: broadcast.subject,
          to: audienceId, // Resend will handle this as a broadcast
          text: "", // Required by Resend
        });

        // Log success
        await ctx.runMutation(api.mutations.admin.insertAdminLog, {
          action: "email_broadcast",
          details: {
            status: "success",
            message: `Sent broadcast: ${broadcast.key}`
          },
          adminId: "system" as Id<'users'>
        });
      }

      return { success: true };
    } catch (error) {
      // Log error
      await ctx.runMutation(api.mutations.admin.insertAdminLog, {
        action: "email_broadcast",
        details: {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        adminId: "system" as Id<'users'>
      });

      throw error;
    }
  },
});

// Action to send a single prelaunch broadcast by key
export const sendPrelaunchEmailBroadcast = action({
  args: {
    ...configSchema,
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const { resendApiKey, audienceId, fromEmail, variables, key } = args;
    const resend = new Resend(resendApiKey);

    try {
      const broadcast = getBroadcastConfig(key) as BroadcastConfig;
      
      if (!broadcast) {
        throw new Error(`No broadcast configuration found for key: ${key}`);
      }

      await resend.emails.send({
        from: fromEmail,
        subject: broadcast.subject,
        to: audienceId, // Resend will handle this as a broadcast
        text: "", // Required by Resend
      });

      // Log success
      await ctx.runMutation(api.mutations.admin.insertAdminLog, {
        action: "email_broadcast",
        details: {
          status: "success",
          message: `Sent broadcast: ${key}`
        },
        adminId: "system" as Id<'users'>
      });

      return { success: true };
    } catch (error) {
      // Log error
      await ctx.runMutation(api.mutations.admin.insertAdminLog, {
        action: "email_broadcast",
        details: {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        adminId: "system" as Id<'users'>
      });

      throw error;
    }
  },
});

// Action to schedule a sequence of prelaunch emails
export const schedulePrelaunchEmailSequence = action({
  args: {
    ...configSchema,
    startDate: v.string(), // ISO date string
    intervalDays: v.number(), // Days between emails
  },
  handler: async (ctx, args) => {
    const { resendApiKey, audienceId, fromEmail, variables, startDate, intervalDays } = args;

    try {
      const broadcasts = getBroadcastConfig() as BroadcastConfig[];

      // Schedule each email in the sequence
      const schedulePromises = broadcasts.map((broadcast, index) => {
        const sendDate = new Date(startDate);
        sendDate.setDate(sendDate.getDate() + (index * intervalDays));

        // Schedule the email using Convex's scheduler
        return ctx.scheduler.runAfter(sendDate.getTime() - Date.now(), internal.crons.dripScheduler.runDripScheduler, {
          broadcastId: broadcast.broadcastId,
          config: {
            resendApiKey,
            audienceId,
            fromEmail,
            variables,
          },
        });
      });

      await Promise.all(schedulePromises);

      // Log success
      await ctx.runMutation(api.mutations.admin.insertAdminLog, {
        action: "email_sequence",
        details: {
          status: "success",
          message: "Scheduled prelaunch email sequence"
        },
        adminId: "system" as Id<'users'>
      });

      return { success: true };
    } catch (error) {
      // Log error
      await ctx.runMutation(api.mutations.admin.insertAdminLog, {
        action: "email_sequence",
        details: {
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        },
        adminId: "system" as Id<'users'>
      });

      throw error;
    }
  },
}); 