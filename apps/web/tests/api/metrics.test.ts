import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Use local spies to control convex query returns
const mockQuery = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery }),
}))

describe('Metrics API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates counts from convex queries and returns uptime/timestamp', async () => {
    const { GET } = await import('@/app/api/metrics/route')
    // Order of calls inside route: users, reviews, customOrders, waitlist, drivers
    mockQuery
      .mockResolvedValueOnce([{}, {}, {}]) // users
      .mockResolvedValueOnce([{}]) // reviews
      .mockResolvedValueOnce([{}, {}]) // custom orders
      .mockResolvedValueOnce([{}]) // waitlist
      .mockResolvedValueOnce([]) // drivers

    const req = new NextRequest('http://localhost:3000/api/metrics')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalUsers).toBe(3)
    expect(data.totalReviews).toBe(1)
    expect(data.totalCustomOrders).toBe(2)
    expect(data.totalWaitlist).toBe(1)
    expect(data.totalDrivers).toBe(0)
    expect(typeof data.uptime).toBe('number')
    expect(typeof data.timestamp).toBe('string')
  })
})

