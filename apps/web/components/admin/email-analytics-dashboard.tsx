'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import {
    BarChart3,
    CheckCircle,
    ChevronRight,
    Clock,
    Globe,
    Mail,
    MousePointer2,
    TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const COLORS = ['#F23E2E', '#F47164', '#F8A49C', '#FBD7D4', '#8884D8', '#82CA9D'];

export function EmailAnalyticsDashboard() {
    const { sessionToken } = useAdminUser();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    // Fetch all analytics data
    const dashboardStats = useQuery(api.emailAnalytics.getEmailDashboardStats, {
        startDate: timeRange === '7d' ? Date.now() - 7 * 24 * 60 * 60 * 1000 :
            timeRange === '30d' ? Date.now() - 30 * 24 * 60 * 60 * 1000 :
                Date.now() - 90 * 24 * 60 * 60 * 1000
    });

    const performanceMetrics = useQuery(api.emailAnalytics.getEmailPerformanceMetrics, {
        startDate: timeRange === '7d' ? Date.now() - 7 * 24 * 60 * 60 * 1000 :
            timeRange === '30d' ? Date.now() - 30 * 24 * 60 * 60 * 1000 :
                Date.now() - 90 * 24 * 60 * 60 * 1000,
        groupBy: 'day'
    });

    const topTemplates = useQuery(api.emailAnalytics.getTopTemplates, {
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        limit: 5
    });

    const deviceAnalytics = useQuery(api.emailAnalytics.getDeviceAnalytics, {
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000
    });

    const locationAnalytics = useQuery(api.emailAnalytics.getLocationAnalytics, {
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000
    });

    const healthMetrics = useQuery(api.emailAnalytics.getEmailHealthMetrics, {});

    const isLoading = !dashboardStats || !performanceMetrics;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F23E2E]"></div>
            </div>
        );
    }

    const metrics = [
        {
            title: 'Total Sent',
            value: dashboardStats.sentEmails.toLocaleString(),
            icon: Mail,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Delivered',
            value: `${dashboardStats.deliveryRate.toFixed(1)}%`,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Open Rate',
            value: `${dashboardStats.openRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        },
        {
            title: 'Click Rate',
            value: `${dashboardStats.clickRate.toFixed(1)}%`,
            icon: MousePointer2,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    {[
                        { key: '7d' as const, label: '7 Days' },
                        { key: '30d' as const, label: '30 Days' },
                        { key: '90d' as const, label: '90 Days' }
                    ].map((period) => (
                        <Button
                            key={period.key}
                            variant={timeRange === period.key ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTimeRange(period.key)}
                            className={timeRange === period.key ? 'bg-[#F23E2E] text-white hover:bg-[#F23E2E]/90' : ''}
                        >
                            {period.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <Card key={index} className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{metric.title}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${metric.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${metric.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Email Performance</CardTitle>
                        <CardDescription>Engagement trends over the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="period"
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        stroke="#9CA3AF"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="#9CA3AF" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="sent" stroke="#3B82F6" strokeWidth={2} name="Sent" dot={false} />
                                    <Line type="monotone" dataKey="opened" stroke="#F59E0B" strokeWidth={2} name="Opens" dot={false} />
                                    <Line type="monotone" dataKey="clicked" stroke="#8B5CF6" strokeWidth={2} name="Clicks" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Health Metrics</CardTitle>
                        <CardDescription>Overall delivery health and reputation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bounce Rate</span>
                                <span className={`font-semibold ${healthMetrics?.bounceRate && healthMetrics.bounceRate > 5 ? 'text-red-500' : 'text-green-500'}`}>
                                    {healthMetrics?.bounceRate.toFixed(2)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${healthMetrics?.bounceRate && healthMetrics.bounceRate > 5 ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min((healthMetrics?.bounceRate || 0) * 10, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Unsubscribe Rate</span>
                                <span className="font-semibold text-orange-500">
                                    {healthMetrics?.unsubscribeRate.toFixed(2)}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${Math.min((healthMetrics?.unsubscribeRate || 0) * 10, 100)}%` }} />
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-gray-500">Avg. Delivery Time</p>
                                    <p className="font-semibold">{healthMetrics ? `${(healthMetrics.averageDeliveryTime / 1000).toFixed(1)}s` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 rounded-lg bg-purple-50">
                                <BarChart3 className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-gray-500">Queue Processing</p>
                                <p className="font-semibold">{healthMetrics?.processingRate.toFixed(1)} emails/min</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Templates */}
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Top Performing Templates</CardTitle>
                        <CardDescription>Most engaged templates in the last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topTemplates?.map((template: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-50">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{template.templateName}</p>
                                            <p className="text-xs text-gray-500">{template.sent} emails sent</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Open</p>
                                            <p className="font-semibold text-gray-900">{template.openRate.toFixed(1)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Click</p>
                                            <p className="font-semibold text-gray-900">{template.clickRate.toFixed(1)}%</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 self-center" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Device & Location Tabs */}
                <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                    <Tabs defaultValue="devices">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle>Engagement Details</CardTitle>
                                <CardDescription>Device and location breakdown</CardDescription>
                            </div>
                            <TabsList className="bg-gray-100">
                                <TabsTrigger value="devices">Devices</TabsTrigger>
                                <TabsTrigger value="location">Location</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent>
                            <TabsContent value="devices" className="m-0 pt-4">
                                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                    <div className="h-[200px] w-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={deviceAnalytics?.devices || []}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                >
                                                    {(deviceAnalytics?.devices || []).map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {deviceAnalytics?.devices.slice(0, 4).map((device: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                    <span className="text-sm font-medium text-gray-700 capitalize">{device.type}</span>
                                                </div>
                                                <span className="text-sm text-gray-500">{device.percentage.toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="location" className="m-0 pt-4">
                                <div className="space-y-3">
                                    {locationAnalytics?.countries.slice(0, 5).map((loc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700">{loc.country}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-500 font-mono">{loc.count} opens</span>
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none">
                                                    {loc.percentage.toFixed(1)}%
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
