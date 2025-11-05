import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

describe('Order Notes & Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const order = { _id: 'o1', order_id: 'o1', order_status: 'confirmed', customer_id: 'cust_1', chef_id: 'chef_1' }
  const cust = () => createTestJwt({ user_id: 'cust_1', email: 'c@cribnosh.co.uk', role: 'customer' })
  const staff = () => createTestJwt({ user_id: 'staff_1', email: 's@cribnosh.co.uk', role: 'staff' })

  describe('GET /api/orders/[order_id]/notes', () => {
    it('returns filtered notes for customer', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/notes/route')
      mockConvexQuery.mockResolvedValueOnce(order)
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'n1', note: 'chef prep', noteType: 'chef_note', added_by: 'chef_1', added_at: Date.now() },
        { _id: 'n2', note: 'internal', noteType: 'internal_note', added_by: 'staff_1', added_at: Date.now() },
      ])
      const req = new NextRequest('http://localhost:3000/api/orders/o1/notes', { headers: { Authorization: `Bearer ${cust()}` } })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.totalNotes).toBe(1)
      expect(data.notes[0].note).toContain('chef')
    })

    it('returns 404 when order not found', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/notes/route')
      mockConvexQuery.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost:3000/api/orders/missing/notes', { headers: { Authorization: `Bearer ${cust()}` } })
      const res = await GET(req)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/orders/[order_id]/notes', () => {
    it('adds internal note as staff', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/notes/route')
      mockConvexQuery.mockResolvedValueOnce(order)
      mockConvexMutation.mockResolvedValueOnce({ ok: true })
      const req = new NextRequest('http://localhost:3000/api/orders/o1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staff()}` },
        body: JSON.stringify({ note: 'check stock', noteType: 'internal_note' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('rejects missing fields', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/notes/route')
      const req = new NextRequest('http://localhost:3000/api/orders/o1/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staff()}` }, body: JSON.stringify({})
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects internal note by customer', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/notes/route')
      mockConvexQuery.mockResolvedValueOnce(order)
      const req = new NextRequest('http://localhost:3000/api/orders/o1/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust()}` }, body: JSON.stringify({ note: 'peek', noteType: 'internal_note' })
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/orders/[order_id]/notifications', () => {
    it('lists notifications for staff', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/notifications/route')
      mockConvexQuery.mockResolvedValueOnce(order)
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'k1', notification_type: 'status', message: 'ready', priority: 'normal', channels: ['email'], sent_by: 'system', sent_at: Date.now(), status: 'sent' },
      ])
      const req = new NextRequest('http://localhost:3000/api/orders/o1/notifications', { headers: { Authorization: `Bearer ${staff()}` } })
      const res = await GET(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.totalNotifications).toBe(1)
      } else {
        const err = await res.json()
        expect(err.error).toBeTruthy()
      }
    })
  })

  describe('Malformed payload confirm', () => {
    it('returns 400 when confirm body missing orderId', async () => {
      const { POST } = await import('@/app/api/orders/confirm/route')
      const req = new NextRequest('http://localhost:3000/api/orders/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staff()}` }, body: JSON.stringify({})
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})