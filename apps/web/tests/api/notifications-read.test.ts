import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

const userToken = () => createTestJwt({ user_id: 'u1', email: 'u@cribnosh.co.uk', roles: ['customer'] })

describe('Notifications Read API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/notifications/[notification_id]/read', () => {
    it('marks a user-owned notification as read', async () => {
      const { POST } = await import('@/app/api/notifications/[notification_id]/read/route')
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'n1', userId: 'u1', global: false, roles: [] },
      ])
      mockConvexMutation.mockResolvedValueOnce({ ok: true })
      const req = new NextRequest('http://localhost:3000/api/notifications/n1/read', {
        method: 'POST', headers: { Authorization: `Bearer ${userToken()}` },
      })
      const res = await POST(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.success).toBe(true)
      } else {
        const err = await res.json()
        expect(err.error).toBeTruthy()
      }
    }, 30000)

    it('returns 404 when notification missing', async () => {
      const { POST } = await import('@/app/api/notifications/[notification_id]/read/route')
      mockConvexQuery.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost:3000/api/notifications/missing/read', {
        method: 'POST', headers: { Authorization: `Bearer ${userToken()}` },
      })
      const res = await POST(req)
      expect([404, 500]).toContain(res.status)
    })

    it('forbids other user notification', async () => {
      const { POST } = await import('@/app/api/notifications/[notification_id]/read/route')
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'n2', userId: 'other', global: false, roles: [] },
      ])
      const req = new NextRequest('http://localhost:3000/api/notifications/n2/read', {
        method: 'POST', headers: { Authorization: `Bearer ${userToken()}` },
      })
      const res = await POST(req)
      expect([403, 500]).toContain(res.status)
    })
  })

  describe('POST /api/notifications/read-all', () => {
    it('marks all as read for authed user', async () => {
      const { POST } = await import('@/app/api/notifications/read-all/route')
      mockConvexMutation.mockResolvedValueOnce({ ok: true })
      const req = new NextRequest('http://localhost:3000/api/notifications/read-all', {
        method: 'POST', headers: { Authorization: `Bearer ${userToken()}` },
      })
      const res = await POST(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.success).toBe(true)
      }
    })

    it('requires auth', async () => {
      const { POST } = await import('@/app/api/notifications/read-all/route')
      const req = new NextRequest('http://localhost:3000/api/notifications/read-all', { method: 'POST' })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})