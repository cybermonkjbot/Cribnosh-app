"use client";

import { logger } from "./utils/logger";

/**
 * Client-side authentication utility for managing Convex session tokens.
 * This utility handles storing and retrieving the 'convex-auth-token' cookie.
 */

const AUTH_COOKIE_NAME = "convex-auth-token";
const DEFAULT_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Set the authentication cookie
 */
export function setAuthToken(token: string, maxAge: number = DEFAULT_MAX_AGE) {
    if (typeof document === "undefined") return;

    try {
        const isProd = process.env.NODE_ENV === "production";
        const secure = isProd ? "; Secure" : "";
        document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
        logger.log(`[auth-client] Set ${AUTH_COOKIE_NAME} cookie`);
    } catch (error) {
        logger.error("[auth-client] Error setting auth cookie:", error);
    }
}

/**
 * Get the authentication cookie
 */
export function getAuthToken(): string | null {
    if (typeof document === "undefined") return null;

    try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${AUTH_COOKIE_NAME}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
        }
    } catch (error) {
        logger.error("[auth-client] Error reading auth cookie:", error);
    }
    return null;
}

/**
 * Clear the authentication cookie
 */
export function clearAuthToken() {
    if (typeof document === "undefined") return;

    try {
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
        logger.log(`[auth-client] Cleared ${AUTH_COOKIE_NAME} cookie`);
    } catch (error) {
        logger.error("[auth-client] Error clearing auth cookie:", error);
    }
}

/**
 * Perform a full logout: clear token and reload page
 */
export function logout(redirectPath: string = "/") {
    clearAuthToken();
    if (typeof window !== "undefined") {
        window.location.href = redirectPath;
    }
}

/**
 * Handle successful authentication: set token and reload
 */
export async function handleAuthSuccess(token: string, redirectPath: string = "/") {
    setAuthToken(token);

    // Give a tiny buffer for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    if (typeof window !== "undefined") {
        window.location.href = redirectPath;
    }
}
