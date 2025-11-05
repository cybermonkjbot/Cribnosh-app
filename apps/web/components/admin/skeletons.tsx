'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * UsersTableSkeleton - Matches users table structure exactly
 * Row structure: Avatar circle, name + email stack, badge, badge, date with icon, action buttons
 */
export function UsersTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <>
      {[...Array(rowCount)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                {/* Name */}
                <Skeleton className="h-4 w-32" />
                {/* Email with icon container */}
                <div className="flex items-center gap-1">
                  <Skeleton className="w-3 h-3" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Badge (rounded-full) */}
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="px-6 py-4">
            {/* Badge (rounded-full) */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-6 py-4">
            {/* Date with icon container */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * AdminStatsGridSkeleton - Matches stats card structure exactly
 * Card structure: Icon container, title text, trend badge (top right), large number
 */
export function AdminStatsGridSkeleton({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(cardCount)].map((_, i) => (
        <div
          key={i}
          className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200/20 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Icon container */}
              <Skeleton className="w-9 h-9 rounded-lg" />
              {/* Title */}
              <Skeleton className="h-4 w-32" />
            </div>
            {/* Trend badge (top right) */}
            <Skeleton className="h-5 w-12 rounded" />
          </div>
          {/* Large number */}
          <Skeleton className="mt-3 h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * PayrollCardSkeleton - Matches payroll stat card structure exactly
 * Card structure: Icon container, trending icon (top right), large number, label text, subtitle text
 */
export function PayrollCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        {/* Icon container */}
        <Skeleton className="w-14 h-14 rounded-xl" />
        {/* Trending icon (top right) */}
        <Skeleton className="w-5 h-5 rounded" />
      </div>
      {/* Large number */}
      <Skeleton className="h-9 w-20 mb-2" />
      {/* Label text */}
      <Skeleton className="h-4 w-40 mt-3" />
      {/* Subtitle text */}
      <Skeleton className="h-4 w-32 mt-3" />
    </div>
  );
}

/**
 * WaitlistCardSkeleton - Matches waitlist entry card structure exactly
 * Header with icon + title, badges row, contact info with icons, metadata footer
 */
export function WaitlistCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-white/70 backdrop-blur-lg rounded-2xl border border-primary-100 p-4 animate-pulse",
      className
    )}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {/* Icon */}
              <Skeleton className="w-4 h-4" />
              {/* Title */}
              <Skeleton className="h-5 w-48" />
            </div>
            {/* Badges row */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t border-gray-200/50">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TimeTrackingTableSkeleton - Matches time tracking table structure
 * Row structure: Staff ID with icon, clock in time with icon, clock out time with icon, duration, status badge, notes, actions
 */
export function TimeTrackingTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <>
      {[...Array(rowCount)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Staff ID icon container */}
              <Skeleton className="w-8 h-8 rounded-full" />
              {/* Staff ID text */}
              <Skeleton className="h-4 w-24" />
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Clock in time with icon */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Clock out time with icon */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Duration */}
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-6 py-4">
            {/* Status badge */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-6 py-4">
            {/* Notes */}
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-6 py-4">
            {/* Actions */}
            <Skeleton className="h-8 w-24 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * PayrollReportsSkeleton - Matches payroll reports page structure
 * Summary cards (4 cards matching report card structure)
 */
export function PayrollReportsSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="w-4 h-4 rounded" />
          </div>
          <div className="space-y-2 mt-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * PayrollReportsChartSkeleton - Matches chart container dimensions
 */
export function PayrollReportsChartSkeleton() {
  return (
    <Skeleton className="h-[300px] w-full rounded-lg animate-pulse" />
  );
}

/**
 * PayrollReportsTableSkeleton - Matches reports table structure
 */
export function PayrollReportsTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(rowCount)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

/**
 * AdminPageSkeleton - For full-page loading (replaces spinners)
 */
export function AdminPageSkeleton({ 
  title, 
  description 
}: { 
  title?: string; 
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-300 shadow-xl w-full max-w-sm sm:max-w-md">
        <div className="text-center space-y-4">
          {/* Spinner or skeleton */}
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-gray-900 mx-auto"></div>
          {title && <h1 className="text-xl sm:text-2xl font-bold font-asgard text-gray-800">{title}</h1>}
          {description ? (
            <p className="text-gray-600 font-satoshi text-sm sm:text-base">{description}</p>
          ) : (
            <p className="text-gray-600 font-satoshi text-sm sm:text-base">Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton - Matches dashboard page structure
 * Stats grid section, cards section, activity sections
 */
export function DashboardSkeleton() {
  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* Header skeleton */}
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Stats grid */}
      <AdminStatsGridSkeleton cardCount={4} />

      {/* Cards section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl animate-pulse">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl animate-pulse">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StaffTableSkeleton - Matches staff table structure
 * Similar to UsersTableSkeleton but for staff table
 */
export function StaffTableSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <>
      {[...Array(rowCount)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                {/* Name */}
                <Skeleton className="h-4 w-32" />
                {/* ID text */}
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            {/* Email */}
            <Skeleton className="h-4 w-40" />
          </td>
          <td className="px-6 py-4">
            {/* Badge */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </td>
          <td className="px-6 py-4">
            {/* Badge */}
            <Skeleton className="h-6 w-16 rounded-full" />
          </td>
          <td className="px-6 py-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * AccountSettingsSkeleton - Matches account settings form structure
 * Profile picture, form fields
 */
export function AccountSettingsSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center gap-2 mb-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Form Fields */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * AnalyticsPageSkeleton - Matches analytics page structure
 * Metrics grid and charts
 */
export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * StaffStatsSkeleton - Matches staff stats grid structure
 * Grid of stat cards (3 columns)
 */
export function StaffStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-primary-50 rounded-xl p-6 flex flex-col items-center">
          <Skeleton className="w-8 h-8 rounded-lg mb-2" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * StaffActivitySkeleton - Matches staff activity section structure
 */
export function StaffActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3 divide-y divide-primary-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3 divide-y divide-primary-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * RequestListSkeleton - Matches request list/table structure
 */
export function RequestListSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="min-w-full divide-y divide-primary-200">
        <thead>
          <tr className="bg-primary-50">
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-32" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-28" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-200">
          {[...Array(rowCount)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * WorkIdListSkeleton - Matches work ID list structure
 */
export function WorkIdListSkeleton({ rowCount = 5 }: { rowCount?: number }) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="min-w-full divide-y divide-primary-200">
        <thead>
          <tr className="bg-primary-50">
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-32" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-28" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="px-4 py-2 text-left">
              <Skeleton className="h-4 w-32" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary-200">
          {[...Array(rowCount)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

