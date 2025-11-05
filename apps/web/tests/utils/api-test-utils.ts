import { NextRequest } from 'next/server'

export interface TestRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: any
  url?: string
  searchParams?: Record<string, string>
}

export function createTestRequest(
  endpoint: string,
  options: TestRequestOptions = {}
): NextRequest {
  const {
    method = 'GET',
    headers = {},
    body,
    url = 'http://localhost:3000',
    searchParams = {},
  } = options

  // Build URL with search parameters
  const urlObj = new URL(`${url}${endpoint}`)
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.append(key, value)
  })

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestOptions.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestOptions as any)
}

export async function expectApiResponse(
  response: Response,
  expectedStatus: number,
  expectedData?: any
) {
  expect(response.status).toBe(expectedStatus)
  
  if (expectedData !== undefined) {
    const data = await response.json()
    expect(data).toEqual(expectedData)
  }
}

export function mockApiResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function mockApiError(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Helper for testing authentication
export function createAuthenticatedRequest(
  endpoint: string,
  token: string,
  options: Omit<TestRequestOptions, 'headers'> = {}
): NextRequest {
  return createTestRequest(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

// Helper for testing form data
export function createFormDataRequest(
  endpoint: string,
  formData: Record<string, any>,
  options: Omit<TestRequestOptions, 'body' | 'headers'> = {}
): NextRequest {
  const data = new FormData()
  Object.entries(formData).forEach(([key, value]) => {
    data.append(key, value)
  })

  return new NextRequest(`http://localhost:3000${endpoint}`, {
    method: options.method || 'POST',
    body: data,
    headers: {},
  })
} 