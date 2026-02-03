// @ts-nocheck
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUserRoles = query({
  args: {},
  handler: async (ctx: any) => {
    const roles = await ctx.db.query("userRoles").collect();
    const users = await ctx.db.query("users").collect();
    
    return roles.map((role: any) => ({
      ...role,
      userCount: users.filter((user: any) => 
        user.roles && user.roles.includes(role.name)
      ).length,
    }));
  },
});

export const getAvailablePermissions = query({
  args: {},
  handler: async (ctx: any) => {
    const permissions = await ctx.db.query("permissions").collect();
    
    // Group permissions by category
    const grouped = permissions.reduce((acc: any, permission: any) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {});
    
    return grouped;
  },
});

export const getUserPermissions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx: any, args: any) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }
    
    const userRoles = user.roles || [];
    const allPermissions = await ctx.db.query("permissions").collect();
    
    // Get permissions from user roles
    const rolePermissions = new Set();
    for (const roleName of userRoles) {
      const role = await ctx.db
        .query("userRoles")
        .filter((q: any) => q.eq(q.field("name"), roleName))
        .first();
      
      if (role) {
        role.permissions.forEach((perm: any) => rolePermissions.add(perm));
      }
    }
    
    return Array.from(rolePermissions);
  },
});

