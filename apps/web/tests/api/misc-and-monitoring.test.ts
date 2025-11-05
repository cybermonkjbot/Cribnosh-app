import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Misc & Monitoring Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api returns welcome JSON', async () => {
    const { GET } = await import('@/app/api/route')
    const res = await GET(new NextRequest('http://localhost:3000/api') as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.message).toContain('CribNosh API')
  })

  it('GET /api/csrf sets csrf cookie and returns token', async () => {
    const { GET } = await import('@/app/api/csrf/route')
    const res = await GET(new NextRequest('http://localhost:3000/api/csrf') as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.csrfToken).toBe('string')
    expect(res.cookies.get('csrf_token')).toBeDefined()
  })

  it('GET /api/ai-docs returns AI docs JSON with headers', async () => {
    const { GET } = await import('@/app/api/ai-docs/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600')
    const data = await res.json()
    expect(data.service?.name).toBe('CribNosh')
    expect(data.authentication?.type).toBe('Bearer')
  })

  it('GET /api/analytics/heatmap validates page param', async () => {
    const { GET } = await import('@/app/api/analytics/heatmap/route')
    const resBad = await GET(new NextRequest('http://localhost:3000/api/analytics/heatmap') as any)
    expect(resBad.status).toBe(400)
    const resOk = await GET(new NextRequest('http://localhost:3000/api/analytics/heatmap?page=/home') as any)
    expect(resOk.status).toBe(200)
    const data = await resOk.json()
    expect(data).toHaveProperty('data')
  })

  it('GET /api/monitoring/metrics returns summary or specific metric', async () => {
    const { GET } = await import('@/app/api/monitoring/metrics/route')
    const resSummary = await GET(new NextRequest('http://localhost:3000/api/monitoring/metrics') as any)
    expect(resSummary.status).toBe(200)
    const summary = await resSummary.json()
    expect(summary.status).toBe('success')
    const resSpecific = await GET(new NextRequest('http://localhost:3000/api/monitoring/metrics?metric=cpu') as any)
    expect(resSpecific.status).toBe(200)
    const specific = await resSpecific.json()
    expect(specific.data.metric).toBe('cpu')
  })

  it('POST /api/monitoring/metrics handles invalid action', async () => {
    const { POST } = await import('@/app/api/monitoring/metrics/route')
    const req = new NextRequest('http://localhost:3000/api/monitoring/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nope' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('GET /api/monitoring/health returns basic or detailed', async () => {
    const { GET } = await import('@/app/api/monitoring/health/route')
    const resBasic = await GET(new NextRequest('http://localhost:3000/api/monitoring/health') as any)
    expect(resBasic.status).toBe(200)
    const basic = await resBasic.json()
    expect(basic).toHaveProperty('status')
    const resDetailed = await GET(new NextRequest('http://localhost:3000/api/monitoring/health?detailed=true') as any)
    expect(resDetailed.status).toBe(200)
    const detailed = await resDetailed.json()
    expect(detailed.status).toBe('success')
  })

  it('GET /api/monitoring/alerts returns alerts or rules', async () => {
    const { GET } = await import('@/app/api/monitoring/alerts/route')
    const resAlerts = await GET(new NextRequest('http://localhost:3000/api/monitoring/alerts') as any)
    expect(resAlerts.status).toBe(200)
    const alerts = await resAlerts.json()
    expect(alerts.status).toBe('success')
    const resRules = await GET(new NextRequest('http://localhost:3000/api/monitoring/alerts?type=rules') as any)
    expect(resRules.status).toBe(200)
    const rules = await resRules.json()
    expect(rules.status).toBe('success')
  })
})

