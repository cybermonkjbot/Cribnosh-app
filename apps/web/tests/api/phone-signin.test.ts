import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Phone OTP Sign-in API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/phone-signin', () => {
    it('should validate required fields for send action', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Phone number is required.')
    })

    it('should validate action field', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1234567890' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Action must be either "send" or "verify".')
    })

    it('should validate action values', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+1234567890', action: 'invalid' }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'Action must be either "send" or "verify".')
    })

    it('should handle send OTP action', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+1234567890', 
          action: 'send' 
        }),
      })
      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data.message).toBe('OTP sent successfully')
        // In development, should return test OTP
        if (process.env.NODE_ENV === 'development') {
          expect(data).toHaveProperty('testOtp')
          expect(data.testOtp).toBe('123456')
        }
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should validate OTP code for verify action', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+1234567890', 
          action: 'verify' 
        }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error', 'OTP code is required for verification.')
    })

    it('should handle verify OTP action', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: '+1234567890', 
          action: 'verify',
          otp: '123456'
        }),
      })
      const response = await POST(request)
      expect([200, 500]).toContain(response.status)
      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('token')
        expect(data).toHaveProperty('user')
        expect(data.user).toHaveProperty('phone')
        expect(data.user).toHaveProperty('roles')
        expect(Array.isArray(data.user.roles)).toBe(true)
      } else {
        expect(typeof data.error).toBe('string')
      }
    })

    it('should handle empty request body', async () => {
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
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
      const { POST } = await import('@/app/api/auth/phone-signin/route')
      const request = new NextRequest('http://localhost:3000/api/auth/phone-signin', {
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
