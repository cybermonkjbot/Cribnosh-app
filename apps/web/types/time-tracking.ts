/**
 * Time Tracking Types
 * Type definitions for time tracking, timelogs, and work sessions
 */

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Time Tracking Entry Status
 */
export type TimeTrackingStatus =
  | "in_progress"
  | "completed"
  | "paused"
  | "cancelled";

/**
 * Time Tracking Entry
 */
export interface TimeTrackingEntry {
  _id?: Id<"timelogs">;
  _creationTime?: number;
  userId: string;
  project: string;
  task: string;
  description?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: TimeTrackingStatus;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Time Tracking Report Filters
 */
export interface TimeTrackingFilters {
  users?: Id<"users">[];
  departments?: string[];
  projects?: string[];
  status?: TimeTrackingStatus[];
}

/**
 * Time Tracking Report Metrics
 */
export interface TimeTrackingMetrics {
  totalHours: number;
  totalSessions: number;
  averageSessionDuration: number;
  topUsers: Array<{
    userId: Id<"users">;
    userName: string;
    totalHours: number;
    sessions: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    totalHours: number;
    activeUsers: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    totalHours: number;
    sessions: number;
  }>;
}

/**
 * Time Tracking Report
 */
export interface TimeTrackingReport {
  reportId: string;
  startDate: number;
  endDate: number;
  filters: TimeTrackingFilters;
  metrics: TimeTrackingMetrics;
  generatedAt: number;
}

