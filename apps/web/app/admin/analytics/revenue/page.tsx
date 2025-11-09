"use client";

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp,
  BarChart2,
  PieChart,
  CreditCard,
  Receipt,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/number-format';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  totalOrders: number;
  orderGrowth: number;
  revenueBySource: { source: string; amount: number; percentage: number }[];
  revenueByLocation: { location: string; amount: number; percentage: number }[];
  monthlyRevenueData: { month: string; revenue: number; growth: number }[];
  dailyRevenueData: { date: string; revenue: number }[];
  topProducts: { name: string; revenue: number; orders: number }[];
  paymentMethods: { method: string; amount: number; percentage: number }[];
  refunds: { total: number; percentage: number; count: number };
  taxes: { total: number; percentage: number };
  fees: { total: number; percentage: number };
  netRevenue: number;
  profitMargin: number;
}

export default function RevenueAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'sources' | 'products'>('overview');

  // Fetch revenue analytics data
  const revenueAnalytics = useQuery(api.queries.analytics.getRevenueAnalytics, { timeRange });

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 font-satoshi mt-2">Financial performance and revenue insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d' | '1y')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'overview' ? 'default' : 'outline'}
          onClick={() => setViewMode('overview')}
          className={viewMode === 'overview' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <BarChart2 className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={viewMode === 'trends' ? 'default' : 'outline'}
          onClick={() => setViewMode('trends')}
          className={viewMode === 'trends' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Trends
        </Button>
        <Button
          variant={viewMode === 'sources' ? 'default' : 'outline'}
          onClick={() => setViewMode('sources')}
          className={viewMode === 'sources' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <PieChart className="w-4 h-4 mr-2" />
          Sources
        </Button>
        <Button
          variant={viewMode === 'products' ? 'default' : 'outline'}
          onClick={() => setViewMode('products')}
          className={viewMode === 'products' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <Target className="w-4 h-4 mr-2" />
          Products
        </Button>
      </div>

      {/* Overview Cards */}
      {viewMode === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueAnalytics?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueAnalytics?.monthlyRevenue || 0)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(revenueAnalytics?.revenueGrowth || 0)}
                      <span className={`text-xs ${getGrowthColor(revenueAnalytics?.revenueGrowth || 0)}`}>
                        {revenueAnalytics?.revenueGrowth || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{revenueAnalytics?.totalOrders || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(revenueAnalytics?.orderGrowth || 0)}
                      <span className={`text-xs ${getGrowthColor(revenueAnalytics?.orderGrowth || 0)}`}>
                        {revenueAnalytics?.orderGrowth || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueAnalytics?.averageOrderValue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#F23E2E]" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gross Revenue</span>
                  <span className="text-sm font-medium">{formatCurrency(revenueAnalytics?.totalRevenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Refunds</span>
                  <span className="text-sm font-medium text-red-600">
                    -{formatCurrency(revenueAnalytics?.refunds || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taxes</span>
                  <span className="text-sm font-medium text-orange-600">
                    -{formatCurrency(revenueAnalytics?.taxes || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fees</span>
                  <span className="text-sm font-medium text-orange-600">
                    -{formatCurrency(revenueAnalytics?.fees || 0)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Net Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(revenueAnalytics?.netRevenue || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#F23E2E]" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profit Margin</span>
                  <div className="flex items-center gap-2">
                    <Progress value={revenueAnalytics?.profitMargin || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium">{revenueAnalytics?.profitMargin || 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Refund Rate</span>
                  <span className="text-sm font-medium">2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tax Rate</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fee Rate</span>
                  <span className="text-sm font-medium">4%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F23E2E]" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueAnalytics?.paymentMethods?.map((method: { method: string; amount: number; percentage: number }, index: number) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                        }`} />
                        <span className="text-sm text-gray-600">{method.method}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={method.percentage} className="w-20 h-2" />
                        <span className="text-sm font-medium">{formatCurrency(method.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Revenue Trends */}
      {viewMode === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>Track revenue growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  {revenueAnalytics?.monthlyRevenueData?.map((month: { month: string; revenue: number; growth: number }, index: number) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{month.month}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(month.revenue)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(month.growth)}
                      <span className={`text-sm font-medium ${getGrowthColor(month.growth)}`}>
                        {month.growth > 0 ? '+' : ''}{month.growth}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
              <CardDescription>Daily revenue trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {revenueAnalytics?.dailyRevenueData?.slice(-7).map((day: { date: string; revenue: number }, index: number) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{day.date}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(day.revenue / Math.max(...(revenueAnalytics?.dailyRevenueData?.map((d: { date: string; revenue: number }) => d.revenue) || [1]))) * 100} className="w-32 h-2" />
                      <span className="text-sm font-medium w-20 text-right">{formatCurrency(day.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Sources */}
      {viewMode === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#F23E2E]" />
                Revenue by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                  {revenueAnalytics?.revenueBySource?.map((source: { source: string; amount: number; percentage: number }, index: number) => (
                  <div key={source.source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm text-gray-600">{source.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={source.percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{formatCurrency(source.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#F23E2E]" />
                Revenue by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                  {revenueAnalytics?.revenueByLocation?.map((location: any, index: number) => (
                  <div key={location.location} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm text-gray-600">{location.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={location.percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{formatCurrency(location.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Products */}
      {viewMode === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#F23E2E]" />
              Top Performing Products
            </CardTitle>
            <CardDescription>Products ranked by revenue and order volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                  {revenueAnalytics?.topProducts?.map((product: any, index: number) => (
                <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F23E2E] font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
