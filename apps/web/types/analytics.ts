/**
 * Analytics Types
 * Type definitions for analytics data, reports, and statistics
 */

import type { Id } from "@/convex/_generated/dataModel";
import type { TableNames } from "@/convex/_generated/dataModel";

/**
 * Date Range for Analytics
 */
export type DateRange = "day" | "week" | "month" | "year" | "custom";

/**
 * Grouped Analytics Data by Date
 */
export interface GroupedByDateData {
  date: string;
  count: number;
  value: number;
  [key: string]: string | number;
}

/**
 * Sales by Status
 */
export interface SalesByStatus {
  status: string;
  count: number;
  revenue: number;
}

/**
 * Sales by Cuisine
 */
export interface SalesByCuisine {
  cuisine_id: string;
  count: number;
  revenue: number;
}

/**
 * Top Food Creator Stats
 */
export interface TopFoodCreatorStats {
  foodCreatorId: Id<"chefs">;
  userId?: Id<"users">;
  foodCreatorName: string;
  userName?: string;
  orderCount: number;
  revenue: number;
}

/**
 * Top Menu Item Stats
 */
export interface TopMenuItemStats {
  menuId: string; // Changed from Id<"menus"> since menus table doesn't exist
  menuName: string;
  foodCreatorId: Id<"chefs">;
  foodCreatorName: string;
  userId?: Id<"users">;
  userName?: string;
  orderCount: number;
  revenue: number;
}

/**
 * Revenue by Location
 */
export interface RevenueByLocation {
  location: string;
  revenue: number;
  orderCount: number;
}

/**
 * Top Product Stats
 */
export interface TopProductStats {
  productId: string;
  productName: string;
  revenue: number;
  orderCount: number;
}

/**
 * Revenue Analytics Response
 */
export interface RevenueAnalytics {
  revenueByDate: GroupedByDateData[];
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByLocation?: RevenueByLocation[];
  topProducts?: TopProductStats[];
}

/**
 * Sales Analytics Response
 */
export interface SalesAnalytics {
  sales_by_status: Record<string, SalesByStatus>;
  sales_by_cuisine: SalesByCuisine[];
  period: string;
}

/**
 * Analytics Chart Payload
 */
export interface AnalyticsChartPayload {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * Event Count Map
 */
export type EventCountMap = Record<string, number>;

/**
 * Template Stats Map
 */
export type TemplateStatsMap = Record<string, {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}>;

/**
 * Device Stats Map
 */
export type DeviceStatsMap = Record<string, {
  count: number;
  percentage: number;
}>;

/**
 * Grouped Analytics Data
 */
export interface GroupedAnalyticsData {
  [key: string]: {
    count: number;
    value: number;
    [key: string]: string | number;
  };
}

