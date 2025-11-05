"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "motion/react";
import { Clock, User, Settings, Shield, Filter, Search, Bell, Eye, ChevronDown, ChevronUp, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: string;
  title?: string;
  description: string;
  timestamp: number;
  user?: string;
  severity?: string;
  category?: string;
  details?: string;
  metadata?: any;
}

const activityIcons = {
  user_action: User,
  system_event: Settings,
  security_alert: Shield,
  new_user: User,
  new_chef: User,
  system_update: Settings,
  content_created: Settings,
  order_created: Clock,
  chef_joined: User,
  payment_processed: Settings,
};

const activityColors = {
  user_action: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  system_event: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  security_alert: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  new_user: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  new_chef: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  system_update: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  content_created: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  order_created: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  chef_joined: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  payment_processed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
};

export function EnhancedActivity() {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch real activity data from Convex
  const activities = useQuery(api.queries.activityFeed.getActivityFeed, { 
    limit: 20,
    type: filter === 'all' ? undefined : filter as any,
    timeRange: '24h'
  });
  const users = useQuery(api.queries.users.getAllUsers);

  // Get user details for activities
  const getUserDetails = (userId?: string) => {
    if (!userId || !users) return null;
    return users.find((user: { _id: string }) => user._id === userId);
  };

  const filteredActivities = activities?.filter((activity: ActivityItem) => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const user = activity.user ? getUserDetails(activity.user) : null;
    const userName = user ? (user as any).name : ''; // Assuming user has a name property
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (userName && userName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }) || [];

  const getActivityCount = (type: string) => {
    return activities?.filter((a: ActivityItem) => type === 'all' || a.type === type).length || 0;
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      user_action: 'Users',
      system_event: 'System',
      security_alert: 'Security',
      new_user: 'Users',
      new_chef: 'Chefs',
      system_update: 'System',
      content_created: 'Content',
      order_created: 'Orders',
      chef_joined: 'Chefs',
      payment_processed: 'Payments'
    };
    return labels[type] || type;
  };

  const filterOptions = [
    { key: 'all', label: 'All Activities' },
    { key: 'new_user', label: 'User Registrations' },
    { key: 'new_chef', label: 'Chef Onboarding' },
    { key: 'system_event', label: 'System Events' },
    { key: 'security_alert', label: 'Security Alerts' },
    { key: 'content_created', label: 'Content Creation' },
    { key: 'order_created', label: 'Order Activity' },
    { key: 'payment_processed', label: 'Payment Processing' }
  ];

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
  };

  const hasActiveFilters = filter !== 'all' || searchTerm !== '';

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6 gap-2 sm:gap-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-asgard text-gray-900 break-words">Activity Feed</h2>
          {activities && activities.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-1 px-2 py-0.5 sm:py-1 bg-green-50 border border-green-200 rounded-full"
            >
              <Bell className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">{activities.length} activities</span>
            </motion.div>
          )}
        </div>
        
        {/* Mobile Filter Toggle */}
        <div className="flex items-center space-x-2 sm:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="admin-filter-toggle admin-filter-button flex items-center space-x-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="admin-filter-indicator w-2 h-2 bg-[#F23E2E] rounded-full"></span>
            )}
            {showMobileFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Desktop Search and Filter */}
        <div className="hidden sm:flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input pl-10 pr-3 py-2 bg-white/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="admin-filter-panel admin-filter-transition sm:hidden mb-4 bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Filter Activities</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="admin-filter-button text-xs text-[#F23E2E] hover:text-[#F23E2E]/80 font-medium px-2 py-1 rounded"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Mobile Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Mobile Filter Grid */}
          <div className="admin-filter-grid grid grid-cols-2 gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`admin-filter-option admin-filter-button p-3 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                  filter === option.key
                    ? 'bg-[#F23E2E] text-white shadow-lg border-2 border-[#F23E2E] font-semibold'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{option.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    filter === option.key
                      ? 'bg-white/30 text-white border border-white/50'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getActivityCount(option.key)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Desktop Filter Tabs */}
      <div className="hidden sm:flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full">
        {filterOptions.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`admin-filter-option flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              filter === tab.key
                ? 'bg-[#F23E2E] text-white shadow-md font-semibold'
                : 'text-gray-700 hover:text-gray-900 hover:bg-white/70'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              filter === tab.key
                ? 'bg-white/30 text-white border border-white/50'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {getActivityCount(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="admin-filter-transition flex items-center space-x-2 mb-4 p-3 bg-[#F23E2E]/10 backdrop-blur-sm rounded-lg border border-[#F23E2E]/20"
        >
          <span className="text-sm font-medium text-[#F23E2E]">Active Filters:</span>
          {filter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-[#F23E2E]/20 text-[#F23E2E] text-xs rounded-full border border-[#F23E2E]/30">
              {getActivityTypeLabel(filter)}
              <button
                onClick={() => setFilter('all')}
                className="admin-filter-button ml-1 hover:text-[#F23E2E]/80 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 bg-[#F23E2E]/20 text-[#F23E2E] text-xs rounded-full border border-[#F23E2E]/30">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="admin-filter-button ml-1 hover:text-[#F23E2E]/80 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="admin-filter-button text-xs text-[#F23E2E] hover:text-[#F23E2E]/80 font-medium underline px-2 py-1"
          >
            Clear All
          </button>
        </motion.div>
      )}

      <div className="space-y-2 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
        {filteredActivities.map((activity: any, index: number) => {
          const Icon = activityIcons[activity.type as keyof typeof activityIcons] || Settings;
          const colors = activityColors[activity.type as keyof typeof activityColors] || activityColors.system_event;
          const userDetails = getUserDetails((activity as any).user);

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-2 sm:p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer bg-white/50 border-gray-200/50 flex flex-col sm:flex-row gap-1 sm:gap-4 min-h-[56px] sm:min-h-[64px]"
              onClick={() => setShowDetails(showDetails === activity.id ? null : activity.id)}
            >
              <div className={`p-2 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform duration-200 flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0">
                  <p className="text-xs sm:text-base font-medium text-gray-900 group-hover:text-gray-700 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} hidden sm:inline-block`}>
                      {getActivityTypeLabel(activity.type)}
                    </span>
                    <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  {userDetails && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">
                        {userDetails.name} ({userDetails.roles?.[0] || 'user'})
                      </span>
                    </>
                  )}
                  <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} sm:hidden`}>
                    {getActivityTypeLabel(activity.type)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 px-4"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm sm:text-base mb-2">No activities found matching your criteria</p>
          {hasActiveFilters && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs sm:text-sm">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="admin-filter-button text-sm text-[#F23E2E] hover:text-[#F23E2E]/80 font-medium underline px-3 py-2 rounded-lg hover:bg-[#F23E2E]/10 transition-colors"
              >
                Clear filters to see all activities
              </button>
            </div>
          )}
          {!hasActiveFilters && activities && activities.length === 0 && (
            <p className="text-gray-400 text-xs sm:text-sm">No activities available at the moment</p>
          )}
        </motion.div>
      )}
    </div>
  );
} 