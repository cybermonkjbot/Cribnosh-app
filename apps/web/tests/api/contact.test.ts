import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock email service and broadcast helper
vi.mock('@/lib/email/email.service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({ send: vi.fn().mockResolvedValue('msg_123') })),
}))
vi.mock('@/lib/email/addToBroadcastList', () => ({ addToBroadcastList: vi.fn().mockResolvedValue(undefined) }))

// Reload module with env available
const reloadContact = async () => await import('@/app/api/contact/route')

describe('Contact API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('OPTIONS returns CORS headers', async () => {
    const { OPTIONS } = await reloadContact()
    const req = new NextRequest('http://localhost:3000/api/contact', { method: 'OPTIONS' })
    const res = await OPTIONS(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })

  it('POST validates input', async () => {
    const { POST } = await reloadContact()
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('POST sends email when configured', async () => {
    process.env.RESEND_API_KEY = 'test'
    const { POST } = await reloadContact()
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', subject: 'Hi', message: 'Hello'
      })
    })
    const res = await POST(req as any)
    expect([200, 202]).toContain(res.status)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})