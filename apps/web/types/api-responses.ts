/**
 * API Response Types
 * Type definitions for API responses and request payloads
 */

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Generic API Response
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Order Item for Analytics
 */
export interface OrderItem {
  _id: Id<"custom_orders">;
  order_date?: number;
  order_status?: string;
  total_amount?: number;
  cuisine_id?: string;
  foodCreatorId?: Id<"chefs">;
  order_items?: Array<{
    menuId?: string;
    name?: string;
    quantity?: number;
    price?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Food Creator Document Structure
 */
export interface FoodCreatorDoc {
  _id: Id<"chefs">;
  userId: Id<"users">;
  foodCreatorId: Id<"chefs">;
  [key: string]: unknown;
}

/**
 * User Document Structure
 */
export interface UserDoc {
  _id: Id<"users">;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Leave Request Structure
 */
export interface LeaveRequest {
  _id: Id<"leaveRequests">;
  staffId: Id<"users">;
  startDate: number;
  endDate: number;
  type: string;
  status: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Work Email Request Structure
 */
export interface WorkEmailRequest {
  _id: Id<"workEmailRequests">;
  staffId: Id<"users">;
  requestedEmail: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Staff Dashboard Data
 */
export interface StaffDashboardData {
  staff: Array<{
    _id: Id<"users">;
    email: string;
    name: string;
    position?: string;
    department?: string;
    [key: string]: unknown;
  }>;
  pendingWorkEmailRequests: WorkEmailRequest[];
  pendingLeaveRequests: LeaveRequest[];
  recentWorkIds: Id<"workSessions">[];
}

/**
 * Waitlist Campaign Structure
 */
export interface WaitlistCampaign {
  _id: string;
  templateId: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  openRate?: number;
  [key: string]: unknown;
}

/**
 * User Permission Data
 */
export interface UserPermissionData {
  userId: Id<"users">;
  permissions: Array<{
    _id: Id<"permissions">;
    name: string;
    category: string;
    [key: string]: unknown;
  }>;
}

/**
 * Permission Structure
 */
export interface Permission {
  _id: Id<"permissions">;
  name: string;
  category: string;
  [key: string]: unknown;
}

/**
 * Notification Structure
 */
export interface Notification {
  _id: Id<"notifications">;
  userId?: Id<"users">;
  type: string;
  title?: string;
  message: string;
  createdAt: number;
  read?: boolean;
  [key: string]: unknown;
}

/**
 * Revenue Analytics API Response
 */
export interface RevenueAnalyticsResponse {
  revenueByDate: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByLocation?: Array<{
    location: string;
    revenue: number;
    orderCount: number;
  }>;
  topProducts?: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orderCount: number;
  }>;
}

