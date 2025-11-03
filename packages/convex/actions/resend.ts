"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

/**
 * Validates image URLs in HTML content and removes broken ones
 */
async function validateAndSanitizeHtml(html: string): Promise<string> {
  // Extract all image URLs from HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = Array.from(html.matchAll(imgRegex));
  
  // Validate each image URL
  for (const match of matches) {
    const imageUrl = match[1];
    
    // Skip validation for data URIs, relative URLs, Convex URLs, and tracking pixels
    if (
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('./') ||
      imageUrl.startsWith('/api/files/') ||
      imageUrl.startsWith('/api/storage/') ||
      imageUrl.includes('track') ||
      imageUrl.includes('tracking') ||
      imageUrl.includes('mailto:')
    ) {
      continue;
    }
    
    // Check if image is accessible
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        headers: { 'Accept': 'image/*' },
      });
      
      const isValid =
        response.ok && response.headers.get('content-type')?.startsWith('image/');
      
      if (!isValid) {
        console.warn(`Removing broken image: ${imageUrl}`);
        // Remove the entire <img> tag
        html = html.replace(match[0], '<!-- Image removed: broken URL -->');
      }
    } catch (error) {
      console.error(`Error validating image ${imageUrl}:`, error);
      // Remove the image on error
      html = html.replace(match[0], '<!-- Image removed: validation error -->');
    }
  }
  
  return html;
}

// Send email using Resend
export const sendEmail = action({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    headers: v.optional(v.record(v.string(), v.string())),
    tags: v.optional(v.array(v.object({
      name: v.string(),
      value: v.string(),
    }))),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Validate and sanitize images before sending
    let sanitizedHtml = args.html;
    try {
      sanitizedHtml = await validateAndSanitizeHtml(args.html);
    } catch (error) {
      console.error('Error validating images in email:', error);
      // Continue with original HTML if validation fails
      sanitizedHtml = args.html;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: sanitizedHtml,
      text: args.text,
      replyTo: args.replyTo,
      headers: args.headers,
      tags: args.tags,
    });
    
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    return data?.id || '';
  },
});

// Get email status
export const getEmailStatus = action({
  args: {
    emailId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.get(args.emailId);
    
    if (error) {
      throw new Error(`Failed to get email status: ${error.message}`);
    }
    
    return data;
  },
});
