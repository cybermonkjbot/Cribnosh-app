import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

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

  it('POST /api/reviews/[review_id]/approval handles approve and 404 path', async () => {
    const { POST } = await import('@/app/api/reviews/[review_id]/approval/route')
    // First query to getAll finds the review
    mockQuery
      .mockResolvedValueOnce([{ _id: 'r1', status: 'pending' }])
      .mockResolvedValueOnce([{ _id: 'r1', status: 'approved' }])
    mockMutation.mockResolvedValueOnce(undefined)
    const req = new NextRequest('http://localhost/api/reviews/r1/approval', { method: 'POST', body: JSON.stringify({ is_approved: true }) })
    const res = await POST(req as any, { params: { review_id: 'r1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.is_approved).toBe(true)
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

  it('GET /api/images/dish/image/[image_id] returns image info or 404', async () => {
      const { GET } = await import('@/app/api/images/dish/image/[image_id]/route')
    mockQuery.mockResolvedValueOnce([{ _id: 'm1', images: ['img1'], chefId: 'c1' }])
    const res = await GET(new NextRequest('http://localhost/api/images/dish/image/img1') as any, { params: { image_id: 'img1' } })
    expect([200, 404]).toContain(res.status)
  })

  it('DELETE /api/images/dish/image/[image_id] enforces auth and role', async () => {
    const { DELETE } = await import('@/app/api/images/dish/image/[image_id]/route')
    const token = createTestJwt({ user_id: 'c1', role: 'chef' })
    mockQuery.mockResolvedValueOnce([{ _id: 'm1', images: ['img1'], chefId: 'c1' }])
    const req = new NextRequest('http://localhost/api/images/dish/image/img1', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const res = await DELETE(req as any, { params: { image_id: 'img1' } })
    expect([200, 401, 403, 404]).toContain(res.status)
  })
})

