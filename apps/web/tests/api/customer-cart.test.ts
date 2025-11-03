import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const mockQuery = vi.fn()
const mockMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockQuery, mutation: mockMutation }),
  api: {
    queries: {
      orders: { getUserCart: vi.fn() },
    },
  },
}))

describe('Customer Cart Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/customer/cart should work with valid customer token', async () => {
    const { GET } = await import('@/app/api/customer/cart/route')
    
    // Create a valid JWT token with customer role
    const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret'
    const customerToken = jwt.sign(
      { 
        user_id: 'customer123', 
        roles: ['customer'] 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    )
    
    // Mock successful cart query
    mockQuery.mockResolvedValueOnce([
      {
        _id: 'cart_item_1',
        dish_id: 'dish_123',
        quantity: 2,
        price: 15.99,
        name: 'Test Dish',
        chef_id: 'chef_123',
        added_at: Date.now()
      }
    ])
    
    const request = new NextRequest('http://localhost:3000/api/customer/cart', {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    })
    
    const response = await GET(request)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data.cart)).toBe(true)
  })

  it('GET /api/customer/cart should reject non-customer tokens', async () => {
    const { GET } = await import('@/app/api/customer/cart/route')
    
    // Create a JWT token with admin role instead of customer
    const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret'
    const adminToken = jwt.sign(
      { 
        user_id: 'admin123', 
        roles: ['admin'] 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    )
    
    const request = new NextRequest('http://localhost:3000/api/customer/cart', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    
    const response = await GET(request)
    expect(response.status).toBe(403)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('Only customers can access their cart')
  })

  it('GET /api/customer/cart should reject tokens without roles', async () => {
    const { GET } = await import('@/app/api/customer/cart/route')
    
    // Create a JWT token without roles
    const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret'
    const tokenWithoutRoles = jwt.sign(
      { 
        user_id: 'user123'
        // No roles field
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    )
    
    const request = new NextRequest('http://localhost:3000/api/customer/cart', {
      headers: {
        'Authorization': `Bearer ${tokenWithoutRoles}`
      }
    })
    
    const response = await GET(request)
    expect(response.status).toBe(403)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('Only customers can access their cart')
  })

  it('GET /api/customer/cart should reject invalid tokens', async () => {
    const { GET } = await import('@/app/api/customer/cart/route')
    
    const request = new NextRequest('http://localhost:3000/api/customer/cart', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    })
    
    const response = await GET(request)
    expect(response.status).toBe(401)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid or expired token')
  })

  it('GET /api/customer/cart should reject requests without authorization header', async () => {
    const { GET } = await import('@/app/api/customer/cart/route')
    
    const request = new NextRequest('http://localhost:3000/api/customer/cart')
    
    const response = await GET(request)
    expect(response.status).toBe(401)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toContain('Missing or invalid Authorization header')
  })
})
