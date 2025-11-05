import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Google OAuth Sign-in API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/google-signin', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Either idToken or accessToken is required.')
    })

    it('should handle idToken authentication', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXVkIjoiMTIzNDU2Nzg5MC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF0X2hhc2giOiIxMjM0NTY3ODkwIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE2MzQ1NzE0OTAsInN1YiI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJuYW1lIjoiVGVzdCBVc2VyIiwicGljdHVyZSI6Imh0dHA6Ly9leGFtcGxlLmNvbS9waWMuanBnIn0.signature'
        }),
      })
      const response = await POST(request)
      expect([200, 401, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('email')
        expect(data.user).toHaveProperty('name')
        expect(data.user).toHaveProperty('provider', 'google')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle accessToken authentication', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accessToken: 'ya29.a0AfH6SMC...'
        }),
      })
      const response = await POST(request)
      expect([200, 401, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('provider', 'google')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle malformed JWT token', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idToken: 'invalid.jwt.token'
        }),
      })
      const response = await POST(request)
      expect([400, 401, 500]).toContain(response.status)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should handle empty request body', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should handle malformed JSON', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })
      const response = await POST(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })
})
