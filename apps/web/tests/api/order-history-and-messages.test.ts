import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

describe('Order History & Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const order = { _id: 'o1', order_id: 'o1', order_status: 'confirmed', customer_id: 'cust_1', chef_id: 'chef_1' }
  const cust = () => createTestJwt({ user_id: 'cust_1', email: 'c@cribnosh.co.uk', role: 'customer' })
  const chef = () => createTestJwt({ user_id: 'chef_1', email: 'chef@cribnosh.co.uk', role: 'chef' })

  describe('GET /api/orders/[order_id]/history', () => {
    it('returns history for authorized customer', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/history/route')
      mockConvexQuery.mockResolvedValueOnce(order)
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'h1', action: 'created', description: 'Order created', performed_by: 'cust_1', performed_at: Date.now() - 1000 },
      ])
      const req = new NextRequest('http://localhost:3000/api/orders/o1/history', {
        headers: { Authorization: `Bearer ${cust()}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.orderId).toBe('o1')
      expect(data.totalEntries).toBe(1)
    })

    it('returns 403 when customer requests different user order', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/history/route')
      mockConvexQuery.mockResolvedValueOnce({ ...order, customer_id: 'other' })
      const req = new NextRequest('http://localhost:3000/api/orders/o1/history', {
        headers: { Authorization: `Bearer ${cust()}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns 401 without auth', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/history/route')
      const req = new NextRequest('http://localhost:3000/api/orders/o1/history')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/orders/[order_id]/messages', () => {
    it('lists messages for authorized chef', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/messages/route')
      const order = { _id: 'o1', customer_id: 'cust_1', chef_id: 'chef_1', order_status: 'confirmed' }
      mockConvexQuery.mockResolvedValueOnce(order)
      mockConvexQuery.mockResolvedValueOnce([{ _id: 'm1', message: 'Hi', sent_at: Date.now(), sender_id: 'cust_1' }])
      const req = new NextRequest('http://localhost:3000/api/orders/o1/messages', {
        headers: { Authorization: `Bearer ${chef()}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.totalMessages).toBe(1)
    }, 30000)

    it('returns 404 when order missing', async () => {
      const { GET } = await import('@/app/api/orders/[order_id]/messages/route')
      mockConvexQuery.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost:3000/api/orders/missing/messages', {
        headers: { Authorization: `Bearer ${chef()}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/orders/[order_id]/messages', () => {
    it('sends a message for authorized customer when status deliverable', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/messages/route')
      mockConvexQuery.mockResolvedValueOnce({ ...order, order_status: 'confirmed' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'm2' })
      const req = new NextRequest('http://localhost:3000/api/orders/o1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust()}` },
        body: JSON.stringify({ message: 'ping', messageType: 'text' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('rejects sending message on completed order', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/messages/route')
      mockConvexQuery.mockResolvedValueOnce({ ...order, order_status: 'completed' })
      const req = new NextRequest('http://localhost:3000/api/orders/o1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust()}` },
        body: JSON.stringify({ message: 'ping', messageType: 'text' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 401 without token', async () => {
      const { POST } = await import('@/app/api/orders/[order_id]/messages/route')
      const req = new NextRequest('http://localhost:3000/api/orders/o1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'ping', messageType: 'text' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})