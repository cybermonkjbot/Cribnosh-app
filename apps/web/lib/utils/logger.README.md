# Logger Utility

A conditional logging utility that respects environment variables and only logs in appropriate contexts.

## Features

- ✅ **Environment-aware**: Only logs in development, respects `LOG_LEVEL` in production
- ✅ **Production-safe**: No console.log noise in production
- ✅ **Error tracking**: Automatically sends errors to monitoring service in production
- ✅ **Context support**: Create namespaced loggers for components/modules
- ✅ **Type-safe**: Full TypeScript support

## Usage

### Basic Usage

```typescript
import { logger } from '@/lib/utils/logger';

// Debug messages (development only)
logger.debug('Debug information');

// Info messages (development only, or if LOG_LEVEL=info in production)
logger.log('Info message');
logger.info('Info message'); // alias for log

// Warning messages (development only, or if LOG_LEVEL=warn in production)
logger.warn('Warning message');

// Error messages (always logged, sent to monitoring in production)
logger.error('Error message');
logger.error('Error message', errorObject);
logger.error('Error message', errorObject, { userId: '123', requestId: 'abc' });
```

### Context-Specific Loggers

Create a logger with a specific context/namespace:

```typescript
import { createLogger } from '@/lib/utils/logger';

const componentLogger = createLogger('ComponentName');

componentLogger.log('Component initialized');
componentLogger.error('Component error', error);
```

### In API Routes

```typescript
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  logger.log('API request received');
  
  try {
    // ... your code
    logger.log('API request successful');
  } catch (error) {
    logger.error('API request failed', error, { 
      endpoint: '/api/example',
      method: 'POST'
    });
    throw error;
  }
}
```

### In React Components

```typescript
'use client';

import { logger } from '@/lib/utils/logger';
import { useEffect } from 'react';

export function MyComponent() {
  useEffect(() => {
    logger.log('Component mounted');
    
    return () => {
      logger.log('Component unmounted');
    };
  }, []);
  
  const handleError = (error: Error) => {
    logger.error('Component error', error, { component: 'MyComponent' });
  };
  
  // ...
}
```

## Behavior by Environment

### Development (`NODE_ENV=development`)
- ✅ All log levels are logged to console
- ✅ Formatted with timestamps and log levels
- ✅ Errors are NOT sent to monitoring service

### Production (`NODE_ENV=production`)
- ✅ Only errors are logged to console
- ✅ Errors are automatically sent to monitoring service
- ✅ Other log levels respect `LOG_LEVEL` environment variable:
  - `LOG_LEVEL=error`: Only errors
  - `LOG_LEVEL=warn`: Warnings and errors
  - `LOG_LEVEL=info`: Info, warnings, and errors
  - `LOG_LEVEL=debug`: All log levels (not recommended for production)

### Test (`NODE_ENV=test`)
- ✅ No logging (silent)

## Environment Variables

- `NODE_ENV`: Controls overall behavior (development/production/test)
- `LOG_LEVEL`: Controls which log levels are logged in production (debug/info/warn/error)

## Migration Guide

### Replace console.log

**Before:**
```typescript
console.log('User logged in', { userId: '123' });
```

**After:**
```typescript
import { logger } from '@/lib/utils/logger';

logger.log('User logged in', { userId: '123' });
```

### Replace console.error

**Before:**
```typescript
console.error('Error occurred', error);
```

**After:**
```typescript
import { logger } from '@/lib/utils/logger';

logger.error('Error occurred', error);
```

### Replace console.warn

**Before:**
```typescript
console.warn('Warning message');
```

**After:**
```typescript
import { logger } from '@/lib/utils/logger';

logger.warn('Warning message');
```

## Best Practices

1. **Use appropriate log levels**: Use `debug` for verbose debugging, `log`/`info` for general information, `warn` for warnings, `error` for errors
2. **Include context**: Pass additional context objects to help with debugging
3. **Use context loggers**: Create context-specific loggers for components/modules
4. **Don't log sensitive data**: Never log passwords, tokens, or other sensitive information
5. **Use structured logging**: Pass objects instead of concatenated strings for better parsing

## Examples

### Structured Logging

```typescript
logger.log('Order created', {
  orderId: '123',
  userId: '456',
  amount: 29.99,
  timestamp: new Date().toISOString()
});
```

### Error with Context

```typescript
try {
  await processPayment(order);
} catch (error) {
  logger.error('Payment processing failed', error, {
    orderId: order.id,
    userId: order.userId,
    amount: order.amount,
    paymentMethod: order.paymentMethod
  });
}
```

### Component Logger

```typescript
import { createLogger } from '@/lib/utils/logger';

const apiLogger = createLogger('API');

export async function fetchUserData(userId: string) {
  apiLogger.log('Fetching user data', { userId });
  
  try {
    const data = await fetch(`/api/users/${userId}`);
    apiLogger.log('User data fetched successfully', { userId });
    return data;
  } catch (error) {
    apiLogger.error('Failed to fetch user data', error, { userId });
    throw error;
  }
}
```

