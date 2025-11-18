"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return {
          label: "Published",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "draft":
        return {
          label: "Draft",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
      case "archived":
        return {
          label: "Archived",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "flagged":
        return {
          label: "Flagged",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      case "removed":
        return {
          label: "Removed",
          className: "bg-gray-200 text-gray-600 border-gray-300",
        };
      case "pending":
        return {
          label: "Pending",
          className: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "approved":
        return {
          label: "Approved",
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

