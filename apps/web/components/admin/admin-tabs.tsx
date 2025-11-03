"use client";

import { motion, AnimatePresence } from 'motion/react';
import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string | number;
}

interface AdminTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  children: (activeTab: string) => ReactNode;
  className?: string;
  onTabChange?: (tabId: string) => void;
  activeTab?: string;
}

export function AdminTabs({ 
  tabs, 
  defaultTab, 
  children, 
  className,
  onTabChange,
  activeTab: externalActiveTab
}: AdminTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  const activeTab = externalActiveTab || internalActiveTab;

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm rounded-t-xl">
        <nav className="flex space-x-0 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium font-satoshi transition-all duration-200 whitespace-nowrap min-h-[44px]",
                  "hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/20 focus:z-10",
                  isActive
                    ? "text-[#F23E2E] border-b-2 border-[#F23E2E] bg-[#F23E2E]/5"
                    : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span className={cn(
                    "ml-2 px-2 py-0.5 text-xs font-medium rounded-full",
                    isActive 
                      ? "bg-[#F23E2E]/20 text-[#F23E2E]" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white/30 backdrop-blur-sm rounded-b-xl border border-gray-200/30 border-t-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {children(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Mobile-optimized version for smaller screens
export function AdminTabsMobile({ 
  tabs, 
  defaultTab, 
  children, 
  className,
  onTabChange 
}: AdminTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Tab Selector */}
      <div className="mb-4">
        <select
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm font-medium font-satoshi focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/20 focus:border-[#F23E2E]"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon && <span className="mr-2">📋</span>}
              {tab.label}
              {tab.badge && ` (${tab.badge})`}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Content */}
      <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-6"
          >
            {children(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
