/**
 * Driver type definitions matching Cribnosh schema
 */

import type { Id } from '../../packages/convex/_generated/dataModel';

export type DriverStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'on_hold'
  | 'active'
  | 'inactive'
  | 'suspended';

export type DriverAvailability = 
  | 'available'
  | 'busy'
  | 'offline'
  | 'on_delivery';

export type VehicleType = 
  | 'car'
  | 'motorcycle'
  | 'bicycle'
  | 'scooter'
  | 'van';

export interface Driver {
  _id: Id<'drivers'>;
  userId?: Id<'users'>;
  name: string;
  email: string;
  phone?: string;
  vehicle: string;
  vehicleType: VehicleType;
  licenseNumber?: string;
  experience?: number;
  status: DriverStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: number;
  };
  availability: DriverAvailability;
  rating?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  // Document fields
  driversLicense?: string;
  driversLicenseFileId?: string;
  driversLicenseUploadedAt?: number;
  vehicleRegistration?: string;
  vehicleRegistrationFileId?: string;
  vehicleRegistrationUploadedAt?: number;
  insurance?: string;
  insuranceFileId?: string;
  insuranceUploadedAt?: number;
  // Verification status
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'on_hold';
  verificationNotes?: string;
  documents?: {
    type: string;
    url: string;
    verified: boolean;
    verifiedAt?: number;
  }[];
  createdAt: number;
  updatedAt?: number;
}

export interface DeliveryAssignment {
  _id: Id<'deliveryAssignments'>;
  order_id: Id<'orders'>;
  driver_id: Id<'drivers'>;
  assigned_by: Id<'users'>;
  assigned_at: number;
  estimated_pickup_time?: number;
  estimated_delivery_time?: number;
  actual_pickup_time?: number;
  actual_delivery_time?: number;
  pickup_location: {
    latitude: number;
    longitude: number;
    address: string;
    instructions?: string;
  };
  delivery_location: {
    latitude: number;
    longitude: number;
    address: string;
    instructions?: string;
  };
  status: 
    | 'assigned'
    | 'accepted'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'failed'
    | 'cancelled';
  delivery_notes?: string;
  customer_rating?: number;
  customer_feedback?: string;
  metadata?: any;
}

