import { v } from 'convex/values';
import {
  ErrorCode,
  ErrorFactory,
  safeConvexOperation,
  withConvexErrorHandling
} from '../../../apps/web/lib/errors/convex-exports';
import { SMS_CONFIG } from '../../../apps/web/lib/sms/sms-config';
import { DEFAULT_SMS_PROVIDER, SMS_PROVIDERS, createSMSService } from '../../../apps/web/lib/sms/sms-providers';
import { api } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { MutationCtx, mutation } from '../_generated/server';

// Create OTP mutation
export const createOTP = mutation({
  args: {
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    code: v.string(),
    maxAttempts: v.optional(v.number()),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  returns: v.object({
    otpId: v.id("otps"),
    waitlistId: v.string(),
    isExistingWaitlistUser: v.boolean(),
    message: v.string(),
  }),
  handler: withConvexErrorHandling(async (ctx: MutationCtx, args: {
    phone?: string;
    email?: string;
    code: string;
    maxAttempts?: number;
    name?: string;
    location?: string;
    referralCode?: string;
    source?: string;
  }) => {
    const now = Date.now();
    const expiresAt = now + (5 * 60 * 1000); // 5 minutes expiry
    const maxAttempts = args.maxAttempts || 3;

    // Validate that either phone or email is provided, but not both
    if (!args.phone && !args.email) {
      throw ErrorFactory.validation('Either phone or email must be provided', {
        operation: 'create_otp'
      });
    }
    if (args.phone && args.email) {
      throw ErrorFactory.validation('Cannot provide both phone and email', {
        operation: 'create_otp'
      });
    }

    // Add user to waitlist before sending OTP
    const identifier = args.email || args.phone!;
    const waitlistResult: { waitlistId: string; isExisting: boolean } = await safeConvexOperation(
      () => ctx.runMutation(api.mutations.waitlist.addToWaitlist, {
        email: args.email || `${args.phone}@temp.cribnosh.com`, // Use phone as temp email if no email
        name: args.name,
        phone: args.phone,
        location: args.location,
        referralCode: args.referralCode,
        source: args.source || 'otp_signup',
      }),
      { operation: 'add_to_waitlist', identifier }
    );

    // Delete any existing OTPs for this phone or email
    let existingOtps;
    if (args.phone) {
      existingOtps = await safeConvexOperation(
        () => ctx.db
          .query('otps')
          .withIndex('by_phone', (q) => q.eq('phone', args.phone))
          .collect(),
        { operation: 'get_existing_otps', phone: args.phone }
      );
    } else {
      existingOtps = await safeConvexOperation(
        () => ctx.db
          .query('otps')
          .withIndex('by_email', (q) => q.eq('email', args.email))
          .collect(),
        { operation: 'get_existing_otps', email: args.email }
      );
    }

    for (const existingOtp of existingOtps) {
      await safeConvexOperation(
        () => ctx.db.delete(existingOtp._id),
        { operation: 'delete_existing_otp', otpId: existingOtp._id }
      );
    }

    // Create new OTP
    const otpId = await safeConvexOperation(
      () => ctx.db.insert('otps', {
        phone: args.phone,
        email: args.email,
        code: args.code,
        expiresAt,
        attempts: 0,
        maxAttempts,
        isUsed: false,
        createdAt: now,
        updatedAt: now,
      }),
      { operation: 'create_otp', phone: args.phone, email: args.email }
    );

    return {
      otpId,
      waitlistId: waitlistResult.waitlistId,
      isExistingWaitlistUser: waitlistResult.isExisting,
      message: 'OTP created and user added to waitlist successfully'
    };
  }),
});

export const verifyOTP = mutation({
  args: {
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    code: v.string(),
  },
  handler: withConvexErrorHandling(async (ctx: MutationCtx, args: {
    phone?: string;
    email?: string;
    code: string;
  }) => {
    const now = Date.now();

    // Validate input
    if (!args.phone && !args.email) {
      throw ErrorFactory.validation('Either phone number or email address is required', {
        operation: 'verify_otp'
      });
    }
    if (args.phone && args.email) {
      throw ErrorFactory.validation('Cannot provide both phone number and email address', {
        operation: 'verify_otp'
      });
    }

      if (!args.code || args.code.length !== 6 || !/^\d{6}$/.test(args.code)) {
        throw ErrorFactory.validation('OTP code must be a 6-digit number', {
          operation: 'verify_otp',
          code: args.code
        });
      }

      // Find the OTP for this phone or email
      let otp: Doc<"otps"> | null;
      const identifier = args.phone || args.email;
      const identifierType = args.phone ? 'phone number' : 'email address';

      if (args.phone) {
        otp = await safeConvexOperation(
          () => ctx.db
            .query('otps')
            .withIndex('by_phone', (q) => q.eq('phone', args.phone))
            .order('desc')
            .first(),
          { operation: 'find_otp_by_phone', phone: args.phone }
        );
      } else {
        otp = await safeConvexOperation(
          () => ctx.db
            .query('otps')
            .withIndex('by_email', (q) => q.eq('email', args.email))
            .order('desc')
            .first(),
          { operation: 'find_otp_by_email', email: args.email }
        );
      }

      if (!otp) {
        throw ErrorFactory.notFound(`No verification code found for this ${identifierType}. Please request a new verification code.`, {
          operation: 'verify_otp',
          identifier,
          identifierType
        });
      }

      // At this point, otp is guaranteed to be non-null
      const otpDoc = otp as Doc<"otps">;

      // Check if OTP is expired
      if (now > otpDoc.expiresAt) {
        // Clean up expired OTP
        await safeConvexOperation(
          () => ctx.db.delete(otpDoc._id),
          { operation: 'delete_expired_otp', otpId: otpDoc._id }
        );
        throw ErrorFactory.validation('Verification code has expired. Please request a new verification code.', {
          operation: 'verify_otp',
          identifier,
          expiresAt: otpDoc.expiresAt
        });
      }

      // Check if OTP is already used
      if (otpDoc.isUsed) {
        throw ErrorFactory.conflict('This verification code has already been used. Please request a new one.', {
          operation: 'verify_otp',
          identifier
        });
      }

      // Check if max attempts exceeded
      if (otpDoc.attempts >= otpDoc.maxAttempts) {
        // Mark as used to prevent further attempts
        await safeConvexOperation(
          () => ctx.db.patch(otpDoc._id, {
            isUsed: true,
            updatedAt: now,
          }),
          { operation: 'mark_otp_used', otpId: otpDoc._id }
        );
        throw ErrorFactory.validation('Maximum verification attempts exceeded. Please request a new verification code.', {
          operation: 'verify_otp',
          identifier,
          attempts: otpDoc.attempts,
          maxAttempts: otpDoc.maxAttempts
        });
      }

      // Check if code matches first
      if (otpDoc.code !== args.code) {
        const newAttempts = otpDoc.attempts + 1;
        const remainingAttempts = otpDoc.maxAttempts - newAttempts;
        
        // Increment attempts only if code is wrong
        await ctx.db.patch(otpDoc._id, {
          attempts: newAttempts,
          updatedAt: now,
        });

        if (remainingAttempts <= 0) {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid verification code. Maximum attempts exceeded. Please request a new verification code.');
        } else {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`);
        }
      }

      // Code matches - mark OTP as used and increment attempts in one operation
      await ctx.db.patch(otpDoc._id, {
        isUsed: true,
        attempts: otpDoc.attempts + 1,
        updatedAt: now,
      });

      // Get waitlist information for the verified user
      const waitlistEntry = await safeConvexOperation(
        () => ctx.db
          .query('waitlist')
          .filter((q) => q.eq(q.field('email'), args.email || `${args.phone}@temp.cribnosh.com`))
          .first(),
        { operation: 'get_waitlist_entry', identifier }
      );

      return { 
        success: true, 
        message: 'Verification successful',
        identifier: identifier,
        identifierType: identifierType,
        verifiedAt: now,
        waitlistId: waitlistEntry?._id,
        isWaitlistUser: !!waitlistEntry
      };
  }),
});

export const createEmailOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    maxAttempts: v.optional(v.number()),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    otpId: v.id("otps"),
    email: v.string(),
    expiresAt: v.number(),
    maxAttempts: v.number(),
    waitlistId: v.string(),
    isExistingWaitlistUser: v.boolean(),
    message: v.string(),
  }),
  handler: withConvexErrorHandling(async (ctx: MutationCtx, args: {
    email: string;
    code: string;
    maxAttempts?: number;
    name?: string;
    location?: string;
    referralCode?: string;
    source?: string;
  }) => {
    try {
      const now = Date.now();
      const expiresAt = now + (5 * 60 * 1000); // 5 minutes expiry
      const maxAttempts = args.maxAttempts || 3;

      // Validate input
      if (!args.email || !args.code) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Email and OTP code are required');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid email address format');
      }

      if (args.code.length !== 6 || !/^\d{6}$/.test(args.code)) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'OTP code must be a 6-digit number');
      }

      if (maxAttempts < 1 || maxAttempts > 10) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Max attempts must be between 1 and 10');
      }

      // Add user to waitlist before sending OTP
      const waitlistResult: { waitlistId: string; isExisting: boolean } = await safeConvexOperation(
        () => ctx.runMutation(api.mutations.waitlist.addToWaitlist, {
          email: args.email,
          name: args.name,
          phone: undefined,
          location: args.location,
          referralCode: args.referralCode,
          source: args.source || 'email_otp_signup',
        }),
        { operation: 'add_to_waitlist', email: args.email }
      );

      // Delete any existing OTPs for this email
      const existingOtps = await ctx.db
        .query('otps')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .collect();

      for (const existingOtp of existingOtps) {
        await ctx.db.delete(existingOtp._id);
      }

      // Create new OTP
      const otpId = await ctx.db.insert('otps', {
        email: args.email,
        code: args.code,
        expiresAt,
        attempts: 0,
        maxAttempts,
        isUsed: false,
        createdAt: now,
        updatedAt: now,
      });

      return {
        success: true,
        otpId,
        email: args.email,
        expiresAt,
        maxAttempts,
        waitlistId: waitlistResult.waitlistId,
        isExistingWaitlistUser: waitlistResult.isExisting,
        message: 'Verification code sent successfully and user added to waitlist'
      };
    } catch (error) {
      // Log error for debugging
      console.error('OTP creation error:', {
        email: args.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to create verification code. Please try again.');
    }
  }),
});

export const verifyEmailOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: withConvexErrorHandling(async (ctx: MutationCtx, args: {
    email: string;
    code: string;
  }) => {
    try {
      const now = Date.now();

      // Validate input
      if (!args.email || !args.code) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Email and OTP code are required');
      }

      if (args.code.length !== 6 || !/^\d{6}$/.test(args.code)) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'OTP code must be a 6-digit number');
      }

      // Find the OTP for this email
      const otp = await ctx.db
        .query('otps')
        .withIndex('by_email', (q) => q.eq('email', args.email))
        .order('desc')
        .first();

      if (!otp) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'No OTP found for this email. Please request a new verification code.');
      }

      // At this point, otp is guaranteed to be non-null
      const otpDoc = otp as Doc<"otps">;

      // Check if OTP is expired
      if (now > otpDoc.expiresAt) {
        // Clean up expired OTP
        await ctx.db.delete(otpDoc._id);
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'OTP has expired. Please request a new verification code.');
      }

      // Check if OTP is already used
      if (otpDoc.isUsed) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'This verification code has already been used. Please request a new one.');
      }

      // Check if max attempts exceeded
      if (otpDoc.attempts >= otpDoc.maxAttempts) {
        // Mark as used to prevent further attempts
        await ctx.db.patch(otpDoc._id, {
          isUsed: true,
          updatedAt: now,
        });
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Maximum verification attempts exceeded. Please request a new verification code.');
      }

      // Check if code matches first
      if (otpDoc.code !== args.code) {
        const newAttempts = otpDoc.attempts + 1;
        const remainingAttempts = otpDoc.maxAttempts - newAttempts;
        
        // Increment attempts only if code is wrong
        await ctx.db.patch(otpDoc._id, {
          attempts: newAttempts,
          updatedAt: now,
        });

        if (remainingAttempts <= 0) {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid verification code. Maximum attempts exceeded. Please request a new verification code.');
        } else {
          throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`);
        }
      }

      // Code matches - mark OTP as used and increment attempts in one operation
      await ctx.db.patch(otpDoc._id, {
        isUsed: true,
        attempts: otpDoc.attempts + 1,
        updatedAt: now,
      });

      // Get waitlist information for the verified user
      const waitlistEntry = await safeConvexOperation(
        () => ctx.db
          .query('waitlist')
          .filter((q) => q.eq(q.field('email'), args.email))
          .first(),
        { operation: 'get_waitlist_entry', email: args.email }
      );

      return { 
        success: true, 
        message: 'Email verified successfully',
        email: args.email,
        verifiedAt: now,
        waitlistId: waitlistEntry?._id,
        isWaitlistUser: !!waitlistEntry
      };
    } catch (error) {
      // Log error for debugging
      console.error('OTP verification error:', {
        email: args.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Verification failed. Please try again.');
    }
  }),
});

export const sendSMSOTP = mutation({
  args: {
    phone: v.string(),
    code: v.string(),
    provider: v.optional(v.string()),
    maxAttempts: v.optional(v.number()),
  },
  handler: withConvexErrorHandling(async (ctx: MutationCtx, args: {
    phone: string;
    code: string;
    provider?: string;
    maxAttempts?: number;
  }) => {
    try {
      const now = Date.now();
      const expiresAt = now + (5 * 60 * 1000); // 5 minutes expiry
      const maxAttempts = args.maxAttempts || 3;
      const providerName = args.provider || DEFAULT_SMS_PROVIDER;

      // Validate input
      if (!args.phone || !args.code) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Phone number and OTP code are required');
      }

      if (args.code.length !== 6 || !/^\d{6}$/.test(args.code)) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'OTP code must be a 6-digit number');
      }

      // Validate provider
      if (!SMS_PROVIDERS[providerName as keyof typeof SMS_PROVIDERS]) {
        throw new Error(`Invalid SMS provider: ${providerName}`);
      }

      const validProviderName = providerName as keyof typeof SMS_PROVIDERS;

      // Check rate limiting (basic implementation)
      const recentOtps = await ctx.db
        .query('otps')
        .withIndex('by_phone', (q) => q.eq('phone', args.phone))
        .filter((q) => q.gt(q.field('createdAt'), now - (60 * 60 * 1000))) // Last hour
        .collect();

      if (recentOtps.length >= SMS_CONFIG.rateLimit.maxOTPsPerPhone) {
        throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Too many OTP requests. Please wait before requesting another code.');
      }

      // Delete any existing OTPs for this phone
      for (const recentOtp of recentOtps) {
        await ctx.db.delete(recentOtp._id);
      }

      // Create new OTP record
      const otpId = await ctx.db.insert('otps', {
        phone: args.phone,
        code: args.code,
        expiresAt,
        attempts: 0,
        maxAttempts,
        isUsed: false,
        createdAt: now,
        updatedAt: now,
      });

      // Send SMS using real SMS service
      try {
        const smsService = createSMSService(validProviderName, {
          apiKey: process.env.SMS_API_KEY,
          username: process.env.SMS_USERNAME,
          password: process.env.SMS_PASSWORD,
          token: process.env.SMS_TOKEN,
          senderId: process.env.SMS_SENDER_ID || 'CribNosh'
        });

        const smsResult = await smsService.sendOTP({
          phone: args.phone,
          code: args.code,
          expiryMinutes: Math.floor((expiresAt - now) / (1000 * 60))
        });

        if (!smsResult.success) {
          console.error(`SMS sending failed for ${args.phone}:`, smsResult.error);
          // Still create the OTP record even if SMS fails
          // The user can request a new OTP
        } else {
          console.log(`SMS OTP sent successfully to ${args.phone} via ${providerName}. Message ID: ${smsResult.messageId}`);
        }
      } catch (smsError) {
        console.error(`SMS service error for ${args.phone}:`, smsError);
        // Still create the OTP record even if SMS service fails
        // The user can request a new OTP
      }

      return {
        success: true,
        otpId,
        phone: args.phone,
        provider: validProviderName,
        expiresAt,
        message: 'OTP sent successfully',
        // smsMessageId: smsResult.messageId,
        // cost: smsResult.cost
      };
    } catch (error) {
      console.error('SMS OTP creation error:', {
        phone: args.phone,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      if (error instanceof Error) {
        throw error;
      }
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to send SMS OTP. Please try again.');
    }
  }),
});

export const cleanupExpiredOTPs = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();

    // Find all expired OTPs
    const expiredOtps = await ctx.db
      .query('otps')
      .withIndex('by_expiry', (q) => q.lt('expiresAt', now))
      .collect();

    // Delete expired OTPs
    for (const expiredOtp of expiredOtps) {
      await ctx.db.delete(expiredOtp._id);
    }

    return { deleted: expiredOtps.length };
  },
});

export const getSMSProviders = mutation({
  args: {},
  handler: async () => {
    return Object.entries(SMS_PROVIDERS).map(([key, provider]: [string, any]) => ({
      id: key,
      name: provider.name,
      pricePerSMS: provider.pricing.perSMS,
      currency: provider.pricing.currency,
      isDefault: key === DEFAULT_SMS_PROVIDER,
      authType: provider.authType
    }));
  },
});
