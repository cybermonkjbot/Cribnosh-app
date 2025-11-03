"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Users, 
  Settings, 
  BarChart2, 
  FileText, 
  Shield, 
  ClipboardList,
  ChefHat,
  MapPin,
  Bell,
  X,
  TrendingUp,
  Activity,
  Database,
  LogOut,
  Mail,
  Badge,
  Clock,
  ChevronDown,
  ChevronRight,
  UserCheck,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  User,
  Bug,
  Edit,
  Eye,
  Plus,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect } from 'react';
import { useAdminUser } from "@/app/admin/AdminUserProvider";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface GlassSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export function GlassSidebar({ isOpen = true, onClose, onLogout }: GlassSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { user, loading } = useAdminUser();
  const [isClient, setIsClient] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-expand menu items when a sub-item is active
  useEffect(() => {
    navItems.forEach(item => {
      if (item.subItems && isSubItemActive(item)) {
        setExpandedItems(prev => new Set([...prev, item.name]));
      }
    });
  }, [pathname]);

  // Fetch real data for sidebar badges
  const totalUsers = useQuery(api.queries.users.getTotalUserCount);
  const waitlistCount = useQuery(api.queries.waitlist.getWaitlistCount);
  const newChefApplications = useQuery(api.queries.careers.getNewChefApplicationsCount);
  
  // Don't render if not in admin section or on login page
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return null;
  }

  // Helper function to format numbers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '...';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const navItems = [  
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: Home,
      description: 'Overview and metrics'
    },
    { 
      name: 'Account', 
      href: '/admin/account', 
      icon: User,
      description: 'Account settings and profile'
    },
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: Users,
      description: 'Manage user accounts',
      badge: formatNumber(totalUsers),
      subItems: [
        {
          name: 'All Users',
          href: '/admin/users',
          icon: Users,
          description: 'View all users',
        },
        {
          name: 'User Roles',
          href: '/admin/users/roles',
          icon: UserCheck,
          description: 'Manage user roles',
        },
        {
          name: 'User Permissions',
          href: '/admin/users/permissions',
          icon: Shield,
          description: 'Set permissions',
        },
      ]
    },
    { 
      name: 'Careers', 
      href: '/admin/careers', 
      icon: Briefcase,
      description: 'Job postings and applications',
      badge: newChefApplications && newChefApplications > 0 ? newChefApplications.toString() : undefined,
      subItems: [
        {
          name: 'Job Postings',
          href: '/admin/careers',
          icon: Briefcase,
          description: 'Manage job postings',
        },
        {
          name: 'Active Jobs',
          href: '/admin/careers/approved',
          icon: CheckCircle,
          description: 'Published job postings',
        },
        {
          name: 'Applications',
          href: '/admin/careers/reviews',
          icon: Users,
          description: 'Job applications',
        },
      ]
    },
    { 
      name: 'Waitlist', 
      href: '/admin/waitlist', 
      icon: ClipboardList,
      description: 'Waitlist management',
      badge: formatNumber(waitlistCount),
      subItems: [
        {
          name: 'All Waitlist',
          href: '/admin/waitlist',
          icon: ClipboardList,
          description: 'View waitlist',
        },
        {
          name: 'Waitlist Details',
          href: '/admin/waitlist/details',
          icon: Eye,
          description: 'Detailed waitlist view',
        },
        {
          name: 'Affiliate',
          href: '/admin/waitlist/affiliate',
          icon: Badge,
          description: 'Manage affiliate settings',
        },
        {
          name: 'Email Campaigns',
          href: '/admin/waitlist/emails',
          icon: Mail,
          description: 'Email management',
        },
      ]
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: BarChart2,
      description: 'Performance metrics',
      subItems: [
        {
          name: 'Overview',
          href: '/admin/analytics',
          icon: BarChart2,
          description: 'Main analytics',
        },
        {
          name: 'User Analytics',
          href: '/admin/analytics/users',
          icon: Users,
          description: 'User metrics',
        },
        {
          name: 'Revenue Analytics',
          href: '/admin/analytics/revenue',
          icon: DollarSign,
          description: 'Financial metrics',
        },
        {
          name: 'Reports',
          href: '/admin/analytics/reports',
          icon: FileSpreadsheet,
          description: 'Generate reports',
        },
      ]
    },
    { 
      name: 'Content', 
      href: '/admin/content', 
      icon: FileText,
      description: 'Content management',
      subItems: [
        {
          name: 'All Content',
          href: '/admin/content',
          icon: FileText,
          description: 'Manage content',
        },
        {
          name: 'Blog Posts',
          href: '/admin/content/blog',
          icon: FileText,
          description: 'Blog management',
        },
        {
          name: 'Recipes',
          href: '/admin/content/recipes',
          icon: ChefHat,
          description: 'Recipe database',
        },
        {
          name: 'Pages',
          href: '/admin/content/pages',
          icon: FileText,
          description: 'Static pages',
        },
      ]
    },
    { 
      name: 'Cities', 
      href: '/admin/cities', 
      icon: MapPin,
      description: 'City management'
    },
    { 
      name: 'Development', 
      href: '/admin/debug', 
      icon: Bug,
      description: 'Development tools and debugging'
    },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: Settings,
      description: 'System settings and configuration',
      subItems: [
        {
          name: 'General',
          href: '/admin/settings',
          icon: Settings,
          description: 'General settings',
        },
        {
          name: 'Email Config',
          href: '/admin/email-config',
          icon: Mail,
          description: 'Email settings',
        },
        {
          name: 'Email Queue',
          href: '/admin/email-config/queue',
          icon: Clock,
          description: 'Queue management',
        },
        {
          name: 'Email Templates',
          href: '/admin/email-config/template/new',
          icon: Plus,
          description: 'Create email templates',
        },
        {
          name: 'Template Editor',
          href: '/admin/email-config/template',
          icon: Edit,
          description: 'Edit email templates',
        },
        {
          name: 'System',
          href: '/admin/system',
          icon: Database,
          description: 'System configuration',
        },
      ]
    },
    { 
      name: 'Compliance', 
      href: '/admin/compliance', 
      icon: Shield,
      description: 'Compliance management',
      subItems: [
        {
          name: 'Overview',
          href: '/admin/compliance',
          icon: Shield,
          description: 'Compliance status',
        },
        {
          name: 'GDPR',
          href: '/admin/compliance/gdpr',
          icon: AlertTriangle,
          description: 'GDPR compliance',
        },
        {
          name: 'Security',
          href: '/admin/compliance/security',
          icon: Shield,
          description: 'Security policies',
        },
      ]
    },
    { 
      name: 'Staff', 
      href: '/admin/staff', 
      icon: Users,
      description: 'Staff management',
      subItems: [
        {
          name: 'All Staff',
          href: '/admin/staff',
          icon: Users,
          description: 'Staff overview',
        },
        {
          name: 'Staff Overview',
          href: '/admin/staff/overview',
          icon: Eye,
          description: 'Detailed staff view',
        },
        {
          name: 'Leave Requests',
          href: '/admin/staff/leave-requests',
          icon: Calendar,
          description: 'Manage leave',
        },
        {
          name: 'Work IDs',
          href: '/admin/staff/work-ids',
          icon: Badge,
          description: 'Work identification',
        },
        {
          name: 'Email Requests',
          href: '/admin/staff/work-email-requests',
          icon: Mail,
          description: 'Email setup',
        },
    {
      name: 'Email Campaigns',
      href: '/admin/staff/emails',
      icon: Mail,
      description: 'External email campaigns',
    },
      ]
    },
    { 
      name: 'Time Tracking', 
      href: '/admin/time-tracking', 
      icon: Clock,
      description: 'Time tracking management',
      subItems: [
        {
          name: 'Overview',
          href: '/admin/time-tracking',
          icon: Clock,
          description: 'Time tracking',
        },
        {
          name: 'Timelogs',
          href: '/admin/timelogs',
          icon: Activity,
          description: 'Detailed logs',
        },
        {
          name: 'Reports',
          href: '/admin/time-tracking/reports',
          icon: FileSpreadsheet,
          description: 'Time reports',
        },
      ]
    },
    { 
      name: 'Payroll', 
      href: '/admin/payroll', 
      icon: TrendingUp,
      description: 'Payroll management',
      subItems: [
        {
          name: 'Overview',
          href: '/admin/payroll',
          icon: TrendingUp,
          description: 'Payroll overview',
        },
        {
          name: 'Reports',
          href: '/admin/payroll/reports',
          icon: FileSpreadsheet,
          description: 'Payroll reports',
        },
        {
          name: 'Tax Documents',
          href: '/admin/payroll/tax-documents',
          icon: FileText,
          description: 'Tax management',
        },
      ]
    }
  ];

  const handleNavClick = (href: string) => {
    router.push(href);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const isItemExpanded = (itemName: string) => {
    return expandedItems.has(itemName);
  };

  const isSubItemActive = (item: any) => {
    return item.subItems?.some((subItem: any) => pathname === subItem.href) || false;
  };

  return (
    <motion.div
      initial={isMobile ? { x: -300 } : { x: 0 }}
      animate={{ x: isOpen ? 0 : -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed lg:static inset-y-0 left-0 z-50 w-64 lg:w-full bg-white/90 backdrop-blur-lg border-r border-gray-200/50 shadow-xl lg:shadow-none flex flex-col h-full`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F23E2E] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm sm:text-base">CN</span>
          </div>
          <div className="hidden sm:block">
            <h2 className="font-bold font-asgard text-gray-900 text-sm sm:text-base">CribNosh Admin</h2>
            <p className="text-xs text-gray-600 font-satoshi">Management Portal</p>
          </div>
        </div>
        
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 sm:px-4 min-h-0">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = isItemExpanded(item.name);
            const hasActiveSubItem = isSubItemActive(item);
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <div className="flex items-center">
                  <button
                    onClick={() => hasSubItems ? toggleExpanded(item.name) : handleNavClick(item.href)}
                    className={`flex-1 group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 min-h-[44px] min-w-0 overflow-hidden ${
                      isActive || hasActiveSubItem
                        ? 'bg-[#F23E2E]/10 text-[#F23E2E] border border-[#F23E2E]/20'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      isActive || hasActiveSubItem ? 'bg-[#F23E2E]/20' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isActive || hasActiveSubItem ? 'text-[#F23E2E]' : 'text-gray-600 group-hover:text-gray-700'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium font-satoshi text-sm sm:text-base truncate flex-1 min-w-0 ${
                          isActive || hasActiveSubItem ? 'text-[#F23E2E]' : 'text-gray-700 group-hover:text-gray-900'
                        }`} title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.badge && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.badge === 'New' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          {hasSubItems && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0"
                            >
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs font-satoshi mt-1 truncate whitespace-nowrap overflow-hidden text-ellipsis ${
                        isActive || hasActiveSubItem ? 'text-[#F23E2E]' : 'text-gray-500 group-hover:text-gray-600'
                      }`} title={item.description}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                </div>
                
                {/* Sub-items with animation */}
                <AnimatePresence>
                  {hasSubItems && isExpanded && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-8 mt-2 space-y-1 overflow-hidden"
                    >
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname === subItem.href;
                        
                        return (
                          <motion.li
                            key={subItem.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <button
                              onClick={() => handleNavClick(subItem.href)}
                              className={`w-full group flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 min-h-[40px] min-w-0 overflow-hidden ${
                                isSubActive
                                  ? 'bg-[#F23E2E]/10 text-[#F23E2E] border border-[#F23E2E]/20'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <SubIcon className={`w-4 h-4 ${
                                isSubActive ? 'text-[#F23E2E]' : 'text-gray-500 group-hover:text-gray-600'
                              }`} />
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <span className={`font-medium font-satoshi text-sm truncate block whitespace-nowrap overflow-hidden text-ellipsis ${
                                  isSubActive ? 'text-[#F23E2E]' : 'text-gray-600 group-hover:text-gray-700'
                                }`} title={subItem.name}>
                                  {subItem.name}
                                </span>
                                <p className={`text-xs font-satoshi mt-1 truncate whitespace-nowrap overflow-hidden text-ellipsis ${
                                  isSubActive ? 'text-[#F23E2E]' : 'text-gray-500 group-hover:text-gray-600'
                                }`} title={subItem.description}>
                                  {subItem.description}
                                </p>
                              </div>
                            </button>
                          </motion.li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200/50 p-4">
        <div className="space-y-3">
          {/* User Info */}
          {user && !loading && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-[#F23E2E]/10 rounded-full flex items-center justify-center">
          <span className="text-[#F23E2E] font-medium font-asgard text-sm">
                  {user.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium font-satoshi text-gray-900 text-sm truncate whitespace-nowrap overflow-hidden text-ellipsis" title={user.name || 'Admin User'}>
                  {user.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-600 font-satoshi truncate whitespace-nowrap overflow-hidden text-ellipsis" title={user.email || 'admin@cribnosh.com'}>
                  {user.email || 'admin@cribnosh.com'}
                </p>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 min-h-[44px] text-gray-700 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200"
          >
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <span className="font-medium font-satoshi text-sm sm:text-base">Logout</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
