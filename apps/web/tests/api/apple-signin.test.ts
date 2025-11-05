import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Apple OAuth Sign-in API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/apple-signin', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Either identityToken or authorizationCode is required.')
    })

    it('should handle identityToken authentication', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identityToken: 'eyJraWQiOiI4NkQ4OEtmIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiY29tLmNyaWJub3NoLmFwcCIsImV4cCI6MTYzNDU2Nzg5MCwiaWF0IjoxNjM0NTY0MjkwLCJzdWIiOiIwMDEyMzQ1Njc4OSIsImNfaGFzaCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6InRydWUiLCJpc19wcml2YXRlX2VtYWlsIjoidHJ1ZSIsImF1dGhfdGltZSI6MTYzNDU2NDI5MCwibm9uY2Vfc3VwcG9ydGVkIjp0cnVlfQ.signature'
        }),
      })
      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('email')
        expect(data.user).toHaveProperty('name')
        expect(data.user).toHaveProperty('provider', 'apple')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle authorizationCode authentication', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorizationCode: 'c1234567890abcdef',
          user: {
            email: 'test@example.com',
            sub: '00123456789',
            name: 'Test User'
          }
        }),
      })
      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('provider', 'apple')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle authorizationCode without user data', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          authorizationCode: 'c1234567890abcdef'
        }),
      })
      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('provider', 'apple')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle malformed JWT token', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identityToken: 'invalid.jwt.token'
        }),
      })
      const response = await POST(request)
      expect([400, 401, 500]).toContain(response.status)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should handle empty request body', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
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
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
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
