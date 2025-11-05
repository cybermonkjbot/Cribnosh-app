import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockQuery = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: vi.fn() }),
  api: {
    queries: {
      reviews: { getAll: vi.fn() },
      users: { getAll: vi.fn() },
      timelogs: { getTimelogs: vi.fn() },
    },
  },
}))

describe('Staff & Reviews Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/staff-list returns staff array even on error', async () => {
    const { GET } = await import('@/app/api/staff-list/route')
    // first call throws, route should still return 200 with []
    mockQuery.mockRejectedValueOnce(new Error('convex down'))
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.staff)).toBe(true)
  })

  it('GET /api/staff/clockin-status returns boolean clockedIn', async () => {
    const { GET } = await import('@/app/api/staff/clockin-status/route')
    mockQuery.mockResolvedValueOnce([{ _id: 'log1' }])
    const res = await GET(new NextRequest('http://localhost:3000/api/staff/clockin-status'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.clockedIn).toBe('boolean')
  })

  it('GET /api/reviews/chef/[chef_id] aggregates chef reviews', async () => {
    const { GET } = await import('@/app/api/reviews/chef/[chef_id]/route')
    // getAll reviews, then users.getAll
    mockQuery
      // reviews.getAll
      .mockResolvedValueOnce([
        { _id: 'r1', chef_id: 'chef_1', rating: 4, user_id: 'u1' },
        { _id: 'r2', chef_id: 'chef_1', rating: 2, user_id: 'u2' },
      ])
      // users.getAll
      .mockResolvedValueOnce([
        { _id: 'u1', name: 'John Doe' },
        { _id: 'u2', name: 'Jane Roe' },
      ])
    const res = await GET(new NextRequest('http://localhost:3000/api/reviews/chef/chef_1'), { params: { chef_id: 'chef_1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.chef_id).toBe('chef_1')
    expect(data.total_reviews).toBe(2)
    expect(data.avg_rating).toBeGreaterThan(0)
  })

  it('GET /api/reviews/dish/[dish_id] aggregates dish reviews', async () => {
    const { GET } = await import('@/app/api/reviews/dish/[dish_id]/route')
    mockQuery
      // reviews.getAll
      .mockResolvedValueOnce([
        { _id: 'r1', meal_id: 'dish_1', rating: 5, user_id: 'u1', createdAt: Date.now() },
        { _id: 'r2', meal_id: 'dish_1', rating: 3, user_id: 'u2', createdAt: Date.now() },
      ])
      // users.getAll
      .mockResolvedValueOnce([
        { _id: 'u1', name: 'Alex Smith' },
        { _id: 'u2', name: 'Mary Ann' },
      ])
    const res = await GET(new NextRequest('http://localhost:3000/api/reviews/dish/dish_1'), { params: { dish_id: 'dish_1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.dish_id).toBe('dish_1')
    expect(data.total_reviews).toBe(2)
  })
})

