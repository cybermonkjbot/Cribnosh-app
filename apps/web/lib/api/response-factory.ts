/**
 * Standardized API response factory for consistent responses across all endpoints
 */

import { NextResponse } from 'next/server';
import { 
  ApiResponse, 
  ListResponse, 
  SingleResponse, 
  EmptyResponse, 
  ResponseMeta, 
  PaginationMeta,
  HTTP_STATUS,
  API_VERSION,
  DEFAULT_HEADERS
} from './types';
import { ErrorCode } from '../errors/types';

export class ResponseFactory {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static createMeta(overrides: Partial<ResponseMeta> = {}): ResponseMeta {
    return {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      version: API_VERSION,
      ...overrides,
    };
  }

  private static createHeaders(requestId?: string): Record<string, string> {
    return {
      ...DEFAULT_HEADERS,
      'X-Request-ID': requestId || this.generateRequestId(),
    };
  }

  /**
   * Create a successful response with data
   */
  static success<T>(
    data: T,
    message?: string,
    statusCode: number = HTTP_STATUS.OK,
    meta?: Partial<ResponseMeta>
  ): NextResponse<SingleResponse<T>> {
    const responseMeta = this.createMeta(meta);
    
    const response: SingleResponse<T> = {
      success: true,
      data,
      message,
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a successful response with a list of data
   */
  static list<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string,
    statusCode: number = HTTP_STATUS.OK,
    meta?: Partial<ResponseMeta>
  ): NextResponse<ListResponse<T>> {
    const responseMeta = this.createMeta({
      ...meta,
      pagination,
    }) as ResponseMeta & { pagination: PaginationMeta };
    
    const response: ListResponse<T> = {
      success: true,
      data,
      message,
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a successful response without data
   */
  static empty(
    message?: string,
    statusCode: number = HTTP_STATUS.NO_CONTENT,
    meta?: Partial<ResponseMeta>
  ): NextResponse<EmptyResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: EmptyResponse = {
      success: true,
      data: null,
      message,
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a created response (201)
   */
  static created<T>(
    data: T,
    message?: string,
    meta?: Partial<ResponseMeta>
  ): NextResponse<SingleResponse<T>> {
    return this.success(data, message || 'Resource created successfully', HTTP_STATUS.CREATED, meta);
  }

  /**
   * Create an accepted response (202)
   */
  static accepted<T>(
    data: T,
    message?: string,
    meta?: Partial<ResponseMeta>
  ): NextResponse<SingleResponse<T>> {
    return this.success(data, message || 'Request accepted', HTTP_STATUS.ACCEPTED, meta);
  }

  /**
   * Create a validation error response
   */
  static validationError(
    message: string,
    errors: Array<{ field?: string; message: string }> = [],
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: errors.map(error => ({
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message,
        field: error.field,
      })),
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create an authentication error response
   */
  static unauthorized(
    message: string = 'Authentication required',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.UNAUTHORIZED,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.UNAUTHORIZED,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a forbidden error response
   */
  static forbidden(
    message: string = 'Access forbidden',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.FORBIDDEN,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.FORBIDDEN,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a not found error response
   */
  static notFound(
    message: string = 'Resource not found',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.NOT_FOUND,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.NOT_FOUND,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a conflict error response
   */
  static conflict(
    message: string = 'Resource conflict',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.CONFLICT,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.CONFLICT,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a rate limit error response
   */
  static rateLimited(
    message: string = 'Too many requests',
    retryAfter?: number,
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.RATE_LIMITED,
        message,
      }],
      meta: responseMeta,
    };

    const headers = this.createHeaders(responseMeta.requestId);
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return NextResponse.json(response, {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      headers,
    });
  }

  /**
   * Create an internal server error response
   */
  static internalError(
    message: string = 'Internal server error',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.INTERNAL_ERROR,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a service unavailable error response
   */
  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a custom error response
   */
  static error(
    message: string,
    code: string,
    statusCode: number,
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a pagination meta object
   */
  static createPagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Create a file download response
   */
  static fileDownload(
    content: string | Buffer,
    filename: string,
    contentType: string = 'application/octet-stream',
    statusCode: number = HTTP_STATUS.OK
  ): NextResponse {
    const headers = this.createHeaders();
    headers['Content-Type'] = contentType;
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;

    return new NextResponse(content as BodyInit, {
      status: statusCode,
      headers,
    });
  }

  /**
   * Create a JSON file download response
   */
  static jsonDownload(
    data: any,
    filename: string,
    statusCode: number = HTTP_STATUS.OK
  ): NextResponse {
    return this.fileDownload(
      JSON.stringify(data, null, 2),
      filename,
      'application/json',
      statusCode
    );
  }

  /**
   * Create a CSV file download response
   */
  static csvDownload(
    csvContent: string,
    filename: string,
    statusCode: number = HTTP_STATUS.OK
  ): NextResponse {
    return this.fileDownload(
      csvContent,
      filename,
      'text/csv',
      statusCode
    );
  }

  /**
   * Create an OPTIONS response for CORS
   */
  static options(
    allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: string[] = ['Content-Type', 'Authorization'],
    statusCode: number = HTTP_STATUS.OK
  ): NextResponse {
    const headers = this.createHeaders();
    headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours

    return new NextResponse(null, {
      status: statusCode,
      headers,
    });
  }

  /**
   * Create a method not allowed response (405)
   */
  static methodNotAllowed(
    message: string = 'Method Not Allowed',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.METHOD_NOT_ALLOWED,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.METHOD_NOT_ALLOWED,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }

  /**
   * Create a bad request response (400)
   */
  static badRequest(
    message: string = 'Bad Request',
    meta?: Partial<ResponseMeta>
  ): NextResponse<ApiResponse> {
    const responseMeta = this.createMeta(meta);
    
    const response: ApiResponse = {
      success: false,
      message,
      errors: [{
        code: ErrorCode.VALIDATION_ERROR,
        message,
      }],
      meta: responseMeta,
    };

    return NextResponse.json(response, {
      status: HTTP_STATUS.BAD_REQUEST,
      headers: this.createHeaders(responseMeta.requestId),
    });
  }
}
