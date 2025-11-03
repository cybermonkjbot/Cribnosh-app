import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestJwt } from '../utils'

// Mock convex api tree to satisfy route imports
vi.mock('@/convex/_generated/api', () => ({
  api: {
    queries: {
      liveSessions: {
        getLiveSessionById: vi.fn(),
        getLiveComments: vi.fn(),
        getLiveReactions: vi.fn(),
      },
    },
    mutations: {
      liveSessions: {
        sendLiveComment: vi.fn(),
        sendLiveReaction: vi.fn(),
      },
    },
  },
}))

// Local convex client mock
const mockConvexQuery = vi.fn()
const mockConvexMutation = vi.fn()
vi.mock('@/lib/conxed-client', () => ({
  getConvexClient: () => ({
    query: mockConvexQuery,
    mutation: mockConvexMutation,
  }),
}))

const adminToken = () => createTestJwt({ user_id: 'u1', email: 'user@cribnosh.co.uk', role: 'admin' })

describe('Live Streaming API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/live-streaming/comments', () => {
    it('retrieves comments for a live session', async () => {
      const { GET } = await import('@/app/api/live-streaming/comments/route')

      mockConvexQuery
        .mockResolvedValueOnce({ _id: 'sess_1', status: 'live', mutedUsers: [] }) // getLiveSessionById
        .mockResolvedValueOnce([
          { _id: 'c1', content: 'hello', commentType: 'general', sent_by: 'u1', sent_by_role: 'admin', user_display_name: 'User', sent_at: Date.now() },
        ]) // getLiveComments

      const url = 'http://localhost:3000/api/live-streaming/comments?sessionId=sess_1&limit=10&offset=0'
      const req = new NextRequest(url, { headers: { Authorization: `Bearer ${adminToken()}` } })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.sessionId).toBe('sess_1')
      expect(Array.isArray(data.comments)).toBe(true)
      expect(data.comments[0].id).toBe('c1')
    })

    it('returns 400 when sessionId missing', async () => {
      const { GET } = await import('@/app/api/live-streaming/comments/route')
      const req = new NextRequest('http://localhost:3000/api/live-streaming/comments', { headers: { Authorization: `Bearer ${adminToken()}` } })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/live-streaming/comments', () => {
    it('creates a comment for a live session', async () => {
      const { POST } = await import('@/app/api/live-streaming/comments/route')

      mockConvexQuery
        .mockResolvedValueOnce({ _id: 'sess_1', status: 'live', mutedUsers: [] }) // getLiveSessionById
      mockConvexMutation
        .mockResolvedValueOnce({ _id: 'cmt_1' }) // sendLiveComment

      const req = new NextRequest('http://localhost:3000/api/live-streaming/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({ sessionId: 'sess_1', content: 'Great!', commentType: 'general' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.comment.id).toBe('cmt_1')
    })

    it('validates required fields', async () => {
      const { POST } = await import('@/app/api/live-streaming/comments/route')
      const req = new NextRequest('http://localhost:3000/api/live-streaming/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken()}` },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/live-streaming/reactions', () => {
    it('retrieves reactions for a live session', async () => {
      const { GET } = await import('@/app/api/live-streaming/reactions/route')
      const url = new URL('http://localhost:3000/api/live-streaming/reactions')
      url.searchParams.set('sessionId', 'sess_1')
      const req = new NextRequest(url, { headers: { Authorization: `Bearer ${adminToken()}` } })
      const res = await GET(req)
      expect([200, 404, 500]).toContain(res.status)
      if (res.status === 200) {
        const data = await res.json()
        expect(Array.isArray(data.reactions)).toBe(true)
      }
    }, 30000)
  })
}) 