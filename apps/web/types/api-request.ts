/**
 * API Request Types
 * Type definitions for API request bodies and parameters
 */

import type { NextRequest } from 'next/server';

/**
 * Helper type for extracting request body type
 */
export type RequestBody<T = unknown> = T;

/**
 * Helper function to safely parse and type request body
 */
export async function parseRequestBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid request body');
  }
}

/**
 * Helper function to safely parse request body with validation
 */
export async function parseAndValidateRequestBody<T = unknown>(
  request: NextRequest,
  validator?: (body: unknown) => body is T
): Promise<T> {
  const body = await request.json();
  
  if (validator && !validator(body)) {
    throw new Error('Request body validation failed');
  }
  
  return body as T;
}

/**
 * Type guard for checking if a value is a valid request body object
 */
export function isRequestBody(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

