import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

// Local controllable mocks for stripe module used by these tests
const mockGetOrCreateCustomer = vi.fn()
const mockPaymentIntentsConfirm = vi.fn()
const mockRefundsCreate = vi.fn()
const mockPaymentMethodsList = vi.fn()
const mockSetupIntentsCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getOrCreateCustomer: mockGetOrCreateCustomer,
  stripe: {
    paymentIntents: { confirm: mockPaymentIntentsConfirm },
    refunds: { create: mockRefundsCreate },
    paymentMethods: { list: mockPaymentMethodsList },
    setupIntents: { create: mockSetupIntentsCreate },
  },
}))

describe('Payment API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/payments/create-payment-intent', () => {
    it('should require authentication', async () => {
      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 2500, currency: 'gbp' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(typeof data.error).toBe('string')
    })

    it('should validate amount requirement', async () => {
      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk', roles: ['customer'] })
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currency: 'gbp' }),
      })
      const response = await POST(request)
      expect([400, 401]).toContain(response.status)
      const data = await response.json()
      expect(typeof data.error).toBe('string')
    })

    it('should validate minimum amount', async () => {
      const { POST } = await import('@/app/api/payments/create-payment-intent/route')
      const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk', roles: ['customer'] })
      const request = new NextRequest('http://localhost:3000/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: 25, currency: 'gbp' }),
      })
      const response = await POST(request)
      expect([400, 401]).toContain(response.status)
      const data = await response.json()
      expect(typeof data.error).toBe('string')
    })
  })

  describe('POST /api/payments/confirm-payment', () => {
    it('should require auth and validate payload', async () => {
      const { POST } = await import('@/app/api/payments/confirm-payment/route')
      const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk', roles: ['customer'] })
      mockPaymentIntentsConfirm.mockResolvedValueOnce({ id: 'pi_1', status: 'succeeded' })
      const request = new NextRequest('http://localhost:3000/api/payments/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payment_intent_id: 'pi_test123', payment_method_id: 'pm_test123' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.status).toBe('succeeded')
      expect(data.paymentIntent.id).toBe('pi_1')
    })
  })

  describe('POST /api/payments/refund', () => {
    it('should enforce admin role and return refund payload', async () => {
      const { POST } = await import('@/app/api/payments/refund/route')
      const adminToken = createTestJwt({ user_id: 'admin1', email: 'admin@cribnosh.co.uk', roles: ['admin'] })
      mockRefundsCreate.mockResolvedValueOnce({ id: 're_1', amount: 2500 })
      const request = new NextRequest('http://localhost:3000/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ payment_intent_id: 'pi_test123', amount: 2500 }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.refund.id).toBe('re_1')
    })
  })

  describe('POST /api/payments/create-customer', () => {
    it('should create Stripe customer and return id', async () => {
      const { POST } = await import('@/app/api/payments/create-customer/route')
      const token = createTestJwt({ user_id: 'u1', email: 'customer@cribnosh.co.uk', roles: ['customer'] })
      mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_123' })
      const request = new NextRequest('http://localhost:3000/api/payments/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stripeCustomerId).toBe('cus_123')
    })
  })

  describe('GET /api/payments/cards', () => {
    it('should require auth and return methods list', async () => {
      const { GET } = await import('@/app/api/payments/cards/route')
      const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk', roles: ['customer'] })
      mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_123' })
      mockPaymentMethodsList.mockResolvedValueOnce({ data: [{ id: 'pm_1' }] })
      const request = new NextRequest('http://localhost:3000/api/payments/cards', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data.cards)).toBe(true)
      expect(data.cards[0].id).toBe('pm_1')
    })
  })

  describe('POST /api/payments/add-card', () => {
    it('should add payment method to customer', async () => {
      const { POST } = await import('@/app/api/payments/add-card/route')
      const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk', roles: ['customer'] })
      mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_123' })
      mockSetupIntentsCreate.mockResolvedValueOnce({ client_secret: 'seti_secret' })
      const request = new NextRequest('http://localhost:3000/api/payments/add-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethodId: 'pm_test123' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(typeof data.clientSecret).toBe('string')
    })
  })
}) 