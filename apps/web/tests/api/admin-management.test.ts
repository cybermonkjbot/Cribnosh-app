import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestJwt } from '../utils'

// Provide controllable convex client mocks
const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({
    query: mockConvexQuery,
    mutation: mockConvexMutation,
  }),
}))

describe('Admin Management API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/all', () => {
    it('should retrieve all admin data successfully', async () => {
      const { GET } = await import('@/app/api/admin/all/route')

      // Sequence of 3 queries: users, chefs, orders
      const users = [{ id: 'u1' }, { id: 'u2' }]
      const chefs = [{ id: 'c1' }]
      const orders = [{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }]
      mockConvexQuery
        .mockResolvedValueOnce(users)
        .mockResolvedValueOnce(chefs)
        .mockResolvedValueOnce(orders)

      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', roles: ['admin'] })
      const req = new NextRequest('http://localhost:3000/api/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.usersCount).toBe(users.length)
      expect(data.chefsCount).toBe(chefs.length)
      expect(data.ordersCount).toBe(orders.length)
      expect(Array.isArray(data.users)).toBe(true)
      expect(Array.isArray(data.chefs)).toBe(true)
      expect(Array.isArray(data.orders)).toBe(true)
    }, 20000)

    it('should return 403 for non-admin users', async () => {
      const { GET } = await import('@/app/api/admin/all/route')
      const token = createTestJwt({ user_id: 'user_1', email: 'user@cribnosh.co.uk', roles: ['customer'] })
      const req = new NextRequest('http://localhost:3000/api/admin/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
      const data = await res.json()
      expect(String(data.error)).toContain('Forbidden')
    })
  })

  describe('GET /api/admin/pending', () => {
    it('should retrieve pending items successfully', async () => {
      const { GET } = await import('@/app/api/admin/pending/route')

      const pendingUsers = [{ id: 'u1', status: 'pending' }]
      const allChefs = [{ id: 'c1', status: 'pending' }, { id: 'c2', status: 'approved' }]
      const pendingDishes = [{ id: 'd1' }]
      mockConvexQuery
        .mockResolvedValueOnce(pendingUsers) // users.getUsersByStatus
        .mockResolvedValueOnce(allChefs)     // chefs.getAllChefLocations
        .mockResolvedValueOnce(pendingDishes) // meals.getPending

      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', roles: ['admin'] })
      const req = new NextRequest('http://localhost:3000/api/admin/pending', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.pendingUsers)).toBe(true)
      expect(Array.isArray(data.pendingChefs)).toBe(true)
      expect(Array.isArray(data.pendingDishes)).toBe(true)
      expect(data.pendingUsers.length).toBe(1)
      expect(data.pendingChefs.length).toBe(1)
      expect(data.pendingDishes.length).toBe(1)
    })
  })

  describe('POST /api/admin/realtime-broadcast', () => {
    it('should send real-time broadcast successfully', async () => {
      const { POST } = await import('@/app/api/admin/realtime-broadcast/route')

      // First mutation returns changeId, second is audit log
      mockConvexMutation
        .mockResolvedValueOnce('change_001')
        .mockResolvedValueOnce(undefined)

      // This endpoint checks payload.role === 'admin'
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
      const req = new NextRequest('http://localhost:3000/api/admin/realtime-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event: 'announcement', data: { message: 'System maintenance' } }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.event).toBe('announcement')
      expect(typeof data.changeId).toBe('string')
    })

    it('should validate broadcast message', async () => {
      const { POST } = await import('@/app/api/admin/realtime-broadcast/route')
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
      const req = new NextRequest('http://localhost:3000/api/admin/realtime-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ event: '', data: {} }),
      })
      const res = await POST(req)
      expect(res.status).toBe(422)
      const data = await res.json()
      expect(String(data.error)).toContain('event')
    })
  })

  describe('GET /api/admin/logs-export', () => {
    beforeEach(() => {
      (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}), text: async () => '' })
    })

    it('exports logs as JSON by default with audit log', async () => {
      const { GET } = await import('@/app/api/admin/logs-export/route')
      const logs = [
        { id: 'l1', action: 'login', adminId: 'admin_1', timestamp: 1000 },
        { id: 'l2', action: 'update_user', adminId: 'admin_2', timestamp: 1200 },
      ]
      mockConvexQuery.mockResolvedValueOnce(logs)
      mockConvexMutation.mockResolvedValueOnce({ _id: 'audit1' })
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
      const req = new NextRequest('http://localhost:3000/api/admin/logs-export', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('application/json')
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(mockConvexMutation).toHaveBeenCalled()
      expect((globalThis as any).fetch).toHaveBeenCalled()
      // both webhook calls
      const calls = (globalThis as any).fetch.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2)
      calls.forEach(([url, init]: any) => {
        expect(init.headers.Authorization).toBe(`Bearer ${token}`)
      })
    })

    it('filters by action and user and returns CSV', async () => {
      const { GET } = await import('@/app/api/admin/logs-export/route')
      const logs = [
        { id: 'l1', action: 'login', adminId: 'admin_1', timestamp: 1000 },
        { id: 'l2', action: 'login', adminId: 'admin_2', timestamp: 1200 },
      ]
      mockConvexQuery.mockResolvedValueOnce(logs)
      mockConvexMutation.mockResolvedValueOnce({ _id: 'audit2' })
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
      const req = new NextRequest('http://localhost:3000/api/admin/logs-export?format=csv&action=login&user=admin_1&start=900&end=1100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toContain('text/csv')
      const text = await res.text()
      expect(text.split('\n').length).toBeGreaterThan(1)
    })
  })

  describe('GET /api/admin/[document_id]', () => {
    it('should retrieve specific document successfully', async () => {
      const { GET } = await import('@/app/api/admin/[document_id]/route')
      const document = { _id: 'doc_123', type: 'user_report', title: 'User Activity Report' }
      mockConvexQuery.mockResolvedValueOnce(document)
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', roles: ['admin'] })
      const req = new NextRequest('http://localhost:3000/api/admin/doc_123', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.document._id).toBe('doc_123')
      expect(data.document.title).toBe('User Activity Report')
    })
  })



  describe('GET /api/admin/logs', () => {
    it('paginates admin logs for admin role', async () => {
      const { GET } = await import('@/app/api/admin/logs/route')
      const logs = [
        { id: 'l1', timestamp: 2 },
        { id: 'l2', timestamp: 1 },
      ]
      mockConvexQuery.mockResolvedValueOnce(logs)
      const token = createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
      const req = new NextRequest('http://localhost:3000/api/admin/logs?limit=1&offset=0', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.total).toBe(2)
      expect(data.limit).toBe(1)
      expect(data.logs[0].id).toBe('l1')
    })

    it('returns 403 for non-admin', async () => {
      const { GET } = await import('@/app/api/admin/logs/route')
      const token = createTestJwt({ user_id: 'user_1', email: 'user@cribnosh.co.uk', role: 'customer' })
      const req = new NextRequest('http://localhost:3000/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })
  })
}) 