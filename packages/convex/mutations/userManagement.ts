// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createUserRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const roleId = await ctx.db.insert("userRoles", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      isDefault: args.isDefault || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, roleId };
  },
});

export const updateUserRole = mutation({
  args: {
    roleId: v.id("userRoles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const { roleId, ...updates } = args;
    await ctx.db.patch(roleId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const deleteUserRole = mutation({
  args: {
    roleId: v.id("userRoles"),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.delete(args.roleId);
    return { success: true };
  },
});

export const assignUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("userRoles"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    const role = await ctx.db.get(args.roleId);
    
    if (!user || !role) {
      throw new Error("User or role not found");
    }
    
    const currentRoles = user.roles || [];
    if (!currentRoles.includes(role.name)) {
      await ctx.db.patch(args.userId, {
        roles: [...currentRoles, role.name],
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const updateUserPermissions = mutation({
  args: {
    userId: v.id("users"),
    permissions: v.array(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.userId, {
      permissions: args.permissions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const toggleUserPermission = mutation({
  args: {
    userId: v.id("users"),
    permission: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const currentPermissions = user.permissions || [];
    const hasPermission = currentPermissions.includes(args.permission);
    
    const newPermissions = hasPermission
      ? currentPermissions.filter((p: any) => p !== args.permission)
      : [...currentPermissions, args.permission];
    
    await ctx.db.patch(args.userId, {
      permissions: newPermissions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
