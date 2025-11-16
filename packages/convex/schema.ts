import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Email Assets table for storing images used in emails
  emailAssets: defineTable({
    url: v.string(), // Original URL or path
    storageId: v.id('_storage'), // Convex storage ID
    contentType: v.string(),
    purpose: v.string(), // e.g., 'welcome-email', 'logo', 'social-icon'
    alt: v.optional(v.string()),
    metadata: v.optional(v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      size: v.optional(v.number()),
    })),
    lastUsed: v.number(), // Timestamp of last use
  })
    .index("by_url", ["url"])
    .index("by_purpose", ["purpose"])
    .index("by_last_used", ["lastUsed"]),

  // Live Sessions table
  liveSessions: defineTable({
    session_id: v.string(),
    chef_id: v.id("chefs"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('scheduled'),
      v.literal('starting'),
      v.literal('live'),
      v.literal('ended'),
      v.literal('cancelled')
    ),
    scheduled_start_time: v.number(),
    actual_start_time: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    endReason: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.object({
      city: v.string(),
      coordinates: v.array(v.number()), // [longitude, latitude]
      address: v.optional(v.string()),
      radius: v.optional(v.number()), // Delivery radius in km
    })),
    chatMessages: v.optional(v.array(v.object({
      userId: v.id("users"),
      message: v.string(),
      timestamp: v.number(),
      type: v.union(v.literal('text'), v.literal('reaction'), v.literal('tip')),
      moderation: v.optional(v.object({
        status: v.union(v.literal('active'), v.literal('deleted'), v.literal('muted')),
        moderatedBy: v.optional(v.id("users")),
        moderatedAt: v.optional(v.number()),
        reason: v.optional(v.string()),
        action: v.optional(v.union(v.literal('delete'), v.literal('warn'), v.literal('ban')))
      }))
    }))),
    viewerCount: v.number(),
    maxViewers: v.number(),
    currentViewers: v.number(),
    chatEnabled: v.boolean(),
    totalComments: v.optional(v.number()),
    totalReactions: v.optional(v.number()),
    mutedUsers: v.optional(v.array(v.union(
      v.id("users"),
      v.object({
        userId: v.id("users"),
        mutedBy: v.id("users"),
        mutedAt: v.number(),
        reason: v.string(),
        expiresAt: v.union(v.number(), v.null()),
      })
    ))),
    sessionStats: v.object({
      totalViewers: v.number(),
      peakViewers: v.number(),
      averageWatchTime: v.number(),
      totalTips: v.number(),
      totalOrders: v.number()
    }),
  })
    .index("by_chef", ["chef_id"])
    .index("by_status", ["status"])
    .index("by_date", ["scheduled_start_time"])
    .index("by_session_id", ["session_id"])
    .index("by_location", ["location.city"]),
    
  // System Health table
  systemHealth: defineTable({
    service: v.string(),
    status: v.string(),
    responseTime: v.number(),
    uptime: v.optional(v.number()),
    lastChecked: v.number(),
    details: v.optional(v.string()),
  })
    .index("by_service", ["service"]),

  // System Alerts table
  systemAlerts: defineTable({
    type: v.string(),
    message: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    timestamp: v.number(),
    resolved: v.boolean(),
    service: v.optional(v.string()),
    details: v.optional(v.string()),
  })
    .index("by_severity", ["severity"])
    .index("by_resolved", ["resolved"])
    .index("by_timestamp", ["timestamp"]),

  // System Metrics table
  systemMetrics: defineTable({
    type: v.string(),
    value: v.number(),
    timestamp: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_timestamp", ["timestamp"]),

  // Admin Logs table
  adminLogs: defineTable({
    action: v.string(),
    details: v.any(),
    timestamp: v.number(),
    userId: v.id("users"),
    adminId: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_admin", ["adminId"])
    .index("by_timestamp", ["timestamp"]),

  // Notifications table
  notifications: defineTable({
    userId: v.optional(v.id("users")),
    roles: v.optional(v.array(v.string())),
    read: v.optional(v.boolean()),
    global: v.optional(v.boolean()),
    type: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
    timestamp: v.optional(v.number()),
    priority: v.optional(v.string()),
    category: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    data: v.optional(v.any()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["read"])
    .index("by_timestamp", ["timestamp"]),

  // System Notifications table
  systemNotifications: defineTable({
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    priority: v.string(),
    category: v.string(),
    targetRoles: v.array(v.string()),
    active: v.boolean(),
    expiresAt: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_active", ["active"])
    .index("by_timestamp", ["timestamp"]),

  // Admin Notifications table
  adminNotifications: defineTable({
    type: v.string(),
    title: v.string(),
    message: v.string(),
    timestamp: v.number(),
    priority: v.string(),
    category: v.string(),
    actionUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    resolved: v.boolean(),
  })
    .index("by_priority", ["priority"])
    .index("by_resolved", ["resolved"])
    .index("by_timestamp", ["timestamp"]),

  // Notification Settings table
  notificationSettings: defineTable({
    userId: v.id("users"),
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    smsNotifications: v.boolean(),
    notificationTypes: v.record(v.string(), v.boolean()),
    quietHours: v.optional(v.object({
      enabled: v.boolean(),
      start: v.string(),
      end: v.string(),
    })),
    frequency: v.string(),
  })
    .index("by_user", ["userId"]),

  // User Sessions table
  userSessions: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_expires", ["expiresAt"]),

  // Chef Status Changes table
  chefStatusChanges: defineTable({
    chefId: v.id("chefs"),
    oldStatus: v.string(),
    newStatus: v.string(),
    timestamp: v.number(),
    reason: v.optional(v.string()),
  })
    .index("by_chef", ["chefId"])
    .index("by_timestamp", ["timestamp"]),

  // Payments table
  payments: defineTable({
    orderId: v.id("orders"),
    amount: v.number(),
    currency: v.string(),
    payment_method: v.string(),
    status: v.string(),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
    transactionId: v.optional(v.string()),
  })
    .index("by_order", ["orderId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Live session orders
  liveOrders: defineTable({
    orderId: v.id("orders"),
    channelName: v.string(),
    userId: v.id("users"),
    quantity: v.number(),
    deliveryAddress: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelName"])
    .index("by_user", ["userId"])
    .index("by_order", ["orderId"]),


  // Live session reports
  liveSessionReports: defineTable({
    sessionId: v.id('liveSessions'),
    channelName: v.string(),
    reporterId: v.id("users"),
    reason: v.string(),
    additionalDetails: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    reportedAt: v.number(),
    notes: v.optional(v.string()),
    resolutionNotes: v.optional(v.string())
  } as const)
    .index("by_channel", ["channelName"])
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status"])
    .index("by_session", ["sessionId"]),
    
  // Live chat mutes
  liveChatMutes: defineTable({
    userId: v.id("users"),
    channelName: v.string(),
    mutedBy: v.id("users"),
    reason: v.string(),
    expiresAt: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("users")),
  })
    .index("by_user_channel", ["userId", "channelName"])
    .index("by_expiry", ["expiresAt"]),

  changes: defineTable({
    type: v.string(),
    data: v.any(),
    synced: v.boolean(),
    timestamp: v.number(),
  }),
  

  // Chefs table
  chefs: defineTable({
    userId: v.id("users"),
    name: v.string(),
    bio: v.string(),
    specialties: v.array(v.string()),
    rating: v.number(),
    status: v.union(
      v.literal("active"), 
      v.literal("inactive"), 
      v.literal("suspended"),
      v.literal("pending_verification")
    ),
    location: v.object({
      city: v.string(),
      coordinates: v.array(v.number()),
    }),
    isAvailable: v.optional(v.boolean()),
    availableDays: v.optional(v.array(v.string())),
    availableHours: v.optional(v.object({})),
    maxOrdersPerDay: v.optional(v.number()),
    advanceBookingDays: v.optional(v.number()),
    specialInstructions: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    verificationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    )),
    verificationDocuments: v.optional(v.object({
      healthPermit: v.boolean(),
      insurance: v.boolean(),
      backgroundCheck: v.boolean(),
      certifications: v.array(v.string())
    })),
    performance: v.optional(v.object({
      totalOrders: v.number(),
      completedOrders: v.number(),
      averageRating: v.number(),
      totalEarnings: v.number(),
      lastOrderDate: v.optional(v.number())
    })),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_verification", ["verificationStatus"]),
  // Meals table
  meals: defineTable({
    chefId: v.id("chefs"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    cuisine: v.array(v.string()),
    dietary: v.array(v.string()),
    status: v.union(v.literal("available"), v.literal("unavailable")),
    rating: v.optional(v.number()),
    images: v.array(v.string()),
    calories: v.optional(v.number()),
  }),
  // Bookings table
  bookings: defineTable({
    chef_id: v.id("chefs"),
    user_id: v.id("users"),
    date: v.string(), // ISO date string
    status: v.string(),
    notes: v.optional(v.string()),
  }),
  // Users table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    phone_number: v.optional(v.string()),
    password: v.string(), // Hashed password
    roles: v.optional(v.array(v.string())), // e.g. ['admin', 'staff']
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    lastLogin: v.optional(v.number()),
    lastModified: v.optional(v.number()),
    preferences: v.optional(v.object({
      cuisine: v.optional(v.array(v.string())),
      dietary: v.optional(v.array(v.string())),
      blockedUsers: v.optional(v.array(v.id("users"))),
    })),
    favorites: v.optional(v.object({
      chefs: v.optional(v.array(v.id("chefs"))),
      meals: v.optional(v.array(v.id("meals"))),
    })),
    avatar: v.optional(v.string()),
    // Staff-specific fields
    onboarding: v.optional(v.any()),
    mattermostActive: v.optional(v.boolean()),
    mattermostProfile: v.optional(v.any()),
    mattermostUserId: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    startDate: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    salary: v.optional(v.string()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      relationship: v.string(),
      phone: v.string(),
      email: v.string(),
    })),
    taxInfo: v.optional(v.object({
      ssn: v.string(),
      filingStatus: v.string(),
      allowances: v.number(),
    })),
    bankingInfo: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.string(),
    })),
    benefits: v.optional(v.object({
      healthInsurance: v.boolean(),
      dentalInsurance: v.boolean(),
      visionInsurance: v.boolean(),
      retirementPlan: v.boolean(),
      lifeInsurance: v.boolean(),
    })),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      country: v.string(),
    })),
    // Affiliate & Referral fields
    referralLink: v.optional(v.string()), // Unique referral link for user
    referralCount: v.optional(v.number()), // Number of successful referrals
    referrerId: v.optional(v.id("users")), // Who referred this user
    rewards: v.optional(v.object({
      noshCredit: v.optional(v.number()),
      earlyAccess: v.optional(v.boolean()),
      deliveryDiscount: v.optional(v.boolean()),
      badge: v.optional(v.string()),
      skipWaitlist: v.optional(v.boolean()),
      leaderboard: v.optional(v.boolean()),
      commissionMode: v.optional(v.boolean()),
      affiliate: v.optional(v.boolean()),
      featured: v.optional(v.boolean()),
      referralUsed: v.optional(v.boolean()),
    })),
    affiliateStatus: v.optional(v.union(
      v.literal("none"),
      v.literal("pending"),
      v.literal("active")
    )),
    referralHistory: v.optional(v.array(v.id("referrals"))), // List of referral event IDs
    referralProgramActive: v.optional(v.boolean()), // User has joined referral program
    sessionToken: v.optional(v.string()), // Session token for Convex Auth
    sessionExpiry: v.optional(v.number()), // Expiry timestamp (ms since epoch)
    stripeCustomerId: v.optional(v.string()),
    // OAuth fields
    oauthProviders: v.optional(v.array(v.object({
      provider: v.union(v.literal('google'), v.literal('apple')),
      providerId: v.string(),
      email: v.string(),
      name: v.string(),
      picture: v.optional(v.string()),
      verified: v.boolean(),
    }))),
    // Primary OAuth provider (for users who only use OAuth)
    primaryOAuthProvider: v.optional(v.union(v.literal('google'), v.literal('apple'))),
    // Apple Sign in notification fields
    emailForwardingEnabled: v.optional(v.boolean()),
    lastEmailForwardingChange: v.optional(v.number()),
    consentWithdrawnAt: v.optional(v.number()),
    accountDeletedAt: v.optional(v.number()),
    // Two-Factor Authentication fields
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()), // Encrypted
    twoFactorBackupCodes: v.optional(v.array(v.string())), // Hashed
  })
  .index('by_email', ['email'])
  .index('by_phone', ['phone_number'])
  .index('by_oauth_provider', ['primaryOAuthProvider']),
  // Waitlist table
  waitlist: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    company: v.optional(v.string()),
    teamSize: v.optional(v.string()),
    source: v.optional(v.string()),
    joinedAt: v.number(),
    location: v.optional(v.any()), // Add location field
    priority: v.optional(v.string()), // Add priority field
    status: v.optional(v.string()), // Add status field
    addedBy: v.optional(v.id("users")), // Staff member who added this entry
    addedByName: v.optional(v.string()), // Staff member's name for display
    referralCode: v.optional(v.string()), // Referral code
    referrer: v.optional(v.id("waitlist")), // Reference to referrer
    notes: v.optional(v.string()), // Admin notes
    convertedAt: v.optional(v.number()), // When converted
    lastNotifiedAt: v.optional(v.number()), // Last email notification
    updatedAt: v.optional(v.number()), // Last update timestamp
  }),
  // Reviews table
  reviews: defineTable({
    user_id: v.id("users"),
    chef_id: v.optional(v.id("chefs")),
    meal_id: v.optional(v.id("meals")),
    order_id: v.optional(v.id("orders")),
    rating: v.number(),
    comment: v.optional(v.string()),
    categories: v.optional(v.object({
      food_quality: v.optional(v.number()),
      delivery_speed: v.optional(v.number()),
      packaging: v.optional(v.number()),
      customer_service: v.optional(v.number()),
    })),
    createdAt: v.number(),
    status: v.string(),
  })
    .index("by_order", ["order_id"])
    .index("by_user", ["user_id"])
    .index("by_chef", ["chef_id"])
    .index("by_meal", ["meal_id"])
    .index("by_createdAt", ["createdAt"]),
  // Kitchens table
  kitchens: defineTable({
    owner_id: v.id("users"),
    address: v.string(),
    certified: v.boolean(),
    inspectionDates: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    featuredVideoId: v.optional(v.id("videoPosts")), // Featured video for this kitchen
  }),
  // Perks table
  perks: defineTable({
    title: v.string(),
    description: v.string(),
    image: v.optional(v.string()),
  }),
  // Analytics table
  analytics: defineTable({
    eventType: v.string(),
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
    metadata: v.any(),
  }).index("by_timestamp", ["timestamp"])
    .index("by_event_type", ["eventType"]),
  // Drivers table
  drivers: defineTable({
    // User information
    userId: v.optional(v.id("users")),
    firstName: v.string(),
    lastName: v.string(),
    name: v.string(), // Full name (firstName + lastName)
    email: v.string(),
    phone: v.optional(v.string()),
    // Vehicle information
    vehicleType: v.string(), // e.g., "Car", "Motorcycle", "Bicycle", "Scooter", "Van"
    vehicleModel: v.string(), // e.g., "Toyota Corolla", "Honda CB500F"
    vehicleYear: v.string(), // e.g., "2020"
    licensePlate: v.string(), // UK license plate format
    // Documents
    documents: v.optional(v.array(v.object({
      type: v.string(), // "driversLicense", "vehicleRegistration", "insurance"
      url: v.string(),
      fileId: v.optional(v.string()),
      verified: v.boolean(),
      verifiedAt: v.optional(v.number()),
    }))),
    // Bank information
    bankName: v.optional(v.string()),
    bankCode: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    accountName: v.optional(v.string()),
    // Work type
    workType: v.optional(v.union(
      v.literal('independent'),
      v.literal('supplier')
    )),
    supplierId: v.optional(v.string()),
    // Legacy fields (for backward compatibility)
    vehicle: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    experience: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("on_hold"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("suspended")
    ),
    currentLocation: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      updatedAt: v.number(),
    })),
    availability: v.union(
      v.literal('available'),
      v.literal('busy'),
      v.literal('offline'),
      v.literal('on_delivery')
    ),
    rating: v.optional(v.number()),
    totalDeliveries: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_availability", ["availability"])
    .index("by_rating", ["rating"])
    .index("by_location", ["currentLocation.latitude", "currentLocation.longitude"]),

  // Delivery assignments table
  deliveryAssignments: defineTable({
    order_id: v.id("orders"),
    driver_id: v.id("drivers"),
    assigned_by: v.id("users"),
    assigned_at: v.number(),
    estimated_pickup_time: v.optional(v.number()),
    estimated_delivery_time: v.optional(v.number()),
    actual_pickup_time: v.optional(v.number()),
    actual_delivery_time: v.optional(v.number()),
    pickup_location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      instructions: v.optional(v.string()),
    }),
    delivery_location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      address: v.string(),
      instructions: v.optional(v.string()),
    }),
    status: v.union(
      v.literal('assigned'),
      v.literal('accepted'),
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    delivery_notes: v.optional(v.string()),
    customer_rating: v.optional(v.number()),
    customer_feedback: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_order", ["order_id"])
    .index("by_driver", ["driver_id"])
    .index("by_status", ["status"])
    .index("by_date", ["assigned_at"]),

  // Delivery tracking table
  deliveryTracking: defineTable({
    assignment_id: v.id("deliveryAssignments"),
    driver_id: v.id("drivers"),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.optional(v.number()),
    }),
    status: v.union(
      v.literal('location_update'),
      v.literal('status_update'),
      v.literal('pickup_confirmed'),
      v.literal('delivery_confirmed'),
      v.literal('issue_reported')
    ),
    timestamp: v.number(),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_assignment", ["assignment_id"])
    .index("by_driver", ["driver_id"])
    .index("by_timestamp", ["timestamp"]),

  // Delivery zones table
  deliveryZones: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    boundaries: v.array(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    center: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    radius_km: v.number(),
    delivery_fee: v.number(),
    estimated_time_minutes: v.number(),
    is_active: v.boolean(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_active", ["is_active"])
    .index("by_center", ["center.latitude", "center.longitude"]),
  adminActivity: defineTable({
    type: v.string(), // 'new_user', 'new_meal', 'system_update', etc.
    userId: v.optional(v.string()),
    description: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.object({
      entityId: v.optional(v.string()),
      entityType: v.optional(v.string()),
      details: v.optional(v.any()),
    })),
  }),
  adminStats: defineTable({
    key: v.string(), // 'total_users', 'active_chefs', etc.
    value: v.number(),
    trend: v.string(), // 'up', 'down', 'stable'
    changePercentage: v.number(),
    lastUpdated: v.number(),
  }),
  adminSessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    sessionToken: v.optional(v.string()),
  }),
  sessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceId: v.optional(v.string()), // Unique device identifier for tracking specific devices
    deviceName: v.optional(v.string()), // Human-readable device name (e.g., "John's iPhone", "Chrome on Mac")
  }).index("by_user", ["userId"])
    .index("by_token", ["sessionToken"])
    .index("by_expiry", ["expiresAt"])
    .index("by_device", ["userId", "deviceId"]), // Index for finding sessions by device
  content: defineTable({
    title: v.string(),
    type: v.union(v.literal("blog"), v.literal("story"), v.literal("recipe"), v.literal("page")),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    author: v.string(),
    lastModified: v.number(),
    publishDate: v.optional(v.number()),
    thumbnail: v.optional(v.string()),
    metadata: v.optional(v.object({
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      readTime: v.optional(v.number()),
    })),
  }),

  // Content Analytics Tables
  contentViews: defineTable({
    contentId: v.id("content"),
    userId: v.optional(v.id("users")), // null for anonymous views
    viewedAt: v.number(),
    sessionId: v.optional(v.string()), // for anonymous tracking
    ipAddress: v.optional(v.string()), // for analytics
    userAgent: v.optional(v.string()), // for analytics
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_date", ["viewedAt"]),

  contentLikes: defineTable({
    contentId: v.id("content"),
    userId: v.id("users"),
    likedAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_date", ["likedAt"]),

  contentComments: defineTable({
    contentId: v.id("content"),
    userId: v.id("users"),
    comment: v.string(),
    commentedAt: v.number(),
    parentCommentId: v.optional(v.id("contentComments")), // for nested comments
    status: v.union(v.literal("active"), v.literal("deleted"), v.literal("moderated")),
  })
    .index("by_content", ["contentId"])
    .index("by_user", ["userId"])
    .index("by_date", ["commentedAt"])
    .index("by_parent", ["parentCommentId"]),

  // User Permissions Table
  userPermissions: defineTable({
    userId: v.id("users"),
    permissions: v.array(v.string()),
    lastUpdated: v.number(),
    updatedBy: v.id("users"),
    reason: v.optional(v.string()), // why permissions were granted/revoked
  })
    .index("by_user", ["userId"])
    .index("by_date", ["lastUpdated"]),

  systemSettings: defineTable({
    key: v.string(),
    value: v.any(),
    lastModified: v.number(),
    modifiedBy: v.id("users"),
  }).index("by_key", ["key"]),
  // Drip Emails table for broadcast tracking
  dripEmails: defineTable({
    userId: v.id("users"),
    templateId: v.string(),
    sentAt: v.number(), // Unix timestamp (ms)
  }),
  // Career related schemas
  jobPosting: defineTable({
    title: v.string(),
    department: v.string(),
    location: v.string(),
    type: v.string(), // full-time, part-time, contract
    description: v.string(),
    requirements: v.array(v.string()),
    responsibilities: v.array(v.string()),
    benefits: v.array(v.string()),
    isActive: v.boolean(),
    postedAt: v.number(), // timestamp
    updatedAt: v.optional(v.number()),
    slug: v.string(), // URL-friendly version of title
  }).index("by_active", ["isActive"])
    .index("by_department", ["department"])
    .index("by_postedAt", ["postedAt"]),
  jobApplication: defineTable({
    jobId: v.id("jobPosting"),
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    resumeUrl: v.string(),
    coverLetter: v.optional(v.string()),
    portfolio: v.optional(v.string()),
    status: v.string(), // pending, reviewed, shortlisted, rejected, hired
    submittedAt: v.number(),
    lastUpdated: v.optional(v.number()),
  }).index("by_job", ["jobId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),
  // Add email options table
  emailOptions: defineTable({
    broadcastId: v.string(),
    templateId: v.string(),
    variables: v.optional(v.any()),
    resendApiKey: v.string(),
    audienceId: v.string(),
    fromEmail: v.string(),
    createdAt: v.number(),
  }).index("by_broadcast", ["broadcastId"]),
  monitoring: defineTable({
    type: v.string(),
    status: v.string(),
    details: v.string(),
  }),
  monitoring_events: defineTable({
    type: v.string(),
    status: v.string(),
    details: v.string(),
    timestamp: v.string(),
  }),
  documents: defineTable({
    userEmail: v.string(),
    name: v.string(),
    type: v.string(),
    status: v.string(),
    uploadDate: v.string(),
    expiryDate: v.optional(v.string()),
    size: v.string(),
    description: v.string(),
    storageId: v.id('_storage'),
  }),
  
  // Work Email Requests table
  workEmailRequests: defineTable({
    userId: v.id("users"),
    requestedEmail: v.string(),
    reason: v.string(),
    department: v.string(),
    position: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
    approvedEmail: v.optional(v.string()),
  }).index("by_user", ["userId", "submittedAt"])
    .index("by_status", ["status"])
    .index("by_department", ["department"]),
  
  // Leave Requests table
  leaveRequests: defineTable({
    userId: v.id("users"),
    leaveType: v.union(v.literal("annual"), v.literal("sick"), v.literal("personal"), v.literal("maternity"), v.literal("paternity"), v.literal("bereavement"), v.literal("other")),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    totalDays: v.number(),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    isHalfDay: v.optional(v.boolean()),
  }).index("by_user", ["userId", "submittedAt"])
    .index("by_status", ["status"])
    .index("by_date_range", ["startDate", "endDate"]),
  
  // Work IDs table
  workIds: defineTable({
    userId: v.id("users"),
    workIdNumber: v.string(),
    employeeId: v.string(),
    name: v.string(),
    department: v.string(),
    position: v.string(),
    photoUrl: v.optional(v.string()),
    qrCode: v.string(),
    qrCodeBase64: v.optional(v.string()), // Base64 encoded QR code image
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("revoked")),
    issuedAt: v.number(),
    expiresAt: v.number(),
    issuedBy: v.id("users"),
    revokedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("users")),
    revocationReason: v.optional(v.string()),
    digitalVersion: v.optional(v.string()), // URL to digital version
    printableVersion: v.optional(v.string()), // URL to printable version
  }).index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_work_id_number", ["workIdNumber"])
    .index("by_expiry", ["expiresAt"]),
  // Referrals table for tracking individual referral events
  referrals: defineTable({
    referrerId: v.id("users"), // Who sent the invite
    referredUserId: v.optional(v.id("users")), // Who signed up (if completed)
    referralCode: v.string(), // The code or link used
    createdAt: v.number(), // Timestamp
    completedAt: v.optional(v.number()), // When referral was completed
    deviceId: v.optional(v.string()), // For unique signup tracking
    ip: v.optional(v.string()), // For unique signup tracking
    rewardTier: v.optional(v.string()), // e.g. '1', '3', '5', '10', '20'
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("invalid")),
  })
    .index("by_referrer", ["referrerId"]) 
    .index("by_referrer_and_device", ["referrerId", "deviceId"]) 
    .index("by_referrer_device_ip", ["referrerId", "deviceId", "ip"]),
  waitlistSessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    sessionToken: v.optional(v.string()),
  }),
  onboardingCodes: defineTable({
    code: v.string(), // 6-digit code
    email: v.string(), // email of the new staff
    status: v.union(v.literal('active'), v.literal('used'), v.literal('expired')),
    createdAt: v.number(),
    expiresAt: v.number(),
  }),
  timelogs: defineTable({
    user: v.string(),
    staffId: v.id('users'),
    bucket: v.string(),
    logs: v.array(v.any()),
    timestamp: v.number(),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedBy: v.optional(v.id('users')),
    updatedAt: v.optional(v.number()),
    changeLog: v.optional(v.array(v.object({
      action: v.string(), // 'create', 'update', 'delete'
      by: v.id('users'),
      at: v.number(),
      details: v.optional(v.any()),
    }))),
  })
    .index('by_user', ['user'])
    .index('by_staffId', ['staffId'])
    .index('by_bucket', ['bucket'])
    .index('by_user_bucket', ['user', 'bucket']),
  
  // Work Sessions (for time tracking and overtime calculation)
  workSessions: defineTable({
    staffId: v.id('users'),
    clockInTime: v.number(), // Unix timestamp
    clockOutTime: v.optional(v.number()), // Unix timestamp
    duration: v.optional(v.number()), // Duration in milliseconds
    status: v.union(
      v.literal('active'),
      v.literal('completed'),
      v.literal('paused'),
      v.literal('adjusted')
    ),
    isOvertime: v.optional(v.boolean()),
    payPeriodId: v.optional(v.id("payPeriods")),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedBy: v.optional(v.id('users')),
    updatedAt: v.optional(v.number()),
  })
    .index('by_staffId', ['staffId'])
    .index('by_status', ['status'])
    .index('by_date', ['clockInTime'])
    .index('by_staff_date', ['staffId', 'clockInTime'])
    .index('by_pay_period', ['payPeriodId']),

  // --- CHAT BUSINESS LOGIC ---
  chats: defineTable({
    participants: v.array(v.id('users')), // All user IDs in the conversation
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // For future extensibility (e.g. group name, avatar)
  })
    .index('by_participant', ['participants'])
    .index('by_lastMessageAt', ['lastMessageAt']),


    
  // Live session viewers


  liveViewers: defineTable({
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
    joinedAt: v.number(),
    leftAt: v.optional(v.number()),
    watchDuration: v.optional(v.number()), // in seconds
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_session_user", ["sessionId", "userId"]),

  messages: defineTable({
    chatId: v.id('chats'),
    senderId: v.id('users'),
    content: v.string(), // Text content
    createdAt: v.number(),
    isRead: v.optional(v.boolean()),
    // MinIO file info (optional)
    fileUrl: v.optional(v.string()), // Presigned URL or object key
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index('by_chat', ['chatId'])
    .index('by_sender', ['senderId'])
    .index('by_createdAt', ['createdAt']),

  // Custom Orders table
  custom_orders: defineTable({
    userId: v.id("users"),
    requirements: v.string(),
    dietary_restrictions: v.optional(v.union(v.string(), v.null())),
    serving_size: v.number(),
    desired_delivery_time: v.string(),
    custom_order_id: v.string(),
    order_id: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    estimatedPrice: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Carts table
  carts: defineTable({
    userId: v.id('users'),
    items: v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      updatedAt: v.optional(v.number()),
      sides: v.optional(v.array(v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
      }))),
    })),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId']),

  // Sides table - available side dishes/extras that can be added to meals
  sides: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Price in cents
    mealId: v.optional(v.id('meals')), // Optional: specific to a meal
    chefId: v.optional(v.id('chefs')), // Optional: specific to a chef
    category: v.optional(v.string()), // e.g., "drinks", "extras", "sauces", "sides"
    image: v.optional(v.string()),
    available: v.optional(v.boolean()), // Default true
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_meal', ['mealId'])
    .index('by_chef', ['chefId'])
    .index('by_category', ['category']),

  // Orders table
  orders: defineTable({
    order_id: v.string(),
    customer_id: v.id('users'),
    chef_id: v.id('chefs'),
    order_date: v.string(), // ISO date string
    total_amount: v.number(),
    subtotal: v.optional(v.number()), // Subtotal before discount
    offer_id: v.optional(v.string()), // Applied special offer ID
    discount_amount: v.optional(v.number()), // Discount amount applied
    discount_type: v.optional(v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_delivery")
    )),
    nosh_points_applied: v.optional(v.number()), // Nosh Points applied for discount
    order_status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    payment_status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    payment_method: v.optional(v.string()),
    payment_id: v.optional(v.string()),
    special_instructions: v.optional(v.string()),
    delivery_time: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    estimated_prep_time_minutes: v.optional(v.number()),
    chef_notes: v.optional(v.string()),
    live_session_id: v.optional(v.id("liveSessions")),
    // Delivery and completion tracking
    delivered_at: v.optional(v.number()),
    completed_at: v.optional(v.number()),
    reviewed_at: v.optional(v.number()),
    refund_eligible_until: v.optional(v.number()), // Timestamp until which refund is allowed
    is_refundable: v.optional(v.boolean()), // Current refund eligibility status
    // Refund fields
    refund_id: v.optional(v.string()),
    refund_amount: v.optional(v.number()),
    refund_reason: v.optional(v.union(
      v.literal('requested_by_customer'),
      v.literal('fraudulent'),
      v.literal('duplicate'),
      v.literal('other')
    )),
    refund_processed_by: v.optional(v.id("users")),
    refund_description: v.optional(v.string()),
    refund_metadata: v.optional(v.any()),
    refund_processed_at: v.optional(v.number()),
    // Cancellation fields
    cancellation_reason: v.optional(v.union(
      v.literal('customer_request'),
      v.literal('out_of_stock'),
      v.literal('chef_unavailable'),
      v.literal('delivery_issue'),
      v.literal('fraudulent'),
      v.literal('duplicate'),
      v.literal('other')
    )),
    cancelled_by: v.optional(v.id("users")),
    cancellation_description: v.optional(v.string()),
    cancellation_metadata: v.optional(v.any()),
    cancelled_at: v.optional(v.number()),
    order_items: v.array(v.object({
      dish_id: v.id("meals"),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    // Group order fields
    is_group_order: v.optional(v.boolean()),
    group_order_id: v.optional(v.id("group_orders")),
    participant_count: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_customer", ["customer_id"])
    .index("by_chef", ["chef_id"])
    .index("by_status", ["order_status"])
    .index("by_payment_status", ["payment_status"])
    .index("by_date", ["order_date"])
    .index("by_order_id", ["order_id"])
    .index("by_refund_eligible", ["is_refundable", "refund_eligible_until"])
    .index("by_group_order", ["group_order_id"]),

  // Group Orders table
  group_orders: defineTable({
    group_order_id: v.string(),
    created_by: v.id("users"),
    chef_id: v.id("chefs"),
    restaurant_name: v.string(),
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("closed"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("on_the_way"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    // Budget tracking
    initial_budget: v.number(), // Initial budget set by creator
    total_budget: v.number(), // Sum of initial_budget + all budget contributions
    budget_contributions: v.array(v.object({
      user_id: v.id("users"),
      amount: v.number(),
      contributed_at: v.number(),
    })),
    // Selection phase tracking
    selection_phase: v.union(
      v.literal("budgeting"),
      v.literal("selecting"),
      v.literal("ready")
    ),
    participants: v.array(v.object({
      user_id: v.id("users"),
      user_name: v.string(),
      user_initials: v.string(),
      user_color: v.optional(v.string()),
      avatar_url: v.optional(v.string()),
      joined_at: v.number(),
      // Budget contribution (separate from order items)
      budget_contribution: v.number(), // Amount participant chipped into budget bucket
      // Order items selected by participant
      order_items: v.array(v.object({
        dish_id: v.id("meals"),
        name: v.string(),
        quantity: v.number(),
        price: v.number(),
        special_instructions: v.optional(v.string()),
      })),
      // Selection status
      selection_status: v.union(
        v.literal("not_ready"),
        v.literal("ready")
      ),
      selection_ready_at: v.optional(v.number()), // Timestamp when marked ready
      // Order totals (sum of order items)
      total_contribution: v.number(), // Sum of order_items (what they selected to eat)
      payment_status: v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("failed")
      ),
    })),
    total_amount: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    final_amount: v.number(),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    delivery_time: v.optional(v.string()),
    estimated_delivery_time: v.optional(v.string()),
    share_token: v.optional(v.string()),
    share_link: v.optional(v.string()),
    share_expires_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    closed_at: v.optional(v.number()),
    expires_at: v.optional(v.number()),
    main_order_id: v.optional(v.id("orders")),
  })
    .index("by_creator", ["created_by"])
    .index("by_chef", ["chef_id"])
    .index("by_status", ["status"])
    .index("by_share_token", ["share_token"])
    .index("by_group_order_id", ["group_order_id"]),

  // Special Offers table
  special_offers: defineTable({
    offer_id: v.string(),
    title: v.string(),
    description: v.string(),
    call_to_action_text: v.string(),
    offer_type: v.union(
      v.literal("limited_time"),
      v.literal("seasonal"),
      v.literal("promotional"),
      v.literal("referral")
    ),
    badge_text: v.optional(v.string()),
    discount_type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_delivery")
    ),
    discount_value: v.number(),
    max_discount: v.optional(v.number()),
    target_audience: v.union(
      v.literal("all"),
      v.literal("new_users"),
      v.literal("existing_users"),
      v.literal("group_orders")
    ),
    min_order_amount: v.optional(v.number()),
    min_participants: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    is_active: v.boolean(),
    background_image_url: v.optional(v.string()),
    background_color: v.optional(v.string()),
    text_color: v.optional(v.string()),
    starts_at: v.number(),
    ends_at: v.number(),
    click_count: v.optional(v.number()),
    conversion_count: v.optional(v.number()),
    action_type: v.union(
      v.literal("navigate"),
      v.literal("external_link"),
      v.literal("group_order")
    ),
    action_target: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_status", ["status", "is_active"])
    .index("by_dates", ["starts_at", "ends_at"])
    .index("by_target", ["target_audience"])
    .index("by_offer_id", ["offer_id"]),

  // Claimed Offers table - tracks which users have claimed which offers
  claimed_offers: defineTable({
    user_id: v.id("users"),
    offer_id: v.string(), // Reference to special_offers.offer_id
    claimed_at: v.number(),
    used_at: v.optional(v.number()), // When offer was actually used in an order
    order_id: v.optional(v.id("orders")), // Order where offer was used
    is_used: v.boolean(), // Whether offer has been used
    expires_at: v.number(), // When the claim expires (usually offer.ends_at)
  })
    .index("by_user", ["user_id"])
    .index("by_offer", ["offer_id"])
    .index("by_user_offer", ["user_id", "offer_id"])
    .index("by_expires", ["expires_at"]),

  // Coupons/Discount Codes table
  coupons: defineTable({
    code: v.string(), // The discount code (e.g., "SAVE20", "NOSHPASS123")
    type: v.union(
      v.literal("nosh_pass"), // Nosh Pass subscription code
      v.literal("discount") // Regular discount code
    ),
    discount_type: v.union(
      v.literal("percentage"),
      v.literal("fixed_amount"),
      v.literal("free_delivery")
    ),
    discount_value: v.number(), // Percentage (0-100) or fixed amount in base currency
    max_discount: v.optional(v.number()), // Maximum discount amount for percentage discounts
    min_order_amount: v.optional(v.number()), // Minimum order amount to use this coupon
    description: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("expired")
    ),
    usage_limit: v.optional(v.number()), // Total number of times this coupon can be used
    usage_count: v.number(), // Current usage count
    user_limit: v.optional(v.number()), // Number of times a single user can use this coupon
    valid_from: v.number(), // Start date timestamp
    valid_until: v.optional(v.number()), // End date timestamp (null = no expiration)
    created_at: v.number(),
    updated_at: v.number(),
    created_by: v.optional(v.id("users")), // Admin who created the coupon
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_valid_dates", ["valid_from", "valid_until"]),

  // Coupon Usage tracking - tracks which users have used which coupons
  coupon_usage: defineTable({
    coupon_id: v.id("coupons"),
    user_id: v.id("users"),
    order_id: v.optional(v.id("orders")), // Order where coupon was applied
    used_at: v.number(),
    discount_amount: v.number(), // Actual discount amount applied
  })
    .index("by_coupon", ["coupon_id"])
    .index("by_user", ["user_id"])
    .index("by_user_coupon", ["user_id", "coupon_id"])
    .index("by_order", ["order_id"]),

  // Deliveries table
  deliveries: defineTable({
    orderId: v.id('orders'),
    driverId: v.id('drivers'),
    status: v.union(
      v.literal('assigned'),
      v.literal('picked_up'),
      v.literal('in_transit'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    pickupAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      coordinates: v.array(v.number()),
    }),
    deliveryAddress: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zipCode: v.string(),
      coordinates: v.array(v.number()),
    }),
    estimatedPickupTime: v.number(),
    estimatedDeliveryTime: v.number(),
    actualPickupTime: v.optional(v.number()),
    actualDeliveryTime: v.optional(v.number()),
    distance: v.number(), // in kilometers
    deliveryFee: v.number(),
    tip: v.number(),
    specialInstructions: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_estimated_delivery", ["estimatedDeliveryTime"]),

  // Cuisines table
  cuisines: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
    image: v.optional(v.string()),
  }),
  emotions_engine_logs: defineTable({
    userId: v.optional(v.string()),
    context: v.any(),
    provider: v.string(),
    query: v.string(),
    response: v.any(),
    timestamp: v.number(),
  }),
  emotions_engine_settings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id('users')),
  }),
  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"]),

  staffAssignments: defineTable({
    userId: v.id("users"),
    department: v.string(),
    position: v.string(),
    assignedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
  staffNotices: defineTable({
    title: v.string(),
    message: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    isActive: v.boolean(),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_isActive", ["isActive"]),
  // Payroll Settings
  payrollSettings: defineTable({
    payFrequency: v.union(
      v.literal('weekly'),
      v.literal('biweekly'),
      v.literal('semimonthly'),
      v.literal('monthly')
    ),
    firstPayDay: v.number(),
    standardWorkWeek: v.number(),
    overtimeMultiplier: v.number(),
    holidayOvertimeMultiplier: v.number(),
    weekendOvertimeMultiplier: v.number(),
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_updated", ["updatedAt"]),

  // Staff Payroll Profiles
  staffPayrollProfiles: defineTable({
    staffId: v.id("users"),
    hourlyRate: v.number(),
    isOvertimeEligible: v.boolean(),
    paymentMethod: v.union(
      v.literal('direct_deposit'),
      v.literal('check'),
      v.literal('other')
    ),
    bankDetails: v.optional(v.object({
      accountNumber: v.string(),
      routingNumber: v.string(),
      accountType: v.union(
        v.literal('checking'),
        v.literal('savings')
      ),
      bankName: v.string()
    })),
    taxWithholdings: v.object({
      federalAllowances: v.number(),
      stateAllowances: v.number(),
      additionalWithholding: v.number(),
      taxStatus: v.union(
        v.literal('single'),
        v.literal('married'),
        v.literal('head_of_household')
      )
    }),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('on_leave')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_staff", ["staffId"])
    .index("by_status", ["status"]),

  // Pay Periods
  payPeriods: defineTable({
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('processed'),
      v.literal('paid')
    ),
    processedAt: v.optional(v.number()),
    processedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_dates", ["startDate", "endDate"])
    .index("by_status", ["status"]),

  // Pay Slips
  paySlips: defineTable({
    staffId: v.id("users"),
    periodId: v.id("payPeriods"),
    baseHours: v.number(),
    overtimeHours: v.number(),
    hourlyRate: v.number(),
    grossPay: v.number(),
    deductions: v.array(v.object({
      type: v.string(),
      amount: v.number(),
      description: v.optional(v.string())
    })),
    bonuses: v.array(v.object({
      type: v.string(),
      amount: v.number(),
      description: v.optional(v.string())
    })),
    netPay: v.number(),
    status: v.union(
      v.literal('draft'),
      v.literal('processing'),
      v.literal('paid'),
      v.literal('cancelled')
    ),
    paymentDate: v.optional(v.number()),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_staff", ["staffId"])
    .index("by_period", ["periodId"])
    .index("by_status", ["status"]),

  // Payroll Audit Log
  payrollAuditLogs: defineTable({
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    performedBy: v.id("users"),
    performedAt: v.number(),
    changes: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_date", ["performedAt"]),

  // Refunds table
  refunds: defineTable({
    order_id: v.id("orders"),
    refund_id: v.string(),
    amount: v.number(),
    reason: v.union(
      v.literal('requested_by_customer'),
      v.literal('fraudulent'),
      v.literal('duplicate'),
      v.literal('other')
    ),
    processed_by: v.id("users"),
    description: v.string(),
    metadata: v.optional(v.any()),
    processed_at: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed')
    ),
  })
    .index("by_order", ["order_id"])
    .index("by_refund_id", ["refund_id"])
    .index("by_status", ["status"]),

  // Order History table
  orderHistory: defineTable({
    order_id: v.id("orders"),
    action: v.union(
      v.literal('created'),
      v.literal('confirmed'),
      v.literal('preparing'),
      v.literal('ready'),
      v.literal('delivered'),
      v.literal('cancelled'),
      v.literal('refunded'),
      v.literal('completed'),
      v.literal('reviewed'),
      v.literal('refund_eligibility_updated'),
      v.literal('updated'),
      v.literal('note_added'),
      v.literal('notification_sent'),
      v.literal('message_sent')
    ),
    reason: v.optional(v.string()),
    performed_by: v.id("users"),
    description: v.string(),
    metadata: v.optional(v.any()),
    performed_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_action", ["action"])
    .index("by_date", ["performed_at"]),

  // Order Notes table
  orderNotes: defineTable({
    order_id: v.id("orders"),
    note: v.string(),
    noteType: v.union(
      v.literal('chef_note'),
      v.literal('customer_note'),
      v.literal('internal_note')
    ),
    added_by: v.id("users"),
    metadata: v.optional(v.any()),
    added_at: v.number(),
  })
    .index("by_order", ["order_id"])
    .index("by_type", ["noteType"])
    .index("by_date", ["added_at"]),

  // Order Notifications table
  orderNotifications: defineTable({
    order_id: v.id("orders"),
    notification_type: v.union(
      v.literal('order_confirmed'),
      v.literal('order_preparing'),
      v.literal('order_ready'),
      v.literal('order_delivered'),
      v.literal('order_completed'),
      v.literal('order_cancelled'),
      v.literal('order_updated'),
      v.literal('custom')
    ),
    message: v.string(),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    channels: v.array(v.union(
      v.literal('email'),
      v.literal('sms'),
      v.literal('push'),
      v.literal('in_app')
    )),
    sent_by: v.id("users"),
    metadata: v.optional(v.any()),
    sent_at: v.number(),
    status: v.union(
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('failed'),
      v.literal('read')
    ),
  })
    .index("by_order", ["order_id"])
    .index("by_type", ["notification_type"])
    .index("by_date", ["sent_at"])
    .index("by_status", ["status"]),

  // Order Messages table
  orderMessages: defineTable({
    order_id: v.id("orders"),
    message: v.string(),
    messageType: v.union(
      v.literal('text'),
      v.literal('image'),
      v.literal('file'),
      v.literal('status_update')
    ),
    sent_by: v.id("users"),
    metadata: v.optional(v.any()),
    sent_at: v.number(),
    read_at: v.optional(v.number()),
    status: v.union(
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('read')
    ),
  })
    .index("by_order", ["order_id"])
    .index("by_type", ["messageType"])
    .index("by_date", ["sent_at"])
    .index("by_status", ["status"]),

  // Live Comments table
  liveComments: defineTable({
    session_id: v.id("liveSessions"),
    content: v.string(),
    commentType: v.union(
      v.literal('general'),
      v.literal('question'),
      v.literal('reaction'),
      v.literal('tip'),
      v.literal('moderation')
    ),
    sent_by: v.id("users"),
    sent_by_role: v.string(),
    user_display_name: v.string(),
    metadata: v.optional(v.any()),
    sent_at: v.number(),
    moderated_at: v.optional(v.number()),
    moderated_by: v.optional(v.id("users")),
    moderation_reason: v.optional(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('deleted'),
      v.literal('muted')
    ),
  })
    .index("by_session", ["session_id"])
    .index("by_type", ["commentType"])
    .index("by_date", ["sent_at"])
    .index("by_status", ["status"]),

  // Live Reactions table
  liveReactions: defineTable({
    session_id: v.id("liveSessions"),
    reactionType: v.union(
      v.literal('like'),
      v.literal('love'),
      v.literal('laugh'),
      v.literal('wow'),
      v.literal('sad'),
      v.literal('angry'),
      v.literal('fire'),
      v.literal('clap'),
      v.literal('heart'),
      v.literal('star')
    ),
    intensity: v.union(
      v.literal('light'),
      v.literal('medium'),
      v.literal('strong')
    ),
    sent_by: v.id("users"),
    sent_by_role: v.string(),
    user_display_name: v.string(),
    metadata: v.optional(v.any()),
    sent_at: v.number(),
    status: v.union(
      v.literal('active'),
      v.literal('deleted')
    ),
  })
    .index("by_session", ["session_id"])
    .index("by_type", ["reactionType"])
    .index("by_date", ["sent_at"])
    .index("by_status", ["status"]),

  // Payroll records table (UPDATED - Multi-country support)
  payrollRecords: defineTable({
    employee_id: v.id("users"),
    pay_date: v.number(),
    tax_year: v.string(),
    country: v.union(
      v.literal('UK'),
      v.literal('Nigeria'),
      v.literal('Ghana'),
      v.literal('Kenya')
    ),
    gross_pay: v.number(),
    currency: v.union(
      v.literal('GBP'),
      v.literal('NGN'),
      v.literal('GHS'),
      v.literal('KES')
    ),
    // UK Tax Fields
    tax_deduction: v.optional(v.number()),
    ni_deduction: v.optional(v.number()),
    pension_deduction: v.optional(v.number()),
    student_loan_deduction: v.optional(v.number()),
    // Nigerian Tax Fields
    paye_tax: v.optional(v.number()),
    nhf_contribution: v.optional(v.number()),
    nhis_contribution: v.optional(v.number()),
    pension_contribution: v.optional(v.number()),
    // Common Fields
    other_deductions: v.optional(v.number()),
    net_pay: v.number(),
    pay_period: v.object({
      start_date: v.number(),
      end_date: v.number()
    }),
    payment_method: v.union(
      v.literal('bank_transfer'),
      v.literal('cash'),
      v.literal('cheque'),
      v.literal('mobile_money')
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('processed'),
      v.literal('paid'),
      v.literal('failed')
    ),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_employee", ["employee_id"])
    .index("by_tax_year", ["tax_year"])
    .index("by_country", ["country"])
    .index("by_pay_date", ["pay_date"])
    .index("by_status", ["status"]),


  // Employee tax profiles table (NEW - Multi-country support)
  employeeTaxProfiles: defineTable({
    employee_id: v.id("users"),
    country: v.union(
      v.literal('UK'),
      v.literal('Nigeria'),
      v.literal('Ghana'),
      v.literal('Kenya')
    ),
    // UK Tax Profile
    ni_number: v.optional(v.string()),
    tax_code: v.optional(v.string()),
    utr: v.optional(v.string()),
    // Nigerian Tax Profile
    tin: v.optional(v.string()), // Tax Identification Number
    nhf_number: v.optional(v.string()),
    nhis_number: v.optional(v.string()),
    pension_pin: v.optional(v.string()),
    // Common Fields
    tax_band: v.optional(v.string()),
    allowances: v.optional(v.number()),
    exemptions: v.optional(v.number()),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended')
    ),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_employee", ["employee_id"])
    .index("by_country", ["country"])
    .index("by_status", ["status"]),

  // Employee benefits table (NEW)
  employeeBenefits: defineTable({
    employee_id: v.id("users"),
    benefit_type: v.union(
      v.literal('car'),
      v.literal('fuel'),
      v.literal('accommodation'),
      v.literal('health_insurance'),
      v.literal('life_insurance'),
      v.literal('other')
    ),
    tax_year: v.string(),
    benefit_value: v.number(),
    taxable_value: v.number(),
    start_date: v.number(),
    end_date: v.optional(v.number()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('terminated')
    ),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_employee", ["employee_id"])
    .index("by_benefit_type", ["benefit_type"])
    .index("by_tax_year", ["tax_year"])
    .index("by_status", ["status"]),

  // Job Queue tables for background processing
  jobQueue: defineTable({
    jobType: v.string(), // 'email', 'optimistic_operation', 'analytics', etc.
    payload: v.any(), // Job data
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('retry')
    ),
    priority: v.union(
      v.literal('low'),
      v.literal('normal'),
      v.literal('high'),
      v.literal('urgent')
    ),
    attempts: v.number(),
    maxAttempts: v.number(),
    retryCount: v.optional(v.number()),
    lastRetryAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    result: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_type", ["jobType"])
    .index("by_priority", ["priority"])
    .index("by_next_attempt", ["nextAttemptAt"])
    .index("by_created", ["createdAt"]),

  // Job processing locks to prevent duplicate processing
  jobLocks: defineTable({
    jobId: v.id("jobQueue"),
    processorId: v.string(), // Unique identifier for the processor
    lockedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_expiry", ["expiresAt"]),

  // Cache table for Redis-like caching
  cache: defineTable({
    key: v.string(),
    value: v.any(),
    ttl: v.optional(v.number()), // Time to live in milliseconds
    expiresAt: v.optional(v.number()),
    prefix: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_prefix", ["prefix"])
    .index("by_expiry", ["expiresAt"]),

  // Session storage table
  sessionStorage: defineTable({
    sessionId: v.string(),
    userId: v.id("users"),
    data: v.any(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  // OTP table for phone and email verification
  otps: defineTable({
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    code: v.string(),
    expiresAt: v.number(),
    attempts: v.number(),
    maxAttempts: v.number(),
    isUsed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone"])
    .index("by_email", ["email"])
    .index("by_expiry", ["expiresAt"])
    .index("by_created", ["createdAt"]),

  // Email Template Configurations
  emailTemplates: defineTable({
    templateId: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    subject: v.string(),
    previewText: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    replyToEmail: v.string(),
    customFields: v.record(v.string(), v.any()),
    styling: v.object({
      primaryColor: v.string(),
      secondaryColor: v.string(),
      accent: v.string(),
      fontFamily: v.string(),
      logoUrl: v.string(),
      footerText: v.string(),
    }),
    scheduling: v.object({
      timezone: v.string(),
      sendTime: v.string(),
      frequency: v.union(
        v.literal("immediate"),
        v.literal("scheduled"),
        v.literal("recurring")
      ),
    }),
    targeting: v.object({
      audience: v.union(
        v.literal("all"),
        v.literal("segment"),
        v.literal("custom")
      ),
      segmentId: v.optional(v.string()),
      customFilters: v.optional(
        v.array(
          v.object({
            field: v.string(),
            operator: v.string(),
            value: v.any(),
          })
        )
      ),
    }),
    testing: v.object({
      testEmails: v.array(v.string()),
      testData: v.record(v.string(), v.any()),
      previewMode: v.boolean(),
    }),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_template_id", ["templateId"])
    .index("by_active", ["isActive"])
    .index("by_audience", ["targeting.audience"]),

  // Email Automation Configurations
  emailAutomations: defineTable({
    automationId: v.string(),
    name: v.string(),
    description: v.string(),
    isActive: v.boolean(),
    triggers: v.array(
      v.object({
        event: v.string(),
        conditions: v.array(
          v.object({
            field: v.string(),
            operator: v.string(),
            value: v.any(),
          })
        ),
        delay: v.number(),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        ),
      })
    ),
    templates: v.array(
      v.object({
        templateId: v.string(),
        data: v.record(v.string(), v.any()),
        conditions: v.optional(
          v.array(
            v.object({
              field: v.string(),
              operator: v.string(),
              value: v.any(),
            })
          )
        ),
      })
    ),
    schedule: v.object({
      startDate: v.number(),
      endDate: v.optional(v.number()),
      timezone: v.string(),
    }),
    limits: v.object({
      maxEmailsPerDay: v.number(),
      maxEmailsPerHour: v.number(),
      maxEmailsPerUser: v.number(),
    }),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_automation_id", ["automationId"])
    .index("by_active", ["isActive"]),

  // Email Branding Configurations
  emailBranding: defineTable({
    brandId: v.string(),
    name: v.string(),
    isDefault: v.boolean(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
      success: v.string(),
      warning: v.string(),
      error: v.string(),
      info: v.string(),
      text: v.string(),
      textSecondary: v.string(),
      background: v.string(),
      backgroundSecondary: v.string(),
    }),
    typography: v.object({
      headingFont: v.string(),
      bodyFont: v.string(),
      headingSizes: v.record(v.string(), v.string()),
      bodySizes: v.record(v.string(), v.string()),
    }),
    logo: v.object({
      url: v.string(),
      width: v.number(),
      height: v.number(),
      altText: v.string(),
    }),
    footer: v.object({
      companyName: v.string(),
      address: v.string(),
      phone: v.string(),
      email: v.string(),
      website: v.string(),
      socialLinks: v.array(
        v.object({
          platform: v.string(),
          url: v.string(),
          icon: v.string(),
        })
      ),
      legalLinks: v.array(
        v.object({
          text: v.string(),
          url: v.string(),
        })
      ),
    }),
    spacing: v.object({
      scale: v.array(v.number()),
      defaultPadding: v.string(),
      defaultMargin: v.string(),
    }),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_brand_id", ["brandId"])
    .index("by_default", ["isDefault"]),

  // Email Delivery Configurations
  emailDelivery: defineTable({
    deliveryId: v.string(),
    provider: v.string(),
    apiKey: v.string(),
    apiSecret: v.optional(v.string()),
    region: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    rateLimits: v.object({
      requestsPerMinute: v.number(),
      requestsPerHour: v.number(),
      requestsPerDay: v.number(),
    }),
    retrySettings: v.object({
      maxRetries: v.number(),
      retryDelay: v.number(),
      backoffMultiplier: v.number(),
    }),
    bounceHandling: v.object({
      hardBounceThreshold: v.number(),
      softBounceThreshold: v.number(),
      suppressionListEnabled: v.boolean(),
    }),
    isActive: v.boolean(),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_delivery_id", ["deliveryId"])
    .index("by_active", ["isActive"])
    .index("by_provider", ["provider"]),

  // Email Analytics Configurations
  emailAnalytics: defineTable({
    analyticsId: v.string(),
    trackingEnabled: v.boolean(),
    openTracking: v.boolean(),
    clickTracking: v.boolean(),
    deviceTracking: v.boolean(),
    clientTracking: v.boolean(),
    utmParameters: v.boolean(),
    customEvents: v.array(v.string()),
    retentionPeriod: v.number(),
    aggregationLevel: v.union(
      v.literal("hourly"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly")
    ),
    reportingEmails: v.array(v.string()),
    dashboardAccess: v.array(v.string()),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_analytics_id", ["analyticsId"])
    .index("by_tracking_enabled", ["trackingEnabled"]),

  // Compliance Issue Resolutions
  complianceIssueResolutions: defineTable({
    issueId: v.string(),
    issueType: v.union(
      v.literal("gdpr"),
      v.literal("security"),
      v.literal("data_retention"),
      v.literal("audit_logging")
    ),
    status: v.union(
      v.literal("resolved"),
      v.literal("in_progress"),
      v.literal("dismissed")
    ),
    resolution: v.optional(v.string()),
    resolvedBy: v.id("users"),
    resolvedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_issue_id", ["issueId"])
    .index("by_status", ["status"])
    .index("by_type", ["issueType"]),

  // General Compliance Settings
  complianceSettings: defineTable({
    settingId: v.string(),
    settingType: v.union(
      v.literal("gdpr"),
      v.literal("security"),
      v.literal("data_retention"),
      v.literal("audit_logging")
    ),
    dataProcessing: v.optional(v.object({
      lawfulBasis: v.string(),
      dataMinimization: v.boolean(),
      purposeLimitation: v.boolean(),
      storageLimitation: v.boolean(),
      accuracy: v.boolean(),
      security: v.boolean(),
      accountability: v.boolean(),
    })),
    userRights: v.optional(v.object({
      rightToAccess: v.boolean(),
      rightToRectification: v.boolean(),
      rightToErasure: v.boolean(),
      rightToRestrictProcessing: v.boolean(),
      rightToDataPortability: v.boolean(),
      rightToObject: v.boolean(),
      rightsRelatedToAutomatedDecisionMaking: v.boolean(),
    })),
    dataRetention: v.optional(v.object({
      userData: v.string(),
      transactionData: v.string(),
      marketingData: v.string(),
      analyticsData: v.string(),
    })),
    accessControls: v.optional(v.object({
      mfaEnabled: v.boolean(),
      passwordPolicy: v.string(),
      sessionTimeout: v.string(),
      roleBasedAccess: v.boolean(),
    })),
    dataEncryption: v.optional(v.object({
      atRest: v.boolean(),
      inTransit: v.boolean(),
      keyManagement: v.string(),
    })),
    auditLogging: v.optional(v.object({
      enabled: v.boolean(),
      retentionPeriod: v.number(),
      logLevel: v.union(
        v.literal("minimal"),
        v.literal("standard"),
        v.literal("detailed")
      ),
    })),
    isActive: v.boolean(),
    lastModified: v.number(),
    modifiedBy: v.id("users"),
    version: v.number(),
  })
    .index("by_setting_id", ["settingId"])
    .index("by_setting_type", ["settingType"])
    .index("by_active", ["isActive"]),

  // Email Compliance Configurations
  emailCompliance: defineTable({
    complianceId: v.string(),
    gdprEnabled: v.boolean(),
    canSpamEnabled: v.boolean(),
    ccpaEnabled: v.boolean(),
    dataRetention: v.object({
      enabled: v.boolean(),
      period: v.number(),
      autoDelete: v.boolean(),
    }),
    consentManagement: v.object({
      doubleOptIn: v.boolean(),
      consentText: v.string(),
      unsubscribeText: v.string(),
      dataProcessingText: v.string(),
    }),
    auditLogging: v.object({
      enabled: v.boolean(),
      retentionPeriod: v.number(),
      logLevel: v.union(
        v.literal("minimal"),
        v.literal("standard"),
        v.literal("detailed")
      ),
    }),
    lastModified: v.optional(v.number()),
    version: v.optional(v.number()),
  })
    .index("by_compliance_id", ["complianceId"])
    .index("by_gdpr_enabled", ["gdprEnabled"]),

  // Email Queue for Processing
  emailQueue: defineTable({
    templateId: v.string(),
    recipientEmail: v.string(),
    recipientData: v.record(v.string(), v.any()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    scheduledFor: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("sent"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    attempts: v.number(),
    maxAttempts: v.number(),
    lastAttempt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    trackingId: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_scheduled_for", ["scheduledFor"])
    .index("by_template_id", ["templateId"]),

  // Email Analytics Data
  emailAnalyticsData: defineTable({
    emailId: v.string(),
    templateId: v.string(),
    recipientEmail: v.string(),
    eventType: v.union(
      // Email events
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed"),
      // Contact events
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("contact_deleted"),
      // Domain events
      v.literal("domain_created"),
      v.literal("domain_updated"),
      v.literal("domain_deleted")
    ),
    timestamp: v.number(),
    metadata: v.record(v.string(), v.any()),
    deviceInfo: v.optional(
      v.object({
        type: v.string(),
        os: v.string(),
        browser: v.string(),
        client: v.string(),
      })
    ),
    locationInfo: v.optional(
      v.object({
        country: v.string(),
        region: v.string(),
        city: v.string(),
        ipAddress: v.string(),
      })
    ),
  })
    .index("by_email_id", ["emailId"])
    .index("by_template_id", ["templateId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_recipient", ["recipientEmail"]),

  // Email Configuration History
  emailConfigHistory: defineTable({
    configType: v.union(
      v.literal("template"),
      v.literal("automation"),
      v.literal("branding"),
      v.literal("delivery"),
      v.literal("analytics"),
      v.literal("compliance")
    ),
    configId: v.string(),
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("activated"),
      v.literal("deactivated")
    ),
    previousConfig: v.optional(v.any()),
    newConfig: v.optional(v.any()),
    changedBy: v.string(),
    changeReason: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_config_type", ["configType"])
    .index("by_config_id", ["configId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_changed_by", ["changedBy"]),

  // Email Test Results
  emailTestResults: defineTable({
    testId: v.string(),
    templateId: v.string(),
    testType: v.union(
      v.literal("preview"),
      v.literal("validation"),
      v.literal("delivery"),
      v.literal("rendering")
    ),
    testData: v.record(v.string(), v.any()),
    results: v.object({
      success: v.boolean(),
      errors: v.array(v.string()),
      warnings: v.array(v.string()),
      renderTime: v.optional(v.number()),
      validationScore: v.optional(v.number()),
      deliveryStatus: v.optional(v.string()),
    }),
    testedBy: v.string(),
    timestamp: v.number(),
  })
    .index("by_test_id", ["testId"])
    .index("by_template_id", ["templateId"])
    .index("by_test_type", ["testType"])
    .index("by_timestamp", ["timestamp"]),

  // Email Alerts table
  emailAlerts: defineTable({
    type: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    service: v.string(),
    details: v.string(),
    timestamp: v.number(),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_severity", ["severity"])
    .index("by_type", ["type"])
    .index("by_resolved", ["resolved"])
    .index("by_timestamp", ["timestamp"]),

  // Cities table for operating locations
  cities: defineTable({
    name: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("coming_soon")
    ),
    serviceArea: v.optional(v.array(v.string())),
    deliveryFee: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.string()),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_country", ["country"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  // Reports table for analytics reports
  reports: defineTable({
    name: v.string(),
    type: v.string(),
    parameters: v.any(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    createdAt: v.number(),
    generatedAt: v.optional(v.number()),
    downloadUrl: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Chef Reviews table
  chefReviews: defineTable({
    chefId: v.id("chefs"),
    reviewerId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chef", ["chefId"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_status", ["status"]),

  // User Roles table
  userRoles: defineTable({
    name: v.string(),
    description: v.string(),
    permissions: v.array(v.string()),
    isDefault: v.boolean(),
    isSystem: v.boolean(),
    userCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_default", ["isDefault"])
    .index("by_system", ["isSystem"]),

  // Permissions table
  permissions: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  // Email Campaigns table
  emailCampaigns: defineTable({
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("failed")
    ),
    recipientType: v.union(
      v.literal("all"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("converted")
    ),
    recipientCount: v.number(),
    sentCount: v.number(),
    openRate: v.number(),
    clickRate: v.number(),
    scheduledFor: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_recipient_type", ["recipientType"])
    .index("by_created", ["createdAt"]),

  // Blog Posts table (separate from content for specific blog functionality)
  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(), // Rich HTML/JSON from editor
    excerpt: v.string(),
    body: v.optional(v.array(v.string())), // Paragraphs array
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      paragraphs: v.optional(v.array(v.string())),
      bullets: v.optional(v.array(v.string())),
      checklist: v.optional(v.array(v.string())),
      proTips: v.optional(v.array(v.string())),
      callout: v.optional(v.object({
        variant: v.union(v.literal("note"), v.literal("warning"), v.literal("tip")),
        text: v.string()
      })),
      image: v.optional(v.string()),
      imageAlt: v.optional(v.string()),
      video: v.optional(v.string()),
      videoThumbnail: v.optional(v.string())
    }))),
    headings: v.optional(v.array(v.object({
      id: v.string(),
      text: v.string()
    }))),
    author: v.object({
      name: v.string(),
      avatar: v.string()
    }),
    authorName: v.string(), // For indexing purposes (duplicate of author.name)
    categories: v.array(v.string()),
    date: v.string(), // Format: "August 2025"
    coverImage: v.optional(v.string()), // Convex storage URL
    featuredImage: v.optional(v.string()), // Convex storage URL
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    categoryId: v.optional(v.string()),
    tags: v.array(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_author", ["authorName"])
    .index("by_published", ["publishedAt"]),

  // Recipes table (separate from content for specific recipe functionality)
  recipes: defineTable({
    title: v.string(),
    description: v.string(),
    ingredients: v.array(v.object({
      name: v.string(),
      amount: v.string(),
      unit: v.string(),
    })),
    instructions: v.array(v.string()),
    prepTime: v.number(),
    cookTime: v.number(),
    servings: v.number(),
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard")
    ),
    cuisine: v.string(),
    dietary: v.array(v.string()),
    author: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    featuredImage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_cuisine", ["cuisine"])
    .index("by_difficulty", ["difficulty"])
    .index("by_status", ["status"])
    .index("by_author", ["author"]),

  // Static Pages table (separate from content for specific page functionality)
  staticPages: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    author: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    parentPage: v.optional(v.id("staticPages")),
    isHomepage: v.boolean(),
    isContact: v.boolean(),
    isAbout: v.boolean(),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_parent", ["parentPage"])
    .index("by_homepage", ["isHomepage"]),

  // AI Chat Channels table
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_created_by", ["createdBy"])
    .index("by_active", ["isActive"])
    .index("by_last_message", ["lastMessageAt"]),

  // AI Chat Messages table
  aiMessages: defineTable({
    channelId: v.id("channels"),
    authorId: v.optional(v.id("users")), // null for AI messages
    content: v.string(),
    createdAt: v.number(),
    messageType: v.union(
      v.literal("user"),
      v.literal("ai")
    ),
  })
    .index("by_channel", ["channelId"])
    .index("by_author", ["authorId"])
    .index("by_created_at", ["createdAt"]),

  // NOSH HEAVEN VIDEO FEED SYSTEM
  
  // Video Posts table
  videoPosts: defineTable({
    creatorId: v.id("users"), // Must be chef or food creator
    kitchenId: v.optional(v.id("kitchens")), // Kitchen associated with this video
    title: v.string(),
    description: v.optional(v.string()),
    videoStorageId: v.id("_storage"), // Convex storage ID for video
    thumbnailStorageId: v.optional(v.id("_storage")), // Convex storage ID for thumbnail
    duration: v.number(), // Duration in seconds
    fileSize: v.number(), // File size in bytes
    resolution: v.object({
      width: v.number(),
      height: v.number(),
    }),
    tags: v.array(v.string()),
    cuisine: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
      v.literal("flagged"),
      v.literal("removed")
    ),
    visibility: v.union(
      v.literal("public"),
      v.literal("followers"),
      v.literal("private")
    ),
    isLive: v.optional(v.boolean()), // For live cooking sessions
    liveSessionId: v.optional(v.id("liveSessions")),
    // Engagement metrics
    likesCount: v.number(),
    commentsCount: v.number(),
    sharesCount: v.number(),
    viewsCount: v.number(),
    // Timestamps
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_kitchen", ["kitchenId"])
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"])
    .index("by_published", ["publishedAt"])
    .index("by_created", ["createdAt"])
    .index("by_cuisine", ["cuisine"])
    .index("by_tags", ["tags"])
    .index("by_likes", ["likesCount"])
    .index("by_views", ["viewsCount"]),

  // Video Comments table
  videoComments: defineTable({
    videoId: v.id("videoPosts"),
    userId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("videoComments")), // For replies
    likesCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("flagged"),
      v.literal("hidden")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentCommentId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Video Likes table
  videoLikes: defineTable({
    videoId: v.id("videoPosts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"])
    .index("by_video_user", ["videoId", "userId"]),

  // Video Shares table
  videoShares: defineTable({
    videoId: v.id("videoPosts"),
    userId: v.id("users"),
    platform: v.optional(v.union(
      v.literal("internal"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("whatsapp"),
      v.literal("other")
    )),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"])
    .index("by_platform", ["platform"])
    .index("by_created", ["createdAt"]),

  // Video Views table (for detailed analytics)
  videoViews: defineTable({
    videoId: v.id("videoPosts"),
    userId: v.optional(v.id("users")), // null for anonymous views
    sessionId: v.optional(v.string()), // For anonymous tracking
    watchDuration: v.number(), // Duration watched in seconds
    completionRate: v.number(), // Percentage of video watched
    deviceInfo: v.optional(v.object({
      type: v.string(), // mobile, tablet, desktop
      os: v.string(),
      browser: v.string(),
    })),
    location: v.optional(v.object({
      country: v.string(),
      city: v.string(),
    })),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_created", ["createdAt"]),

  // User Follows table
  userFollows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // Video Collections/Playlists table
  videoCollections: defineTable({
    creatorId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    videoIds: v.array(v.id("videoPosts")),
    coverImageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_public", ["isPublic"])
    .index("by_created", ["createdAt"]),

  // Comment Likes table
  commentLikes: defineTable({
    commentId: v.id("videoComments"),
    userId: v.id("users"),
    likedAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_user", ["userId"])
    .index("by_comment_user", ["commentId", "userId"]),

  // User Favorites table
  userFavorites: defineTable({
    userId: v.id("users"),
    favoriteType: v.union(
      v.literal("chef"),
      v.literal("meal"),
      v.literal("video")
    ),
    favoriteId: v.any(), // Can be chef, meal, or video ID (using any since Convex doesn't support union ID types)
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["favoriteType"])
    .index("by_user_type", ["userId", "favoriteType"])
    .index("by_favorite", ["favoriteId"]),

  // Video Reports table
  videoReports: defineTable({
    videoId: v.id("videoPosts"),
    reporterId: v.id("users"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("violence"),
      v.literal("copyright"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewing"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Video Analytics table
  videoAnalytics: defineTable({
    videoId: v.id("videoPosts"),
    date: v.string(), // YYYY-MM-DD format
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    avgWatchTime: v.number(), // Average watch time in seconds
    completionRate: v.number(), // Average completion rate percentage
    engagementRate: v.number(), // (likes + comments + shares) / views
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_date", ["date"])
    .index("by_video_date", ["videoId", "date"]),

  // Video Processing Jobs table
  videoProcessingJobs: defineTable({
    videoId: v.id("videoPosts"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    jobType: v.union(
      v.literal("thumbnail_generation"),
      v.literal("video_compression"),
      v.literal("format_conversion"),
      v.literal("quality_analysis")
    ),
    progress: v.number(), // 0-100
    errorMessage: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_status", ["status"])
    .index("by_job_type", ["jobType"]),

  // Files table for file management
  files: defineTable({
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.id("_storage"),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    status: v.union(
      v.literal("uploading"),
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    metadata: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    isPublic: v.boolean(),
    downloadCount: v.number(),
    lastAccessedAt: v.optional(v.number()),
  })
    .index("by_uploader", ["uploadedBy"])
    .index("by_status", ["status"])
    .index("by_file_type", ["fileType"])
    .index("by_uploaded_at", ["uploadedAt"]),

  // Tax Documents table for payroll
  taxDocuments: defineTable({
    employeeId: v.id("users"),
    documentType: v.union(
      // UK Documents
      v.literal("p60"),
      v.literal("p45"),
      v.literal("p11d"),
      v.literal("self_assessment"),
      v.literal("payslip"),
      // Nigerian Documents
      v.literal("payslip_ng"),
      v.literal("tax_clearance"),
      v.literal("nhf_certificate"),
      v.literal("nhis_certificate"),
      v.literal("pension_certificate")
    ),
    taxYear: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("generated"),
      v.literal("sent"),
      v.literal("downloaded"),
      v.literal("error")
    ),
    fileUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    generatedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    downloadedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_employee", ["employeeId"])
    .index("by_tax_year", ["taxYear"])
    .index("by_status", ["status"])
    .index("by_employee_year", ["employeeId", "taxYear"]),

    // Staff Email Campaigns table
    staffEmailCampaigns: defineTable({
      name: v.string(),
      subject: v.string(),
      content: v.string(),
      status: v.union(
        v.literal("draft"),
        v.literal("sending"),
        v.literal("sent"),
        v.literal("failed")
      ),
      recipientType: v.union(
        v.literal("all_waitlist"),
        v.literal("pending_waitlist"),
        v.literal("approved_waitlist"),
        v.literal("converted_users"),
        v.literal("all_users")
      ),
      recipientCount: v.number(),
      sentCount: v.number(),
      createdAt: v.number(),
      sentAt: v.optional(v.number()),
    })
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"])
      .index("by_recipient_type", ["recipientType"]),

  // Payment Methods table
  paymentMethods: defineTable({
    userId: v.id("users"),
    payment_method_id: v.string(), // Stripe payment method ID or similar
    type: v.union(v.literal("card"), v.literal("apple_pay"), v.literal("google_pay")),
    is_default: v.boolean(),
    last4: v.optional(v.string()),
    brand: v.optional(v.string()), // visa, mastercard, etc.
    exp_month: v.optional(v.number()),
    exp_year: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("expired")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_default", ["userId", "is_default"])
    .index("by_status", ["status"]),

  // Customer Balance table
  customerBalances: defineTable({
    userId: v.id("users"),
    balance: v.number(), // in smallest currency unit (pence/cents)
    currency: v.string(), // GBP, USD, etc.
    is_available: v.boolean(),
    last_updated: v.number(),
  })
    .index("by_user", ["userId"]),

  // Balance Transactions table
  balanceTransactions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("credit"), v.literal("debit")),
    amount: v.number(), // positive for credit, negative for debit
    currency: v.string(),
    description: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    order_id: v.optional(v.id("orders")),
    reference: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"])
    .index("by_status", ["status"])
    .index("by_order", ["order_id"]),

  // Payment Analytics Data table
  paymentAnalyticsData: defineTable({
    paymentId: v.string(), // Stripe payment intent ID or charge ID
    orderId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    eventType: v.union(
      // Payment events
      v.literal("payment_intent.created"),
      v.literal("payment_intent.succeeded"),
      v.literal("payment_intent.payment_failed"),
      v.literal("payment_intent.canceled"),
      v.literal("payment_intent.processing"),
      v.literal("payment_intent.requires_action"),
      // Charge events
      v.literal("charge.succeeded"),
      v.literal("charge.failed"),
      v.literal("charge.refunded"),
      v.literal("charge.dispute.created"),
      v.literal("charge.dispute.closed"),
      // Subscription events
      v.literal("subscription.created"),
      v.literal("subscription.updated"),
      v.literal("subscription.deleted"),
      // Refund events
      v.literal("refund.created"),
      v.literal("refund.succeeded"),
      v.literal("refund.failed"),
    ),
    amount: v.number(), // Amount in smallest currency unit (cents/pence)
    currency: v.string(),
    paymentMethod: v.optional(v.string()), // card, apple_pay, google_pay, etc.
    paymentMethodType: v.optional(v.string()), // visa, mastercard, etc.
    status: v.optional(v.string()),
    failureCode: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    metadata: v.record(v.string(), v.any()),
    timestamp: v.number(),
  })
    .index("by_payment_id", ["paymentId"])
    .index("by_order_id", ["orderId"])
    .index("by_user_id", ["userId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // Family Profiles table
  familyProfiles: defineTable({
    parent_user_id: v.id("users"), // The account owner (parent)
    userId: v.id("users"), // Keep for backward compatibility, maps to parent_user_id
    member_user_ids: v.array(v.id("users")), // Array of user IDs for accepted family members
    family_members: v.array(v.object({
      id: v.string(),
      user_id: v.optional(v.id("users")), // Link to user account (if they have login)
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      relationship: v.string(),
      status: v.union(v.literal("pending_invitation"), v.literal("accepted"), v.literal("declined"), v.literal("removed")),
      invited_at: v.optional(v.number()),
      accepted_at: v.optional(v.number()),
      invitation_token: v.optional(v.string()), // For accepting invitations
      budget_settings: v.optional(v.object({
        daily_limit: v.optional(v.number()),
        weekly_limit: v.optional(v.number()),
        monthly_limit: v.optional(v.number()),
        currency: v.optional(v.string()),
      })),
      allergy_preferences: v.optional(v.array(v.id("allergies"))), // Array of allergy IDs
      dietary_preference_id: v.optional(v.id("dietaryPreferences")), // Reference to dietary preferences
    })),
    settings: v.object({
      shared_payment_methods: v.boolean(),
      shared_orders: v.boolean(),
      allow_child_ordering: v.boolean(),
      require_approval_for_orders: v.boolean(),
      spending_notifications: v.boolean(),
    }),
    shared_payment_methods: v.boolean(), // Keep for backward compatibility
    shared_orders: v.boolean(), // Keep for backward compatibility
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_parent_user", ["parent_user_id"]),

  // Family Member Budgets table
  familyMemberBudgets: defineTable({
    family_profile_id: v.id("familyProfiles"),
    member_user_id: v.id("users"),
    period_start: v.number(), // Timestamp
    period_type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    spent_amount: v.number(),
    limit_amount: v.number(),
    currency: v.string(),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_family_profile", ["family_profile_id"])
    .index("by_member_user", ["member_user_id"])
    .index("by_period", ["family_profile_id", "member_user_id", "period_type", "period_start"]),

  // Family Member Preferences table
  familyMemberPreferences: defineTable({
    family_profile_id: v.id("familyProfiles"),
    member_user_id: v.id("users"),
    allergy_ids: v.array(v.id("allergies")),
    dietary_preference_id: v.optional(v.id("dietaryPreferences")),
    parent_controlled: v.boolean(), // If parent manages preferences
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_family_profile", ["family_profile_id"])
    .index("by_member_user", ["member_user_id"])
    .index("by_family_member", ["family_profile_id", "member_user_id"]),

  // Allergies table
  allergies: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("allergy"), v.literal("intolerance")),
    severity: v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe")),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user", ["userId"]),

  // Dietary Preferences table
  dietaryPreferences: defineTable({
    userId: v.id("users"),
    preferences: v.array(v.string()), // vegetarian, gluten_free, etc.
    religious_requirements: v.array(v.string()), // halal, kosher, etc.
    health_driven: v.array(v.string()), // low_sodium, low_fat, etc.
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // Food Safety Settings table
  foodSafetySettings: defineTable({
    userId: v.id("users"),
    avoid_cross_contamination: v.boolean(),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // Data Sharing Preferences table
  dataSharingPreferences: defineTable({
    userId: v.id("users"),
    analytics_enabled: v.boolean(),
    personalization_enabled: v.boolean(),
    marketing_enabled: v.boolean(),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // Support Cases table
  supportCases: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    message: v.string(),
    category: v.union(
      v.literal("order"),
      v.literal("payment"),
      v.literal("account"),
      v.literal("technical"),
      v.literal("other")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("closed"), v.literal("resolved")),
    order_id: v.optional(v.string()),
    attachments: v.array(v.string()),
    support_reference: v.string(),
    last_message: v.optional(v.string()),
    chat_id: v.optional(v.id("chats")),
    assigned_agent_id: v.optional(v.id("users")),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_reference", ["support_reference"])
    .index("by_chat", ["chat_id"])
    .index("by_agent", ["assigned_agent_id"]),

  // Account Deletions table
  accountDeletions: defineTable({
    userId: v.id("users"),
    deletion_requested_at: v.number(),
    deletion_will_complete_at: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    feedback_options: v.optional(v.array(v.number())),
    completed_at: v.optional(v.number()),
    cancelled_at: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Data Downloads table (GDPR)
  dataDownloads: defineTable({
    userId: v.id("users"),
    download_token: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("expired"),
      v.literal("failed")
    ),
    download_url: v.optional(v.string()),
    expires_at: v.number(),
    requested_at: v.number(),
    completed_at: v.optional(v.number()),
    estimated_completion_time: v.optional(v.number()),
    storage_id: v.optional(v.id("_storage")),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["download_token"])
    .index("by_status", ["status"])
    .index("by_expires", ["expires_at"]),

  // ForkPrint Scores table
  forkPrintScores: defineTable({
    userId: v.id("users"),
    score: v.number(),
    status: v.string(), // level name
    points_to_next: v.number(),
    next_level: v.string(),
    current_level_icon: v.optional(v.string()),
    level_history: v.optional(v.array(v.object({
      level: v.string(),
      unlocked_at: v.string(), // ISO date string
    }))),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // Nosh Points table
  noshPoints: defineTable({
    userId: v.id("users"),
    available_points: v.number(),
    total_points_earned: v.number(),
    total_points_spent: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // Nosh Point Transactions table
  noshPointTransactions: defineTable({
    userId: v.id("users"),
    points: v.number(), // signed (positive for earned, negative for spent)
    type: v.union(v.literal("earned"), v.literal("spent")),
    reason: v.string(),
    order_id: v.optional(v.id("orders")),
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "created_at"]),

  // Meal Logs table
  mealLogs: defineTable({
    userId: v.id("users"),
    order_id: v.optional(v.id("orders")),
    meal_type: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snacks")
    ),
    calories: v.number(),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    meal_id: v.optional(v.id("meals")),
    created_at: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Nutrition Goals table
  nutritionGoals: defineTable({
    userId: v.id("users"),
    daily_goal: v.number(),
    goal_type: v.string(), // e.g., 'daily', 'weekly'
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // User Streaks table
  userStreaks: defineTable({
    userId: v.id("users"),
    current_streak: v.number(),
    best_streak: v.number(),
    streak_start_date: v.optional(v.string()), // ISO date string
    last_activity_date: v.string(), // ISO date string
    updated_at: v.number(),
  })
    .index("by_user", ["userId"]),

  // ForkPrint Level History table
  forkPrintLevelHistory: defineTable({
    userId: v.id("users"),
    level: v.string(),
    unlocked_at: v.number(), // timestamp
  })
    .index("by_user", ["userId"]),

  // Verification Sessions table for 2FA
  verificationSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(), // Temporary token for verification
    expiresAt: v.number(), // Expiry timestamp
    createdAt: v.number(),
    used: v.boolean(), // Prevents reuse
    failedAttempts: v.optional(v.number()), // Track failed attempts for rate limiting
  })
    .index("by_token", ["sessionToken"])
    .index("by_user", ["userId"]),

  // Treats table - Track who treated whom to meals
  treats: defineTable({
    treater_id: v.id("users"), // User who is treating
    treated_user_id: v.optional(v.id("users")), // User being treated (if known)
    order_id: v.optional(v.id("orders")), // Order associated with treat (if applicable)
    treat_token: v.string(), // Unique token for sharing
    status: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    created_at: v.number(),
    claimed_at: v.optional(v.number()),
    expires_at: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional treat information
  })
    .index("by_treater", ["treater_id"])
    .index("by_treated_user", ["treated_user_id"])
    .index("by_token", ["treat_token"])
    .index("by_status", ["status"]),

  // User Connections table - Track manual colleague/friend connections
  user_connections: defineTable({
    user_id: v.id("users"),
    connected_user_id: v.id("users"),
    connection_type: v.union(
      v.literal("colleague"),
      v.literal("friend")
    ),
    company: v.optional(v.string()), // Company name if colleague connection
    status: v.union(
      v.literal("active"),
      v.literal("removed"),
      v.literal("blocked")
    ),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_connected_user", ["connected_user_id"])
    .index("by_user_connected", ["user_id", "connected_user_id"])
    .index("by_type", ["connection_type"])
    .index("by_status", ["status"]),

  // Event Chef Requests table - Track customer requests for event catering
  eventChefRequests: defineTable({
    customer_id: v.id("users"),
    event_date: v.string(),
    number_of_guests: v.number(),
    event_type: v.string(),
    event_location: v.string(),
    phone_number: v.string(),
    email: v.string(),
    dietary_requirements: v.optional(v.string()),
    additional_notes: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("contacted"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  })
    .index("by_customer", ["customer_id"])
    .index("by_status", ["status"])
    .index("by_event_date", ["event_date"]),
});