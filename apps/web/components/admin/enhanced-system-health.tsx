"use client";

import { useAdminUser } from "@/app/admin/AdminUserProvider";
import { useQuery } from "convex/react";
import { Activity, AlertTriangle, CheckCircle, Cloud, Database, Server, Shield, Wifi } from "lucide-react";
import { useEffect, useState } from 'react';

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "critical";
  icon: typeof Activity;
  description: string;
  threshold: {
    warning: number;
    critical: number;
  };
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export function EnhancedSystemHealth() {
  const { sessionToken } = useAdminUser();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alerts, setAlerts] = useState<string[]>([]);

  // Fetch real system health data from Convex
  const systemHealthData = useQuery(api.queries.systemHealth.getSystemHealth, sessionToken ? { sessionToken } : 'skip');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Convert Convex data to our format
  const convertSystemHealthData = (): SystemMetric[] => {
    if (!systemHealthData) return [];

    const iconMap: Record<string, typeof Activity> = {
      'API Gateway': Activity,
      'Database': Database,
      'Authentication': Shield,
      'Payment Processing': Server,
      'File Storage': Cloud,
      'Email Service': Wifi,
    };

    return systemHealthData.services.map((service: any) => {
      const status = service.status === 'healthy' ? 'healthy' : 
                    service.status === 'warning' ? 'warning' : 'critical';
      
      return {
        name: service.name,
        value: service.responseTime,
        status: status as "healthy" | "warning" | "critical",
        icon: iconMap[service.name] || Activity,
        description: service.details || `${service.name} status`,
        threshold: { 
          warning: service.name === 'API Gateway' ? 200 : 
                   service.name === 'Database' ? 100 : 
                   service.name === 'Authentication' ? 150 : 200, 
          critical: service.name === 'API Gateway' ? 500 : 
                    service.name === 'Database' ? 200 : 
                    service.name === 'Authentication' ? 300 : 500 
        },
        unit: service.name.includes('Usage') || service.name.includes('Load') ? '%' : 'ms',
        trend: service.responseTime < 100 ? 'down' : 
               service.responseTime > 300 ? 'up' : 'stable'
      };
    });
  };

  const metrics = convertSystemHealthData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', progress: 'bg-green-500' };
      case 'warning': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', progress: 'bg-amber-500' };
      case 'critical': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', progress: 'bg-red-500' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', progress: 'bg-gray-500' };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <motion.div animate={{ y: [-2, 0, -2] }} transition={{ duration: 1, repeat: Infinity }}><Activity className="w-3 h-3" /></motion.div>;
      case 'down': return <motion.div animate={{ y: [2, 0, 2] }} transition={{ duration: 1, repeat: Infinity }}><Activity className="w-3 h-3" /></motion.div>;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const criticalMetrics = metrics.filter(m => m.status === 'critical');
  const warningMetrics = metrics.filter(m => m.status === 'warning');

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-asgard text-gray-900 break-words">System Health Monitor</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          {(criticalMetrics.length > 0 || warningMetrics.length > 0) && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                {criticalMetrics.length} critical, {warningMetrics.length} warnings
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {criticalMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Critical System Alerts</h3>
              <p className="text-sm text-red-700">
                {criticalMetrics.map(m => m.name).join(', ')} require immediate attention
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-full overflow-hidden">
        {metrics.map((metric, index) => {
          const colors = getStatusColor(metric.status);
          const Icon = metric.icon;
          const progressPercentage = Math.min((metric.value / metric.threshold.critical) * 100, 100);

          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              className={`group bg-white/70 backdrop-blur-md rounded-2xl p-3 sm:p-4 md:p-6 border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300 max-w-full overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className={`p-2 sm:p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${colors.text}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 break-words">{metric.name}</h3>
                    <p className="text-xs text-gray-500 break-words">{metric.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text} break-words`}>
                    {metric.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold font-asgard text-gray-900 break-words">
                    {metric.value}{metric.unit}
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                    <span>Threshold:</span>
                    <span className="text-amber-600">{metric.threshold.warning}{metric.unit}</span>
                    <span>/</span>
                    <span className="text-red-600">{metric.threshold.critical}{metric.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Performance</span>
                    <span>{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full ${colors.progress} relative`}
                    >
                      {metric.status === 'critical' && (
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 bg-white/30"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 min-w-0">
                  <span>Status</span>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {metric.status === 'healthy' && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {metric.status === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {metric.status === 'critical' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                    <span className={`${colors.text} break-words`}>{metric.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Summary */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-lg">
        <h3 className="text-lg font-bold font-asgard text-gray-900 mb-4 break-words">System Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.filter(m => m.status === 'healthy').length}</div>
            <div className="text-sm text-gray-600">Healthy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{warningMetrics.length}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{criticalMetrics.length}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metrics.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
} 