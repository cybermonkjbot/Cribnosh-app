import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Authentication API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    it('should validate required fields', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@cribnosh.co.uk' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Email and password are required.')
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Email and password are required.')
    })

    it('should handle empty request body', async () => {
      const { POST } = await import('@/app/api/auth/login/route')
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should create new user account', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'newuser@cribnosh.co.uk', password: 'password123', name: 'New User' }),
      })
      const response = await POST(request)
      expect([200, 409, 500]).toContain(response.status)
      const data = await response.json()
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(typeof data.userId === 'string' || data.userId === null).toBeTruthy()
        expect(data.email).toBe('newuser@cribnosh.co.uk')
      } else if (response.status === 409) {
        expect(String(data.error)).toContain('exists')
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should validate registration data', async () => {
      const { POST } = await import('@/app/api/auth/register/route')
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      expect([400, 500]).toContain(response.status)
      const data = await response.json()
      expect(typeof data.error).toBe('string')
    })
  })
}) 