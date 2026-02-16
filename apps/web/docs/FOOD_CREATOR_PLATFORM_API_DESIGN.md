# Food Creator Platform - API Design

## Document Information
- **Version**: 1.0
- **Last Updated**: 2024
- **Status**: Draft
- **Base URL**: `/api/chef`

## Overview

This document defines all API endpoints for the food creator platform, including course management, document upload, content creation, payouts, and status management. All endpoints require food creator authentication.

## Authentication

All endpoints require authentication via session token (cookie-based or header).

**Headers**:
```
Cookie: sessionToken=<token>
```
or
```
Authorization: Bearer <sessionToken>
```

**Response Format**:
All endpoints return JSON with the following structure:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
```

---

## 1. Course Management Endpoints

### 1.1 Get Chef's Course Enrollment and Progress

**GET** `/api/chef/courses`

Get all courses the food creator is enrolled in and their progress.

**Response**:
```typescript
{
  success: true,
  data: {
    courses: [
      {
        courseId: string;
        courseName: string;
        enrollmentDate: number;
        completionDate: number | null;
        status: "enrolled" | "in_progress" | "completed" | "expired";
        progress: {
          moduleId: string;
          moduleName: string;
          moduleNumber: number;
          completed: boolean;
          completedAt: number | null;
          quizScore: number | null;
          quizAttempts: number;
          lastAccessed: number;
          timeSpent: number;
        }[];
        totalTimeSpent: number;
        completionPercentage: number;
        certificateId: string | null;
      }
    ]
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `500`: Internal server error

---

### 1.2 Get Course Modules

**GET** `/api/chef/courses/{courseId}/modules`

Get all modules for a specific course.

**Path Parameters**:
- `courseId` (string, required): Course identifier

**Response**:
```typescript
{
  success: true,
  data: {
    courseId: string;
    courseName: string;
    modules: [
      {
        moduleId: string;
        moduleName: string;
        moduleNumber: number;
        description: string;
        estimatedTime: number; // in minutes
        content: {
          type: "text" | "video" | "interactive";
          data: any;
        }[];
        quiz: {
          questionId: string;
          question: string;
          type: "multiple_choice" | "true_false" | "text";
          options?: string[];
          correctAnswer: any;
        }[] | null;
      }
    ]
  }
}
```

---

### 1.3 Get Module Content

**GET** `/api/chef/courses/{courseId}/modules/{moduleId}`

Get detailed content for a specific module.

**Path Parameters**:
- `courseId` (string, required): Course identifier
- `moduleId` (string, required): Module identifier

**Response**:
```typescript
{
  success: true,
  data: {
    moduleId: string;
    moduleName: string;
    moduleNumber: number;
    content: {
      type: "text" | "video" | "interactive";
      title: string;
      data: any;
      order: number;
    }[];
    quiz: {
      questions: [
        {
          questionId: string;
          question: string;
          type: "multiple_choice" | "true_false" | "text";
          options?: string[];
        }
      ];
    } | null;
    progress: {
      completed: boolean;
      quizScore: number | null;
      attempts: number;
      lastAccessed: number;
      timeSpent: number;
    };
  }
}
```

---

### 1.4 Mark Module as Complete

**POST** `/api/chef/courses/{courseId}/modules/{moduleId}/complete`

Mark a module as completed (after quiz if applicable).

**Path Parameters**:
- `courseId` (string, required): Course identifier
- `moduleId` (string, required): Module identifier

**Request Body**:
```typescript
{
  timeSpent: number; // in seconds
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    moduleId: string;
    completed: boolean;
    completedAt: number;
    nextModuleId: string | null; // If there's a next module
  }
}
```

---

### 1.5 Submit Quiz Answers

**POST** `/api/chef/courses/{courseId}/modules/{moduleId}/quiz`

Submit quiz answers for a module.

**Path Parameters**:
- `courseId` (string, required): Course identifier
- `moduleId` (string, required): Module identifier

**Request Body**:
```typescript
{
  answers: [
    {
      questionId: string;
      answer: any; // Depends on question type
    }
  ]
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    score: number; // 0-100
    passed: boolean; // true if score >= 70
    totalQuestions: number;
    correctAnswers: number;
    results: [
      {
        questionId: string;
        correct: boolean;
        correctAnswer: any;
        userAnswer: any;
      }
    ];
    canRetake: boolean;
    attemptsRemaining: number;
  }
}
```

---

### 1.6 Get Completion Certificate

**GET** `/api/chef/courses/{courseId}/certificate`

Get the completion certificate for a course.

**Path Parameters**:
- `courseId` (string, required): Course identifier

**Response**:
```typescript
{
  success: true,
  data: {
    certificateId: string;
    certificateNumber: string;
    courseName: string;
    chefName: string;
    issuedAt: number;
    documentUrl: string;
    downloadUrl: string;
  }
}
```

---

## 2. Document Management Endpoints

### 2.1 Get All Food Creator Documents

**GET** `/api/chef/documents`

Get all documents uploaded by the chef.

**Query Parameters**:
- `type` (string, optional): Filter by document type
- `status` (string, optional): Filter by verification status

**Response**:
```typescript
{
  success: true,
  data: {
    documents: [
      {
        documentId: string;
        documentType: "id" | "health_permit" | "insurance" | "tax" | "kitchen_cert" | "other";
        documentName: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
        uploadedAt: number;
        verifiedAt: number | null;
        status: "pending" | "verified" | "rejected" | "expired";
        rejectionReason: string | null;
        expiresAt: number | null;
        isRequired: boolean;
      }
    ];
    requirements: {
      required: string[]; // Document types required
      optional: string[]; // Document types optional
      completed: string[]; // Document types completed
      pending: string[]; // Document types pending
    };
  }
}
```

---

### 2.2 Upload Document

**POST** `/api/chef/documents`

Upload a new document.

**Request Body** (multipart/form-data):
- `documentType` (string, required): Document type
- `file` (File, required): Document file (PDF, JPG, PNG, max 10MB)
- `documentName` (string, optional): User-friendly name
- `metadata` (JSON string, optional): Additional metadata

**Response**:
```typescript
{
  success: true,
  data: {
    documentId: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: number;
    status: "pending";
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Validation error (file too large, invalid type, etc.)
- `401`: Unauthorized
- `500`: Internal server error

---

### 2.3 Get Document Details

**GET** `/api/chef/documents/{documentId}`

Get details for a specific document.

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Response**:
```typescript
{
  success: true,
  data: {
    documentId: string;
    documentType: string;
    documentName: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: number;
    verifiedAt: number | null;
    verifiedBy: string | null; // Admin user ID
    status: "pending" | "verified" | "rejected" | "expired";
    rejectionReason: string | null;
    rejectionDetails: string | null;
    expiresAt: number | null;
    isRequired: boolean;
    metadata: any;
  }
}
```

---

### 2.4 Delete Document

**DELETE** `/api/chef/documents/{documentId}`

Delete a document (only if not verified or if rejected).

**Path Parameters**:
- `documentId` (string, required): Document identifier

**Response**:
```typescript
{
  success: true,
  data: {
    documentId: string;
    deleted: boolean;
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Cannot delete verified document
- `401`: Unauthorized
- `404`: Document not found

---

### 2.5 Get Document Requirements Checklist

**GET** `/api/chef/documents/requirements`

Get the document requirements checklist for onboarding.

**Response**:
```typescript
{
  success: true,
  data: {
    requirements: [
      {
        documentType: string;
        name: string;
        description: string;
        isRequired: boolean;
        status: "not_uploaded" | "pending" | "verified" | "rejected";
        uploadedAt: number | null;
        verifiedAt: number | null;
        rejectionReason: string | null;
      }
    ];
    completionStatus: {
      required: number;
      completed: number;
      pending: number;
      rejected: number;
    };
    canReceiveOrders: boolean;
  }
}
```

---

## 3. Recipe Management Endpoints

### 3.1 Get All Food Creator Recipes

**GET** `/api/chef/recipes`

Get all recipes created by the chef.

**Query Parameters**:
- `status` (string, optional): Filter by status (draft, published, archived)
- `cuisine` (string, optional): Filter by cuisine
- `limit` (number, optional): Limit results (default: 20)
- `offset` (number, optional): Offset for pagination (default: 0)

**Response**:
```typescript
{
  success: true,
  data: {
    recipes: [
      {
        recipeId: string;
        title: string;
        description: string;
        cuisine: string;
        difficulty: "beginner" | "intermediate" | "advanced";
        prepTime: number;
        cookTime: number;
        servings: number;
        images: string[];
        tags: string[];
        status: "draft" | "published" | "archived";
        publishedAt: number | null;
        views: number;
        saves: number;
        shares: number;
        createdAt: number;
        updatedAt: number;
      }
    ];
    total: number;
    limit: number;
    offset: number;
  }
}
```

---

### 3.2 Create Recipe

**POST** `/api/chef/recipes`

Create a new recipe.

**Request Body**:
```typescript
{
  title: string;
  description?: string;
  cuisine: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  ingredients: [
    {
      name: string;
      quantity: number;
      unit: string;
      notes?: string;
      order: number;
    }
  ];
  instructions: [
    {
      step: number;
      instruction: string;
      imageStorageId?: string;
      timeEstimate?: number;
    }
  ];
  images?: string[]; // Array of storage IDs
  tags?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  linkedMealId?: string;
  status?: "draft" | "published";
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    title: string;
    status: string;
    createdAt: number;
  }
}
```

---

### 3.3 Get Recipe Details

**GET** `/api/chef/recipes/{recipeId}`

Get detailed information for a specific recipe.

**Path Parameters**:
- `recipeId` (string, required): Recipe identifier

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    chefId: string;
    title: string;
    description: string;
    cuisine: string;
    difficulty: string;
    prepTime: number;
    cookTime: number;
    totalTime: number;
    servings: number;
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      notes?: string;
      order: number;
    }>;
    instructions: Array<{
      step: number;
      instruction: string;
      imageUrl?: string;
      timeEstimate?: number;
    }>;
    images: string[];
    tags: string[];
    nutritionalInfo: any;
    linkedMealId: string | null;
    status: string;
    publishedAt: number | null;
    views: number;
    saves: number;
    shares: number;
    likes: number;
    comments: number;
    createdAt: number;
    updatedAt: number;
  }
}
```

---

### 3.4 Update Recipe

**PUT** `/api/chef/recipes/{recipeId}`

Update an existing recipe.

**Path Parameters**:
- `recipeId` (string, required): Recipe identifier

**Request Body**: Same as create recipe (all fields optional)

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    updatedAt: number;
  }
}
```

---

### 3.5 Delete Recipe

**DELETE** `/api/chef/recipes/{recipeId}`

Delete a recipe.

**Path Parameters**:
- `recipeId` (string, required): Recipe identifier

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    deleted: boolean;
  }
}
```

---

### 3.6 Publish Recipe

**POST** `/api/chef/recipes/{recipeId}/publish`

Publish a draft recipe.

**Path Parameters**:
- `recipeId` (string, required): Recipe identifier

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    status: "published";
    publishedAt: number;
  }
}
```

---

### 3.7 Archive Recipe

**POST** `/api/chef/recipes/{recipeId}/archive`

Archive a published recipe.

**Path Parameters**:
- `recipeId` (string, required): Recipe identifier

**Response**:
```typescript
{
  success: true,
  data: {
    recipeId: string;
    status: "archived";
  }
}
```

---

## 4. Story Management Endpoints

### 4.1 Get All Food Creator Stories

**GET** `/api/chef/stories`

Get all stories created by the chef.

**Query Parameters**:
- `status` (string, optional): Filter by status
- `category` (string, optional): Filter by category
- `limit` (number, optional): Limit results
- `offset` (number, optional): Offset for pagination

**Response**:
```typescript
{
  success: true,
  data: {
    stories: Array<{
      storyId: string;
      title: string;
      excerpt: string;
      featuredImageUrl: string | null;
      tags: string[];
      category: string | null;
      status: string;
      publishedAt: number | null;
      views: number;
      likes: number;
      comments: number;
      createdAt: number;
    }>;
    total: number;
  }
}
```

---

### 4.2 Create Story

**POST** `/api/chef/stories`

Create a new story.

**Request Body**:
```typescript
{
  title: string;
  content: string; // HTML or markdown
  excerpt?: string;
  featuredImageStorageId?: string;
  images?: string[]; // Array of storage IDs
  tags?: string[];
  category?: string;
  status?: "draft" | "published";
  scheduledPublishAt?: number;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    storyId: string;
    title: string;
    status: string;
    createdAt: number;
  }
}
```

---

### 4.3 Get Story Details

**GET** `/api/chef/stories/{storyId}`

Get detailed information for a specific story.

**Path Parameters**:
- `storyId` (string, required): Story identifier

**Response**:
```typescript
{
  success: true,
  data: {
    storyId: string;
    chefId: string;
    title: string;
    content: string;
    excerpt: string;
    featuredImageUrl: string | null;
    images: Array<{
      url: string;
      caption?: string;
    }>;
    tags: string[];
    category: string | null;
    status: string;
    publishedAt: number | null;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    readingTime: number | null;
    createdAt: number;
    updatedAt: number;
  }
}
```

---

### 4.4 Update Story

**PUT** `/api/chef/stories/{storyId}`

Update an existing story.

**Path Parameters**:
- `storyId` (string, required): Story identifier

**Request Body**: Same as create story (all fields optional)

**Response**:
```typescript
{
  success: true,
  data: {
    storyId: string;
    updatedAt: number;
  }
}
```

---

### 4.5 Delete Story

**DELETE** `/api/chef/stories/{storyId}`

Delete a story.

**Path Parameters**:
- `storyId` (string, required): Story identifier

**Response**:
```typescript
{
  success: true,
  data: {
    storyId: string;
    deleted: boolean;
  }
}
```

---

### 4.6 Publish Story

**POST** `/api/chef/stories/{storyId}/publish`

Publish a draft story.

**Path Parameters**:
- `storyId` (string, required): Story identifier

**Response**:
```typescript
{
  success: true,
  data: {
    storyId: string;
    status: "published";
    publishedAt: number;
  }
}
```

---

## 5. Payout Management Endpoints

### 5.1 Get Earnings Dashboard

**GET** `/api/chef/earnings`

Get earnings dashboard data.

**Query Parameters**:
- `period` (string, optional): Time period (daily, weekly, monthly, yearly, all)
- `startDate` (number, optional): Start date timestamp
- `endDate` (number, optional): End date timestamp

**Response**:
```typescript
{
  success: true,
  data: {
    totalEarnings: number; // in pence
    availableBalance: number; // in pence
    pendingPayouts: number; // in pence
    platformFees: number; // in pence
    netEarnings: number; // in pence
    breakdown: {
      period: string;
      earnings: number;
      fees: number;
      net: number;
      orderCount: number;
    }[];
    recentTransactions: Array<{
      transactionId: string;
      type: "earning" | "payout" | "fee" | "refund";
      amount: number;
      date: number;
      description: string;
      orderId?: string;
    }>;
    charts: {
      earningsOverTime: Array<{
        date: string;
        earnings: number;
      }>;
      ordersOverTime: Array<{
        date: string;
        count: number;
      }>;
    };
  }
}
```

---

### 5.2 Get Payout History

**GET** `/api/chef/payouts`

Get payout history.

**Query Parameters**:
- `status` (string, optional): Filter by status
- `limit` (number, optional): Limit results
- `offset` (number, optional): Offset for pagination

**Response**:
```typescript
{
  success: true,
  data: {
    payouts: Array<{
      payoutId: string;
      amount: number; // in pence
      currency: "gbp";
      status: "pending" | "processing" | "completed" | "failed" | "cancelled";
      requestedAt: number;
      processedAt: number | null;
      completedAt: number | null;
      estimatedArrivalDate: number | null;
      actualArrivalDate: number | null;
      failureReason: string | null;
      bankAccount: {
        accountHolderName: string;
        bankName: string;
        last4: string; // Last 4 digits of account
      };
    }>;
    total: number;
  }
}
```

---

### 5.3 Request Payout

**POST** `/api/chef/payouts/request`

Request a new payout.

**Request Body**:
```typescript
{
  bankAccountId: string;
  amount?: number; // in pence, if not provided, uses all available
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    payoutId: string;
    amount: number;
    status: "pending";
    requestedAt: number;
    estimatedArrivalDate: number; // 1-3 business days
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid amount or insufficient balance
- `401`: Unauthorized
- `500`: Internal server error

---

### 5.4 Get Payout Details

**GET** `/api/chef/payouts/{payoutId}`

Get details for a specific payout.

**Path Parameters**:
- `payoutId` (string, required): Payout identifier

**Response**:
```typescript
{
  success: true,
  data: {
    payoutId: string;
    chefId: string;
    bankAccountId: string;
    amount: number;
    currency: "gbp";
    fees: number;
    netAmount: number;
    status: string;
    requestedAt: number;
    processedAt: number | null;
    completedAt: number | null;
    estimatedArrivalDate: number | null;
    actualArrivalDate: number | null;
    failureReason: string | null;
    stripePayoutId: string | null;
    transactionId: string | null;
  }
}
```

---

## 6. Bank Account Management Endpoints

### 6.1 Get Bank Accounts

**GET** `/api/chef/bank-accounts`

Get all bank accounts for the chef.

**Response**:
```typescript
{
  success: true,
  data: {
    bankAccounts: Array<{
      accountId: string;
      accountHolderName: string;
      bankName: string;
      last4: string; // Last 4 digits of account number
      isPrimary: boolean;
      verified: boolean;
      verifiedAt: number | null;
      createdAt: number;
      lastUsedAt: number | null;
    }>;
  }
}
```

---

### 6.2 Add Bank Account

**POST** `/api/chef/bank-accounts`

Add a new bank account.

**Request Body**:
```typescript
{
  accountHolderName: string;
  accountNumber: string; // 8 digits
  sortCode: string; // 6 digits, format: "XX-XX-XX"
  bankName: string;
  accountType?: "checking" | "savings";
  isPrimary?: boolean;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    accountId: string;
    accountHolderName: string;
    bankName: string;
    last4: string;
    verified: false;
    status: "pending_verification";
  }
}
```

---

### 6.3 Update Bank Account

**PUT** `/api/chef/bank-accounts/{accountId}`

Update a bank account (limited fields).

**Path Parameters**:
- `accountId` (string, required): Bank account identifier

**Request Body**:
```typescript
{
  isPrimary?: boolean;
  accountHolderName?: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    accountId: string;
    updatedAt: number;
  }
}
```

---

### 6.4 Delete Bank Account

**DELETE** `/api/chef/bank-accounts/{accountId}`

Delete a bank account (only if not primary and no pending payouts).

**Path Parameters**:
- `accountId` (string, required): Bank account identifier

**Response**:
```typescript
{
  success: true,
  data: {
    accountId: string;
    deleted: boolean;
  }
}
```

---

### 6.5 Verify Bank Account

**POST** `/api/chef/bank-accounts/{accountId}/verify`

Initiate bank account verification via Stripe Financial Connections.

**Path Parameters**:
- `accountId` (string, required): Bank account identifier

**Response**:
```typescript
{
  success: true,
  data: {
    accountId: string;
    verificationUrl: string; // Stripe Financial Connections URL
    expiresAt: number; // URL expiration timestamp
  }
}
```

---

## 7. Tax Management Endpoints

### 7.1 Get Tax Records

**GET** `/api/chef/tax-records`

Get all tax records for the chef.

**Response**:
```typescript
{
  success: true,
  data: {
    taxRecords: Array<{
      taxYear: string;
      taxYearStart: number;
      taxYearEnd: number;
      totalEarnings: number;
      platformFees: number;
      netEarnings: number;
      orderCount: number;
      documentUrl: string | null;
      generatedAt: number;
    }>;
  }
}
```

---

### 7.2 Get Tax Year Summary

**GET** `/api/chef/tax-records/{taxYear}`

Get detailed tax year summary.

**Path Parameters**:
- `taxYear` (string, required): Tax year (e.g., "2023-2024")

**Response**:
```typescript
{
  success: true,
  data: {
    taxYear: string;
    taxYearStart: number;
    taxYearEnd: number;
    totalEarnings: number;
    platformFees: number;
    netEarnings: number;
    orderCount: number;
    breakdown: Array<{
      month: string;
      monthStart: number;
      monthEnd: number;
      earnings: number;
      fees: number;
      net: number;
      orderCount: number;
    }>;
    utrNumber: string | null;
    vatRegistered: boolean;
    vatNumber: string | null;
    selfEmployed: boolean;
    documentUrl: string | null;
    generatedAt: number;
  }
}
```

---

### 7.3 Download Tax Document

**GET** `/api/chef/tax-records/{taxYear}/download`

Download tax document as PDF.

**Path Parameters**:
- `taxYear` (string, required): Tax year

**Response**: PDF file download

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="tax-record-2023-2024.pdf"
```

---

## 8. Status Management Endpoints

### 8.1 Go Online

**POST** `/api/chef/status/online`

Set food creator status to online (available to receive orders).

**Response**:
```typescript
{
  success: true,
  data: {
    status: "online";
    updatedAt: number;
  }
}
```

---

### 8.2 Go Offline

**POST** `/api/chef/status/offline`

Set food creator status to offline (not available for orders).

**Response**:
```typescript
{
  success: true,
  data: {
    status: "offline";
    updatedAt: number;
  }
}
```

---

### 8.3 Get Current Status

**GET** `/api/chef/status`

Get current food creator status.

**Response**:
```typescript
{
  success: true,
  data: {
    isOnline: boolean;
    isLive: boolean;
    lastOnlineAt: number | null;
    availability: {
      days: string[];
      hours: {
        [day: string]: {
          start: string;
          end: string;
        }[];
      };
      maxOrdersPerDay: number;
    };
    canReceiveOrders: boolean;
    restrictions: string[]; // Reasons why orders might be restricted
  }
}
```

---

### 8.4 Start Live Stream

**POST** `/api/chef/live/start`

Start a live streaming session.

**Request Body**:
```typescript
{
  title: string;
  description?: string;
  thumbnailStorageId?: string;
  scheduledStartTime?: number;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    sessionId: string;
    streamUrl: string;
    streamKey: string;
    status: "starting";
    startedAt: number;
  }
}
```

---

### 8.5 End Live Stream

**POST** `/api/chef/live/end`

End a live streaming session.

**Request Body**:
```typescript
{
  sessionId: string;
  saveAsVideo?: boolean;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    sessionId: string;
    status: "ended";
    endedAt: number;
    videoId: string | null; // If saved as video
    stats: {
      duration: number;
      peakViewers: number;
      totalViewers: number;
      totalOrders: number;
    };
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```typescript
{
  success: false,
  error: "Validation error",
  message: "Invalid request parameters",
  details?: any
}
```

### 401 Unauthorized
```typescript
{
  success: false,
  error: "Unauthorized",
  message: "Authentication required"
}
```

### 403 Forbidden
```typescript
{
  success: false,
  error: "Forbidden",
  message: "You don't have permission to access this resource"
}
```

### 404 Not Found
```typescript
{
  success: false,
  error: "Not Found",
  message: "Resource not found"
}
```

### 500 Internal Server Error
```typescript
{
  success: false,
  error: "Internal Server Error",
  message: "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per chef
- **File upload endpoints**: 10 requests per minute per chef
- **Payout endpoints**: 5 requests per minute per chef

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Versioning

API versioning is handled via URL path:
- Current version: `/api/chef/v1/...` (or just `/api/chef/...`)
- Future versions: `/api/chef/v2/...`

---

## Webhooks

The platform may send webhooks for certain events:
- Payout completed
- Document verified
- Course completed
- Order received (if food creator is offline)

Webhook payload format:
```typescript
{
  event: string;
  timestamp: number;
  data: any;
  signature: string; // For verification
}
```

