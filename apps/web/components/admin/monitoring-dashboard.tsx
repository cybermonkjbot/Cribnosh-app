'use client';

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { AlertDescription, AlertTitle, Alert as UIAlert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from 'convex/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Gauge,
  Heart,
  TrendingUp,
  User,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    stripe: boolean;
    agora: boolean;
    external_apis: boolean;
  };
  lastCheck: number;
  uptime: number;
  version: string;
}

interface PerformanceMetrics {
  api_response_time: number;
  database_query_time: number;
  redis_operation_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  error_rate: number;
  request_rate: number;
}

interface SystemAlert {
  id: string;
  ruleId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export default function MonitoringDashboard() {
  const { sessionToken } = useAdminUser();
  const [refreshing, setRefreshing] = useState(false);

  // Get monitoring data from Convex
  const systemHealthData = useQuery(api.queries.systemHealth.getSystemHealth, sessionToken ? { sessionToken } : 'skip');
  const performanceMetrics = useQuery(api.queries.analytics.getRealtimeMetrics, sessionToken ? { sessionToken } : 'skip');
  const activeAlerts = useQuery(api.queries.activityFeed.getActivityFeed, sessionToken ? {
    type: "system",
    limit: 10,
    sessionToken
  } : 'skip');

  const resolveAlert = useMutation(api.mutations.admin.logActivity);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Convex will automatically refetch data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert({
        description: `Alert ${alertId} resolved by admin`,
        type: "alert_resolution"
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!systemHealthData && !performanceMetrics && !activeAlerts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <Activity className="h-4 w-4 mr-2" />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemHealthData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(systemHealthData.overallHealth.status)}>
                    {systemHealthData.overallHealth.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Score: {systemHealthData.overallHealth.score.toFixed(1)}%
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last Updated: {new Date(systemHealthData.overallHealth.lastUpdated).toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {systemHealthData.services.map((service: any) => (
                  <div key={service.name} className="flex items-center gap-2">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">{service.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.systemHealth.responseTime.toFixed(0)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Average API response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Orders awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Streams</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.liveStreams}
              </div>
              <p className="text-xs text-muted-foreground">
                Active live sessions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Alerts ({activeAlerts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!activeAlerts || activeAlerts.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p>No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map((alert: any) => (
                <UIAlert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    <span>{alert.description || alert.title || 'System Alert'}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity || 'medium')}>
                        {alert.severity || 'medium'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    {new Date(alert.timestamp).toLocaleString()}
                  </AlertDescription>
                </UIAlert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 