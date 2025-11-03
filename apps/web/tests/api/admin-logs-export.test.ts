import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

const adminToken = () => createTestJwt({ user_id: 'admin_1', email: 'admin@cribnosh.co.uk', role: 'admin' })
const userToken = () => createTestJwt({ user_id: 'user_1', email: 'user@cribnosh.co.uk', role: 'customer' })

describe('Admin Logs Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Stub external fetches used by the handler
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, status: 200 } as any)) as any
  })

  const sampleLogs = [
    { _id: 'l1', action: 'login', adminId: 'admin_1', timestamp: 1700000000000 },
    { _id: 'l2', action: 'export_logs', adminId: 'admin_1', timestamp: 1700000100000 },
    { _id: 'l3', action: 'login', adminId: 'admin_2', timestamp: 1700000200000 },
  ]

  it('exports JSON by default with filters applied', async () => {
    const { GET } = await import('@/app/api/admin/logs-export/route')
    mockConvexQuery.mockResolvedValueOnce(sampleLogs)
    mockConvexMutation.mockResolvedValueOnce({})

    const url = new URL('http://localhost:3000/api/admin/logs-export')
    url.searchParams.set('action', 'login')
    url.searchParams.set('user', 'admin_1')
    url.searchParams.set('start', '1699999999000')
    url.searchParams.set('end', '1700000150000')

    const req = new NextRequest(url, { headers: { Authorization: `Bearer ${adminToken()}` } })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Content-Disposition')).toContain('logs-export.json')
    const body = await res.json()
    // Only l1 should match login + admin_1 + within range
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(1)
    expect(body[0]._id).toBe('l1')
  })

  it('exports CSV when format=csv', async () => {
    const { GET } = await import('@/app/api/admin/logs-export/route')
    mockConvexQuery.mockResolvedValueOnce(sampleLogs)
    mockConvexMutation.mockResolvedValueOnce({})

    const url = new URL('http://localhost:3000/api/admin/logs-export')
    url.searchParams.set('format', 'csv')
    url.searchParams.set('action', 'login')

    const req = new NextRequest(url, { headers: { Authorization: `Bearer ${adminToken()}` } })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/csv')
    expect(res.headers.get('Content-Disposition')).toContain('logs-export.csv')
    const text = await res.text()
    // header + two rows for action login
    const lines = text.trim().split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })

  it('requires admin role', async () => {
    const { GET } = await import('@/app/api/admin/logs-export/route')
    const req = new NextRequest('http://localhost:3000/api/admin/logs-export', { headers: { Authorization: `Bearer ${userToken()}` } })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('requires auth', async () => {
    const { GET } = await import('@/app/api/admin/logs-export/route')
    const req = new NextRequest('http://localhost:3000/api/admin/logs-export')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})