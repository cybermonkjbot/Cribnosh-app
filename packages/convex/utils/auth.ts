import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Authentication and Authorization Utilities
 * 
 * This module provides centralized security functions for Convex queries, mutations, and actions.
 * All security checks should go through these utilities to ensure consistency.
 */

export type UserRole = "admin" | "staff" | "user" | "chef" | "customer" | "hr" | "management" | "developer" | "compliance";

export interface AuthenticatedUser {
  _id: Id<"users">;
  email: string;
  roles: UserRole[];
  status?: "active" | "inactive" | "suspended" | "provisional";
  sessionToken?: string;
  sessionExpiry?: number;
}

/**
 * Get the current authenticated user from Convex auth or session token
 * Returns null if not authenticated
 * If sessionToken is provided, uses session token authentication
 * Otherwise, falls back to JWT from setAuth() (for backward compatibility)
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser | null> {
  // If session token is provided, use it
  if (sessionToken) {
    return getAuthenticatedUserBySessionToken(ctx, sessionToken);
  }

  // Otherwise, fall back to JWT from setAuth()
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.tokenIdentifier) {
      return null;
    }

    // Extract email from token identifier (format: "provider:email")
    const email = identity.tokenIdentifier.split(":")[1];
    if (!email) {
      return null;
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();

    if (!user || user.status === "suspended" || user.status === "inactive") {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      roles: (user.roles || []) as UserRole[],
      status: user.status as AuthenticatedUser["status"],
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Get authenticated user by session token (for staff portal)
 * Now supports multiple devices by checking the sessions table
 */
export async function getAuthenticatedUserBySessionToken(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string
): Promise<AuthenticatedUser | null> {
  try {
    if (!sessionToken) {
      return null;
    }

    // First, check the sessions table (supports multiple devices)
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("sessionToken", sessionToken))
      .first();

    if (session) {
      // Check if session is expired
      if (session.expiresAt && session.expiresAt < Date.now()) {
        return null;
      }

      // Get the user associated with this session
      const user = await ctx.db.get(session.userId);
      if (!user) {
        return null;
      }

      // Check if user is active
      if (user.status === "suspended" || user.status === "inactive") {
        return null;
      }

      return {
        _id: user._id,
        email: user.email,
        roles: (user.roles || []) as UserRole[],
        status: user.status as AuthenticatedUser["status"],
        sessionToken: session.sessionToken,
        sessionExpiry: session.expiresAt,
      };
    }

    // Fallback: Check user document for backward compatibility (legacy sessions)
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("sessionToken"), sessionToken))
      .first();

    if (!user) {
      return null;
    }

    // Check if session is expired
    if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
      return null;
    }

    // Check if user is active
    if (user.status === "suspended" || user.status === "inactive") {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      roles: (user.roles || []) as UserRole[],
      status: user.status as AuthenticatedUser["status"],
      sessionToken: user.sessionToken,
      sessionExpiry: user.sessionExpiry,
    };
  } catch (error) {
    console.error("Error getting authenticated user by session token:", error);
    return null;
  }
}

/**
 * Require authentication - throws if user is not authenticated
 * If sessionToken is provided, uses session token authentication
 * Otherwise, falls back to JWT from setAuth() (for backward compatibility)
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(ctx, sessionToken);
  if (!user) {
    throw new ConvexError("Authentication required");
  }
  return user;
}

/**
 * Require authentication by session token - throws if user is not authenticated
 */
export async function requireAuthBySessionToken(
  ctx: QueryCtx | MutationCtx,
  sessionToken: string
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUserBySessionToken(ctx, sessionToken);
  if (!user) {
    throw new ConvexError("Authentication required");
  }
  return user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthenticatedUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: AuthenticatedUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: AuthenticatedUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.every((role) => user.roles.includes(role));
}

/**
 * Check if user is admin or has admin privileges
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return hasAnyRole(user, ["admin", "management", "developer", "compliance"]);
}

/**
 * Check if user is staff (admin or staff role)
 */
export function isStaff(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return hasAnyRole(user, ["admin", "staff", "management", "developer", "compliance", "hr"]);
}

/**
 * Check if user is HR or admin
 */
export function isHROrAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) return false;
  return hasAnyRole(user, ["admin", "hr", "management"]);
}

/**
 * Require a specific role - throws if user doesn't have the role
 * If sessionToken is provided, uses session token authentication
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: UserRole,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  if (!hasRole(user, role)) {
    throw new ConvexError(`Role '${role}' required`);
  }
  return user;
}

/**
 * Require any of the specified roles - throws if user doesn't have any
 * If sessionToken is provided, uses session token authentication
 */
export async function requireAnyRole(
  ctx: QueryCtx | MutationCtx,
  roles: UserRole[],
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  if (!hasAnyRole(user, roles)) {
    throw new ConvexError(`One of the following roles required: ${roles.join(", ")}`);
  }
  return user;
}

/**
 * Require admin role - throws if user is not admin
 * If sessionToken is provided, uses session token authentication
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  if (!isAdmin(user)) {
    throw new ConvexError("Admin access required");
  }
  return user;
}

/**
 * Require staff role - throws if user is not staff
 * If sessionToken is provided, uses session token authentication
 */
export async function requireStaff(
  ctx: QueryCtx | MutationCtx,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  if (!isStaff(user)) {
    throw new ConvexError("Staff access required");
  }
  return user;
}

/**
 * Check if user can access a specific resource (by ownership or role)
 * If sessionToken is provided, uses session token authentication
 */
export async function canAccessResource(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users"> | string,
  requireAdmin: boolean = false,
  sessionToken?: string
): Promise<boolean> {
  const user = await getAuthenticatedUser(ctx, sessionToken);
  if (!user) return false;

  // Admins can access everything if requireAdmin is false
  if (!requireAdmin && isAdmin(user)) {
    return true;
  }

  // Check if user owns the resource
  const resourceUserIdStr = typeof resourceUserId === "string" ? resourceUserId : resourceUserId;
  const userStr = user._id.toString();
  return resourceUserIdStr === userStr;
}

/**
 * Require access to a resource - throws if user cannot access it
 * If sessionToken is provided, uses session token authentication
 */
export async function requireResourceAccess(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users"> | string,
  requireAdmin: boolean = false,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  const hasAccess = await canAccessResource(ctx, resourceUserId, requireAdmin, sessionToken);
  if (!hasAccess) {
    throw new ConvexError("Access denied to this resource");
  }
  return user;
}

/**
 * Check if user can modify a resource (must be owner or admin)
 * If sessionToken is provided, uses session token authentication
 */
export async function canModifyResource(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users"> | string,
  sessionToken?: string
): Promise<boolean> {
  const user = await getAuthenticatedUser(ctx, sessionToken);
  if (!user) return false;

  // Admins can modify everything
  if (isAdmin(user)) {
    return true;
  }

  // Check if user owns the resource
  const resourceUserIdStr = typeof resourceUserId === "string" ? resourceUserId : resourceUserId;
  const userStr = user._id.toString();
  return resourceUserIdStr === userStr;
}

/**
 * Require modification access to a resource - throws if user cannot modify it
 * If sessionToken is provided, uses session token authentication
 */
export async function requireModifyAccess(
  ctx: QueryCtx | MutationCtx,
  resourceUserId: Id<"users"> | string,
  sessionToken?: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx, sessionToken);
  const canModify = await canModifyResource(ctx, resourceUserId, sessionToken);
  if (!canModify) {
    throw new ConvexError("You do not have permission to modify this resource");
  }
  return user;
}

