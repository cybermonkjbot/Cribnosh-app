import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/email/addToBroadcastList', () => ({ addToBroadcastList: vi.fn().mockResolvedValue(undefined) }))

describe('Submit Form API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('OPTIONS returns CORS headers', async () => {
    const { OPTIONS } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', { method: 'OPTIONS' })
    const res = await OPTIONS(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('validates formType', async () => {
    const { POST } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', { method: 'POST', body: JSON.stringify({}) })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('validates Chef Application fields', async () => {
    const { POST } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', {
      method: 'POST', body: JSON.stringify({ formType: 'Chef Application', email: 'x' })
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('accepts Chef Application', async () => {
    const { POST } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', {
      method: 'POST', body: JSON.stringify({ formType: 'Chef Application', email: 'chef@example.com', fullName: 'Chef Foo' })
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('validates Waitlist fields', async () => {
    const { POST } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', {
      method: 'POST', body: JSON.stringify({ formType: 'Waitlist', email: 'x' })
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('accepts Waitlist', async () => {
    const { POST } = await import('@/app/api/submit-form/route')
    const req = new NextRequest('http://localhost:3000/api/submit-form', {
      method: 'POST', body: JSON.stringify({ formType: 'Waitlist', email: 'wait@example.com', name: 'W Ait' })
    })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})