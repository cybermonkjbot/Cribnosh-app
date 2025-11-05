import { describe, it, expect, beforeEach, vi } from 'vitest'
import { generateUser } from '../utils'
import { buildAuthedRequest } from '../utils'

// Provide a controllable mock for lib/stripe
const mockGetOrCreateCustomer = vi.fn()
const mockPaymentIntentsCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getOrCreateCustomer: mockGetOrCreateCustomer,
  stripe: {
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
  },
}))

describe('Payments Integration - Payment Intent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a payment intent for an authenticated user', async () => {
      const { POST } = await import('@/app/api/payments/create-payment-intent/route')

    const user = generateUser({ roles: ['customer'], email: 'buyer@cribnosh.co.uk' })

    mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_123', email: user.email })
    mockPaymentIntentsCreate.mockResolvedValueOnce({
      id: 'pi_123',
      client_secret: 'pi_123_secret_abc',
      amount: 2500,
      currency: 'gbp',
      status: 'requires_payment_method',
    })

    const request = buildAuthedRequest('http://localhost:3000/api/payments/create-payment-intent', {
      method: 'POST',
      user,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2500, currency: 'gbp' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(typeof data.clientSecret).toBe('string')
    expect(typeof data.paymentIntentId).toBe('string')
  })
})