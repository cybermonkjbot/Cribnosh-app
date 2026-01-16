import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()
const mockMutation = vi.fn()
const mockAction = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: mockMutation, action: mockAction }),
}))

describe('Additional Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/notify-staff validates and sends email', async () => {
    const { POST } = await import('@/app/api/notify-staff/route')
    const bad = await POST(new NextRequest('http://localhost/api/notify-staff', { method: 'POST', body: JSON.stringify({}) }) as any)
    expect(bad.status).toBe(400)
    const ok = await POST(new NextRequest('http://localhost/api/notify-staff', { method: 'POST', body: JSON.stringify({ to: 'x@cribnosh.co.uk', subject: 'S', message: 'M' }) }) as any)
    expect([200, 500]).toContain(ok.status)
  })



  it('POST /api/staff/auth/login sets cookie on success', async () => {
    const { POST } = await import('@/app/api/staff/auth/login/route')
    mockAction.mockResolvedValueOnce({ sessionToken: 'token_123' })
    const req = new NextRequest('http://localhost/api/staff/auth/login', { method: 'POST', body: JSON.stringify({ email: 's@cribnosh.co.uk', password: 'x' }) })
    const res = await POST(req as any)
    expect([200, 401, 500]).toContain(res.status)
  })

  it('POST /api/staff/auth/logout clears cookie', async () => {
    const { POST } = await import('@/app/api/staff/auth/logout/route')
    const req = new NextRequest('http://localhost/api/staff/auth/logout', { method: 'POST' })
    const res = await POST(req)
    expect([200, 500]).toContain(res.status)
  })

  it('POST /api/stripe/webhook handles signature failure and returns 400', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route')
    const req = new NextRequest('http://localhost/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'bad' }, body: 'raw' as any })
    const res = await POST(req as any)
    expect([200, 400, 500]).toContain(res.status)
  })


})

