import { requireStaff } from '../utils/auth';
import { v } from 'convex/values';
import {
  withConvexQueryErrorHandling
} from '../../../apps/web/lib/errors/convex-exports';
import { Id } from '../_generated/dataModel';
import { query, QueryCtx } from '../_generated/server';

export const getAdminStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const users = await ctx.db.query("users").collect();
    const chefs = await ctx.db.query("chefs").collect();

    // Calculate user growth from last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentUsers = users.filter(user => user._creationTime >= thirtyDaysAgo);
    const previousUsers = users.filter(user => user._creationTime < thirtyDaysAgo);
    const userGrowthPercentage = previousUsers.length > 0 
      ? ((recentUsers.length - previousUsers.length) / previousUsers.length) * 100 
      : 0;

    // Calculate chef growth from last 30 days
    const recentChefs = chefs.filter(chef => chef._creationTime >= thirtyDaysAgo);
    const previousChefs = chefs.filter(chef => chef._creationTime < thirtyDaysAgo);
    const chefGrowthPercentage = previousChefs.length > 0 
      ? ((recentChefs.length - previousChefs.length) / previousChefs.length) * 100 
      : 0;

    // Get system health for response time
    const systemHealth = await ctx.db
      .query("systemHealth")
      .filter(q => q.eq(q.field("service"), "main"))
      .first();
    
    const avgResponseTime = systemHealth?.responseTime || 0;

    // Calculate conversion rate from orders vs users
    const orders = await ctx.db.query("orders").collect();
    const conversionRate = users.length > 0 ? (orders.length / users.length) * 100 : 0;

    return [
      {
        _id: "total_users",
        key: "total_users",
        value: users.length,
        trend: userGrowthPercentage >= 0 ? "up" : "down",
        changePercentage: Math.round(userGrowthPercentage),
        lastUpdated: Date.now(),
      },
      {
        _id: "active_chefs",
        key: "active_chefs",
        value: chefs.length,
        trend: chefGrowthPercentage >= 0 ? "up" : "down",
        changePercentage: Math.round(chefGrowthPercentage),
        lastUpdated: Date.now(),
      },
      {
        _id: "avg_response_time",
        key: "avg_response_time",
        value: avgResponseTime,
        trend: avgResponseTime < 500 ? "down" : "up", // Assuming < 500ms is good
        changePercentage: 0, // Would need historical data to calculate this properly
        lastUpdated: Date.now(),
      },
      {
        _id: "conversion_rate",
        key: "conversion_rate",
        value: Math.round(conversionRate * 10) / 10, // Round to 1 decimal place
        trend: "up", // Would need historical data to determine trend
        changePercentage: 0, // Would need historical data to calculate this properly
        lastUpdated: Date.now(),
      },
    ] as const;
  },
});

export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx: QueryCtx, args: { limit?: number, sessionToken?: string }) => {
    await requireStaff(ctx, args.sessionToken);
    const limit = args.limit || 10;
    return await ctx.db
      .query('adminActivity')
      .order('desc')
      .take(limit);
  },
});

export const getSystemHealth = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    return await ctx.db.query('systemHealth').collect();
  },
});

export const getAnalytics = query({
  args: {
    timeRange: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d")),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const daysInRange = args.timeRange === "7d" ? 7 : args.timeRange === "30d" ? 30 : 90;
    const startTime = Date.now() - (daysInRange * 24 * 60 * 60 * 1000);
    
    // Get analytics events for the time range
    const analyticsEvents = await ctx.db
      .query("analytics")
      .filter(q => q.gte(q.field("timestamp"), startTime))
      .collect();

    // Get users for the time range
    const users = await ctx.db
      .query("users")
      .filter(q => q.gte(q.field("_creationTime"), startTime))
      .collect();

    // Get orders for the time range
    const orders = await ctx.db
      .query("orders")
      .filter(q => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Calculate daily active users from analytics events
    const dailyActiveUsers = [];
    for (let i = 0; i < daysInRange; i++) {
      const dayStart = startTime + (i * 24 * 60 * 60 * 1000);
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);
      
      const dayEvents = analyticsEvents.filter(event => 
        event.timestamp >= dayStart && event.timestamp < dayEnd
      );
      
      const uniqueUsers = new Set(dayEvents.map(event => event.userId)).size;
      dailyActiveUsers.push(uniqueUsers);
    }

    // Calculate user growth
    const previousStartTime = startTime - (daysInRange * 24 * 60 * 60 * 1000);
    const previousUsers = await ctx.db
      .query("users")
      .filter(q => q.and(
        q.gte(q.field("_creationTime"), previousStartTime),
        q.lt(q.field("_creationTime"), startTime)
      ))
      .collect();
    
    const userGrowth = previousUsers.length > 0 
      ? ((users.length - previousUsers.length) / previousUsers.length) * 100 
      : 0;

    // Calculate conversion rate
    const conversionRate = users.length > 0 ? (orders.length / users.length) * 100 : 0;

    // Get top locations from orders
    const cityCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.delivery_address?.city) {
        cityCounts[order.delivery_address.city] = (cityCounts[order.delivery_address.city] || 0) + 1;
      }
    });
    
    const topLocations = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent events from analytics
    const eventCounts: Record<string, number> = {};
    analyticsEvents.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    const recentEvents = Object.entries(eventCounts)
      .map(([type, count]) => ({
        type,
        count,
        timestamp: Date.now(), // Use current timestamp instead of random
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    return {
      dailyActiveUsers,
      userGrowth: Math.round(userGrowth),
      averageSessionTime: 420, // This would need session tracking to calculate properly
      conversionRate: Math.round(conversionRate * 10) / 10,
      topLocations,
      recentEvents,
    };
  },
});

export const getSystemSettings = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const settings = await ctx.db
      .query("systemSettings")
      .collect();

    // Convert array of settings to object
    const settingsObject = settings.reduce((acc, setting) => ({
      ...acc,
      [setting.key]: setting.value,
    }), {
      emailNotifications: true,
      maintenanceMode: false,
      debugMode: false,
      apiRateLimit: 100,
      maxUploadSize: 10,
      backupFrequency: "daily",
      allowedDomains: ["*"],
      securityLevel: "standard",
    } as const);

    return settingsObject;
  },
});

// Regional Availability Configuration Queries
export const getRegionalAvailabilityConfig = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "regional_availability_config"))
      .first();

    // Default configuration for Midland cities
    const defaultConfig = {
      enabled: true,
      supportedRegions: ["Midlands", "West Midlands", "East Midlands"],
      supportedCities: [
        "Birmingham",
        "Leicester",
        "Nottingham",
        "Coventry",
        "Stoke-on-Trent",
        "Derby",
        "Wolverhampton",
        "Northampton",
      ],
      supportedCountries: ["UK"],
    };

    if (setting) {
      return setting.value as typeof defaultConfig;
    }

    return defaultConfig;
  },
});

export const checkRegionAvailability = query({
  args: {
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    address: v.optional(v.object({
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      coordinates: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    // Get config directly to avoid circular dependency
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "regional_availability_config"))
      .first();

    // Default configuration for Midland cities
    const defaultConfig = {
      enabled: true,
      supportedRegions: ["Midlands", "West Midlands", "East Midlands"],
      supportedCities: [
        "Birmingham",
        "Leicester",
        "Nottingham",
        "Coventry",
        "Stoke-on-Trent",
        "Derby",
        "Wolverhampton",
        "Northampton",
      ],
      supportedCountries: ["UK"],
    };

    const config = setting ? (setting.value as typeof defaultConfig) : defaultConfig;
    
    // If regional availability is disabled, allow all regions
    if (!config.enabled) {
      return true;
    }

    // Check from address object if provided
    if (args.address) {
      const city = args.address.city;
      const country = args.address.country;
      
      if (city) {
        const normalizedCity = city.trim().toLowerCase();
        const isSupported = config.supportedCities.some(
          (supportedCity) => supportedCity.toLowerCase() === normalizedCity
        );
        
        if (!isSupported) {
          return false;
        }
      }
      
      if (country) {
        const normalizedCountry = country.trim();
        const isSupported = config.supportedCountries.some(
          (supportedCountry) => supportedCountry.toLowerCase() === normalizedCountry.toLowerCase()
        );
        
        if (!isSupported) {
          return false;
        }
      }
      
      // If we have both city and country and both are supported, return true
      if (city && country) {
        return true;
      }
    }

    // Check from direct city parameter
    if (args.city) {
      const normalizedCity = args.city.trim().toLowerCase();
      const isSupported = config.supportedCities.some(
        (supportedCity) => supportedCity.toLowerCase() === normalizedCity
      );
      
      if (!isSupported) {
        return false;
      }
    }

    // Check from country parameter
    if (args.country) {
      const normalizedCountry = args.country.trim();
      const isSupported = config.supportedCountries.some(
        (supportedCountry) => supportedCountry.toLowerCase() === normalizedCountry.toLowerCase()
      );
      
      if (!isSupported) {
        return false;
      }
    }

    // If we have coordinates but no city/country, we'd need reverse geocoding
    // For now, if coordinates are provided without city, we'll allow it
    // (This can be enhanced later with reverse geocoding)
    if (args.coordinates && !args.city && !args.country && !args.address) {
      // Without reverse geocoding, we can't determine the city from coordinates
      // For safety, we'll return false, but this can be enhanced
      return false;
    }

    // If we have city or country and they're supported, return true
    if (args.city || args.country || args.address) {
      return true;
    }

    // Default to false if no valid location info provided
    return false;
  },
});

export const getContentItems = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const content = await ctx.db
      .query("content")
      .order("desc" as const)
      .take(20);

    return content;
  },
});

export const globalAdminSearch = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number()), // Limit total results
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const q = args.query.toLowerCase();
    const resultLimit = args.limit || 50; // Default to 50 results max
    const perTableLimit = 500; // Limit records fetched per table to avoid memory issues
    
    // Users - limit fetch to recent users first
    const allUsers = await ctx.db.query('users').order('desc').take(perTableLimit);
    const userResults = allUsers.filter(user =>
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q)
    ).slice(0, 10).map(user => ({
      _id: user._id,
      type: 'user',
      name: user.name,
      email: user.email,
      roles: user.roles,
      status: user.status
    }));
    
    // Chefs - limit fetch
    const allChefs = await ctx.db.query('chefs').take(perTableLimit);
    const chefResults = allChefs.filter(chef =>
      chef.bio?.toLowerCase().includes(q) ||
      chef.specialties?.some((s: string) => s.toLowerCase().includes(q))
    ).slice(0, 10).map(chef => ({
      _id: chef._id,
      type: 'chef',
      bio: chef.bio,
      specialties: chef.specialties,
      status: chef.status
    }));
    
    // Meals - limit fetch
    const allMeals = await ctx.db.query('meals').take(perTableLimit);
    const mealResults = allMeals.filter(meal =>
      meal.name?.toLowerCase().includes(q) ||
      meal.description?.toLowerCase().includes(q) ||
      meal.cuisine?.some((c: string) => c.toLowerCase().includes(q))
    ).slice(0, 10).map(meal => ({
      _id: meal._id,
      type: 'meal',
      name: meal.name,
      description: meal.description,
      cuisine: meal.cuisine
    }));
    
    // Bookings - limit fetch
    const allBookings = await ctx.db.query('bookings').take(perTableLimit);
    const bookingResults = allBookings.filter(booking =>
      booking.notes?.toLowerCase().includes(q)
    ).slice(0, 10).map(booking => ({
      _id: booking._id,
      type: 'booking',
      notes: booking.notes,
      status: booking.status
    }));
    
    // Waitlist - limit fetch
    const allWaitlist = await ctx.db.query('waitlist').take(perTableLimit);
    const waitlistResults = allWaitlist.filter(w =>
      w.email?.toLowerCase().includes(q)
    ).slice(0, 10).map(w => ({
      _id: w._id,
      type: 'waitlist',
      email: w.email
    }));
    
    // Reviews - limit fetch
    const allReviews = await ctx.db.query('reviews').take(perTableLimit);
    const reviewResults = allReviews.filter(r =>
      r.comment?.toLowerCase().includes(q)
    ).slice(0, 10).map(r => ({
      _id: r._id,
      type: 'review',
      comment: r.comment,
      rating: r.rating
    }));
    // Kitchens - limit fetch
    const allKitchens = await ctx.db.query('kitchens').take(perTableLimit);
    const kitchenResults = allKitchens.filter(k =>
      k.address?.toLowerCase().includes(q)
    ).slice(0, 10).map(k => ({
      _id: k._id,
      type: 'kitchen',
      address: k.address,
      certified: k.certified
    }));
    // Perks - limit fetch
    const allPerks = await ctx.db.query('perks').take(perTableLimit);
    const perkResults = allPerks.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, 10).map(p => ({
      _id: p._id,
      type: 'perk',
      title: p.title,
      description: p.description
    }));
    // Analytics - limit fetch
    const allAnalytics = await ctx.db.query('analytics').take(perTableLimit);
    const analyticsResults = allAnalytics.filter(a =>
      a.eventType?.toLowerCase().includes(q)
    ).slice(0, 10).map(a => ({
      _id: a._id,
      type: 'analytics',
      eventType: a.eventType,
      timestamp: a.timestamp
    }));
    // Drivers - limit fetch
    const allDrivers = await ctx.db.query('drivers').take(perTableLimit);
    const driverResults = allDrivers.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.vehicle?.toLowerCase().includes(q)
    ).slice(0, 10).map(d => ({
      _id: d._id,
      type: 'driver',
      name: d.name,
      email: d.email,
      vehicle: d.vehicle
    }));
    // Admin Activity - limit fetch
    const allAdminActivity = await ctx.db.query('adminActivity').take(perTableLimit);
    const activityResults = allAdminActivity.filter(a =>
      a.description?.toLowerCase().includes(q) ||
      a.type?.toLowerCase().includes(q)
    ).slice(0, 10).map(a => ({
      _id: a._id,
      type: 'adminActivity',
      description: a.description,
      activityType: a.type
    }));
    // System Health - limit fetch
    const allSystemHealth = await ctx.db.query('systemHealth').take(perTableLimit);
    const healthResults = allSystemHealth.filter(s =>
      s.service?.toLowerCase().includes(q) ||
      s.status?.toLowerCase().includes(q)
    ).slice(0, 10).map(s => ({
      _id: s._id,
      type: 'systemHealth',
      service: s.service,
      status: s.status
    }));
    // Admin Stats - limit fetch
    const allAdminStats = await ctx.db.query('adminStats').take(perTableLimit);
    const statsResults = allAdminStats.filter(s =>
      s.key?.toLowerCase().includes(q)
    ).slice(0, 10).map(s => ({
      _id: s._id,
      type: 'adminStats',
      key: s.key,
      value: s.value
    }));
    // Content - limit fetch
    const allContent = await ctx.db.query('content').take(perTableLimit);
    const contentResults = allContent.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q)
    ).slice(0, 10).map(item => ({
      _id: item._id,
      type: 'content',
      title: item.title,
      author: item.author,
      summary: item.content?.slice(0, 100)
    }));
    // Jobs - limit fetch
    const allJobs = await ctx.db.query('jobPosting').take(perTableLimit);
    const jobResults = allJobs.filter(job =>
      job.title?.toLowerCase().includes(q) ||
      job.department?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q)
    ).slice(0, 10).map(job => ({
      _id: job._id,
      type: 'job',
      title: job.title,
      department: job.department,
      location: job.location
    }));
    // Job Applications - limit fetch
    const allJobApplications = await ctx.db.query('jobApplication').take(perTableLimit);
    const jobAppResults = allJobApplications.filter(app =>
      app.fullName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.phone?.toLowerCase().includes(q)
    ).slice(0, 10).map(app => ({
      _id: app._id,
      type: 'jobApplication',
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      status: app.status
    }));
    // Admin Logs - limit fetch
    const allAdminLogs = await ctx.db.query('adminLogs').take(perTableLimit);
    const logResults = allAdminLogs.filter(log =>
      log.action?.toLowerCase().includes(q)
    ).slice(0, 10).map(log => ({
      _id: log._id,
      type: 'adminLog',
      action: log.action,
      timestamp: log.timestamp
    }));
    
    // Combine all results and limit total
    const allResults = [
      ...userResults,
      ...chefResults,
      ...mealResults,
      ...bookingResults,
      ...waitlistResults,
      ...reviewResults,
      ...kitchenResults,
      ...perkResults,
      ...analyticsResults,
      ...driverResults,
      ...activityResults,
      ...healthResults,
      ...statsResults,
      ...contentResults,
      ...jobResults,
      ...jobAppResults,
      ...logResults
    ].slice(0, resultLimit);
    
    return {
      users: userResults,
      chefs: chefResults,
      meals: mealResults,
      bookings: bookingResults,
      waitlist: waitlistResults,
      reviews: reviewResults,
      kitchens: kitchenResults,
      perks: perkResults,
      analytics: analyticsResults,
      drivers: driverResults,
      adminActivity: activityResults,
      systemHealth: healthResults,
      adminStats: statsResults,
      content: contentResults,
      jobs: jobResults,
      jobApplications: jobAppResults,
      adminLogs: logResults
    };
  }
}); 

// Get files uploaded by a user
export const getUserFiles = query({
  args: {
    userId: v.id("users"),
    fileType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    try {
      let query = ctx.db
        .query("files")
        .filter((q) => q.eq(q.field("uploadedBy"), args.userId));
      
      if (args.fileType) {
        query = query.filter((q) => q.eq(q.field("fileType"), args.fileType));
      }
      
      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }
      
      const files = await query
        .order("desc")
        .take(args.limit || 50);
      
      return files.map(file => ({
        id: file._id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        status: file.status,
        uploadedAt: file.uploadedAt,
        downloadCount: file.downloadCount,
        isPublic: file.isPublic,
        tags: file.tags || [],
        metadata: file.metadata || {}
      }));
      
    } catch (error) {
      console.error('Failed to fetch user files:', error);
      return [];
    }
  },
});
export const files = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    try {
      // Get files from the _storage system table
      const files = await ctx.db.system.query('_storage').collect();
      
      // Filter by type if specified
      let filteredFiles = files;
      if (args.type) {
        filteredFiles = files.filter(file => 
          file.contentType?.startsWith(args.type!) || false
        );
      }
      
      // Apply limit if specified
      if (args.limit) {
        filteredFiles = filteredFiles.slice(0, args.limit);
      }
      
      // Transform to include metadata
      return filteredFiles.map(file => ({
        _id: file._id,
        _creationTime: file._creationTime,
        contentType: file.contentType,
        sha256: file.sha256,
        size: file.size,
        url: `/api/storage/${file._id}`,
        type: file.contentType?.split('/')[0] || 'unknown',
        extension: file.contentType?.split('/')[1] || '',
        uploadedAt: file._creationTime
      }));
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  },
});

// Additional functions needed by frontend
export const getWaitlistEntries = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    let entries = await ctx.db.query("waitlist").collect();
    
    if (args.status) {
      entries = entries.filter((entry) => (entry as { status?: string }).status === args.status);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      entries = entries.filter((entry) => {
        const e = entry as { email?: string; name?: string };
        return e.email?.toLowerCase().includes(searchLower) ||
          (e.name && e.name.toLowerCase().includes(searchLower));
      });
    }
    
    return entries;
  },
});

export const getCountries = query({
  args: {},
  returns: v.array(v.object({
    code: v.string(),
    name: v.string()
  })),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx) => {
    return [
      { code: 'US', name: 'United States' },
      { code: 'UK', name: 'United Kingdom' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'GH', name: 'Ghana' },
      { code: 'KE', name: 'Kenya' },
    ];
  },
});

export const getWaitlistCount = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const entries = await ctx.db.query("waitlist").collect();
    return entries.length;
  },
});

export const getAvailablePermissions = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    // Get permissions from database
    const permissions = await ctx.db.query("permissions").collect();
    
    // If no permissions exist, return empty array
    // The frontend should call initializeDefaultPermissions mutation to set up default permissions
    if (permissions.length === 0) {
      return [];
    }
    
    return permissions;
  },
});

export const getUserPermissions = query({
  args: {
    userId: v.optional(v.id("users")),
    sessionToken: v.optional(v.string())
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    // Get user permissions from database
    if (args.userId) {
      const userPermissions = await ctx.db
        .query("userPermissions")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .collect();
      
      if (userPermissions.length === 0) {
        // Return empty permissions if user has none
        return [{ userId: args.userId, permissions: [] }];
      }
      
      return userPermissions;
    }

    // Get all user permissions
    const allUserPermissions = await ctx.db.query("userPermissions").collect();
    return allUserPermissions;
  },
});

export const getUserRoles = query({
  args: { sessionToken: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireStaff(ctx, args.sessionToken);
    // Get user roles from database
    const roles = await ctx.db.query("userRoles").collect();
    
    // If no roles exist, return empty array
    // The frontend should call initializeDefaultRoles mutation to set up default roles
    if (roles.length === 0) {
      return [];
    }
    
    // Calculate user count for each role
    const rolesWithUserCount = await Promise.all(roles.map(async (role) => {
      // Note: This query may need adjustment based on your schema
      // If users have a roleId field, use: .filter((q) => q.eq(q.field("roleId"), role._id))
      // If users have a roles array, you'd need to use a different approach
      const allUsers = await ctx.db.query("users").collect();
      const usersWithRole = allUsers.filter((user) => {
        const userRoles = (user as { roles?: unknown[] }).roles;
        return Array.isArray(userRoles) && userRoles.includes(role._id);
      });
      
      return {
        ...role,
        userCount: usersWithRole.length
      };
    }));
    
    return rolesWithUserCount;
  },
});

// Chef Management Queries
export const getChefStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const chefs = await ctx.db.query("chefs").collect();
    const orders = await ctx.db.query("orders").collect();
    
    const totalChefs = chefs.length;
    const activeChefs = chefs.filter(chef => chef.status === 'active').length;
    const pendingVerification = chefs.filter(chef => chef.status === 'pending_verification').length;
    const suspendedChefs = chefs.filter(chef => chef.status === 'suspended').length;
    
    const totalEarnings = chefs.reduce((sum, chef) => {
      const chefOrders = orders.filter(order => order.chef_id === chef._id);
      return sum + chefOrders.reduce((orderSum, order) => orderSum + (order.total_amount || 0), 0);
    }, 0);
    
    const averageRating = chefs.length > 0 
      ? chefs.reduce((sum, chef) => sum + chef.rating, 0) / chefs.length 
      : 0;
    
    return {
      totalChefs,
      activeChefs,
      pendingVerification,
      suspendedChefs,
      totalEarnings,
      averageRating: Math.round(averageRating * 10) / 10
    };
  },
});

export const getChefsWithPerformance = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  handler: withConvexQueryErrorHandling(async (ctx: QueryCtx, args: { limit?: number; status?: string; verificationStatus?: string, sessionToken?: string }) => {
    await requireStaff(ctx, args.sessionToken);
    let chefs = await ctx.db.query("chefs").collect();
    const orders = await ctx.db.query("orders").collect();
    
    // Apply filters
    if (args.status && args.status !== 'all') {
      chefs = chefs.filter(chef => chef.status === args.status);
    }
    
    if (args.verificationStatus && args.verificationStatus !== 'all') {
      chefs = chefs.filter(chef => chef.verificationStatus === args.verificationStatus);
    }
    
    // Add performance data to each chef
    const chefsWithPerformance = chefs.map(chef => {
      const chefOrders = orders.filter(order => order.chef_id === chef._id);
      const completedOrders = chefOrders.filter(order => order.order_status === 'completed');
      const totalEarnings = chefOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      return {
        ...chef,
        performance: {
          totalOrders: chefOrders.length,
          completedOrders: completedOrders.length,
          averageRating: chef.rating,
          totalEarnings,
          lastOrderDate: chefOrders.length > 0 
            ? Math.max(...chefOrders.map(order => order.createdAt || 0))
            : undefined
        },
        verificationStatus: chef.verificationStatus || 'pending',
        verificationDocuments: {
          healthPermit: false,
          insurance: false,
          backgroundCheck: false,
          certifications: []
        }
      };
    });
    
    // Apply limit
    if (args.limit) {
      return chefsWithPerformance.slice(0, args.limit);
    }
    
    return chefsWithPerformance;
  }),
});

// Order Management Queries
export const getOrderStats = query({
  args: { sessionToken: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args) => {
    await requireStaff(ctx, args.sessionToken);
    const orders = await ctx.db.query("orders").collect();
    
    const totalOrders = orders.length;
    const activeOrders = orders.filter(order => 
      !['delivered', 'cancelled', 'refunded'].includes(order.order_status)
    ).length;
    
    const today = new Date();
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === today.toDateString();
    });
    
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const averageOrderValue = orders.length > 0 
      ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length 
      : 0;
    
    const completedOrders = orders.filter(order => order.order_status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.order_status === 'cancelled').length;
    const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;
    
    return {
      totalOrders,
      activeOrders,
      todayRevenue,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      completedOrders,
      cancelledOrders,
      completionRate: Math.round(completionRate * 10) / 10
    };
  },
});

export const getAllOrdersWithDetails = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    sessionToken: v.optional(v.string())
  },
  handler: withConvexQueryErrorHandling(async (ctx: QueryCtx, args: { limit?: number; status?: string; paymentStatus?: string, sessionToken?: string }) => {
    await requireStaff(ctx, args.sessionToken);
    let orders = await ctx.db.query("orders").collect();
    
    // Apply filters
    if (args.status && args.status !== 'all') {
      orders = orders.filter(order => order.order_status === args.status);
    }
    
    if (args.paymentStatus && args.paymentStatus !== 'all') {
      orders = orders.filter(order => order.payment_status === args.paymentStatus);
    }
    
    // Add related data
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const customer = await ctx.db.get(order.customer_id);
      const chef = await ctx.db.get(order.chef_id);
      
      // Get meal details
      const mealDetails = await Promise.all(
        order.order_items.map(async (item) => {
          const itemWithMealId = item as { meal_id?: Id<'meals'> | string; [key: string]: unknown };
          const mealId = itemWithMealId.meal_id;
          const meal = mealId ? await ctx.db.get(mealId as Id<'meals'>) : null;
          const mealData = meal as { name?: string; description?: string } | null;
          return {
            ...item,
            name: mealData?.name || 'Unknown Meal',
            description: mealData?.description || ''
          };
        })
      );
      
      return {
        ...order,
        customer: customer ? {
          name: customer.name || 'Unknown Customer',
          email: customer.email || '',
          phone: customer.phone_number || ''
        } : null,
        chef: chef ? {
          bio: chef.bio || 'Unknown Chef',
          location: chef.location || { city: 'Unknown' },
          rating: chef.rating || 0
        } : null,
        meals: mealDetails
      };
    }));
    
    // Apply limit
    if (args.limit) {
      return ordersWithDetails.slice(0, args.limit);
    }
    
    return ordersWithDetails;
  }),
});

// Delivery Management Queries
export const getDeliveryStats = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const deliveries = await ctx.db.query("deliveries").collect();
    const drivers = await ctx.db.query("drivers").collect();
    
    const activeDrivers = drivers.filter(driver => driver.status === 'active').length;
    const inTransit = deliveries.filter(delivery => delivery.status === 'in_transit').length;
    
    const today = new Date();
    const todayDeliveries = deliveries.filter(delivery => {
      const deliveryDate = new Date(delivery.actualDeliveryTime || delivery.createdAt);
      return deliveryDate.toDateString() === today.toDateString() && delivery.status === 'delivered';
    });
    
    const completedToday = todayDeliveries.length;
    
    // Calculate average delivery time from actual delivery data
    const completedDeliveriesWithTimes = deliveries.filter(delivery => 
      delivery.status === 'delivered' && 
      delivery.actualPickupTime && 
      delivery.actualDeliveryTime
    );
    
    const averageDeliveryTime = completedDeliveriesWithTimes.length > 0
      ? completedDeliveriesWithTimes.reduce((sum, delivery) => {
          const deliveryTime = (delivery.actualDeliveryTime! - delivery.actualPickupTime!) / (1000 * 60); // Convert to minutes
          return sum + deliveryTime;
        }, 0) / completedDeliveriesWithTimes.length
      : 0;
    
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(delivery => delivery.status === 'delivered').length;
    const failedDeliveries = deliveries.filter(delivery => delivery.status === 'failed').length;
    const successRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;
    
    return {
      activeDrivers,
      inTransit,
      completedToday,
      averageDeliveryTime: Math.round(averageDeliveryTime),
      totalDeliveries,
      completedDeliveries,
      failedDeliveries,
      successRate: Math.round(successRate * 10) / 10
    };
  },
});

export const getAllDeliveriesWithDetails = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    driverId: v.optional(v.id('drivers'))
  },
  handler: withConvexQueryErrorHandling(async (ctx: QueryCtx, args: { limit?: number; status?: string; driverId?: string }) => {
    let deliveries = await ctx.db.query("deliveries").collect();
    
    // Apply filters
    if (args.status && args.status !== 'all') {
      deliveries = deliveries.filter(delivery => delivery.status === args.status);
    }
    
    if (args.driverId && args.driverId !== 'all') {
      deliveries = deliveries.filter(delivery => delivery.driverId === args.driverId);
    }
    
    // Add related data
    const deliveriesWithDetails = await Promise.all(deliveries.map(async (delivery) => {
      const driver = await ctx.db.get(delivery.driverId);
      const order = await ctx.db.get(delivery.orderId);
      const customer = order ? await ctx.db.get(order.customer_id) : null;
      
      return {
        ...delivery,
        driver: driver ? {
          _id: driver._id,
          name: driver.name || 'Unknown Driver',
          phone: driver.phone || '',
          email: driver.email || '',
          status: driver.status || 'inactive',
          location: driver.currentLocation || { latitude: 0, longitude: 0, updatedAt: 0 },
          vehicle: {
            type: driver.vehicleType || 'bicycle',
            make: driver.vehicle || 'Unknown',
            model: 'Unknown',
            licensePlate: driver.licenseNumber || 'Unknown'
          },
          rating: driver.rating || 0,
          totalDeliveries: driver.totalDeliveries || 0,
          completedDeliveries: driver.totalDeliveries || 0,
          averageDeliveryTime: 0, // Calculate from actual delivery data if needed
          isAvailable: driver.availability === 'available',
          currentOrder: undefined, // Not in current schema
          createdAt: driver.createdAt,
          updatedAt: driver.updatedAt
        } : null,
        order: order ? {
          customer_id: order.customer_id,
          total_amount: order.total_amount || 0,
          items: order.order_items || []
        } : null,
        customer: customer ? {
          name: customer.name || 'Unknown Customer',
          phone: customer.phone_number || '',
          email: customer.email || ''
        } : null
      };
    }));
    
    // Apply limit
    if (args.limit) {
      return deliveriesWithDetails.slice(0, args.limit);
    }
    
    return deliveriesWithDetails;
  }),
}); 