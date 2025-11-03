/**
 * Helper function to create error responses matching the spec format:
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Error description",
 *     "code": "ERROR_CODE",
 *     "details": {}
 *   }
 * }
 */

import { NextResponse } from 'next/server';

interface SpecErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

export function createSpecErrorResponse(
  message: string,
  code: string,
  statusCode: number,
  details?: Record<string, any>
): NextResponse<SpecErrorResponse> {
  const response: SpecErrorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    },
  };

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

