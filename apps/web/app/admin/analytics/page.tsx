"use client";

import React, { useState } from 'react';
import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AnalyticsPageSkeleton } from '@/components/admin/skeletons';
import { useQuery } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  BarChart3,
  Activity,
  Download,
  Filter,
  DollarSign,
  ShoppingCart,
  MapPin
} from 'lucide-react';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/number-format';
import { Button } from '@/components/ui/button';

interface AnalyticsData {
  totalUsers: number;
  activeChefs: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  citiesServed: number;
  userGrowth: number;
  chefGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
  topLocations: Array<{ city: string; count: number }>;
  recentActivity: Array<{ type: string; count: number; timestamp: number }>;
  dailyMetrics: Array<{ date: string; users: number; orders: number; revenue: number }>;
}

export default function AdminAnalyticsPage() {
  // Auth is handled by layout, no client-side checks needed
  const { user } = useAdminUser();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const convex = useConvex();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics', timeRange],
    queryFn: () => convex.query(api.queries.analytics.getDashboardMetrics, { 
      timeRange 
    }) as Promise<AnalyticsData>,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: realtimeMetrics } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: () => convex.query(api.queries.analytics.getRealtimeMetrics),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const currentData = analyticsData || {
    totalUsers: 0,
    activeChefs: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    citiesServed: 0,
    userGrowth: 0,
    chefGrowth: 0,
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
      changeType: currentData.userGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Chefs',
      value: currentData.activeChefs.toLocaleString(),
      change: `${currentData.chefGrowth >= 0 ? '+' : ''}${currentData.chefGrowth.toFixed(1)}%`,
      changeType: currentData.chefGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: currentData.totalOrders.toLocaleString(),
      change: `${currentData.orderGrowth >= 0 ? '+' : ''}${currentData.orderGrowth.toFixed(1)}%`,
      changeType: currentData.orderGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Revenue',
      value: formatCurrency(currentData.totalRevenue, { currency: 'GBP' }),
      change: `${currentData.revenueGrowth >= 0 ? '+' : ''}${currentData.revenueGrowth.toFixed(1)}%`,
      changeType: currentData.revenueGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (isLoading && !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <AnalyticsPageSkeleton />
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your platform&apos;s performance and growth</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="lg">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </Button>
              <Button variant="outline" size="lg">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
              </Button>
            </div>
        </div>
        
          {/* Real-time Status */}
          {realtimeMetrics && (
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
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
                <span className="text-xs text-gray-700">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: '7d' as const, label: '7 Days' },
                  { key: '30d' as const, label: '30 Days' },
                  { key: '90d' as const, label: '90 Days' },
                  { key: '1y' as const, label: '1 Year' }
                ].map((period) => (
                  <Button
                    key={period.key}
                    onClick={() => setTimeRange(period.key)}
                    disabled={isLoading}
                    variant={timeRange === period.key ? "default" : "ghost"}
                    size="sm"
                    className={timeRange === period.key ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium font-satoshi text-gray-600">{metric.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold font-asgard text-gray-900 mt-1">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-sm font-medium font-satoshi ${
                      metric.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold font-asgard text-gray-900 mb-4">Growth Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-700">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Chart component will be implemented here</p>
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold font-asgard text-gray-900 mb-4">Top Locations</h3>
          <div className="space-y-3">
            {currentData.topLocations.slice(0, 5).map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium font-satoshi text-gray-900">{location.city}</span>
                </div>
                <span className="text-sm font-medium font-satoshi text-gray-600">{location.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold font-asgard text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {currentData.recentActivity.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium font-satoshi text-gray-900">{activity.type}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium font-satoshi text-gray-900">{activity.count}</span>
                <p className="text-xs text-gray-700 font-satoshi">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold font-asgard text-gray-900 mb-4">Daily Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium font-satoshi text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium font-satoshi text-gray-700">Users</th>
                <th className="text-left py-3 px-4 text-sm font-medium font-satoshi text-gray-700">Orders</th>
                <th className="text-left py-3 px-4 text-sm font-medium font-satoshi text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {currentData.dailyMetrics.slice(0, 7).map((metric, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm font-satoshi text-gray-900">{metric.date}</td>
                  <td className="py-3 px-4 text-sm font-satoshi text-gray-600">{metric.users}</td>
                  <td className="py-3 px-4 text-sm font-satoshi text-gray-600">{metric.orders}</td>
                  <td className="py-3 px-4 text-sm font-satoshi text-gray-600">{formatCurrency(metric.revenue, { currency: 'GBP' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'View Users', icon: Users, href: '/admin/users', color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { title: 'Manage Chefs', icon: Activity, href: '/admin/chefs', color: 'text-green-600', bgColor: 'bg-green-50' },
              { title: 'Order History', icon: ShoppingCart, href: '/admin/orders', color: 'text-purple-600', bgColor: 'bg-purple-50' },
              { title: 'System Settings', icon: BarChart3, href: '/admin/settings', color: 'text-orange-600', bgColor: 'bg-orange-50' },
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
                    <div className={`p-3 rounded-lg ${action.bgColor} w-fit mb-4`}>
                      <Icon className={`w-6 h-6 ${action.color}`} />
          </div>
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
    </div>
  );
}

