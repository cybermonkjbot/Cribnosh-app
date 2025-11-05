import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({ query: mockConvexQuery, mutation: mockConvexMutation }),
}))

const staffToken = () => createTestJwt({ user_id: 'staff_1', email: 's@cribnosh.co.uk', role: 'staff' })
const chefToken = () => createTestJwt({ user_id: 'chef_1', email: 'chef@cribnosh.co.uk', role: 'chef' })
const customerToken = () => createTestJwt({ user_id: 'cust_1', email: 'cust@cribnosh.co.uk', role: 'customer' })

const baseOrder = { _id: 'o1', order_id: 'o1', order_status: 'confirmed', customer_id: 'cust_1', chef_id: 'chef_1' }

describe('Order Notify API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends notification by staff with default message', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    mockConvexQuery.mockResolvedValueOnce(baseOrder)
    mockConvexMutation.mockResolvedValueOnce({ _id: 'not1' })
    const req = new NextRequest('http://localhost:3000/api/orders/o1/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` },
      body: JSON.stringify({ notificationType: 'order_ready', priority: 'high', channels: ['in_app'] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.notification.type).toBe('order_ready')
  }, 30000)

  it('rejects missing required fields', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    const req = new NextRequest('http://localhost:3000/api/orders/o1/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` }, body: JSON.stringify({})
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when order not found', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    mockConvexQuery.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost:3000/api/orders/missing/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken()}` }, body: JSON.stringify({ notificationType: 'order_updated', priority: 'low', channels: ['in_app'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('forbids chef notifying order not theirs', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    mockConvexQuery.mockResolvedValueOnce({ ...baseOrder, chef_id: 'other_chef' })
    const req = new NextRequest('http://localhost:3000/api/orders/o1/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chefToken()}` }, body: JSON.stringify({ notificationType: 'order_updated', priority: 'low', channels: ['in_app'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejects customer role', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    mockConvexQuery.mockResolvedValueOnce(baseOrder)
    const req = new NextRequest('http://localhost:3000/api/orders/o1/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken()}` }, body: JSON.stringify({ notificationType: 'order_updated', priority: 'low', channels: ['in_app'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('requires auth header', async () => {
    const { POST } = await import('@/app/api/orders/[order_id]/notify/route')
    const req = new NextRequest('http://localhost:3000/api/orders/o1/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationType: 'order_updated', priority: 'low', channels: ['in_app'] })
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})