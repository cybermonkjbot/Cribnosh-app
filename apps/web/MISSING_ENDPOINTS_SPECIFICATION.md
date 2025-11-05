# Missing API Endpoints Specification

This document specifies the exact request payloads and response formats needed for all missing endpoints identified in the frontend code.

**Base URL**: `https://cribnosh.com/api`  
**Authentication**: Bearer token in `Authorization` header

---

## 1. Account Management Endpoints

### 1.1 DELETE /customer/account
**Description**: Delete customer account permanently

**Request**:
- **Method**: `DELETE`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Account deletion request has been submitted. You will receive an email confirmation shortly.",
  "data": {
    "deletion_requested_at": "2024-01-15T10:30:00Z",
    "deletion_will_complete_at": "2024-01-22T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Account not found
- `400 Bad Request`: Account deletion already in progress

---

### 1.2 POST /customer/account/delete-feedback
**Description**: Submit feedback about why the user is deleting their account

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "feedback_options": [0, 3]
}
```
**Note**: `feedback_options` is an array of numbers representing selected feedback option indices (0-based). The options are:
- `0`: "I'm not using the app."
- `1`: "I found a better alternative."
- `2`: "The app contains too many ads."
- `3`: "The app didn't have the features or functionality I were looking for."
- `4`: "I'm not satisfied with the quality of content."
- `5`: "The app was difficult to navigate."
- `6`: "Other."

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid feedback_options format

---

### 1.3 POST /customer/account/download-data
**Description**: Request download of all account data (GDPR compliance)

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Your data download request has been submitted. You'll receive an email when it's ready.",
  "data": {
    "download_url": "https://cribnosh.com/api/customer/account/download-data/abc123def456",
    "expires_at": "2024-01-17T10:30:00Z",
    "status": "processing"
  }
}
```

**Alternative Response** (if processing asynchronously):
```json
{
  "success": true,
  "message": "Your data download request has been submitted. You'll receive an email when it's ready.",
  "data": {
    "status": "pending",
    "estimated_completion_time": "2024-01-15T14:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `429 Too Many Requests`: Too many download requests (max 1 per 24 hours)

---

## 2. Payment Methods Endpoints

### 2.1 GET /customer/payment-methods
**Description**: Get all payment methods for the customer

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_1234567890",
      "type": "apple_pay",
      "is_default": true,
      "last4": null,
      "brand": null,
      "exp_month": null,
      "exp_year": null,
      "created_at": "2024-01-10T10:00:00Z"
    },
    {
      "id": "pm_0987654321",
      "type": "card",
      "is_default": false,
      "last4": "8601",
      "brand": "visa",
      "exp_month": 12,
      "exp_year": 2025,
      "created_at": "2024-01-08T14:30:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 2.2 POST /customer/payment-methods
**Description**: Add a new payment method

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "payment_method_id": "pm_token_from_stripe_or_other_processor",
  "type": "card",
  "set_as_default": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "id": "pm_new_payment_method_id",
    "type": "card",
    "is_default": false,
    "last4": "8601",
    "brand": "visa",
    "exp_month": 12,
    "exp_year": 2025,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid payment method token or validation error
- `422 Unprocessable Entity`: Payment method could not be processed

---

### 2.3 PUT /customer/payment-methods/{payment_method_id}/default
**Description**: Set a payment method as default

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Path Parameters**: 
  - `payment_method_id`: The ID of the payment method to set as default
- **Body**: None

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Default payment method updated successfully",
  "data": {
    "id": "pm_0987654321",
    "is_default": true,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Payment method not found
- `400 Bad Request`: Payment method cannot be set as default

---

## 3. Balance Endpoints

### 3.1 GET /customer/balance
**Description**: Get customer's Cribnosh balance

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "balance": 5000,
    "currency": "GBP",
    "is_available": true,
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```
**Note**: `balance` is in smallest currency unit (pence for GBP, cents for USD, etc.)

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 3.2 GET /customer/balance/transactions
**Description**: Get balance transaction history

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123456",
        "type": "credit",
        "amount": 1000,
        "currency": "GBP",
        "description": "Refund from order #ORD-12345",
        "created_at": "2024-01-14T15:30:00Z",
        "status": "completed"
      },
      {
        "id": "txn_123457",
        "type": "debit",
        "amount": -500,
        "currency": "GBP",
        "description": "Payment for order #ORD-12346",
        "created_at": "2024-01-13T10:20:00Z",
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

## 4. Family Profile Endpoint

### 4.1 POST /customer/family-profile
**Description**: Setup family profile for shared ordering

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "family_members": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+44123456789",
      "relationship": "spouse"
    },
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+44987654321",
      "relationship": "child"
    }
  ],
  "shared_payment_methods": true,
  "shared_orders": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Family profile setup successfully",
  "data": {
    "family_profile_id": "fp_123456",
    "family_members": [
      {
        "id": "fm_123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+44123456789",
        "relationship": "spouse",
        "status": "pending_invitation"
      },
      {
        "id": "fm_124",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "+44987654321",
        "relationship": "child",
        "status": "pending_invitation"
      }
    ],
    "settings": {
      "shared_payment_methods": true,
      "shared_orders": true
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid family member data or validation error
- `409 Conflict`: Family profile already exists

---

## 5. Food Safety Endpoints

### 5.1 GET /customer/allergies
**Description**: Get customer's allergies and intolerances

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "allergy_123",
      "name": "Peanuts",
      "type": "allergy",
      "severity": "severe",
      "created_at": "2024-01-10T10:00:00Z"
    },
    {
      "id": "allergy_124",
      "name": "Lactose",
      "type": "intolerance",
      "severity": "moderate",
      "created_at": "2024-01-08T14:30:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 5.2 PUT /customer/allergies
**Description**: Update customer's allergies and intolerances

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "allergies": [
    {
      "name": "Peanuts",
      "type": "allergy",
      "severity": "severe"
    },
    {
      "name": "Lactose",
      "type": "intolerance",
      "severity": "moderate"
    },
    {
      "name": "Gluten",
      "type": "intolerance",
      "severity": "mild"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Allergies updated successfully",
  "data": {
    "allergies": [
      {
        "id": "allergy_123",
        "name": "Peanuts",
        "type": "allergy",
        "severity": "severe",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "allergy_124",
        "name": "Lactose",
        "type": "intolerance",
        "severity": "moderate",
        "updated_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "allergy_125",
        "name": "Gluten",
        "type": "intolerance",
        "severity": "mild",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid allergy data or validation error

---

### 5.3 GET /customer/dietary-preferences
**Description**: Get customer's dietary preferences

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "preferences": [
      "vegetarian",
      "gluten_free"
    ],
    "religious_requirements": [
      "halal"
    ],
    "health_driven": [
      "low_sodium",
      "low_fat"
    ],
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 5.4 PUT /customer/dietary-preferences
**Description**: Update customer's dietary preferences

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "preferences": [
    "vegetarian",
    "gluten_free"
  ],
  "religious_requirements": [
    "halal"
  ],
  "health_driven": [
    "low_sodium",
    "low_fat"
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Dietary preferences updated successfully",
  "data": {
    "preferences": [
      "vegetarian",
      "gluten_free"
    ],
    "religious_requirements": [
      "halal"
    ],
    "health_driven": [
      "low_sodium",
      "low_fat"
    ],
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid preference data or validation error

---

### 5.5 PUT /customer/food-safety/cross-contamination
**Description**: Update cross-contamination avoidance setting

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "avoid_cross_contamination": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Cross-contamination setting updated successfully",
  "data": {
    "avoid_cross_contamination": true,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid request data

---

## 6. Data Sharing Endpoints

### 6.1 GET /customer/data-sharing-preferences
**Description**: Get customer's data sharing preferences

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**: None

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "analytics_enabled": true,
    "personalization_enabled": true,
    "marketing_enabled": false,
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 6.2 PUT /customer/data-sharing-preferences
**Description**: Update customer's data sharing preferences

**Request**:
- **Method**: `PUT`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "analytics_enabled": true,
  "personalization_enabled": true,
  "marketing_enabled": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Data sharing preferences updated successfully",
  "data": {
    "analytics_enabled": true,
    "personalization_enabled": true,
    "marketing_enabled": false,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid preference data

---

## 7. Support Endpoints

### 7.1 GET /customer/support-cases
**Description**: Get customer's support cases

**Request**:
- **Method**: `GET`
- **Headers**: 
  - `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 50)
  - `status` (optional): Filter by status (`open`, `closed`, `resolved`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "case_123456",
        "subject": "Order delivery issue",
        "status": "open",
        "priority": "high",
        "created_at": "2024-01-14T10:30:00Z",
        "updated_at": "2024-01-15T09:00:00Z",
        "last_message": "We're looking into your delivery issue..."
      },
      {
        "id": "case_123457",
        "subject": "Payment refund request",
        "status": "resolved",
        "priority": "medium",
        "created_at": "2024-01-10T14:20:00Z",
        "updated_at": "2024-01-12T16:45:00Z",
        "last_message": "Your refund has been processed."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

---

### 7.2 POST /customer/support-cases
**Description**: Create a new support case

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "subject": "Order delivery issue",
  "message": "My order was supposed to arrive yesterday but I haven't received it yet.",
  "category": "order",
  "priority": "high",
  "order_id": "ORD-12345",
  "attachments": []
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Support case created successfully",
  "data": {
    "id": "case_123458",
    "subject": "Order delivery issue",
    "status": "open",
    "priority": "high",
    "category": "order",
    "created_at": "2024-01-15T10:30:00Z",
    "support_reference": "SUP-2024-001234"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid case data or validation error

---

## 8. Order Management Endpoints (Customer-Specific)

### 8.1 POST /customer/orders/{order_id}/cancel
**Description**: Cancel a customer's order

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Path Parameters**: 
  - `order_id`: The ID of the order to cancel
- **Body**:
```json
{
  "reason": "Customer requested cancellation",
  "refund_preference": "full_refund"
}
```
**Note**: `refund_preference` can be `"full_refund"`, `"partial_refund"`, or `"credit"`. `reason` is optional.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Order cancellation request submitted",
  "data": {
    "order_id": "ORD-12345",
    "status": "cancellation_pending",
    "refund_status": "pending",
    "cancelled_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Order not found
- `400 Bad Request`: Order cannot be cancelled (already delivered, too late, etc.)

---

### 8.2 POST /customer/orders/{order_id}/rate
**Description**: Rate and review an order

**Request**:
- **Method**: `POST`
- **Headers**: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Path Parameters**: 
  - `order_id`: The ID of the order to rate
- **Body**:
```json
{
  "rating": 5,
  "review": "Excellent food quality and timely delivery!",
  "categories": {
    "food_quality": 5,
    "delivery_speed": 4,
    "packaging": 5,
    "customer_service": 5
  }
}
```
**Note**: 
- `rating` is required (1-5 stars)
- `review` is optional
- `categories` is optional and can include any combination of: `food_quality`, `delivery_speed`, `packaging`, `customer_service` (all 1-5 stars)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Thank you for your rating!",
  "data": {
    "review_id": "rev_123456",
    "order_id": "ORD-12345",
    "rating": 5,
    "review": "Excellent food quality and timely delivery!",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Order not found
- `400 Bad Request`: Order cannot be rated (already rated, not delivered, etc.)

---

## Common Error Response Format

All endpoints should return errors in this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

---

## Notes

1. **Authentication**: All endpoints require Bearer token authentication
2. **Content-Type**: All POST/PUT requests must use `application/json`
3. **Date Formats**: All dates should be in ISO 8601 format (UTC)
4. **Currency**: All monetary amounts should be in smallest currency unit (pence/cents)
5. **Validation**: Backend should validate all input data and return appropriate error messages
6. **Rate Limiting**: Consider implementing rate limiting for sensitive operations (account deletion, etc.)

