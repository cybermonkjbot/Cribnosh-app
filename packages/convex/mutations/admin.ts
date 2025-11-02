import { v } from 'convex/values';
import {
  handleConvexError
} from '../../../apps/web/lib/errors/convex-exports';
import { mutation } from '../_generated/server';

export const logActivity = mutation({
  args: {
    type: v.string(),
    userId: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.object({
      entityId: v.optional(v.string()),
      entityType: v.optional(v.string()),
      details: v.optional(v.any()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert('adminActivity', {
        type: args.type,
        userId: args.userId,
        description: args.description,
        timestamp: Date.now(),
        metadata: args.metadata,
      });
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateSystemHealth = mutation({
  args: {
    service: v.string(),
    status: v.string(),
    responseTime: v.number(),
    details: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query('systemHealth')
        .filter((q) => q.eq(q.field('service'), args.service))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: args.status,
          responseTime: args.responseTime,
          lastChecked: Date.now(),
          details: args.details,
        });
      } else {
        await ctx.db.insert('systemHealth', {
          service: args.service,
          status: args.status,
          responseTime: args.responseTime,
          lastChecked: Date.now(),
          details: args.details,
        });
      }
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateAdminStats = mutation({
  args: {
    key: v.string(),
    value: v.number(),
    trend: v.string(),
    changePercentage: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query('adminStats')
        .filter((q) => q.eq(q.field('key'), args.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: args.value,
          trend: args.trend,
          changePercentage: args.changePercentage,
          lastUpdated: Date.now(),
        });
      } else {
        await ctx.db.insert('adminStats', {
          key: args.key,
          value: args.value,
          trend: args.trend,
          changePercentage: args.changePercentage,
          lastUpdated: Date.now(),
        });
      }
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const createSystemSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    modifiedBy: v.id("users"),
  },
  returns: v.union(v.id("systemSettings"), v.null()),
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query("systemSettings")
        .filter((q) => q.eq(q.field("key"), args.key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value: args.value,
          lastModified: Date.now(),
          modifiedBy: args.modifiedBy,
        });
        return existing._id;
      }

      return await ctx.db.insert("systemSettings", {
        key: args.key,
        value: args.value,
        lastModified: Date.now(),
        modifiedBy: args.modifiedBy,
      });
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const createContent = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("blog"), v.literal("story"), v.literal("recipe"), v.literal("page")),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    author: v.string(),
    thumbnail: v.optional(v.string()),
    metadata: v.optional(v.object({
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      readTime: v.optional(v.number()),
    })),
  },
  returns: v.id("content"),
  handler: async (ctx, args) => {
    try {
      return await ctx.db.insert("content", {
        ...args,
        lastModified: Date.now(),
        metadata: args.metadata || {
          description: "",
          tags: [],
          readTime: 0,
        },
      });
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("content"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    thumbnail: v.optional(v.string()),
    metadata: v.optional(v.object({
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      readTime: v.optional(v.number()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { contentId, ...updates } = args;
      await ctx.db.patch(contentId, {
        ...updates,
        lastModified: Date.now(),
        ...(updates.status === "published" && { publishDate: Date.now() }),
      });
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const deleteContent = mutation({
  args: {
    contentId: v.id("content"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.contentId);
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const publishContent = mutation({
  args: {
    contentId: v.id("content"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.contentId, {
        status: "published",
        publishDate: Date.now(),
        lastModified: Date.now(),
      });
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const archiveContent = mutation({
  args: {
    contentId: v.id("content"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.contentId, {
        status: "archived",
        lastModified: Date.now(),
      });
      return null;
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const insertAdminLog = mutation({
  args: {
    action: v.string(),
    details: v.any(),
    adminId: v.id("users"),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("adminLogs", {
      action: args.action,
      details: args.details,
      timestamp: args.timestamp ?? Date.now(),
      userId: args.adminId, // Use adminId as userId for admin actions
      adminId: args.adminId,
    });
  },
});

// Additional functions needed by frontend
export const updateWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.entryId, {
        status: args.status,
        notes: args.notes,
        updatedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const deleteWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.entryId);
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const approveWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.entryId, {
        status: 'approved',
        updatedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const rejectWaitlistEntry = mutation({
  args: {
    entryId: v.id("waitlist"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.entryId, {
        status: 'rejected',
        notes: args.reason ? `Rejected: ${args.reason}` : undefined,
        updatedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateUserPermissions = mutation({
  args: {
    userId: v.id("users"),
    permissions: v.array(v.object({
      id: v.string(),
      granted: v.boolean(),
    })),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Update user permissions in the database
      const existingPermissions = await ctx.db
        .query("userPermissions")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
    
      // Convert permission objects to string array for schema compatibility
      const permissionStrings = args.permissions
        .filter((p) => p.granted)
        .map((p) => p.id);

      if (existingPermissions) {
        await ctx.db.patch(existingPermissions._id, {
          permissions: permissionStrings,
          lastUpdated: Date.now(),
          updatedBy: args.userId, // Using userId as updatedBy for now
        });
      } else {
        await ctx.db.insert("userPermissions", {
          userId: args.userId,
          permissions: permissionStrings,
          lastUpdated: Date.now(),
          updatedBy: args.userId,
        });
      }
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "permission_update",
        userId: args.userId,
        description: `Updated permissions for user ${args.userId}`,
        timestamp: Date.now(),
        metadata: {
          entityId: args.userId,
          entityType: "user",
          details: { permissions: args.permissions }
        }
      });
      
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const toggleUserPermission = mutation({
  args: {
    userId: v.id("users"),
    permissionId: v.string(),
    granted: v.boolean(),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Get existing user permissions
      const existingPermissions = await ctx.db
        .query("userPermissions")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
      
      // Schema expects array of strings, so we work with that
      const existingPermStrings = (existingPermissions?.permissions as string[]) || [];
      
      if (args.granted) {
        // Add permission if not already present
        if (!existingPermStrings.includes(args.permissionId)) {
          existingPermStrings.push(args.permissionId);
        }
      } else {
        // Remove permission if present
        const index = existingPermStrings.indexOf(args.permissionId);
        if (index > -1) {
          existingPermStrings.splice(index, 1);
        }
      }
      
      if (existingPermissions) {
        await ctx.db.patch(existingPermissions._id, {
          permissions: existingPermStrings,
          lastUpdated: Date.now(),
          updatedBy: args.userId,
        });
      } else {
        await ctx.db.insert("userPermissions", {
          userId: args.userId,
          permissions: args.granted ? [args.permissionId] : [],
          lastUpdated: Date.now(),
          updatedBy: args.userId,
        });
      }
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "permission_toggle",
        userId: args.userId,
        description: `${args.granted ? 'Granted' : 'Revoked'} permission ${args.permissionId} for user ${args.userId}`,
        timestamp: Date.now(),
        metadata: {
          entityId: args.userId,
          entityType: "user",
          details: { permissionId: args.permissionId, granted: args.granted }
        }
      });
      
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const createUserRole = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    roleId: v.id("userRoles")
  }),
  handler: async (ctx, args) => {
    try {
      // Create a new user role in the database
      const roleId = await ctx.db.insert("userRoles", {
        name: args.name,
        description: args.description,
        permissions: args.permissions,
        isDefault: false,
        isSystem: false,
        userCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "role_create",
        description: `Created new role: ${args.name}`,
        timestamp: Date.now(),
        metadata: {
          entityId: roleId,
          entityType: "role",
          details: { name: args.name, permissions: args.permissions }
        }
      });
      
      return { success: true, roleId };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const updateUserRole = mutation({
  args: {
    roleId: v.id("userRoles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Update an existing user role
      const existingRole = await ctx.db.get(args.roleId);
      
      if (!existingRole) {
        throw new Error("Role not found");
      }
      
      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      if (args.permissions !== undefined) updates.permissions = args.permissions;
      updates.updatedAt = Date.now();
      
      await ctx.db.patch(args.roleId, updates);
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "role_update",
        description: `Updated role: ${args.name || existingRole.name}`,
        timestamp: Date.now(),
        metadata: {
          entityId: args.roleId,
          entityType: "role",
          details: { name: args.name, permissions: args.permissions }
        }
      });
      
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const deleteUserRole = mutation({
  args: {
    roleId: v.id("userRoles"),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Delete a user role from the database
      const existingRole = await ctx.db.get(args.roleId);
      
      if (!existingRole) {
        throw new Error("Role not found");
      }
      
      if (existingRole.isSystem) {
        throw new Error("Cannot delete system roles");
      }
      
      // Check if any users have this role
      const usersWithRole = await ctx.db
        .query("users")
        .collect();
      
      const usersWithThisRole = usersWithRole.filter((user) => {
        const userRoles = (user as { roles?: unknown[] }).roles;
        return Array.isArray(userRoles) && userRoles.includes(args.roleId);
      });
      
      if (usersWithThisRole.length > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }
      
      await ctx.db.delete(args.roleId);
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "role_delete",
        description: `Deleted role: ${existingRole.name}`,
        timestamp: Date.now(),
        metadata: {
          entityId: args.roleId,
          entityType: "role",
          details: { name: existingRole.name }
        }
      });
      
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const assignUserRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("userRoles"),
  },
  returns: v.object({
    success: v.boolean()
  }),
  handler: async (ctx, args) => {
    try {
      // Assign a role to a user
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }
      
      const role = await ctx.db.get(args.roleId);
      
      if (!role) {
        throw new Error("Role not found");
      }
      
      // Update user's roles
      const userWithRoles = user as { roles?: string[] };
      const currentRoles: string[] = Array.isArray(userWithRoles.roles) ? userWithRoles.roles : [];
      const roleIdString = args.roleId as string;
      if (!currentRoles.includes(roleIdString)) {
        await ctx.db.patch(args.userId, {
          roles: [...currentRoles, roleIdString]
        });
      }
      
      const roleName = (role as { name?: unknown }).name as string | undefined || 'Unknown';
      const userData = user as { name?: unknown; email?: unknown };
      const userName = (userData.name as string | undefined) || (userData.email as string | undefined) || 'Unknown';
      
      // Log the activity
      await ctx.db.insert('adminActivity', {
        type: "role_assign",
        userId: args.userId,
        description: `Assigned role ${roleName} to user ${userName}`,
        timestamp: Date.now(),
        metadata: {
          entityId: args.userId,
          entityType: "user",
          details: { roleId: args.roleId, roleName: roleName }
        }
      });
      
      return { success: true };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const initializeDefaultRoles = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string()
  }),
  handler: async (ctx) => {
    try {
      // Check if roles already exist
      const existingRoles = await ctx.db.query("userRoles").collect();
      if (existingRoles.length > 0) {
        return { success: true, message: "Roles already initialized" };
      }

      // Initialize default roles
    const defaultRoles = [
      {
        name: "Administrator",
        description: "Full system access",
        permissions: [
          "users.view",
          "users.create", 
          "users.edit",
          "users.delete",
          "chefs.view",
          "chefs.approve",
          "chefs.reject",
          "orders.view",
          "orders.manage",
          "analytics.view",
          "settings.manage",
          "staff.manage",
          "payroll.view",
          "content.manage",
          "compliance.view"
        ],
        isDefault: true,
        isSystem: true,
        userCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: "Moderator",
        description: "Content and user moderation",
        permissions: [
          "content.manage",
          "users.view",
          "analytics.view"
        ],
        isDefault: false,
        isSystem: true,
        userCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: "Support Agent",
        description: "Customer support and order assistance",
        permissions: [
          "orders.view",
          "orders.manage",
          "users.view",
          "analytics.view"
        ],
        isDefault: false,
        isSystem: true,
        userCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        name: "Data Analyst",
        description: "Analytics and reporting access",
        permissions: [
          "analytics.view",
          "users.view",
          "orders.view"
        ],
        isDefault: false,
        isSystem: false,
        userCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];
    
      // Insert default roles
      for (const role of defaultRoles) {
        await ctx.db.insert("userRoles", role);
      }
      
      return { success: true, message: "Default roles initialized" };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});

export const initializeDefaultPermissions = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string()
  }),
  handler: async (ctx) => {
    try {
      // Check if permissions already exist
      const existingPermissions = await ctx.db.query("permissions").collect();
      if (existingPermissions.length > 0) {
        return { success: true, message: "Permissions already initialized" };
      }

      // Initialize default permissions
      const defaultPermissions = [
        {
          name: "user_management",
          description: "Manage users and their permissions",
          category: "users",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "content_management",
          description: "Manage content and pages",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "analytics_access",
          description: "View analytics and reports",
          category: "analytics",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "view_users",
          description: "View user list and details",
          category: "users",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "edit_users",
          description: "Edit user information",
          category: "users",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "delete_users",
          description: "Delete user accounts",
          category: "users",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "manage_roles",
          description: "Assign and modify user roles",
          category: "users",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "view_content",
          description: "View all content",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "create_content",
          description: "Create new content",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "edit_content",
          description: "Edit existing content",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "delete_content",
          description: "Delete content",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "publish_content",
          description: "Publish content",
          category: "content",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "view_analytics",
          description: "Access analytics dashboard",
          category: "analytics",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "export_data",
          description: "Export analytics data",
          category: "analytics",
          isActive: true,
          createdAt: Date.now()
        },
        {
          name: "view_reports",
          description: "Access reports",
          category: "analytics",
          isActive: true,
          createdAt: Date.now()
        }
      ];
    
      // Insert default permissions
      for (const permission of defaultPermissions) {
        await ctx.db.insert("permissions", permission);
      }
      
      return { success: true, message: "Default permissions initialized" };
    } catch (error) {
      throw handleConvexError(error);
    }
  },
});
