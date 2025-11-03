import { describe, it, expect } from 'vitest'

describe('Docs API', () => {
  it('returns swagger spec JSON with cache headers', async () => {
    const { GET } = await import('@/app/api/docs/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600')
    const data = await res.json()
    expect(data.openapi).toBe('3.0.0')
    expect(data.info?.title).toContain('CribNosh API')
  })
})

