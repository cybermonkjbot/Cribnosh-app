# Production Rate Limit Reset - Security Key

## 🔐 **36-Bit Security Key**

**Your generated security key is:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## 📋 **Usage Instructions**

### **Development/Test Environment**
No key required - works without authentication:
```bash
curl -X POST http://localhost:3000/api/test/reset-rate-limits
```

### **Production Environment**
Requires the 36-bit security key:
```bash
curl -X POST https://your-domain.com/api/test/reset-rate-limits \
  -H "Content-Type: application/json" \
  -d '{"key": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

## 🔒 **Security Features**

### **Key Validation**
- **Format**: 36-bit UUID format (36 characters)
- **Validation**: Exact string match required
- **Error Handling**: Clear error messages for invalid/missing keys
- **Request Body**: Must be valid JSON with `key` field

### **Production Safety**
- **Key Required**: Production requests must include valid key
- **Error Responses**: 400 status for invalid keys
- **Logging**: Security key usage is logged
- **Environment Detection**: Automatic dev vs prod handling

## 📊 **Response Examples**

### **Success Response (Production)**
```json
{
  "success": true,
  "message": "All rate limits have been reset",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "resetLimiters": [
    "otpRateLimiter",
    "verificationRateLimiter",
    "generalAuthRateLimiter",
    "authRateLimiter (sensitive)",
    "sensitiveRateLimiter",
    "moderationRateLimiter",
    "apiRateLimiter",
    "authRateLimiter (middleware)",
    "webhookRateLimiter",
    "searchRateLimiter"
  ],
  "securityNote": "Rate limits reset with valid security key",
  "keyUsed": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### **Error Response (Invalid Key)**
```json
{
  "error": "Invalid or missing security key",
  "message": "In production, a valid 36-bit security key is required"
}
```

### **Error Response (Invalid JSON)**
```json
{
  "error": "Invalid request body",
  "message": "Request body must contain a valid JSON with security key"
}
```

## 🛠️ **Configuration Endpoint**

### **GET Request (All Environments)**
```bash
curl https://your-domain.com/api/test/reset-rate-limits
```

### **Response Includes Production Info**
```json
{
  "message": "Rate limit reset endpoint",
  "usage": "POST to /api/test/reset-rate-limits to reset all rate limits",
  "environment": "production",
  "productionUsage": {
    "note": "In production, POST requests require a security key",
    "keyFormat": "36-bit UUID format",
    "example": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  "currentLimits": {
    // ... rate limit configurations
  }
}
```

## 🔧 **Implementation Details**

### **Key Generation**
- **Algorithm**: Cryptographically secure random generation
- **Format**: UUID v4 format (36 characters)
- **Entropy**: 128-bit entropy for security
- **Uniqueness**: Globally unique identifier

### **Validation Logic**
```typescript
// Production key validation
if (isProduction) {
  const body = await request.json();
  const providedKey = body?.key;
  const validKey = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  if (!providedKey || providedKey !== validKey) {
    return 400; // Invalid key
  }
}
```

### **Security Considerations**
- **Key Storage**: Hardcoded in application (not in environment variables)
- **Key Rotation**: Manual process (requires code deployment)
- **Access Control**: Only authorized personnel should have the key
- **Audit Trail**: Key usage is logged for security monitoring

## 🚨 **Emergency Usage**

### **When to Use**
- **Rate Limit Issues**: When legitimate users are blocked
- **Testing**: Production testing scenarios
- **Debugging**: Troubleshooting rate limiting problems
- **Maintenance**: Scheduled maintenance windows

### **Best Practices**
1. **Use Sparingly**: Only when absolutely necessary
2. **Monitor Usage**: Track when and why the key is used
3. **Secure Storage**: Keep the key secure and private
4. **Team Access**: Limit access to authorized team members
5. **Documentation**: Document each usage for audit purposes

## 📝 **Swagger Documentation**

The endpoint includes comprehensive Swagger documentation:
- **Request Body Schema**: JSON schema with key field
- **Response Schemas**: Success and error response formats
- **Security Notes**: Production key requirements
- **Examples**: Complete usage examples
- **Error Codes**: Detailed error response documentation

## 🔄 **Rate Limiters Reset**

All 10 rate limiting systems are reset simultaneously:
1. **OTP Rate Limiter** (15 min window)
2. **Verification Rate Limiter** (5 min window)
3. **General Auth Rate Limiter** (1 min window)
4. **Sensitive Auth Rate Limiter** (5 min window)
5. **Sensitive Rate Limiter** (1 min window)
6. **Moderation Rate Limiter** (1 min window)
7. **API Rate Limiter** (15 min window)
8. **Middleware Auth Rate Limiter** (15 min window)
9. **Webhook Rate Limiter** (1 min window)
10. **Search Rate Limiter** (1 min window)

## ⚠️ **Important Notes**

- **Key Security**: Keep the security key private and secure
- **Production Only**: Key is only required in production environment
- **Audit Trail**: All key usage is logged for security monitoring
- **Emergency Use**: Intended for emergency rate limit resets only
- **Team Access**: Limit key access to authorized personnel only
