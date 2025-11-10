/**
 * API request/response types for driver endpoints
 */

// Authentication types
export interface PhoneLoginData {
  phoneNumber: string;
  otp?: string;
}

export interface PhoneLoginResponse {
  success: boolean;
  data: {
    sessionToken: string;
    driver?: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      status: string;
      availability: string;
    };
  };
  message: string;
}

export interface SendOTPResponse {
  success: boolean;
  data: {
    sessionId: string;
    expiresAt: number;
  };
  message: string;
}

// Driver profile types
export interface GetDriverProfileResponse {
  success: boolean;
  data: {
    driver: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
      vehicle: string;
      vehicleType: string;
      status: string;
      availability: string;
      rating?: number;
      totalDeliveries?: number;
      totalEarnings?: number;
      currentLocation?: {
        latitude: number;
        longitude: number;
        updatedAt: number;
      };
    };
  };
  message: string;
}

export interface UpdateDriverProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  vehicle?: string;
  vehicleType?: string;
}

export interface UpdateDriverProfileResponse {
  success: boolean;
  data: {
    driver: {
      _id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  message: string;
}

// Orders types
export interface GetDriverOrdersResponse {
  success: boolean;
  data: {
    orders: {
      _id: string;
      order_id: string;
      order_status: string;
      delivery_assignment?: {
        _id: string;
        status: string;
        pickup_location: {
          latitude: number;
          longitude: number;
          address: string;
        };
        delivery_location: {
          latitude: number;
          longitude: number;
          address: string;
        };
      };
      created_at: number;
    }[];
    total: number;
    limit: number;
    offset: number;
  };
  message: string;
}

export interface GetDriverOrderResponse {
  success: boolean;
  data: {
    order: {
      _id: string;
      order_id: string;
      order_status: string;
      status?: string;
      customer_id?: string;
      customerId?: string;
      delivery_address?: {
        street: string;
        city: string;
        state?: string;
        country?: string;
        postalCode?: string;
        latitude?: number;
        longitude?: number;
      };
      order_items?: Array<{
        _id: string;
        product: string;
        quantity: number;
        price: number;
      }>;
      total_amount?: number;
      ratingComment?: string;
      _creationTime?: number;
      createdAt?: number;
      delivery_assignment?: {
        _id: string;
        status: string;
        estimated_pickup_time?: number;
        estimated_delivery_time?: number;
        pickup_location: {
          latitude: number;
          longitude: number;
          address: string;
        };
        delivery_location: {
          latitude: number;
          longitude: number;
          address: string;
        };
      };
    };
    assignment?: {
      _id: string;
      status: string;
      estimated_pickup_time?: number;
      estimated_delivery_time?: number;
      pickup_location: {
        latitude: number;
        longitude: number;
        address: string;
      };
      delivery_location: {
        latitude: number;
        longitude: number;
        address: string;
      };
    };
  };
  message: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  data: {
    order: {
      _id: string;
      order_status: string;
    };
  };
  message: string;
}

// Location update types
export interface UpdateDriverLocationRequest {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  availability?: 'available' | 'busy' | 'offline' | 'on_delivery';
  metadata?: any;
}

export interface UpdateDriverLocationResponse {
  success: boolean;
  data: {
    driverId: string;
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    availability: string;
    updatedAt: string;
  };
  message: string;
}

// Earnings types
export interface GetDriverEarningsResponse {
  success: boolean;
  data: {
    earnings: {
      total: number;
      thisWeek: number;
      thisMonth: number;
      transactions: {
        _id: string;
        amount: number;
        order_id: string;
        date: number;
        status: string;
      }[];
    };
  };
  message: string;
}

// Documents types
export interface GetDriverDocumentsResponse {
  success: boolean;
  data: {
    documents: Array<{
      _id: string;
      type: string;
      url: string;
      verified: boolean;
      verifiedAt?: number;
      uploadedAt?: number;
    }>;
    driver?: {
      driversLicense?: string;
      vehicleRegistration?: string;
      insurance?: string;
      verificationStatus?: 'pending' | 'approved' | 'rejected' | 'on_hold';
      verificationNotes?: string;
    };
  };
  message: string;
}

export interface UploadDriverDocumentRequest {
  type: string;
  file: FormData;
}

export interface UploadDriverDocumentResponse {
  success: boolean;
  data: {
    document: {
      type: string;
      url: string;
      verified: boolean;
    };
  };
  message: string;
}

// User types
export interface GetUserByIdResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      email: string;
      fullName?: string;
      name?: string;
      phone?: string;
      roles?: string[];
      _creationTime?: number;
    };
  };
  message: string;
}

// Performance analytics types
export interface GetDriverPerformanceAnalyticsResponse {
  success: boolean;
  data: {
    score: number;
    trend: number;
    ordersCompleted: number;
    averageRating?: number;
    completionRate?: number;
    onTimeDeliveryRate?: number;
    customerFeedbackCount?: number;
    averageDeliveryTime?: number;
    failedDeliveries?: number;
    safetyIncidents?: number;
    breakdown?: Record<string, any>;
  };
  message: string;
}

// Advanced earnings types
export interface GetDriverAdvancedEarningsResponse {
  success: boolean;
  data: {
    total_earnings: number;
    weekly_earnings: number;
    monthly_earnings: number;
    earnings_breakdown: {
      base_earnings: number;
      tips: number;
      bonuses: number;
      incentives: number;
    };
    earnings_trend: number;
    goals: {
      weekly_target: number;
      monthly_target: number;
      weekly_progress: number;
      monthly_progress: number;
    };
    performance: {
      average_order_value: number;
      orders_completed: number;
      average_rating: number;
      completion_rate: number;
    };
  };
  message: string;
}

// Payout history types
export interface GetDriverPayoutHistoryResponse {
  success: boolean;
  data: {
    payouts: {
      _id: string;
      amount: number;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
      requestedAt: number;
      processedAt?: number;
      bankDetails?: {
        accountNumber: string;
        bankName: string;
        accountName: string;
      };
    }[];
    total: number;
    limit: number;
    offset: number;
  };
  message: string;
}

// File upload types
export interface GenerateUploadUrlRequest {
  fileName: string;
  contentType: string;
  fileSize?: number;
  metadata?: any;
}

export interface GenerateUploadUrlResponse {
  success: boolean;
  data: {
    url: string;
    objectKey: string;
    storageType: string;
    expiresAt: number;
  };
  message: string;
}

export interface ConfirmUploadRequest {
  storageId: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
  metadata?: any;
}

export interface ConfirmUploadResponse {
  success: boolean;
  data: {
    fileId: string;
    fileUrl: string;
    storageId: string;
    fileName: string;
    contentType: string;
    fileSize?: number;
    metadata?: any;
  };
  message: string;
}

// Legal content types
export interface GetLegalContentResponse {
  success: boolean;
  data: {
    title: string;
    content: string;
    lastUpdated: number;
  };
  message: string;
}

// Help FAQs types
export interface GetHelpFAQsResponse {
  success: boolean;
  data: {
    categories: {
      category: string;
      questions: {
        question: string;
        answer: string;
      }[];
    }[];
    lastUpdated: number;
  };
  message: string;
}

// Logout types
export interface LogoutResponse {
  success: boolean;
  data: {
    message: string;
  };
  message: string;
}

