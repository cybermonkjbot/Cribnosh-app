"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Activity, Server, Database, Cloud } from "lucide-react";
import { motion } from "motion/react";

interface SystemMetric {
  name: string;
  value: number;
  status: "healthy" | "warning" | "critical";
  icon: typeof Activity;
}

export function SystemHealth() {
  // Get system health metrics from Convex
  const metrics = useQuery(api.queries.systemHealth.getSystemHealth) as SystemMetric[] | undefined;

  // Default metrics if data is not available
  const defaultMetrics = [
    {
      name: "API Response Time",
      value: 120, // ms
      status: "healthy" as const,
      icon: Activity,
    },
    {
      name: "Server Load",
      value: 45, // percentage
      status: "warning" as const,
      icon: Server,
    },
    {
      name: "Database Health",
      value: 98, // percentage
      status: "healthy" as const,
      icon: Database,
    },
    {
      name: "Storage Usage",
      value: 75, // percentage
      status: "warning" as const,
      icon: Cloud,
    },
  ] as SystemMetric[];

  const systemMetrics = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {systemMetrics.map((metric) => (
        <motion.div
          key={metric.name}
          whileHover={{ scale: 1.02 }}
          className="bg-white/50  backdrop-blur-sm rounded-xl p-6 border border-gray-200/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                metric.status === "healthy" ? "bg-green-100/50 " :
                metric.status === "warning" ? "bg-amber-100/50 " :
                "bg-red-100/50 "
              }`}>
                <metric.icon className={`w-5 h-5 ${
                  metric.status === "healthy" ? "text-green-600 " :
                  metric.status === "warning" ? "text-amber-600 " :
                  "text-red-600 "
                }`} />
              </div>
              <h3 className="text-sm font-medium text-gray-500 ">
                {metric.name}
              </h3>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              metric.status === "healthy" ? "bg-green-100/50 text-green-700  " :
              metric.status === "warning" ? "bg-amber-100/50 text-amber-700  " :
              "bg-red-100/50 text-red-700  "
            }`}>
              {metric.status.toUpperCase()}
            </span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block text-gray-600 ">
                  {metric.value}{metric.name.includes("Time") ? "ms" : "%"}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 ">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1 }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                  metric.status === "healthy" ? "bg-green-500" :
                  metric.status === "warning" ? "bg-amber-500" :
                  "bg-red-500"
                }`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}