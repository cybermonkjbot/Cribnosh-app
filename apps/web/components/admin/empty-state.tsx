"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  variant?: "no-data" | "filtered" | "compact";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "no-data",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const iconSize = isCompact ? "w-6 h-6" : "w-12 h-12";
  const iconColor = isCompact ? "text-gray-500" : "text-gray-500";

  if (isCompact) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-4", className)}>
        <Icon className={cn(iconSize, iconColor)} />
        <p className="text-sm text-gray-700 font-satoshi">{title}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("w-full", className)}
    >
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="text-center py-12">
          <Icon className={cn(iconSize, iconColor, "mx-auto mb-4")} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
          
          {(action || secondaryAction) && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {action && (
                <Button
                  onClick={action.onClick}
                  className={cn(
                    action.variant === "secondary"
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      : "bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                  )}
                >
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

