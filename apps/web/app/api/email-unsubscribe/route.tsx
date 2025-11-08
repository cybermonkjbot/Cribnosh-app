import { NextResponse } from "next/server";
import { ResponseFactory } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token"); // Optional unsubscribe token
  
  if (!email) {
    return ResponseFactory.validationError("Email is required");
  }
  
  try {
    // Verify unsubscribe token if provided
    if (token && !verifyUnsubscribeToken(email, token)) {
      return ResponseFactory.unauthorized("Invalid unsubscribe token");
    }
    
    // Unsubscribe from newsletter service
    const unsubscribeResult = await unsubscribeFromNewsletter(email);
    
    if (!unsubscribeResult.success) {
      return ResponseFactory.internalError(unsubscribeResult.error || "Failed to unsubscribe");
    }
    
    // Log the unsubscribe event
    logger.log(`Email unsubscribed: ${email}`, {
      timestamp: new Date().toISOString(),
      token: token ? 'provided' : 'none'
    });
    
    return ResponseFactory.success({ 
      success: true, 
      message: `Successfully unsubscribed ${email} from newsletter`,
      unsubscribedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error("Unsubscribe error:", error);
    return ResponseFactory.internalError("Failed to process unsubscribe request");
  }
}

export const POST = GET;

/**
 * Unsubscribe email from newsletter service
 */
async function unsubscribeFromNewsletter(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      // Example with Resend API
      const response = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          unsubscribed: true,
          audience_id: process.env.RESEND_AUDIENCE_ID || 'default'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Resend unsubscribe error:', errorData);
        return { success: false, error: 'Failed to unsubscribe via email service' };
      }
    }
    
    // Update local database (if using Convex)
    // This would require importing Convex client and calling a mutation
    // await convex.mutation(api.mutations.email.unsubscribeEmail, { email });
    
    logger.log(`Successfully unsubscribed ${email} from newsletter`);
    return { success: true };
    
  } catch (error) {
    logger.error('Newsletter unsubscribe error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Verify unsubscribe token
 */
function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    try {
      const crypto = require('crypto');
      const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';
      
      // Decode the token
      const tokenData = Buffer.from(token, 'base64').toString('utf-8');
      const [payload, signature] = tokenData.split(':');
      
      if (!payload || !signature) {
        return false;
      }
      
      // Verify the signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return false;
      }
      
      // Parse and validate payload
      const tokenPayload = JSON.parse(payload);
      const now = Date.now();
      
      // Check token expiration (24 hours)
      if (tokenPayload.timestamp && (now - tokenPayload.timestamp) > 24 * 60 * 60 * 1000) {
        return false;
      }
      
      // Verify email matches
      return tokenPayload.email === email;
      
    } catch (error) {
      logger.error('Token validation failed:', error);
      return false;
    }
    
  } catch (error) {
    logger.error('Token verification error:', error);
    return false;
  }
}

/**
 * Generate unsubscribe token for email
 */
function generateUnsubscribeToken(email: string): string {
  try {
    const crypto = require('crypto');
    const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production';
    
    // Create a secure token with timestamp and email
    const timestamp = Date.now();
    const payload = JSON.stringify({ email, timestamp });
    
    // Create HMAC signature
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Combine payload and signature
    const token = Buffer.from(`${payload}:${signature}`).toString('base64');
    
    return token;
  } catch (error) {
    logger.error('Failed to generate unsubscribe token:', error);
    // Fallback to simple token
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${email}:${timestamp}:${random}`);
  }
}
