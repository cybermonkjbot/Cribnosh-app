"use client";

import { useAdminUser } from "@/app/admin/AdminUserProvider";
import { api } from "@/convex/_generated/api";
import { formatCurrency } from "@/lib/utils/number-format";
import { useQuery } from "convex/react";
import {
  Activity,
  ChefHat,
  MapPin,
  PoundSterling,
  Star,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface AnalyticsData {
  totalUsers: number;
  activeFoodCreators: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  citiesServed: number;
  userGrowth: number;
  foodCreatorGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
  topLocations: Array<{ city: string; count: number }>;
  recentActivity: Array<{ type: string; count: number; timestamp: number }>;
  dailyMetrics: Array<{ date: string; users: number; orders: number; revenue: number }>;
}

export function AnalyticsOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const { sessionToken } = useAdminUser();

  const periods = [
    { key: '7d' as const, label: '7 Days' },
    { key: '30d' as const, label: '30 Days' },
    { key: '90d' as const, label: '90 Days' },
    { key: '1y' as const, label: '1 Year' }
  ];

  // Real analytics data using Convex useQuery
  const analyticsData = useQuery(api.queries.analytics.getDashboardMetrics, sessionToken ? {
    timeRange: selectedPeriod,
    sessionToken,
  } : 'skip');

  // Real-time metrics using Convex useQuery
  const realtimeMetrics = useQuery(api.queries.analytics.getRealtimeMetrics, sessionToken ? {
    sessionToken
  } : 'skip');

  const isLoading = analyticsData === undefined;

  const currentData = analyticsData || {
    totalUsers: 0,
    activeFoodCreators: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    citiesServed: 0,
    userGrowth: 0,
    foodCreatorGrowth: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
    topLocations: [],
    recentActivity: [],
    dailyMetrics: [],
  };

  const metrics = [
    {
      title: 'Total Users',
      value: currentData.totalUsers.toLocaleString(),
      change: `${currentData.userGrowth >= 0 ? '+' : ''}${currentData.userGrowth.toFixed(1)}%`,
      trend: currentData.userGrowth >= 0 ? 'up' as const : 'down' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active foodCreators',
      value: currentData.activeFoodCreators.toLocaleString(),
      change: `${currentData.foodCreatorGrowth >= 0 ? '+' : ''}${currentData.foodCreatorGrowth.toFixed(1)}%`,
      trend: currentData.foodCreatorGrowth >= 0 ? 'up' as const : 'down' as const,
      icon: ChefHat,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Total Orders',
      value: currentData.totalOrders.toLocaleString(),
      change: `${currentData.orderGrowth >= 0 ? '+' : ''}${currentData.orderGrowth.toFixed(1)}%`,
      trend: currentData.orderGrowth >= 0 ? 'up' as const : 'down' as const,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Revenue',
      value: formatCurrency(currentData.totalRevenue, { currency: 'GBP' }),
      change: `${currentData.revenueGrowth >= 0 ? '+' : ''}${currentData.revenueGrowth.toFixed(1)}%`,
      trend: currentData.revenueGrowth >= 0 ? 'up' as const : 'down' as const,
      icon: PoundSterling,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Avg Rating',
      value: currentData.averageRating.toFixed(1),
      change: '+2.1%', // This would need to be calculated from historical data
      trend: 'up' as const,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Cities Served',
      value: currentData.citiesServed.toString(),
      change: '+1', // This would need to be calculated from historical data
      trend: 'up' as const,
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const insights = [
    {
      type: 'positive' as const,
      title: 'User Growth',
      description: `User registrations ${currentData.userGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(currentData.userGrowth).toFixed(1)}% this period`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: currentData.foodCreatorGrowth < 0 ? 'warning' as const : 'positive' as const,
      title: 'foodCreator Retention',
      description: `foodCreator ${currentData.foodCreatorGrowth >= 0 ? 'growth' : 'retention'} ${currentData.foodCreatorGrowth >= 0 ? 'increased' : 'dropped'} by ${Math.abs(currentData.foodCreatorGrowth).toFixed(1)}%`,
      icon: currentData.foodCreatorGrowth >= 0 ? TrendingUp : TrendingDown,
      color: currentData.foodCreatorGrowth >= 0 ? 'text-green-600' : 'text-amber-600',
      bgColor: currentData.foodCreatorGrowth >= 0 ? 'bg-green-50' : 'bg-amber-50'
    },
    {
      type: 'positive' as const,
      title: 'Revenue Performance',
      description: `Revenue ${currentData.revenueGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(currentData.revenueGrowth).toFixed(1)}% this period`,
      icon: PoundSterling,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  const handlePeriodChange = async (period: '7d' | '30d' | '90d' | '1y') => {
    setSelectedPeriod(period);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-bold font-asgard text-gray-900 break-words">Analytics Overview</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
          <span className="text-xs sm:text-sm text-gray-500">Time period:</span>
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => handlePeriodChange(period.key)}
                disabled={isLoading}
                className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${selectedPeriod === period.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'} ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      {realtimeMetrics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${realtimeMetrics.systemHealth.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  System: {realtimeMetrics.systemHealth.status}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {realtimeMetrics.activeUsers} active users
              </span>
              <span className="text-sm text-gray-600">
                {realtimeMetrics.pendingOrders} pending orders
              </span>
              <span className="text-sm text-gray-600">
                {realtimeMetrics.liveStreams} live streams
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-full overflow-hidden">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trend === 'up';

          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              className="bg-white/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 max-w-full overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4 min-w-0">
                <div className={`p-2 sm:p-3 rounded-xl ${metric.bgColor} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${metric.color}`} />
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                  )}
                  <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} break-words`}>{metric.change}</span>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 break-words">{metric.title}</h3>
                <p className="text-lg sm:text-xl md:text-2xl font-bold font-asgard text-gray-900 break-words">
                  {isLoading ? (
                    <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    metric.value
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-full overflow-hidden">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.6 }}
              className="bg-white/70 backdrop-blur-md rounded-xl p-3 sm:p-4 md:p-6 border border-white/20 shadow-lg max-w-full overflow-hidden"
            >
              <div className="flex items-start space-x-3 min-w-0">
                <div className={`p-2 rounded-lg ${insight.bgColor} flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 break-words">{insight.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Top Locations */}
      {currentData.topLocations.length > 0 && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-purple-600" />
            Top Locations
          </h3>
          <div className="space-y-3">
            {currentData.topLocations.map((location: any, index: number) => (
              <div key={location.city} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{location.city}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{location.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {currentData.recentActivity.length > 0 && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {currentData.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">{activity.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{activity.count}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 