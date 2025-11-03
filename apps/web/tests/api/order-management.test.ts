import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

// Add local convex mock for this file
const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

// Stripe mock for cancel refunds
const mockRefundsCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: { refunds: { create: mockRefundsCreate } },
}))

const chefToken = () => createTestJwt({ user_id: 'chef_1', email: 'chef@cribnosh.co.uk', role: 'chef' })
const staffToken = () => createTestJwt({ user_id: 'staff_1', email: 'staff@cribnosh.co.uk', role: 'staff' })
const customerToken = () => createTestJwt({ user_id: 'cust_1', email: 'cust@cribnosh.co.uk', role: 'customer' })

describe('Order Management API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/orders/ready', () => {
    it('marks order as ready when in preparing and by chef', async () => {
      const { POST } = await import('@/app/api/orders/ready/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o1', order_id: 'o1', order_status: 'preparing', chef_id: 'chef_1', chef_notes: 'note' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o1', order_status: 'ready' })
      const req = new NextRequest('http://localhost:3000/api/orders/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chefToken()}` },
        body: JSON.stringify({ orderId: 'o1', readyNotes: 'Packed' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.order.status).toBe('ready')
    })
  })

  describe('POST /api/orders/confirm', () => {
    it('confirms pending order by chef', async () => {
      const { POST } = await import('@/app/api/orders/confirm/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o2', order_id: 'o2', order_status: 'pending', chef_id: 'chef_1', estimated_prep_time_minutes: 20, chef_notes: '' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o2', order_status: 'confirmed' })
      const req = new NextRequest('http://localhost:3000/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chefToken()}` },
        body: JSON.stringify({ orderId: 'o2', estimatedPrepTime: 25 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.order.status).toBe('confirmed')
    })
  })

  describe('POST /api/orders/prepare', () => {
    it('starts preparation for confirmed order by staff', async () => {
      const { POST } = await import('@/app/api/orders/prepare/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o3', order_id: 'o3', order_status: 'confirmed', chef_id: 'chef_1', chef_notes: '' , estimated_prep_time_minutes: 15 })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o3', order_status: 'preparing' })
      const req = new NextRequest('http://localhost:3000/api/orders/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` },
        body: JSON.stringify({ orderId: 'o3', prepNotes: 'Start prep', updatedPrepTime: 18 }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.order.status).toBe('preparing')
    }, 30000)
  })

  describe('POST /api/orders/deliver', () => {
    it('marks order as delivered from ready', async () => {
      const { POST } = await import('@/app/api/orders/deliver/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o4', order_id: 'o4', order_status: 'ready' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o4', order_status: 'delivered' })
      const req = new NextRequest('http://localhost:3000/api/orders/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` },
        body: JSON.stringify({ orderId: 'o4', deliveryNotes: 'Left at door' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.order.status).toBe('delivered')
      expect(data.order.isRefundable).toBe(true)
    }, 30000)
  })

  describe('POST /api/orders/complete', () => {
    it('marks order as completed after delivered', async () => {
      const { POST } = await import('@/app/api/orders/complete/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o5', order_id: 'o5', order_status: 'delivered' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o5', order_status: 'completed' })
      const req = new NextRequest('http://localhost:3000/api/orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` },
        body: JSON.stringify({ orderId: 'o5', completionNotes: 'Enjoy!' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.order.status).toBe('completed')
    }, 30000)
  })

  describe('POST /api/orders/cancel', () => {
    it('cancels order with auto refund for paid order', async () => {
      const { POST } = await import('@/app/api/orders/cancel/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o6', order_id: 'o6', order_status: 'confirmed', customer_id: 'cust_1', payment_status: 'paid', amount_paid: 2500, refund_id: null, total_amount: 25, payment_id: 'pi_1' })
      mockRefundsCreate.mockResolvedValueOnce({ id: 're_1', status: 'succeeded', reason: 'requested_by_customer', created: Date.now() / 1000 })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o6', order_status: 'cancelled', refund_id: 're_1' })
      const req = new NextRequest('http://localhost:3000/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({ orderId: 'o6', reason: 'customer_request' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.order.status).toBe('cancelled')
      expect(data.refund?.id).toBe('re_1')
    }, 30000)
  })

  describe('POST /api/orders/review', () => {
    it('reviews a delivered order by customer', async () => {
      const { POST } = await import('@/app/api/orders/review/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o7', order_id: 'o7', order_status: 'delivered', customer_id: 'cust_1' })
      mockConvexMutation.mockResolvedValueOnce({ _id: 'o7' })
      const req = new NextRequest('http://localhost:3000/api/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` },
        body: JSON.stringify({ orderId: 'o7', reviewNotes: 'Great!' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.order.id).toBe('o7')
    }, 30000)
  })

  describe('Negative paths for lifecycle', () => {
    it('confirm: 403 when chef does not own order', async () => {
      const { POST } = await import('@/app/api/orders/confirm/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'oX', order_id: 'oX', order_status: 'pending', chef_id: 'other_chef', estimated_prep_time_minutes: 10, chef_notes: '' })
      const req = new NextRequest('http://localhost:3000/api/orders/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chefToken()}` }, body: JSON.stringify({ orderId: 'oX' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('prepare: 400 when status not confirmed', async () => {
      const { POST } = await import('@/app/api/orders/prepare/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'oY', order_id: 'oY', order_status: 'pending', chef_id: 'chef_1' })
      const req = new NextRequest('http://localhost:3000/api/orders/prepare', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` }, body: JSON.stringify({ orderId: 'oY' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('ready: 404 for non-existent order', async () => {
      const { POST } = await import('@/app/api/orders/ready/route')
      mockConvexQuery.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost:3000/api/orders/ready', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chefToken()}` }, body: JSON.stringify({ orderId: 'missing' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })

  describe('Auth/role guards for lifecycle', () => {
    it('confirm: 401 without Authorization header', async () => {
      const { POST } = await import('@/app/api/orders/confirm/route')
      const req = new NextRequest('http://localhost:3000/api/orders/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('prepare: 403 when role not allowed', async () => {
      const { POST } = await import('@/app/api/orders/prepare/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o1', order_id: 'o1', order_status: 'confirmed', chef_id: 'chef_1' })
      const token = createTestJwt({ user_id: 'u1', email: 'u@cribnosh.co.uk', role: 'customer' })
      const req = new NextRequest('http://localhost:3000/api/orders/prepare', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('ready: 401 invalid token', async () => {
      const { POST } = await import('@/app/api/orders/ready/route')
      const req = new NextRequest('http://localhost:3000/api/orders/ready', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalid' }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('deliver: 403 when role not allowed', async () => {
      const { POST } = await import('@/app/api/orders/deliver/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o1', order_id: 'o1', order_status: 'confirmed', chef_id: 'chef_1' })
      const token = createTestJwt({ user_id: 'u1', email: 'u@cribnosh.co.uk', role: 'customer' })
      const req = new NextRequest('http://localhost:3000/api/orders/deliver', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('complete: 401 without token', async () => {
      const { POST } = await import('@/app/api/orders/complete/route')
      const req = new NextRequest('http://localhost:3000/api/orders/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('review: 403 when role not allowed', async () => {
      const { POST } = await import('@/app/api/orders/review/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o1', order_id: 'o1', order_status: 'delivered', customer_id: 'cust_1' })
      const token = createTestJwt({ user_id: 'u1', email: 'u@cribnosh.co.uk', role: 'driver' })
      const req = new NextRequest('http://localhost:3000/api/orders/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: 'o1' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })
  })
}) 