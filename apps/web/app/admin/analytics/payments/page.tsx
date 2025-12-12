"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { formatCurrency } from '@/lib/utils/number-format';
import { useQuery } from 'convex/react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  CreditCard,
  PieChart,
  PoundSterling,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function PaymentAnalyticsPage() {
  const { sessionToken, loading } = useAdminUser();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate date range
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const endDate: number = Date.now();
  const startDate: number = endDate - (days * 24 * 60 * 60 * 1000);

  const queryArgs = loading || !sessionToken ? 'skip' : { startDate, endDate, sessionToken };
  const queryArgsWithLimit = loading || !sessionToken ? 'skip' : { startDate, endDate, limit: 10, sessionToken };

  // Fetch payment analytics data from backend
  // @ts-ignore - Type instantiation depth issue with Convex useQuery (known TypeScript limitation)
  const paymentStats = useQuery(api.queries.paymentAnalytics.getPaymentDashboardStats, queryArgs as any);

  // @ts-ignore - Type instantiation depth issue with Convex useQuery (known TypeScript limitation)
  const paymentHealth = useQuery(api.queries.paymentAnalytics.getPaymentHealthMetrics, queryArgs as any);

  // @ts-ignore - Type instantiation depth issue with Convex useQuery (known TypeScript limitation)
  const paymentMethods = useQuery(api.queries.paymentAnalytics.getPaymentMethodAnalytics, queryArgs as any);

  // @ts-ignore - Type instantiation depth issue with Convex useQuery (known TypeScript limitation)
  const failureReasons = useQuery(api.queries.paymentAnalytics.getPaymentFailureReasons, queryArgsWithLimit as any);

  // @ts-ignore - Type instantiation depth issue with Convex useQuery (known TypeScript limitation)
  const performanceMetrics = useQuery(api.queries.paymentAnalytics.getPaymentPerformanceMetrics, queryArgs === 'skip' ? 'skip' : { ...queryArgs, groupBy: 'day' });

  const isLoading = paymentStats === undefined || paymentHealth === undefined;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading payment analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">Payment Analytics</h1>
          <p className="text-gray-600 font-satoshi mt-2">Payment processing insights and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats?.successRate.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PoundSterling className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((paymentStats?.totalRevenue || 0) / 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats?.failedPayments || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {paymentStats?.failureRate.toFixed(1) || 0}% failure rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats?.totalPayments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#F23E2E]" />
              Payment Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={paymentHealth?.successRate || 0} className="w-20 h-2" />
                <span className="text-sm font-medium">{paymentHealth?.successRate.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failure Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={paymentHealth?.failureRate || 0} className="w-20 h-2" />
                <span className="text-sm font-medium text-red-600">{paymentHealth?.failureRate.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Refund Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={paymentHealth?.refundRate || 0} className="w-20 h-2" />
                <span className="text-sm font-medium">{paymentHealth?.refundRate.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dispute Rate</span>
              <div className="flex items-center gap-2">
                <Progress value={paymentHealth?.disputeRate || 0} className="w-20 h-2" />
                <span className="text-sm font-medium text-orange-600">{paymentHealth?.disputeRate.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Reputation Score</span>
                <span className={`font-bold ${(paymentHealth?.reputationScore || 0) >= 90 ? 'text-green-600' :
                    (paymentHealth?.reputationScore || 0) >= 75 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {paymentHealth?.reputationScore.toFixed(1) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#F23E2E]" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethods?.map((method: { method: string; count: number; revenue: number; successRate: number; percentage: number }, index: number) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                    <span className="text-sm text-gray-600 capitalize">{method.method}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={method.percentage} className="w-20 h-2" />
                    <span className="text-sm font-medium">{formatCurrency(method.revenue / 100)}</span>
                  </div>
                </div>
              ))}
              {(!paymentMethods || paymentMethods.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No payment method data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F23E2E]" />
              Failure Reasons
            </CardTitle>
            <CardDescription>Top failure reasons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failureReasons?.map((reason: { failureCode: string; failureReason: string; count: number; percentage: number }, index: number) => (
                <div key={reason.failureCode} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reason.failureCode}</p>
                    <p className="text-xs text-gray-500">{reason.count} occurrences</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">{reason.percentage.toFixed(1)}%</span>
                </div>
              ))}
              {(!failureReasons || failureReasons.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No failure data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Performance Over Time</CardTitle>
          <CardDescription>Daily payment success and failure rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics?.map((metric: { period: string; successful: number; failed: number; canceled: number; revenue: number; successRate: number }) => (
              <div key={metric.period} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{new Date(metric.period).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">
                    {metric.successful} successful, {metric.failed} failed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{metric.successRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">Success rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(metric.revenue / 100)}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              </div>
            ))}
            {(!performanceMetrics || performanceMetrics.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No performance data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Refunds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((paymentStats?.totalRefunds || 0) / 100)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {paymentStats?.refundRate.toFixed(1) || 0}% refund rate
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentStats?.totalDisputes || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {paymentStats?.disputeRate.toFixed(1) || 0}% dispute rate
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Payment Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency((paymentStats?.averagePaymentAmount || 0) / 100)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Per successful transaction
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

