import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: () => new Map(),
  cookies: () => new Map(),
}))

// Mock external dependencies
vi.mock('@/lib/auth', () => ({
  authenticateUser: vi.fn(),
  createSession: vi.fn(),
  createUser: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}))

// Mock Stripe
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    paymentMethods: {
      create: vi.fn(),
      attach: vi.fn(),
      detach: vi.fn(),
      list: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}))

// Global test timeout
vi.setConfig({ testTimeout: 10000 })

// Mock fetch for API testing (must return a Promise for callers using .catch/.then)
global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
process.env.NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Mock health endpoint dependencies
vi.mock('@/lib/monitoring/monitoring.service', () => ({
  MonitoringService: {
    getInstance: vi.fn(() => ({
      logInfo: vi.fn(),
      logError: vi.fn(),
      incrementMetric: vi.fn(),
    })),
  },
}))

vi.mock('@/lib/email/email.service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    getTemplateRenderer: vi.fn(() => ({
      renderGenericNotificationEmail: vi.fn().mockResolvedValue('<html></html>'),
    })),
    send: vi.fn().mockResolvedValue({ id: 'email_1' }),
  })),
}))


vi.mock('@/lib/api/monitoring', () => ({
  apiMonitoring: {
    getHealthData: vi.fn(() => ({
      status: 'healthy',
      metrics: { requests: 100, errors: 0 },
      uptime: 3600,
      errorRate: 0,
    })),
  },
}))

vi.mock('@/lib/conxed-client', () => {
  const query = vi.fn().mockResolvedValue([])
  const mutation = vi.fn().mockResolvedValue(undefined)
  const action = vi.fn().mockResolvedValue(undefined)
  const api = {
    queries: {
      users: {
        getAllUsers: vi.fn(),
        getUserByEmail: vi.fn(),
        getUsersByStatus: vi.fn(),
        getStripeCustomerId: vi.fn(),
        getById: vi.fn(),
        getAll: vi.fn(),
        getAllStaff: vi.fn(),
        getUserByNameOrEmail: vi.fn(),
      },
      staff: {
        getStaffAssignmentByUser: vi.fn(),
        getActiveStaffNotices: vi.fn(),
      },
      timelogs: {
        getTimelogs: vi.fn(),
      },
      reviews: {
        getAll: vi.fn(),
      },
      liveSessions: {
        getLiveOrdersForChef: vi.fn(),
      },
      waitlist: {
        getAll: vi.fn(),
      },
      meals: {
        getAll: vi.fn(),
        getPending: vi.fn(),
      },
    },
    mutations: {
      timelogs: { createTimelog: vi.fn() },
      users: { updateSubscriptionStatus: vi.fn() },
      orders: { markPaid: vi.fn(), markRefunded: vi.fn(), createOrder: vi.fn(), updateStatus: vi.fn() },
      notifications: { create: vi.fn() },
      waitlist: { addToWaitlist: vi.fn(), deleteWaitlistEntry: vi.fn() },
      documents: { generateUploadUrl: vi.fn(), uploadDocument: vi.fn() },
      meals: { updateMeal: vi.fn() },
    },
    actions: {
      users: { loginAndCreateSession: vi.fn() },
    },
  }
  return {
    getConvexClient: vi.fn().mockReturnValue({ query, mutation, action }),
    getApiFunction: vi.fn().mockImplementation((ns: string, name: string) => `${ns}.${name}`),
    api,
  }
})

vi.mock('@/convex/_generated/api', () => ({
  api: {
    queries: {
      users: {
        getAllUsers: vi.fn(),
        getUserByEmail: vi.fn(),
        getUsersByStatus: vi.fn(),
        getStripeCustomerId: vi.fn(),
        getById: vi.fn(),
        getAll: vi.fn(),
        getAllStaff: vi.fn(),
        getUserByNameOrEmail: vi.fn(),
      },
      staff: {
        getStaffAssignmentByUser: vi.fn(),
        getActiveStaffNotices: vi.fn(),
      },
      timelogs: {
        getTimelogs: vi.fn(),
      },
      reviews: {
        getAll: vi.fn(),
      },
      chefs: {
        getAllChefLocations: vi.fn(),
        listAllCuisines: vi.fn(),
      },
      meals: {
        getPending: vi.fn(),
        getAll: vi.fn(),
      },
      custom_orders: {
        getAllOrders: vi.fn(),
        getAll: vi.fn(),
      },
      waitlist: {
        getAll: vi.fn(),
      },
      drivers: {
        getAll: vi.fn(),
      },
      documents: {
        getById: vi.fn(),
      },
      adminLogs: {
        getAll: vi.fn(),
      },
      notifications: {
        getAll: vi.fn(),
      },
      liveSessions: {
        getLiveSessionById: vi.fn(),
        getLiveComments: vi.fn(),
        getLiveReactions: vi.fn(),
        getLiveOrdersForChef: vi.fn(),
      },
      orders: {
        listByCustomer: vi.fn(),
        getById: vi.fn(),
        getUserCart: vi.fn(),
      },
    },
    mutations: {
      changes: {
        insert: vi.fn(),
      },
      admin: {
        insertAdminLog: vi.fn(),
      },
      users: {
        setStripeCustomerId: vi.fn(),
        create: vi.fn(),
        updateSubscriptionStatus: vi.fn(),
      },
      chefs: {
        updateCuisine: vi.fn(),
      },
      emotionsEngine: {
        logEmotionsEngineInteraction: vi.fn(),
      },
      liveSessions: {
        sendLiveComment: vi.fn(),
        sendLiveReaction: vi.fn(),
      },
      orders: {
        createOrder: vi.fn(),
        updateStatus: vi.fn(),
        markPaid: vi.fn(),
        markRefunded: vi.fn(),
      },
      notifications: {
        create: vi.fn(),
      },
      waitlist: {
        addToWaitlist: vi.fn(),
        deleteWaitlistEntry: vi.fn(),
      },
      documents: { generateUploadUrl: vi.fn(), uploadDocument: vi.fn() },
      meals: { updateMeal: vi.fn() },
      timelogs: {
        createTimelog: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/api/error-handler', () => ({
  withErrorHandling: vi.fn((handler) => handler),
  apiErrorHandler: {
    createErrorResponse: (code: string, message: string, status = 400) => new Response(JSON.stringify({ error: message, code }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
    createSuccessResponse: (data: any, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  },
}))

vi.mock('@/lib/api/middleware', () => ({
  withAPIMiddleware: vi.fn((handler) => handler),
}))

// Swagger config is heavy; provide a light mock for docs route
vi.mock('@/lib/swagger/config', () => ({
  swaggerSpec: { openapi: '3.0.0', info: { title: 'CribNosh API' } },
}))

// Mock auth session helper used by some staff endpoints
vi.mock('@/lib/auth/session', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ _id: 'staff_1', email: 's1@cribnosh.co.uk', roles: ['staff'] }),
  getUserFromCookies: vi.fn().mockResolvedValue({ _id: 'staff_1', email: 's1@cribnosh.co.uk', roles: ['staff'] }),
}))

// Monitoring service used by monitoring endpoints
vi.mock('@/lib/monitoring/monitor', () => ({
  monitoringService: {
    getPerformanceMetrics: vi.fn().mockResolvedValue({
      cpu: { avg: 10 },
      memory: { usedMb: 100 },
      requests: { perSecond: 5 },
    }),
    recordMetric: vi.fn().mockResolvedValue(undefined),
    recordMetrics: vi.fn().mockResolvedValue(undefined),
    recordBusinessMetrics: vi.fn().mockResolvedValue(undefined),
    recordAPIMetric: vi.fn().mockResolvedValue(undefined),
    getSystemHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      uptime: 123,
      version: '1.0.0',
    }),
    recordSystemHealth: vi.fn().mockResolvedValue(undefined),
    getAlertRules: vi.fn().mockResolvedValue([{ id: 'r1', metric: 'cpu', threshold: 80, condition: 'gt' }]),
    getActiveAlerts: vi.fn().mockResolvedValue([{ id: 'a1', message: 'High CPU' }]),
    addAlertRule: vi.fn().mockResolvedValue(undefined),
    updateAlertRule: vi.fn().mockResolvedValue(undefined),
    deleteAlertRule: vi.fn().mockResolvedValue(undefined),
    resolveAlert: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mattermost service used by waitlist route
vi.mock('@/lib/mattermost', () => ({
  mattermostService: {
    notifyWaitlistSignup: vi.fn().mockResolvedValue(true),
  },
}))

// Convex browser client
vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({})),
}))

// MinIO client for image endpoints
vi.mock('@/lib/minio', () => ({
  default: {
    statObject: vi.fn().mockResolvedValue({ metaData: { 'content-type': 'image/jpeg' }, lastModified: new Date() }),
    removeObject: vi.fn().mockResolvedValue(undefined),
  },
  MINIO_BUCKET: 'bucket',
}))


// Mock Stripe dependencies for payment tests
vi.mock('@/lib/stripe', () => ({
  getOrCreateCustomer: vi.fn(),
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
      list: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    paymentMethods: {
      create: vi.fn(),
      attach: vi.fn(),
      detach: vi.fn(),
      list: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    setupIntents: {
      create: vi.fn(),
    },
  },
})) 