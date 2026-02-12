// @ts-nocheck
"use node";

import { v } from "convex/values";
import { authenticator } from "otplib";
import { api } from "../_generated/api";
import { ActionCtx, action } from "../_generated/server";

/**
 * Google OAuth Authentication Action
 * Verifies Google token (idToken or accessToken) and creates/updates user session
 */
export const googleAuth = action({
    args: {
        idToken: v.optional(v.string()),
        accessToken: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.idToken && !args.accessToken) {
            throw new Error("Either idToken or accessToken is required.");
        }

        // Verify Google token and get user info
        let googleUserInfo;

        if (args.idToken) {
            // Verify ID token with Google
            const response = await fetch(
                `https://oauth2.googleapis.com/tokeninfo?id_token=${args.idToken}`
            );
            if (!response.ok) {
                throw new Error("Failed to verify Google ID token");
            }
            const data = await response.json();
            if (!data.sub || !data.email || !data.name) {
                throw new Error("Invalid Google ID token data");
            }
            googleUserInfo = {
                sub: data.sub,
                email: data.email,
                name: data.name,
                picture: data.picture,
                email_verified: data.email_verified === "true",
            };
        } else if (args.accessToken) {
            // Get user info using access token
            const response = await fetch(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                {
                    headers: {
                        "Authorization": `Bearer ${args.accessToken}`,
                    },
                }
            );
            if (!response.ok) {
                throw new Error("Failed to get Google user info");
            }
            const data = await response.json();
            if (!data.id || !data.email || !data.name) {
                throw new Error("Invalid Google user info data");
            }
            googleUserInfo = {
                sub: data.id,
                email: data.email,
                name: data.name,
                picture: data.picture,
                email_verified: data.verified_email || false,
            };
        }

        if (!googleUserInfo) {
            throw new Error("Failed to verify Google authentication");
        }

        // Create or update user with OAuth info
        const { userId, isNewUser } = await ctx.runMutation(api.mutations.users.createOrUpdateOAuthUser, {
            provider: "google",
            providerId: googleUserInfo.sub,
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            picture: googleUserInfo.picture,
            verified: googleUserInfo.email_verified,
        });

        // Get the user details
        const user = await ctx.runQuery(api.queries.users.getById, {
            userId,
            sessionToken: undefined
        });

        if (!user) {
            throw new Error("Failed to retrieve user after Google authentication");
        }

        // Ensure user has 'customer' role
        let userRoles = user.roles || ["user"];
        if (!userRoles.includes("customer")) {
            userRoles = [...userRoles, "customer"];
            await ctx.runMutation(api.mutations.users.updateUserRoles, {
                userId: user._id,
                roles: userRoles,
            });
        }

        // Check for 2FA
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
                userId: user._id,
            });

            return {
                success: false as const,
                requires2FA: true as const,
                verificationToken,
                message: "2FA verification required",
            };
        }

        // Create session token
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId: user._id,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        return {
            success: true as const,
            message: isNewUser ? "User created and authenticated successfully" : "Authentication successful",
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: user._id,
                email: user.email,
                name: user.name,
                roles: userRoles,
                picture: googleUserInfo.picture,
                isNewUser,
                provider: "google",
            },
        };
    }
});

/**
 * Apple OAuth Authentication Action
 */
export const appleAuth = action({
    args: {
        identityToken: v.optional(v.string()),
        authorizationCode: v.optional(v.string()),
        user: v.optional(v.any()), // For user data in authorization code flow
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.identityToken && !args.authorizationCode) {
            throw new Error("Either identityToken or authorizationCode is required.");
        }

        // Decode JWT payload (Apple identity token is a JWT)
        const decodeJWT = (token: string) => {
            try {
                const parts = token.split(".");
                if (parts.length !== 3) return null;
                const base64Url = parts[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
                return JSON.parse(jsonPayload);
            } catch (e) {
                return null;
            }
        };

        let appleUserInfo;

        if (args.identityToken) {
            const payload = decodeJWT(args.identityToken);
            if (!payload || !payload.sub) {
                throw new Error("Invalid Apple identity token");
            }
            appleUserInfo = {
                sub: payload.sub,
                email: payload.email_verified && payload.email ? payload.email : (payload.email || null),
                name: payload.name || `Apple User ${payload.sub.slice(-4)}`,
                picture: undefined,
                verified: !!payload.email_verified,
            };
        } else {
            // For authorization code flow, we'd need to exchange it
            // This part usually requires client_secret which needs private key signing
            // For now, if we have identityToken, that's the preferred method
            throw new Error("Authorization code flow not yet implemented in direct Convex action");
        }

        // Create or update user
        const { userId, isNewUser } = await ctx.runMutation(api.mutations.users.createOrUpdateOAuthUser, {
            provider: "apple",
            providerId: appleUserInfo.sub,
            email: appleUserInfo.email || `apple-${appleUserInfo.sub}@privaterelay.appleid.com`,
            name: appleUserInfo.name,
            picture: appleUserInfo.picture,
            verified: true,
        });

        // Get user details
        const userDetails = await ctx.runQuery(api.queries.users.getById, {
            userId,
            sessionToken: undefined
        });

        if (!userDetails) {
            throw new Error("Failed to retrieve user after Apple authentication");
        }

        // Roles
        let userRoles = userDetails.roles || ["user"];
        if (!userRoles.includes("customer")) {
            userRoles = [...userRoles, "customer"];
            await ctx.runMutation(api.mutations.users.updateUserRoles, {
                userId: userDetails._id,
                roles: userRoles,
            });
        }

        // 2FA
        if (userDetails.twoFactorEnabled && userDetails.twoFactorSecret) {
            const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
                userId: userDetails._id,
            });

            return {
                success: false as const,
                requires2FA: true as const,
                verificationToken,
                message: "2FA verification required",
            };
        }

        // Session
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId: userDetails._id,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        return {
            success: true as const,
            message: isNewUser ? "User created and authenticated successfully" : "Authentication successful",
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: userDetails._id,
                email: userDetails.email,
                name: userDetails.name,
                roles: userRoles,
                picture: undefined,
                isNewUser,
                provider: "apple",
            },
        };
    }
});

/**
 * Email/Password Login Action
 */
export const emailLogin = action({
    args: {
        email: v.string(),
        password: v.string(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx: ActionCtx, args) => {
        // Find user by email
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
            email: args.email,
        });

        if (!user) {
            return { success: false, error: "Invalid credentials." };
        }

        if (!user.password) {
            return { success: false, error: "Invalid credentials." };
        }

        // Verify password
        const isPasswordValid = await ctx.runAction(api.actions.password.verifyPasswordAction, {
            password: args.password,
            hashedPassword: user.password,
        });

        if (!isPasswordValid) {
            return { success: false, error: "Invalid credentials." };
        }

        // Check for 2FA
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
                userId: user._id,
            });

            return {
                success: false,
                requires2FA: true,
                verificationToken,
                message: "2FA verification required",
            };
        }

        // Create session
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId: user._id,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        return {
            success: true,
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: user._id,
                email: user.email,
                name: user.name,
                roles: user.roles || ["customer"],
            },
        };
    },
});

/**
 * Verify 2FA Action
 */
export const verify2FA = action({
    args: {
        verificationToken: v.string(),
        code: v.string(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx: ActionCtx, args) => {
        // Get verification session
        const session = await ctx.runMutation(api.mutations.verificationSessions.getVerificationSession, {
            sessionToken: args.verificationToken,
        });

        if (!session || session.used) {
            return { success: false, error: "Invalid or expired verification session." };
        }

        const MAX_FAILED_ATTEMPTS = 5;
        if (session.failedAttempts && session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            return { success: false, error: "Too many failed attempts. Please try again later." };
        }

        // Get user
        const user = await ctx.runQuery(api.queries.users.getById, {
            userId: session.userId,
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            return { success: false, error: "2FA not enabled for this user." };
        }

        // Verify TOTP code
        let isValid = false;
        try {
            isValid = authenticator.check(args.code, user.twoFactorSecret);
        } catch (error) {
            console.error("2FA Verification Error:", error);
        }

        if (!isValid) {
            // Increment failed attempts
            const newFailedAttempts = await ctx.runMutation(api.mutations.verificationSessions.incrementFailedAttempts, {
                sessionToken: args.verificationToken,
            });

            const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
            return {
                success: false,
                error: remainingAttempts > 0
                    ? `Invalid code. ${remainingAttempts} attempts remaining.`
                    : "Too many failed attempts. Session locked.",
            };
        }

        // Mark session as used
        await ctx.runMutation(api.mutations.verificationSessions.markSessionAsUsed, {
            sessionToken: args.verificationToken,
        });

        // Create actual session token
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId: user._id,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        return {
            success: true,
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: user._id,
                email: user.email,
                name: user.name,
                roles: user.roles || ["customer"],
            },
        };
    },
});

/**
 * Register Action
 */
export const register = action({
    args: {
        name: v.string(),
        email: v.string(),
        password: v.string(),
        role: v.optional(v.string()),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx: ActionCtx, args) => {
        // Check for existing user
        const existing = await ctx.runQuery(api.queries.users.getUserByEmail, {
            email: args.email,
        });

        if (existing) {
            return { success: false, error: "A user with this email already exists." };
        }

        // Hash password
        const passwordHash = await ctx.runAction(api.actions.password.hashPasswordAction, {
            password: args.password,
        });

        // Create user
        const userId = await ctx.runMutation(api.mutations.users.create, {
            name: args.name,
            email: args.email,
            password: passwordHash,
            roles: [args.role || "customer"],
            status: "active",
        });

        // Create session
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        return {
            success: true,
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: userId,
                email: args.email,
                name: args.name,
                roles: [args.role || "customer"],
            },
        };
    },
});
/**
 * Send Waitlist OTP Action
 * Handles OTP generation, email sending via Resend, and user registration in waitlist
 */
export const sendWaitlistOTP = action({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
        location: v.optional(v.string()),
        referralCode: v.optional(v.string()),
        source: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const TEST_OTP = '123456';
        const isDev = process.env.NODE_ENV === 'development';
        const otpCode = isDev ? TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();

        // Send OTP email using Resend action
        const recipientName = args.name || args.email.split('@')[0];
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Verify your email</h2>
                <p>Hello ${recipientName},</p>
                <p>Your CribNosh verification code is:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                    ${otpCode}
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p>If you didn't request this verification code, please ignore this email.</p>
                <p>Best regards,<br>CribNosh Team</p>
            </div>
        `;

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'CribNosh <onboarding@emails.cribnosh.co.uk>';

        try {
            await ctx.runAction(api.actions.resend.sendEmail, {
                from: fromEmail,
                to: args.email,
                subject: `Verify your email - ${otpCode}`,
                html: htmlContent,
                text: `Your CribNosh verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.`,
            });
        } catch (emailError: any) {
            console.error('Failed to send OTP email:', emailError);
            if (!isDev) {
                return {
                    success: false,
                    error: 'Failed to send verification email. Please try again.'
                };
            }
        }

        // Create OTP and add to waitlist
        const otpResult = await ctx.runMutation(api.mutations.otp.createEmailOTP, {
            email: args.email,
            code: otpCode,
            maxAttempts: 3,
            name: args.name,
            location: args.location,
            referralCode: args.referralCode,
            source: args.source || 'waitlist_otp_direct',
        });

        return {
            success: true,
            message: 'Verification code sent and added to waitlist',
            waitlistId: otpResult.waitlistId,
            isExistingWaitlistUser: otpResult.isExistingWaitlistUser,
            ...(isDev && { testOtp: TEST_OTP })
        };
    }
});

/**
 * Verify Waitlist OTP Action
 * Verifies OTP and creates/updates user session
 */
export const verifyWaitlistOTP = action({
    args: {
        email: v.string(),
        otp: v.string(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        deviceId: v.optional(v.string()),
        deviceName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Verify OTP
        const verificationResult = await ctx.runMutation(api.mutations.otp.verifyEmailOTP, {
            email: args.email,
            code: args.otp,
            purpose: 'waitlist',
        });

        // Find or create user with roles
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });

        let targetUser;
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            targetUser = await ctx.runMutation(api.mutations.users.createOrUpdateUserWithRoles, {
                name: args.email.split('@')[0],
                email: args.email,
                ensureCustomerRole: true,
            });
        } else {
            targetUser = user;
            // Ensure customer role
            if (!user.roles?.includes('customer')) {
                targetUser = await ctx.runMutation(api.mutations.users.createOrUpdateUserWithRoles, {
                    name: user.name || user.email.split('@')[0],
                    email: user.email,
                    roles: user.roles,
                    ensureCustomerRole: true,
                });
            }
        }

        if (!targetUser) {
            throw new Error('Failed to identify or create user');
        }

        // Create session
        const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
            userId: targetUser._id,
            expiresInDays: 30,
            userAgent: args.userAgent,
            ipAddress: args.ipAddress,
            deviceId: args.deviceId,
            deviceName: args.deviceName,
        });

        // Update last login
        await ctx.runMutation(api.mutations.users.updateLastLogin, {
            userId: targetUser._id,
        });

        return {
            success: true,
            message: 'Email verified successfully',
            sessionToken: sessionResult.sessionToken,
            user: {
                user_id: targetUser._id,
                email: targetUser.email,
                name: targetUser.name,
                roles: targetUser.roles || ['customer'],
                isNewUser,
            },
            waitlistId: verificationResult.waitlistId,
            isWaitlistUser: verificationResult.isWaitlistUser,
        };
    }
});
