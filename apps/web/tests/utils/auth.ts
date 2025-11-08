import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { api } from '@/convex/_generated/api'
import { getConvexClient } from '@/lib/conxed-client'

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret) || ('cribnosh-dev-secret' as Secret)

type Expires = NonNullable<SignOptions['expiresIn']>

/**
 * Create a test JWT token (for backward compatibility during migration)
 * @deprecated Use createTestSessionToken instead
 */
export function createTestJwt(payload: Record<string, any>, expiresIn: Expires = '2h' as unknown as Expires): string {
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, JWT_SECRET, options)
}

/**
 * Create a test session token for a user
 * This creates a real session token using Convex mutation
 */
export async function createTestSessionToken(
  userId: string,
  expiresInDays: number = 30
): Promise<string> {
  const convex = getConvexClient()
  const result = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
    userId: userId as any,
    expiresInDays,
  })
  return result.sessionToken
}

/**
 * Create a test request with session token in cookie (for web app tests)
 */
export function createTestRequestWithSessionToken(
  url: string,
  sessionToken: string,
  method: string = 'GET'
): NextRequest {
  const request = new NextRequest(url, { method })
  request.cookies.set('convex-auth-token', sessionToken)
  return request
}

/**
 * Create a test request with session token in header (for mobile app tests)
 */
export function createTestRequestWithSessionTokenHeader(
  url: string,
  sessionToken: string,
  method: string = 'GET'
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'X-Session-Token': sessionToken,
    },
  })
  return request
}

export function withAuthHeaders(headers: HeadersInit = {}, token?: string): HeadersInit {
  const h = new Headers(headers)
  if (token) h.set('Authorization', `Bearer ${token}`)
  return h
}

// Normalize RequestInit so `signal` is never null and allow an optional `user` helper field
export function buildAuthedRequest(
  url: string,
  init: (Omit<RequestInit, 'signal'> & { signal?: AbortSignal; user?: any }) = {}
): NextRequest {
  const token = init.user
    ? createTestJwt({ user_id: init.user.id, email: init.user.email, roles: init.user.roles ?? ['customer'] })
    : undefined

  const { user, signal, ...rest } = init
  const headers = withAuthHeaders(init.headers, token)

  const normalizedInit: RequestInit = {
    ...rest,
    ...(signal ? { signal } : {}),
    headers,
  }

  type NextInit = import('next/dist/server/web/spec-extension/request').RequestInit
  return new NextRequest(url, normalizedInit as unknown as NextInit)
}