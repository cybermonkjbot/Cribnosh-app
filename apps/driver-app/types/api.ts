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
    documents: {
      type: string;
      url: string;
      verified: boolean;
      verifiedAt?: number;
    }[];
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

