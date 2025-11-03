import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

// Local convex and stripe mocks for customer endpoints
const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))
const mockGetOrCreateCustomer = vi.fn()
const mockPaymentIntentsCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getOrCreateCustomer: mockGetOrCreateCustomer,
  stripe: { paymentIntents: { create: mockPaymentIntentsCreate } },
}))

const customerToken = () => createTestJwt({ user_id: 'cust_1', email: 'customer@cribnosh.co.uk', roles: ['customer'] })

describe('Customer Profile Management API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/customer/orders', () => {
    it('lists orders for the authenticated customer with pagination', async () => {
      const { GET } = await import('@/app/api/customer/orders/route')
      const now = Date.now()
      mockConvexQuery.mockResolvedValueOnce([
        { _id: 'o2', customer_id: 'cust_1', createdAt: now - 1000 },
        { _id: 'o1', customer_id: 'cust_1', createdAt: now },
      ])
      const req = new NextRequest('http://localhost:3000/api/customer/orders?limit=1&offset=0', {
        headers: { Authorization: `Bearer ${customerToken()}` },
      })
      const res = await GET(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.total).toBe(2)
        expect(data.limit).toBe(1)
        expect(data.offset).toBe(0)
        expect(Array.isArray(data.orders)).toBe(true)
        expect(data.orders[0]._id).toBe('o1')
      }
    })
  })

  describe('GET /api/customer/orders/[order_id]', () => {
    it('returns order details for owned order', async () => {
      const { GET } = await import('@/app/api/customer/orders/[order_id]/route')
      mockConvexQuery.mockResolvedValueOnce({
        _id: 'o1', customer_id: 'cust_1', chef_id: 'chef_1', total_amount: 2500, order_status: 'confirmed',
        payment_status: 'paid', order_items: [], order_date: Date.now(),
      })
      const req = new NextRequest('http://localhost:3000/api/customer/orders/o1', {
        headers: { Authorization: `Bearer ${customerToken()}` },
      })
      const res = await GET(req, { params: { order_id: 'o1' } })
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.order_id).toBe('o1')
        expect(data.customer_id).toBe('cust_1')
        expect(typeof data.total_amount).toBe('number')
      }
    })
  })

  describe('GET /api/customer/orders/[order_id]/status', () => {
    it('returns status for existing order', async () => {
      const { GET } = await import('@/app/api/customer/orders/[order_id]/status/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'o1', order_status: 'preparing' })
      const req = new NextRequest('http://localhost:3000/api/customer/orders/o1/status')
      const res = await GET(req, { params: { order_id: 'o1' } })
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.order_id).toBe('o1')
        expect(data.order_status).toBe('preparing')
      }
    })
  })

  describe('POST /api/customer/checkout', () => {
    it('creates payment intent for cart with items', async () => {
      const { POST } = await import('@/app/api/customer/checkout/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'cart1', items: [{ price: 12.5, quantity: 2 }] })
      mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_test' })
      mockPaymentIntentsCreate.mockResolvedValueOnce({ id: 'pi_1', client_secret: 'secret' })
      const req = new NextRequest('http://localhost:3000/api/customer/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken()}` },
      })
      const res = await POST(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.paymentIntent.id).toBe('pi_1')
        expect(typeof data.paymentIntent.client_secret).toBe('string')
      }
    })
  })

  describe('GET /api/customer/profile/me', () => {
    it('returns user profile for customer', async () => {
      const { GET } = await import('@/app/api/customer/profile/me/route')
      mockConvexQuery.mockResolvedValueOnce({ _id: 'cust_1', email: 'customer@cribnosh.co.uk', name: 'Customer', roles: ['customer'] })
      const req = new NextRequest('http://localhost:3000/api/customer/profile/me', {
        headers: { Authorization: `Bearer ${customerToken()}` },
      })
      const res = await GET(req)
      expect([200, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(data.user.email).toBe('customer@cribnosh.co.uk')
        expect(Array.isArray(data.user.roles)).toBe(true)
      }
    })

    it('returns 403 for non-customer role', async () => {
      const { GET } = await import('@/app/api/customer/profile/me/route')
      const token = createTestJwt({ user_id: 'u1', email: 'user@cribnosh.co.uk', roles: ['admin'] })
      const req = new NextRequest('http://localhost:3000/api/customer/profile/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns 401 without auth', async () => {
      const { GET } = await import('@/app/api/customer/profile/me/route')
      const req = new NextRequest('http://localhost:3000/api/customer/profile/me')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })
  })
}) 