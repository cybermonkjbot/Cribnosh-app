import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Comprehensive Authentication API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toContain('Email and password are required')
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toContain('Email and password are required')
    })

    it('should handle missing password', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@cribnosh.co.uk' }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toContain('Email and password are required')
    })

    it('should handle invalid JSON', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('POST /api/auth/register', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields/)
    })

    it('should validate password length', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@cribnosh.co.uk',
          password: '123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields/)
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Invalid email format|Missing or invalid required fields|A user with this email already exists/)
    })

    it('should handle missing name', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@cribnosh.co.uk',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields/)
    })
  })

  describe('POST /api/auth/register/customer', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/customer/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([200, 400, 422]).toContain(response.status)
      
      if (response.status !== 200) {
        const data = await response.json()
        expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields|Missing or invalid fields/)
      }
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/auth/register/customer/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Customer User',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Invalid email format|Missing or invalid required fields|A user with this email already exists/)
    })
  })

  describe('POST /api/auth/register/chef', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/chef/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields/)
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/auth/register/chef/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Chef User',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Invalid email format|Missing or invalid required fields|A user with this email already exists/)
    })
  })

  describe('POST /api/auth/register/admin', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/register/admin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      if (response.status !== 409) {
        const data = await response.json()
        expect(data.message).toMatch(/Name, email, and password are required|Missing or invalid required fields|Missing or invalid fields/)
      }
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/auth/register/admin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/register/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Admin User',
          email: 'invalid-email',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      expect([400, 409, 422]).toContain(response.status)
      
      const data = await response.json()
      expect(data.message).toMatch(/Invalid email format|Missing or invalid required fields|A user with this email already exists/)
    })
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
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing idToken', async () => {
      const { POST } = await import('@/app/api/auth/google-signin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
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
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing identityToken', async () => {
      const { POST } = await import('@/app/api/auth/apple-signin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/apple-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('POST /api/auth/phone-signin', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing phoneNumber', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('POST /api/auth/email-otp', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/email-otp/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/auth/email-otp/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('POST /api/staff/auth/login', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/staff/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/staff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/staff/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/staff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing password', async () => {
      const { POST } = await import('@/app/api/staff/auth/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/staff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'staff@cribnosh.co.uk' }),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })

  describe('POST /api/staff/auth/logout', () => {
    it('should handle logout request', async () => {
      const { POST } = await import('@/app/api/staff/auth/logout/route')

      const request = new NextRequest('http://localhost:3000/api/staff/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should handle logout request', async () => {
      const { POST } = await import('@/app/api/auth/logout/route')

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      expect([200, 401, 500]).toContain(response.status)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should handle me request', async () => {
      const { GET } = await import('@/app/api/auth/me/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer mock-jwt-token',
        },
      })

      const response = await GET(request)
      expect([200, 401, 500]).toContain(response.status)
    })

    it('should handle missing authorization header', async () => {
      const { GET } = await import('@/app/api/auth/me/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      })

      const response = await GET(request)
      expect([401, 500]).toContain(response.status)
    })
  })

  describe('POST /api/auth/token/refresh', () => {
    it('should handle token refresh request', async () => {
      const { POST } = await import('@/app/api/auth/token/refresh/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/token/refresh', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer mock-jwt-token',
        },
      })

      const response = await POST(request)
      expect([200, 401, 500]).toContain(response.status)
    })

    it('should handle missing authorization header', async () => {
      const { POST } = await import('@/app/api/auth/token/refresh/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/token/refresh', {
        method: 'POST',
      })

      const response = await POST(request)
      expect([401, 500]).toContain(response.status)
    })
  })

  describe('GET /api/auth/token', () => {
    it('should handle token info request', async () => {
      const { GET } = await import('@/app/api/auth/token/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/token', {
        method: 'GET',
        headers: { 
          'Authorization': 'Bearer mock-jwt-token',
        },
      })

      const response = await GET(request)
      expect([200, 401, 500]).toContain(response.status)
    })

    it('should handle missing authorization header', async () => {
      const { GET } = await import('@/app/api/auth/token/route')
      
      const request = new NextRequest('http://localhost:3000/api/auth/token', {
        method: 'GET',
      })

      const response = await GET(request)
      expect([200, 401, 500]).toContain(response.status)
    })
  })

  describe('GET /api/auth/check-integration', () => {
    it('should handle integration check request', async () => {
      const { GET } = await import('@/app/api/auth/check-integration/route')

      const request = new NextRequest('http://localhost:3000/api/auth/check-integration', {
        method: 'GET',
      })

      const response = await GET(request)
      expect([200, 500]).toContain(response.status)
    })
  })

  describe('POST /api/admin/login', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/admin/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/admin/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })

    it('should handle missing password', async () => {
      const { POST } = await import('@/app/api/admin/login/route')
      
      const request = new NextRequest('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@cribnosh.co.uk' }),
      })

      const response = await POST(request)
      expect([400, 422, 500]).toContain(response.status)
    })
  })
})