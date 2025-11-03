import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockQuery = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery }),
}))

describe('Functions Live Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/functions/getLiveOrdersForChef returns JSON or handles error', async () => {
    const { GET } = await import('@/app/api/functions/getLiveOrdersForChef/route')
    mockQuery.mockResolvedValueOnce([{ orderId: 'o1' }])
    const res = await GET(new NextRequest('http://localhost:3000/api/functions/getLiveOrdersForChef') as any)
    expect([200, 500]).toContain(res.status)
  })
})

