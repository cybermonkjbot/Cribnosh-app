import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { ConvexError } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";

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
  status?: "active" | "inactive" | "suspended";
  sessionToken?: string;
  sessionExpiry?: number;
}

/**
 * Get the current authenticated user from Convex auth
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<AuthenticatedUser | null> {
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
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user || user.status === "suspended" || user.status === "inactive") {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      roles: (user.roles || []) as UserRole[],
      status: user.status,
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Get authenticated user by session token (for staff portal)
 */
export async function getAuthenticatedUserBySessionToken(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  sessionToken: string
): Promise<AuthenticatedUser | null> {
  try {
    if (!sessionToken) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("sessionToken"), sessionToken))
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
      status: user.status,
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
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new ConvexError("Authentication required");
  }
  return user;
}

/**
 * Require authentication by session token - throws if user is not authenticated
 */
export async function requireAuthBySessionToken(
  ctx: QueryCtx | MutationCtx | ActionCtx,
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
  return hasAnyRole(user, ["admin", "hr", "human_resources", "management"]);
}

/**
 * Require a specific role - throws if user doesn't have the role
 */
export async function requireRole(ctx: QueryCtx | MutationCtx | ActionCtx, role: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  if (!hasRole(user, role)) {
    throw new ConvexError(`Role '${role}' required`);
  }
  return user;
}

/**
 * Require any of the specified roles - throws if user doesn't have any
 */
export async function requireAnyRole(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  roles: UserRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  if (!hasAnyRole(user, roles)) {
    throw new ConvexError(`One of the following roles required: ${roles.join(", ")}`);
  }
  return user;
}

/**
 * Require admin role - throws if user is not admin
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  if (!isAdmin(user)) {
    throw new ConvexError("Admin access required");
  }
  return user;
}

/**
 * Require staff role - throws if user is not staff
 */
export async function requireStaff(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  if (!isStaff(user)) {
    throw new ConvexError("Staff access required");
  }
  return user;
}

/**
 * Check if user can access a specific resource (by ownership or role)
 */
export async function canAccessResource(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  resourceUserId: Id<"users"> | string,
  requireAdmin: boolean = false
): Promise<boolean> {
  const user = await getAuthenticatedUser(ctx);
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
 */
export async function requireResourceAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  resourceUserId: Id<"users"> | string,
  requireAdmin: boolean = false
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  const hasAccess = await canAccessResource(ctx, resourceUserId, requireAdmin);
  if (!hasAccess) {
    throw new ConvexError("Access denied to this resource");
  }
  return user;
}

/**
 * Check if user can modify a resource (must be owner or admin)
 */
export async function canModifyResource(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  resourceUserId: Id<"users"> | string
): Promise<boolean> {
  const user = await getAuthenticatedUser(ctx);
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
 */
export async function requireModifyAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  resourceUserId: Id<"users"> | string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);
  const canModify = await canModifyResource(ctx, resourceUserId);
  if (!canModify) {
    throw new ConvexError("You do not have permission to modify this resource");
  }
  return user;
}

