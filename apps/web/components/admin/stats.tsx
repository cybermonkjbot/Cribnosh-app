"use client";

import { Users, Utensils, Clock, TrendingUp } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AdminStatsGridSkeleton } from '@/components/admin/skeletons';

interface AdminStat {
  _id: string;
  key: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  lastUpdated: number;
}

export function AdminStats({ onError }: { onError?: (err: string) => void }) {
  const stats = useQuery(api.queries.admin.getAdminStats) as AdminStat[] | undefined;

  const statIcons: Record<string, typeof Users> = {
    total_users: Users,
    active_chefs: Utensils,
    avg_response_time: Clock,
    conversion_rate: TrendingUp,
  };

  if (!stats || !Array.isArray(stats)) {
    return <AdminStatsGridSkeleton cardCount={4} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = statIcons[stat.key] || Users;
        const formattedValue = stat.key.includes('time') 
          ? `${stat.value}s`
          : stat.key.includes('rate') 
            ? `${stat.value}%`
            : stat.value.toLocaleString();

        return (
          <div
            key={stat._id}
            className="bg-white/50  backdrop-blur-sm rounded-xl p-6 border border-gray-200/20 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-100/50 ">
                  <Icon className="w-5 h-5 text-amber-600 " />
                </div>
                <h3 className="text-sm font-medium text-gray-500 ">
                  {stat.key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </h3>
              </div>
              <span
                className={`text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-600 ' : 'text-red-600 '
                }`}
              >
                {stat.changePercentage > 0 ? '+' : ''}{stat.changePercentage}%
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold font-Asgard text-gray-900 ">
              {formattedValue}
            </p>
          </div>
        );
      })}
    </div>
  );
}
