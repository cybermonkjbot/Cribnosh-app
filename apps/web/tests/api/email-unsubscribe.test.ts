import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

describe('Email Unsubscribe API', () => {
  it('returns 400 when email is missing', async () => {
    const { GET } = await import('@/app/api/email-unsubscribe/route')
    const req = new NextRequest('http://localhost:3000/api/email-unsubscribe')
    const res = await GET(req as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Email is required')
  })

  it('unsubscribes when email is provided via query and mirrors message', async () => {
    const { GET } = await import('@/app/api/email-unsubscribe/route')
    const req = new NextRequest('http://localhost:3000/api/email-unsubscribe?email=test@cribnosh.co.uk')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('test@cribnosh.co.uk')
  })

  it('POST is aliased to GET and behaves the same', async () => {
    const { POST } = await import('@/app/api/email-unsubscribe/route')
    const req = new NextRequest('http://localhost:3000/api/email-unsubscribe?email=user@cribnosh.co.uk', { method: 'POST' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toContain('user@cribnosh.co.uk')
  })
})

