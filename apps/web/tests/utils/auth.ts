import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret) || ('cribnosh-dev-secret' as Secret)

type Expires = NonNullable<SignOptions['expiresIn']>

export function createTestJwt(payload: Record<string, any>, expiresIn: Expires = '2h' as unknown as Expires): string {
  const options: SignOptions = { expiresIn }
  return jwt.sign(payload, JWT_SECRET, options)
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