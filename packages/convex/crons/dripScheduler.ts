// @ts-nocheck
"use node";
import { cronJobs } from "convex/server";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

const crons = cronJobs();

// Define the cron job with proper typing
crons.interval(
  "sendDripEmails",
  { hours: 24 }, // Run every 24 hours
  internal.crons.dripScheduler.runDripScheduler,
  { broadcastId: "daily-update", config: { resendApiKey: process.env.RESEND_API_KEY || "", audienceId: "all-users", fromEmail: "noreply@cribnosh.com" } }
);

const TEMPLATES_DIR = path.join(process.cwd(), 'lib', 'email', 'templates', 'html');

// Helper to read template and metadata
async function getTemplateData(key: string) {
  const templatePath = path.join(TEMPLATES_DIR, `${key}.html`);
  const metadataPath = path.join(TEMPLATES_DIR, `${key}.json`);
  
  if (!fs.existsSync(templatePath) || !fs.existsSync(metadataPath)) {
    throw new Error(`Template ${key} not found`);
  }
  
  const html = await fs.promises.readFile(templatePath, 'utf8');
  const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
  
  return { html, metadata };
}

// Action to schedule and send a drip email
export const runDripScheduler = internalAction({
  args: {
    broadcastId: v.string(),
    config: v.object({
      resendApiKey: v.string(),
      audienceId: v.string(),
      fromEmail: v.string(),
      variables: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const { broadcastId, config } = args;
    const resend = new Resend(config.resendApiKey);

    try {
      await resend.emails.send({
        from: config.fromEmail,
        to: config.audienceId,
        subject: "Your CribNosh Update",
        html: "",
        headers: {
          "X-Entity-Ref-ID": broadcastId,
        },
        ...(config.variables && { variables: config.variables }),
      });

      // Log success (monitoring module not available)
      console.log(`Successfully sent drip email broadcast: ${broadcastId}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'Unknown error';
          
      // Log error (monitoring module not available)
      console.error(`Failed to send drip email broadcast ${broadcastId}: ${errorMessage}`);

      // Re-throw the error with more context
      throw new Error(`Failed to process drip email broadcast ${broadcastId}: ${errorMessage}`);
    }
  },
});

export default crons;