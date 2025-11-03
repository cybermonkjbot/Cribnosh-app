import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Health API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 status and health message', async () => {
    const { GET } = await import('@/app/api/health/route')
    const mockRequest = new Request('http://localhost:3000/api/health') as any
    const response = await GET(mockRequest)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('environment')
    expect(data).toHaveProperty('services')
    expect(data).toHaveProperty('api')
    expect(data).toHaveProperty('system')
    expect(data.services).toHaveProperty('email')
    expect(data.services).toHaveProperty('redis')
    expect(data.services).toHaveProperty('monitoring')
    expect(data.services).toHaveProperty('convex')
    expect(data.api).toHaveProperty('status')
    expect(data.api).toHaveProperty('metrics')
    expect(data.api).toHaveProperty('uptime')
    expect(data.api).toHaveProperty('errorRate')
    expect(data.system).toHaveProperty('memory')
    expect(data.system).toHaveProperty('uptime')
    expect(data.system).toHaveProperty('nodeVersion')
  }, 30000)

  it('should include proper headers in response', async () => {
    const { GET } = await import('@/app/api/health/route')
    const mockRequest = new Request('http://localhost:3000/api/health') as any
    const response = await GET(mockRequest)
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate')
    expect(response.headers.get('X-Health-Check')).toBe('true')
  })

  it('should return valid JSON structure', async () => {
    const { GET } = await import('@/app/api/health/route')
    const mockRequest = new Request('http://localhost:3000/api/health') as any
    const response = await GET(mockRequest)
    const data = await response.json()
    expect(typeof data.timestamp).toBe('string')
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status)
    expect(typeof data.version).toBe('string')
    expect(typeof data.environment).toBe('string')
    expect(typeof data.services).toBe('object')
    expect(typeof data.api).toBe('object')
    expect(typeof data.system).toBe('object')
  })
}) 