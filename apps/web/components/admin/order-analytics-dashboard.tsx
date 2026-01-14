'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Download, Filter, PoundSterling, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface OrderAnalytics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    statusBreakdown: Record<string, number>;
    paymentBreakdown: Record<string, number>;
    completionRate: number;
  };
  details: Array<{
    date?: string;
    orders: number;
    revenue: number;
    averageOrderValue: number;
    status?: string;
    percentage?: number;
    chefId?: string;
  }>;
  totalOrders: number;
  totalRevenue: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface OrderAnalyticsDashboardProps {
  startDate?: string;
  endDate?: string;
  chefId?: string;
  customerId?: string;
  status?: string;
  groupBy?: 'day' | 'week' | 'month' | 'chef' | 'status';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function OrderAnalyticsDashboard({
  startDate,
  endDate,
  chefId,
  customerId,
  status,
  groupBy = 'day'
}: OrderAnalyticsDashboardProps) {
  const { sessionToken } = useAdminUser();
  const [filters, setFilters] = useState(() => ({
    startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
    chefId: chefId || '',
    customerId: customerId || '',
    status: status || '',
    groupBy
  }));

  // Get order analytics from Convex
  const analytics = useQuery(api.queries.analytics.getOrderAnalytics, sessionToken ? {
    startDate: new Date(filters.startDate).getTime(),
    endDate: new Date(filters.endDate).getTime(),
    groupBy: filters.groupBy,
    chefId: filters.chefId ? filters.chefId as any : undefined,
    customerId: filters.customerId ? filters.customerId as any : undefined,
    status: filters.status || undefined,
    sessionToken,
  } : 'skip');

  const isLoading = !analytics;
  const error = null; // Convex handles errors internally

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      // For now, export as JSON - can be enhanced with proper export functionality
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-report-${filters.startDate}-${filters.endDate}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Failed to load analytics data</p>
        <p className="text-sm text-gray-500">Please try again later</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary, details } = analytics;

  // Prepare chart data
  const statusChartData = Object.entries(summary.statusBreakdown).map(([status, count]) => ({
    name: status,
    value: count as number,
    percentage: ((count as number) / summary.totalOrders) * 100
  }));

  const revenueChartData = details.map((item: any) => ({
    name: item.date || item.status || item.chefId || 'Unknown',
    revenue: item.revenue,
    orders: item.orders,
    averageOrderValue: item.averageOrderValue
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Analytics Filters
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
            <select
              value={filters.groupBy}
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="chef">Chef</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalOrders.toLocaleString()}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">£{summary.totalRevenue.toLocaleString()}</p>
            </div>
            <PoundSterling className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">£{summary.averageOrderValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary.completionRate.toFixed(1)}%</p>
            </div>
            <Users className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue (£)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(({ name, percentage }: { name: string; percentage: number }): string => `${name} ${percentage.toFixed(0)}%`) as any}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {filters.groupBy === 'day' ? 'Date' :
                    filters.groupBy === 'chef' ? 'Chef ID' :
                      filters.groupBy === 'status' ? 'Status' : 'Period'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Order Value
                </th>
                {filters.groupBy === 'status' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {details.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.date || item.status || item.chefId || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    £{item.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    £{item.averageOrderValue.toFixed(2)}
                  </td>
                  {filters.groupBy === 'status' && item.percentage && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
} 