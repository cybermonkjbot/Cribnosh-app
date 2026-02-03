// @ts-nocheck
import { Id } from "../_generated/dataModel";
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

// Role constants to avoid importing from agora-access-token
export const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2
} as const;

export type RtcRole = typeof RtcRole[keyof typeof RtcRole];

export interface Location {
  coordinates: [number, number];
  address?: string;
  city?: string;
}

export interface LiveSession {
  _id: Id<"liveSessions">;
  _creationTime: number;
  channelName: string;
  chefId: Id<"chefs">;
  title: string;
  description: string;
  mealId: Id<"meals">;
  isActive: boolean;
  startedAt: number;
  endedAt?: number;
  endReason?: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  thumbnailUrl?: string;
  tags: string[];
  viewerCount: number;
  peakViewers: number;
  userId?: Id<"users">;
}

export interface LiveSessionReport {
  _id: Id<"liveSessionReports">;
  _creationTime: number;
  sessionId: Id<"liveSessions">;
  reporterId: Id<"users">;
  channelName: string;
  reason: string;
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  reportedAt: number;
  resolvedAt?: number;
  resolvedBy?: Id<"users">;
  resolutionNotes?: string;
}

export interface LiveOrder {
  _id: Id<"liveOrders">;
  _creationTime: number;
  sessionId: Id<"liveSessions">;
  userId: Id<"users">;
  mealId: Id<"meals">;
  quantity: number;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  deliveredAt?: number;
  cancelledAt?: number;
  cancellationReason?: string;
}

export interface LiveViewer {
  _id: Id<"liveViewers">;
  _creationTime: number;
  sessionId: Id<"liveSessions">;
  userId: Id<"users">;
  joinedAt: number;
  leftAt?: number;
  lastActiveAt: number;
}

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  name: string;
  email: string;
  roles?: string[];
  status?: "active" | "inactive" | "suspended";
  lastActiveAt?: number;
  profileImageUrl?: string;
}

export type OrderStatus = 
  | "pending" 
  | "confirmed" 
  | "preparing" 
  | "ready" 
  | "out_for_delivery" 
  | "delivered" 
  | "cancelled" 
  | "refunded";

export const TOKEN_EXPIRY_SECONDS = 7200; // 2 hours
export const MAX_DISTANCE_KM = 50; // Maximum distance to show live sessions

// Extend the base Convex context with our custom types
export type ConvexContext = ActionCtx & {
  auth: {
    getUserIdentity: () => Promise<{
      tokenIdentifier: string;
      subject: string;
      name?: string;
      givenName?: string;
      familyName?: string;
      nickname?: string;
      preferredUsername?: string;
      profileUrl?: string;
      picture?: string;
      website?: string;
      email?: string;
      emailVerified?: boolean;
      gender?: string;
      birthdate?: string;
      zoneinfo?: string;
      locale?: string;
      phoneNumber?: string;
      phoneNumberVerified?: boolean;
      updatedAt?: number;
      // Add issuer to match UserIdentity type
      issuer: string;
    } | null>;
  };
  // These are already included in ActionCtx, no need to redeclare
  // db: ActionCtx["db"];
  // scheduler: ActionCtx["scheduler"];
  // runAction: ActionCtx["runAction"];
  // runMutation: ActionCtx["runMutation"];
  // runQuery: QueryCtx["runQuery"];
  admin?: {
    getToken: () => Promise<string>;
  }
};

export interface FunctionReference<T extends {
  _args: any;
  _return: any;
}> {
  _args: T['_args'];
  _return: T['_return'];
}

// Helper function to calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Import types from dataModel
import type { TableNames as DataModelTableNames, Doc as DataModelDoc } from "../_generated/dataModel";

// Helper types for database operations
type WithoutSystemFields<T> = Omit<T, '_id' | '_creationTime'>;

type PartialWithId<TableName extends DataModelTableNames> = 
  Partial<WithoutSystemFields<DataModelDoc<TableName>>> & { 
    _id: Id<TableName> 
  };

// Re-export types for convenience
export type TableNames = DataModelTableNames;
export type Doc<TableName extends TableNames> = DataModelDoc<TableName>;

export type { 
  WithoutSystemFields, 
  PartialWithId 
};
