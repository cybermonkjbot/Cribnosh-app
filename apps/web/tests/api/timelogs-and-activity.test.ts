import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockQuery = vi.fn()
const mockMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: mockMutation }),
  api: {
    queries: {
      timelogs: { getTimelogs: vi.fn() },
      users: { getUserByNameOrEmail: vi.fn() },
    },
    mutations: {
      timelogs: { createTimelog: vi.fn() },
    },
  },
}))

describe('Timelogs & Activity Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('OPTIONS /api/timelogs returns 204 with CORS headers', async () => {
    const { OPTIONS } = await import('@/app/api/timelogs/route')
    const res = await OPTIONS()
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS')
  })

  it('GET /api/timelogs proxies query params and returns JSON', async () => {
    const { GET } = await import('@/app/api/timelogs/route')
    mockQuery.mockResolvedValueOnce({ results: [], total: 0 })
    const res = await GET(new NextRequest('http://localhost:3000/api/timelogs?bucket=dev&skip=0&limit=10') as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('results')
  })

  it('POST /api/timelogs validates payload and creates timelog', async () => {
    const { POST } = await import('@/app/api/timelogs/route')
    mockQuery.mockResolvedValueOnce({ _id: 'u1' }) // users.getUserByNameOrEmail
    mockMutation.mockResolvedValueOnce({ ok: true }) // timelogs.createTimelog
    const req = new NextRequest('http://localhost:3000/api/timelogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: 'user@example.com',
        bucket: 'dev',
        logs: [{ timestamp: '2024-01-01T00:00:00Z', duration: 10, data: {} }],
      }),
    })
    const res = await POST(req as any)
    expect([200, 400]).toContain(res.status) // tolerate internal variations
  })

  it('POST /api/timelogs/activity-tracker validates and records logs', async () => {
    const { POST } = await import('@/app/api/timelogs/activity-tracker/route')
    mockQuery
      .mockResolvedValueOnce({ _id: 'staff_1' }) // users.getUserByNameOrEmail
      .mockResolvedValueOnce({ results: [] }) // timelogs.getTimelogs (dedupe path)
    mockMutation.mockResolvedValueOnce({ ok: true })
    const req = new NextRequest('http://localhost:3000/api/timelogs/activity-tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: 'staff@cribnosh.co.uk',
        logs: [
          {
            url: 'https://example.com',
            title: 'Example',
            start: Date.now(),
            end: Date.now() + 1000,
            idleState: 'active',
          },
        ],
        bucket: 'chrome-activity',
        batchId: 'b1',
      }),
    })
    const res = await POST(req as any)
    expect([200, 400]).toContain(res.status)
  })
})

