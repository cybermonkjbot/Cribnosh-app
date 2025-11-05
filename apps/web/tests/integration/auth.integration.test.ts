import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { scryptSync, randomBytes } from 'crypto'
import { generateUser } from '../utils'

// Mock convex client with a shared query mock reference
const mockConvexQuery = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({
    query: mockConvexQuery,
  }),
}))

describe('Auth Integration - Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs in successfully with correct password (scrypt + salt)', async () => {
    const { POST } = await import('@/app/api/auth/login/route')

    // Arrange: create a user with a salted scrypt hash
    const testUser = generateUser({ roles: ['customer'], email: 'test@cribnosh.co.uk', name: 'Test User' })
    const password = 'StrongPassw0rd!'

    const salt = randomBytes(16).toString('hex')
    const hashHex = scryptSync(password, salt, 64).toString('hex')
    const storedPassword = `${salt}:${hashHex}`

    mockConvexQuery.mockResolvedValueOnce({
      _id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      password: storedPassword,
      roles: testUser.roles,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password }),
    })

    // Act
    const response = await POST(request)

    // Assert
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.user.email).toBe(testUser.email)
    expect(Array.isArray(data.user.roles)).toBe(true)
    expect(typeof data.token).toBe('string')
  })

  it('returns 401 for wrong password even if user exists', async () => {
    const { POST } = await import('@/app/api/auth/login/route')

    const testUser = generateUser({ roles: ['customer'], email: 'test@cribnosh.co.uk' })
    const correctPassword = 'Correct123!'
    const wrongPassword = 'Wrong123!'

    const salt = randomBytes(16).toString('hex')
    const hashHex = scryptSync(correctPassword, salt, 64).toString('hex')
    const storedPassword = `${salt}:${hashHex}`

    mockConvexQuery.mockResolvedValueOnce({
      _id: testUser.id,
      email: testUser.email,
      name: 'Test User',
      password: storedPassword,
      roles: testUser.roles,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: wrongPassword }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Invalid credentials')
  })
})