import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockQuery = vi.fn()
const mockMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: mockMutation }),
}))

describe('Metrics Export API', () => {
  const adminToken = () => createTestJwt({ user_id: 'admin_1', roles: ['admin'], email: 'a@cribnosh.co.uk' })
  const userToken = () => createTestJwt({ user_id: 'user_1', roles: ['customer'], email: 'u@cribnosh.co.uk' })

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any) = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })

  it('requires auth header', async () => {
    const { GET } = await import('@/app/api/metrics-export/route')
    const req = new NextRequest('http://localhost:3000/api/metrics-export')
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('forbids non-admin', async () => {
    const { GET } = await import('@/app/api/metrics-export/route')
    const req = new NextRequest('http://localhost:3000/api/metrics-export', { headers: { Authorization: `Bearer ${userToken()}` } })
    const res = await GET(req as any)
    expect(res.status).toBe(403)
  })

  it('returns JSON by default and audits export', async () => {
    const { GET } = await import('@/app/api/metrics-export/route')
    mockQuery
      .mockResolvedValueOnce([{}, {}]) // users
      .mockResolvedValueOnce([{}]) // reviews
      .mockResolvedValueOnce([]) // custom orders
      .mockResolvedValueOnce([{}, {}, {}]) // waitlist
      .mockResolvedValueOnce([{}]) // drivers
    mockMutation.mockResolvedValueOnce(undefined) // insertAdminLog

    const req = new NextRequest('http://localhost:3000/api/metrics-export', { headers: { Authorization: `Bearer ${adminToken()}` } })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Content-Disposition')).toContain('metrics-export.json')
    const data = await res.json()
    expect(data.totalUsers).toBe(2)
    expect(data.totalWaitlist).toBe(3)
    expect(mockMutation).toHaveBeenCalled()
    expect((global.fetch as any)).toHaveBeenCalledTimes(2)
  })

  it('returns CSV when format=csv', async () => {
    const { GET } = await import('@/app/api/metrics-export/route')
    mockQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockMutation.mockResolvedValueOnce(undefined)

    const req = new NextRequest('http://localhost:3000/api/metrics-export?format=csv', { headers: { Authorization: `Bearer ${adminToken()}` } })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('metrics-export.csv')
    const text = await res.text()
    expect(text.split('\n')[0]).toContain('totalUsers')
  })
})

