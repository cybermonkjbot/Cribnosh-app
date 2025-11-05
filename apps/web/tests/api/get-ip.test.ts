import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'

describe('GET /api/get-ip', () => {
  it('returns ip from x-real-ip header', async () => {
    const { GET } = await import('@/app/api/get-ip/route')
    const req = new NextRequest('http://localhost:3000/api/get-ip', { headers: { 'x-real-ip': '203.0.113.10' } })
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ip).toBe('203.0.113.10')
  })

  it('returns empty string if header missing', async () => {
    const { GET } = await import('@/app/api/get-ip/route')
    const req = new NextRequest('http://localhost:3000/api/get-ip')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ip).toBe('')
  })
})