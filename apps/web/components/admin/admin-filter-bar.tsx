"use client";

import { useState } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterOption[];
  showActiveFilters?: boolean;
  onClearAll?: () => void;
  className?: string;
}

export function AdminFilterBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  showActiveFilters = true,
  onClearAll,
  className = "",
}: AdminFilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get active filters (non-default values)
  const activeFilters = filters.filter(
    (filter) => filter.value !== "all" && filter.value !== ""
  );
  const hasActiveFilters = activeFilters.length > 0 || searchValue !== "";

  const handleClearAll = () => {
    onSearchChange("");
    filters.forEach((filter) => {
      if (filter.value !== "all" && filter.value !== "") {
        filter.onChange("all");
      }
    });
    onClearAll?.();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input - Always Visible */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
          />
        </div>

        {/* Desktop Filters - Inline */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="h-10 min-w-[140px] bg-white border-gray-200">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Clear All Button */}
          {hasActiveFilters && onClearAll && (
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
        <div className="md:hidden">
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
            className="md:hidden space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filter.value}
                onValueChange={filter.onChange}
              >
                <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                  <SelectValue placeholder={filter.placeholder || filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {hasActiveFilters && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="w-full h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All Filters
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {showActiveFilters && hasActiveFilters && (
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

          {activeFilters.map((filter) => {
            const selectedOption = filter.options.find((opt) => opt.value === filter.value);
            return (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200"
              >
                {filter.label}: {selectedOption?.label || filter.value}
                <button
                  onClick={() => filter.onChange("all")}
                  className="ml-1 hover:text-gray-900"
                  aria-label={`Clear ${filter.label} filter`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          {onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 ml-auto"
            >
              Clear all
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

