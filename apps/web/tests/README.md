# Next.js API Testing with Vitest

This directory contains the testing setup for CribNosh's Next.js API endpoints using Vitest.

## Setup

The testing environment is configured with:
- **Vitest** - Fast unit testing framework
- **JSDOM** - Browser-like environment for DOM testing
- **React Testing Library** - Utilities for testing React components
- **TypeScript support** - Full TypeScript integration

## Configuration Files

- `vitest.config.ts` - Main Vitest configuration
- `tests/setup.ts` - Global test setup and mocks
- `tests/utils/api-test-utils.ts` - Utility functions for API testing

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run specific test files
bun test tests/api/auth.test.ts

# Run tests matching a pattern
bun test --grep "auth"
```

## Writing API Tests

### Basic API Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createTestRequest, expectApiResponse } from '../utils/api-test-utils'

describe('Your API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle successful requests', async () => {
    // Create test request
    const request = createTestRequest('/api/your-endpoint', {
      method: 'POST',
      body: { key: 'value' }
    })

    // Call your API route handler
    // const response = await POST(request)

    // Assert response
    // await expectApiResponse(response, 200, { success: true })
  })
})
```

### Testing Different HTTP Methods

```typescript
it('should handle GET requests', async () => {
  const request = createTestRequest('/api/users', {
    method: 'GET',
    searchParams: { page: '1', limit: '10' }
  })
  // const response = await GET(request)
})

it('should handle POST requests', async () => {
  const request = createTestRequest('/api/users', {
    method: 'POST',
    body: { name: 'John', email: 'john@cribnosh.co.uk' }
  })
  // const response = await POST(request)
})
```

### Testing Authentication

```typescript
import { createAuthenticatedRequest } from '../utils/api-test-utils'

it('should require authentication', async () => {
  const request = createAuthenticatedRequest('/api/protected', 'valid-token')
  // const response = await GET(request)
  // expect(response.status).toBe(200)
})

it('should reject invalid tokens', async () => {
  const request = createAuthenticatedRequest('/api/protected', 'invalid-token')
  // const response = await GET(request)
  // expect(response.status).toBe(401)
})
```

### Testing Form Data

```typescript
import { createFormDataRequest } from '../utils/api-test-utils'

it('should handle form data', async () => {
  const request = createFormDataRequest('/api/upload', {
    file: new File(['content'], 'test.txt'),
    description: 'Test file'
  })
  // const response = await POST(request)
})
```

### Mocking External Dependencies

```typescript
import { vi } from 'vitest'

// Mock external services
vi.mock('@/lib/database', () => ({
  query: vi.fn(),
  connect: vi.fn(),
}))

it('should handle database errors', async () => {
  const mockDb = await import('@/lib/database')
  mockDb.query.mockRejectedValue(new Error('Database connection failed'))
  
  const request = createTestRequest('/api/users')
  // const response = await GET(request)
  // expect(response.status).toBe(500)
})
```

## Test Utilities

### `createTestRequest(endpoint, options)`

Creates a `NextRequest` object for testing:

```typescript
const request = createTestRequest('/api/users', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: { name: 'John' },
  searchParams: { page: '1' }
})
```

### `expectApiResponse(response, status, data?)`

Asserts response status and optionally validates response data:

```typescript
await expectApiResponse(response, 200, { success: true })
```

### `createAuthenticatedRequest(endpoint, token, options?)`

Creates a request with authentication headers:

```typescript
const request = createAuthenticatedRequest('/api/protected', 'valid-token')
```

### `createFormDataRequest(endpoint, formData, options?)`

Creates a request with FormData:

```typescript
const request = createFormDataRequest('/api/upload', {
  file: new File(['content'], 'test.txt')
})
```

## Best Practices

### 1. Test Structure
- Use descriptive test names
- Group related tests with `describe` blocks
- Test both success and error cases
- Test edge cases and validation

### 2. Mocking
- Mock external dependencies (databases, APIs, etc.)
- Use `vi.clearAllMocks()` in `beforeEach` to reset mocks
- Mock at the module level in `setup.ts` for global mocks

### 3. Assertions
- Test HTTP status codes
- Validate response structure
- Check error messages
- Verify side effects (database calls, emails, etc.)

### 4. Test Data
- Use realistic test data
- Create test fixtures for complex objects
- Use factories for generating test data

### 5. Performance
- Keep tests fast and focused
- Avoid testing implementation details
- Use appropriate timeouts for async operations

## Example Test Files

- `tests/api/health.test.ts` - Basic health check endpoint
- `tests/api/auth.test.ts` - Authentication endpoints
- `tests/utils/api-test-utils.ts` - Utility functions

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure paths are correctly configured in `vitest.config.ts`
2. **Mock not working**: Make sure mocks are defined in `setup.ts` or at the top level of test files
3. **TypeScript errors**: Check that types are properly imported and configured

### Debug Mode

Run tests in debug mode to see more detailed output:

```bash
bun test --reporter=verbose
```

### Coverage Reports

Generate coverage reports to identify untested code:

```bash
bun test:coverage
```

## Integration with CI/CD

The test setup is designed to work seamlessly with CI/CD pipelines. Tests will run automatically on pull requests and deployments.

## Contributing

When adding new API endpoints, please:

1. Create corresponding test files
2. Follow the established patterns
3. Ensure good test coverage
4. Update this documentation if needed 