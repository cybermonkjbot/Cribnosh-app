"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/convex/_generated/api';
import { formatCurrency } from '@/lib/utils/number-format';
import { useQuery } from 'convex/react';
import {
  Activity,
  BarChart2,
  Clock,
  MapPin,
  PieChart,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserX,
  Users
} from 'lucide-react';
import { useState } from 'react';

interface UserData {
  totalUsers: number;
  newUserSignups: number;
  activeUsers: number;
  inactiveUsers: number;
  userGrowth: number;
  retentionRate: number;
  averageSessionDuration: number;
  topLocations: { location: string; users: number; percentage: number }[];
  userSegments: { segment: string; count: number; percentage: number }[];
  registrationSources: { source: string; count: number; percentage: number }[];
  monthlyGrowth: { month: string; users: number }[];
  dailyActiveUsers: { day: string; users: number }[];
  userLifetimeValue: number;
  churnRate: number;
  userGrowthChart: { month: string; users: number }[];
}

export default function UserAnalyticsPage() {
  const { sessionToken, loading } = useAdminUser();
  const [timeRange, setTimeRange] = useState('30d');
  const [viewMode, setViewMode] = useState<'overview' | 'growth' | 'segments' | 'locations'>('overview');

  // Fetch user analytics data
  const queryArgs = loading || !sessionToken ? "skip" : { timeRange, sessionToken };
  const userAnalytics = useQuery(api.queries.analytics.getUserAnalytics, queryArgs);

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-[18px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-asgard text-gray-900">User Analytics</h1>
          <p className="text-gray-600 font-satoshi mt-2">Comprehensive user behavior and growth analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          variant={viewMode === 'growth' ? 'default' : 'outline'}
          onClick={() => setViewMode('growth')}
          className={viewMode === 'growth' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Growth
        </Button>
        <Button
          variant={viewMode === 'segments' ? 'default' : 'outline'}
          onClick={() => setViewMode('segments')}
          className={viewMode === 'segments' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <PieChart className="w-4 h-4 mr-2" />
          Segments
        </Button>
        <Button
          variant={viewMode === 'locations' ? 'default' : 'outline'}
          onClick={() => setViewMode('locations')}
          className={viewMode === 'locations' ? 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white' : ''}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Locations
        </Button>
      </div>

      {/* Overview Cards */}
      {viewMode === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userAnalytics?.totalUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">New Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userAnalytics?.newUserSignups || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(userAnalytics?.userGrowth || 0)}
                      <span className={`text-xs ${getGrowthColor(userAnalytics?.userGrowth || 0)}`}>
                        {userAnalytics?.userGrowth || 0}%
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
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{userAnalytics?.activeUsers || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Session</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userAnalytics?.averageSessionDuration ? Math.round(userAnalytics.averageSessionDuration / 60) : 0}m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#F23E2E]" />
                  User Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={userAnalytics?.retentionRate || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium">{userAnalytics?.retentionRate || 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Churn Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={userAnalytics?.churnRate || 0} className="w-20 h-2" />
                    <span className="text-sm font-medium">{userAnalytics?.churnRate || 0}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Lifetime Value</span>
                  <span className="text-sm font-medium">{formatCurrency(userAnalytics?.userLifetimeValue || 0, { currency: 'GBP' })}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-[#F23E2E]" />
                  User Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(userAnalytics?.activeUsers || 0) / (userAnalytics?.totalUsers || 1) * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{userAnalytics?.activeUsers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-600">Inactive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(userAnalytics?.inactiveUsers || 0) / (userAnalytics?.totalUsers || 1) * 100} className="w-20 h-2" />
                    <span className="text-sm font-medium">{userAnalytics?.inactiveUsers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Growth Analytics */}
      {viewMode === 'growth' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly User Growth</CardTitle>
              <CardDescription>Track user growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAnalytics?.monthlyGrowth?.map((month: { month: string; users: number }, index: number) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{month.month}</p>
                      <p className="text-sm text-gray-600">{month.users} users</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        {month.users} users
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users</CardTitle>
              <CardDescription>Daily active user trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userAnalytics?.dailyActiveUsers?.slice(-7).map((day: { day: string; users: number }, index: number) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{day.day}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(day.users / Math.max(...(userAnalytics?.dailyActiveUsers?.map((d: { day: string; users: number }) => d.users) || [1]))) * 100} className="w-32 h-2" />
                      <span className="text-sm font-medium w-12 text-right">{day.users}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Segments */}
      {viewMode === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#F23E2E]" />
                User Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAnalytics?.userSegments?.map((segment: { segment: string; count: number; percentage: number }, index: number) => (
                  <div key={segment.segment} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-purple-500' :
                        index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm text-gray-600">{segment.segment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={segment.percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{segment.count}</span>
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
                Registration Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAnalytics?.registrationSources?.map((source: { source: string; count: number; percentage: number }, index: number) => (
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
                      <span className="text-sm font-medium">{source.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Analytics */}
      {viewMode === 'locations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F23E2E]" />
              User Locations
            </CardTitle>
            <CardDescription>Geographic distribution of users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userAnalytics?.topLocations?.map((location: { location: string; users: number; percentage: number }, index: number) => (
                <div key={location.location} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F23E2E] font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{location.location}</p>
                      <p className="text-sm text-gray-600">{location.users} users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={location.percentage} className="w-24 h-2" />
                    <span className="text-sm font-medium w-12 text-right">{location.percentage}%</span>
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
