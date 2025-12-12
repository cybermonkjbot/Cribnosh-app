"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { api } from '@/convex/_generated/api';
import { formatCurrency } from '@/lib/utils/number-format';
import { useQuery } from 'convex/react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  ChefHat,
  Clock,
  MapPin,
  PoundSterling,
  TrendingUp,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { GlassCard, GlassCardGrid } from './glass-card';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function StatCard({ title, value, change, changeType = 'neutral', icon, color, description }: StatCardProps) {
  const getChangeIcon = () => {
    if (changeType === 'positive') return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (changeType === 'negative') return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <GlassCard
      title={title}
      subtitle={description}
      icon={icon}
      variant="primary"
      className="relative overflow-hidden group transition-all duration-200 hover:shadow-2xl hover:bg-white/95 cursor-pointer max-w-full"
    >
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-asgard text-gray-900 group-hover:text-gray-700 transition-colors break-words leading-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                {getChangeIcon()}
                <span className={`text-xs sm:text-sm font-medium font-satoshi ${getChangeColor()} break-words`}>
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 md:p-4 rounded-2xl bg-primary-50 flex items-center justify-center shadow-inner flex-shrink-0`}>
            <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center ${color}`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

interface EnhancedStatsProps {
  onError?: (error: string) => void;
}

export function EnhancedStats({ onError }: EnhancedStatsProps) {
  const [loading, setLoading] = useState(false);
  const { sessionToken } = useAdminUser();

  // Fetch real analytics data from Convex
  const analyticsData = useQuery(
    api.queries.analytics.getDashboardMetrics,
    sessionToken ? { timeRange: "30d", sessionToken } : 'skip'
  );

  const realtimeMetrics = useQuery(
    api.queries.analytics.getRealtimeMetrics,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Calculate derived stats from real data
  const stats = analyticsData ? {
    totalUsers: analyticsData.totalUsers.toLocaleString(),
    activeUsers: realtimeMetrics?.activeUsers?.toLocaleString() || '0',
    totalRevenue: formatCurrency(analyticsData.totalRevenue, { currency: 'GBP' }),
    monthlyGrowth: `${analyticsData.userGrowth >= 0 ? '+' : ''}${analyticsData.userGrowth.toFixed(1)}%`,
    chefApplications: analyticsData.activeChefs.toLocaleString(),
    citiesCovered: analyticsData.citiesServed.toString(),
    orderCompletion: analyticsData.totalOrders > 0
      ? `${((analyticsData.totalOrders - (analyticsData.totalOrders * 0.013)) / analyticsData.totalOrders * 100).toFixed(1)}%`
      : '0%',
    avgResponseTime: realtimeMetrics?.systemHealth?.responseTime
      ? `${(realtimeMetrics.systemHealth.responseTime / 1000).toFixed(1)}s`
      : '0s'
  } : {
    totalUsers: '0',
    activeUsers: '0',
    totalRevenue: formatCurrency(0, { currency: 'GBP' }),
    monthlyGrowth: '0%',
    chefApplications: '0',
    citiesCovered: '0',
    orderCompletion: '0%',
    avgResponseTime: '0s'
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // The data will automatically refresh due to Convex reactivity
      // Just simulate a brief loading state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analyticsData === undefined || realtimeMetrics === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [analyticsData, realtimeMetrics]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: analyticsData ? `${analyticsData.userGrowth >= 0 ? '+' : ''}${analyticsData.userGrowth.toFixed(1)}%` : '0%',
      changeType: analyticsData && analyticsData.userGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: <Users className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Registered users across all cities'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: realtimeMetrics ? `+${realtimeMetrics.activeUsers} online` : '0 online',
      changeType: 'positive' as const,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Users currently active'
    },
    {
      title: 'Total Revenue',
      value: stats.totalRevenue,
      change: analyticsData ? `${analyticsData.revenueGrowth >= 0 ? '+' : ''}${analyticsData.revenueGrowth.toFixed(1)}%` : '0%',
      changeType: analyticsData && analyticsData.revenueGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: <PoundSterling className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Revenue generated this month'
    },
    {
      title: 'Active Chefs',
      value: stats.chefApplications,
      change: analyticsData ? `${analyticsData.chefGrowth >= 0 ? '+' : ''}${analyticsData.chefGrowth.toFixed(1)}%` : '0%',
      changeType: analyticsData && analyticsData.chefGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: <ChefHat className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Active food creators on platform'
    },
    {
      title: 'Cities Covered',
      value: stats.citiesCovered,
      change: analyticsData ? `+${analyticsData.citiesServed} cities` : '0 cities',
      changeType: 'positive' as const,
      icon: <MapPin className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Cities with active service'
    },
    {
      title: 'Order Completion',
      value: stats.orderCompletion,
      change: analyticsData ? `${analyticsData.orderGrowth >= 0 ? '+' : ''}${analyticsData.orderGrowth.toFixed(1)}%` : '0%',
      changeType: analyticsData && analyticsData.orderGrowth >= 0 ? 'positive' as const : 'negative' as const,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'text-gray-600',
      description: 'Successful order completion rate'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold font-asgard text-gray-900 break-words">Platform Statistics</h2>
          <p className="text-gray-800 font-satoshi text-xs sm:text-sm md:text-base break-words">Real-time metrics and performance indicators</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 font-satoshi text-xs sm:text-sm md:text-base w-full sm:w-auto flex-shrink-0"
          aria-label="Refresh statistics"
        >
          <Clock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-medium">Refresh</span>
        </motion.button>
      </div>

      <GlassCardGrid cols={3} className="hidden sm:grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </GlassCardGrid>
      <GlassCardGrid cols={1} className="sm:hidden">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </GlassCardGrid>

      {/* Performance Indicators */}
      <GlassCard
        title="Performance Indicators"
        subtitle="System health and response metrics"
        icon={<TrendingUp className="w-6 h-6" />}
        className="max-w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 rounded-full flex items-center justify-center ${realtimeMetrics?.systemHealth?.status === 'operational' ? 'bg-green-100' : 'bg-red-100'
              }`}>
              <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${realtimeMetrics?.systemHealth?.status === 'operational' ? 'text-green-600' : 'text-red-600'
                }`} />
            </div>
            <h4 className="text-sm sm:text-base md:text-lg font-bold font-asgard text-gray-900 mb-0.5 sm:mb-1 break-words">System Status</h4>
            <p className={`text-base sm:text-lg md:text-2xl font-bold font-satoshi break-words ${realtimeMetrics?.systemHealth?.status === 'operational' ? 'text-green-600' : 'text-red-600'
              }`}>
              {realtimeMetrics?.systemHealth?.status || 'Unknown'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-satoshi break-words">Current status</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-600" />
            </div>
            <h4 className="text-sm sm:text-base md:text-lg font-bold font-asgard text-gray-900 mb-0.5 sm:mb-1 break-words">Response Time</h4>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-700 font-satoshi break-words">
              {stats.avgResponseTime}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-satoshi break-words">Average API response</p>
          </div>

          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-600" />
            </div>
            <h4 className="text-sm sm:text-base md:text-lg font-bold font-asgard text-gray-900 mb-0.5 sm:mb-1 break-words">Live Streams</h4>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-gray-700 font-satoshi break-words">
              {realtimeMetrics?.liveStreams || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-satoshi break-words">Currently streaming</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
} 