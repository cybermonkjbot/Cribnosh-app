"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Filter, Search, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface OrderFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  timeFilter: string;
  onTimeFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

export function OrderFilterBar({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  timeFilter,
  onTimeFilterChange,
  sortBy,
  onSortByChange,
  totalCount = 0,
  filteredCount,
  className = "",
}: OrderFilterBarProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters =
    searchValue !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    timeFilter !== "today" ||
    sortBy !== "recent";

  const handleClearAll = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onPaymentFilterChange("all");
    onTimeFilterChange("today");
    onSortByChange("recent");
  };

  const displayCount = filteredCount !== undefined ? filteredCount : totalCount;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search - Prominent */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by customer, food creator, city, or order ID..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />
          </div>

          {/* Desktop Filters - Inline */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="h-10 w-[140px] bg-white border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
              <SelectTrigger className="h-10 w-[140px] bg-white border-gray-200">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={onTimeFilterChange}>
              <SelectTrigger className="h-10 w-[120px] bg-white border-gray-200">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="h-10 w-[140px] bg-white border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Count Display */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px]">
              <ShoppingBag className="w-4 h-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{displayCount}</span>
                <span className="text-xs text-gray-500">Orders</span>
              </div>
            </div>

            {/* Clear Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full h-10 bg-white border-gray-200 justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
                )}
              </div>
              {showMobileFilters ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Filter Panel */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 space-y-3 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Status</label>
                  <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Payment</label>
                  <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Time</label>
                  <Select value={timeFilter} onValueChange={onTimeFilterChange}>
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Sort by</label>
                  <Select value={sortBy} onValueChange={onSortByChange}>
                    <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recent</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{displayCount}</span>
                    <span className="text-xs text-gray-500">Orders</span>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <span className="text-xs font-medium text-gray-600">Active filters:</span>

          {searchValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">
              Search: "{searchValue}"
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:text-gray-900"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange("all")}
                className="ml-1 hover:text-gray-900"
                aria-label="Clear status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {paymentFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">
              Payment: {paymentFilter}
              <button
                onClick={() => onPaymentFilterChange("all")}
                className="ml-1 hover:text-gray-900"
                aria-label="Clear payment filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {timeFilter !== "today" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">
              Time: {timeFilter}
              <button
                onClick={() => onTimeFilterChange("today")}
                className="ml-1 hover:text-gray-900"
                aria-label="Clear time filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {sortBy !== "recent" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200">
              Sort: {sortBy}
              <button
                onClick={() => onSortByChange("recent")}
                className="ml-1 hover:text-gray-900"
                aria-label="Clear sort"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-auto"
          >
            Clear all
          </Button>
        </motion.div>
      )}
    </div>
  );
}

