import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

// Control stripe list and getOrCreateCustomer
const mockList = vi.fn()
const mockGetOrCreateCustomer = vi.fn()
vi.mock('@/lib/stripe', () => ({
  getOrCreateCustomer: mockGetOrCreateCustomer,
  stripe: {
    paymentIntents: { list: mockList },
  },
}))

const mockQuery = vi.fn()
const mockMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: mockMutation }),
  getApiFunction: () => 'mutations/analytics.saveAnalyticsEvent',
}))

describe('Payments History & Analytics Event', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/payments/history requires auth', async () => {
    const { GET } = await import('@/app/api/payments/history/route')
    const res = await GET(new NextRequest('http://localhost:3000/api/payments/history') as any)
    expect(res.status).toBe(401)
  })

  it('GET /api/payments/history returns list for authed user', async () => {
    const { GET } = await import('@/app/api/payments/history/route')
    const token = createTestJwt({ user_id: 'u1', email: 'buyer@cribnosh.co.uk' })
    mockGetOrCreateCustomer.mockResolvedValueOnce({ id: 'cus_123' })
    mockList.mockResolvedValueOnce({ data: [{ id: 'pi_1' }, { id: 'pi_2' }] })
    const req = new NextRequest('http://localhost:3000/api/payments/history', { headers: { Authorization: `Bearer ${token}` } })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.payments)).toBe(true)
  })

  it('POST /api/analytics/event stores events in batches', async () => {
    const { POST } = await import('@/app/api/analytics/event/route')
    mockMutation.mockResolvedValue(undefined)
    const events = Array.from({ length: 7 }, (_, i) => ({ type: 'click', page: '/p', x: i, y: i }))
    const req = new NextRequest('http://localhost:3000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})

