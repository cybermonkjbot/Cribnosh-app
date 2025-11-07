"use client";

import { useAdminUser } from '@/app/admin/AdminUserProvider';
import { GlassCard } from '@/components/ui/glass-card';
import { useMobileMenu } from '@/context';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useStaffAuth, StaffUser } from '@/hooks/useStaffAuth';
import { useConvex, useQuery } from 'convex/react';
import { Bell, BookOpen, Clock, Home, LayoutGrid, LogOut, Menu, Search, Settings, User, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SearchModal } from './search-modal';

// Utility to get a cookie value by name (client-side only)
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

interface GlassNavbarProps {
  onMenuClick?: () => void;
  notifications?: number;
  onNotificationClick?: () => void;
  staffUser?: StaffUser | null;
  staffLoading?: boolean;
}

export function GlassNavbar({ onMenuClick, notifications = 0, onNotificationClick, staffUser: propStaffUser, staffLoading: propStaffLoading }: GlassNavbarProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const pathname = usePathname();
  const router = useRouter();
  // Navigation items based on current section
  const isAdminPage = pathname.startsWith('/admin');
  const isStaffPage = pathname.startsWith('/staff');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const deviceInfo = useMobileDevice();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const convex = useConvex();
  const [staffPortalLoading, setStaffPortalLoading] = useState(false);
  const { user: adminUser, loading: adminLoading } = useAdminUser();
  // Use passed props if available, otherwise fall back to hook
  const hookStaffAuth = useStaffAuth();
  const staffUser = propStaffUser !== undefined ? propStaffUser : hookStaffAuth.staff;
  const staffLoading = propStaffLoading !== undefined ? propStaffLoading : hookStaffAuth.loading;

  // Auth is handled by middleware, no client-side user info needed

  // Navigation items based on current section
  const adminNavItems = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Chefs', href: '/admin/careers' },
    { label: 'Waitlist', href: '/admin/waitlist' },
    { label: 'Analytics', href: '/admin/analytics' },
    { label: 'Content', href: '/admin/content' },
    { label: 'Cities', href: '/admin/cities' },
    { label: 'System', href: '/admin/system' },
    { label: 'Compliance', href: '/admin/compliance' },
    { label: 'Staff', href: '/admin/staff' },
  ];

  const staffNavItems = [
    { label: 'Portal', href: '/staff/portal' },
    { label: 'Blog', href: '/staff/blog' },
    { label: 'Waitlist', href: '/staff/waitlist' },
    { label: 'Time Tracking', href: '/staff/time-tracking' },
    { label: 'Profile', href: '/staff/profile' },
    { label: 'Documents', href: '/staff/documents' },
    { label: 'Leave Request', href: '/staff/leave-request' },
    { label: 'Work Email', href: '/staff/work-email-request' },
    { label: 'Work ID', href: '/staff/work-id' },
    { label: 'Mattermost', href: '/staff/mattermost' },
    { label: 'Onboarding', href: '/staff/onboarding' },
  ];

  const currentNavItems = isAdminPage ? adminNavItems : isStaffPage ? staffNavItems : [];

  // Mobile menu open/close
  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    if (diff < -50) {
      toggleMenu();
      setTouchStart(null);
    }
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Don't render if on login page
  if (pathname === '/admin/login' || pathname === '/staff/login') {
    return null;
  }

  // Auth is handled by middleware, no client-side checks needed

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Logout handled by middleware, just redirect
      if (isAdminPage) {
        router.push('/admin/login');
      } else if (isStaffPage) {
        router.push('/staff/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchLoading(true);
    setShowSearchModal(true);
    setSearchError(null);
    
    // Add to recent searches
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('admin-recent-searches', JSON.stringify(newRecentSearches));
    
    try {
      if (isAdminPage) {
        const res = await convex.query(api.queries.admin.globalAdminSearch, { query });
        setSearchResults(res);
      } else if (isStaffPage) {
        // For staff, we could implement staff-specific search later
        setSearchResults([]);
      }
    } catch (err) {
      setSearchError('Search failed.');
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('admin-recent-searches');
  };

  const isMobile = deviceInfo.isMobile;

  // Find current user's staff assignment (if any)
  const dashboard = useQuery(api.queries.staff.getAdminStaffDashboard, {});
  let currentAssignment: any = null;
  if (adminUser && dashboard && dashboard.staff) {
    currentAssignment = dashboard.staff.find((s: any) => s._id === adminUser._id || s.email === adminUser.email);
  }

  // Check if user is clocked in (staff/admin)
  const activeSession = useQuery(api.queries.workSessions.getActiveSession, adminUser && adminUser._id ? { staffId: adminUser._id as Id<'users'> } : "skip");

  return (
    <div className="w-full h-16 fixed top-0 left-0 right-0 p-4 backdrop-blur-xl bg-white/95 border-b border-gray-200/60 shadow-lg flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMenu}
          className="lg:hidden p-3 sm:p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="admin-mobile-menu"
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </motion.button>
        {/* Logo and Chip: stack vertically on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <img src="/logo.svg" alt="CribNosh Logo" className="h-30 w-30 mr-0 sm:mr-2" />
          <span className="hidden sm:inline rounded-full px-4 py-2 bg-[#F23E2E]/10 text-[#F23E2E] font-asgard text-base sm:text-lg font-light shadow-sm">
            {isAdminPage ? 'Admin Panel' : 'Staff Portal'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Desktop Navigation Menu - Time Tracking Only */}
        {isStaffPage && (
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/staff/time-tracking"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/staff/time-tracking'
                  ? 'bg-[#F23E2E]/10 text-[#F23E2E]'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Time Tracking
            </Link>
            {activeSession && (
              <span className="ml-2 flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-satoshi font-medium border border-green-200">
                <Clock className="w-4 h-4 text-green-500" />
                Clocked in
              </span>
            )}
          </nav>
        )}
        
        {/* Search button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
          aria-label="Open search"
        >
          <Search className="w-5 h-5 text-gray-800" />
        </motion.button>
        
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNotificationClick}
          className="p-2 rounded-lg hover:bg-gray-100/80 transition-colors relative"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5 text-gray-800" />
          {notifications > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-medium font-satoshi"
            >
              {notifications > 9 ? '9+' : notifications}
            </motion.span>
          )}
        </motion.button>
        {/* Workspace Icon (now opens modal) */}
        <button
          onClick={() => setShowAppSelector(true)}
          aria-label="Open app selector"
          className="p-2 rounded-lg hover:bg-[#F23E2E]/10 transition-colors flex items-center justify-center"
        >
          <LayoutGrid className="w-6 h-6 text-[#F23E2E]" />
        </button>
        {/* User Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-lg bg-white/80 border border-[#F23E2E]/20 overflow-hidden"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <User className="w-6 h-6 text-primary-400" />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-12 w-56 bg-white rounded-xl border border-gray-200 shadow-xl p-2 z-[100]"
              >
                <div className="p-3 border-b border-gray-200 bg-white">
                  {isStaffPage ? (
                    staffLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </div>
                    ) : staffUser ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 font-satoshi">{staffUser.name || 'User'}</p>
                        <p className="text-xs text-gray-600 font-satoshi">{staffUser.email || 'No email'}</p>
                        {staffUser.status && (
                          <div className="text-xs text-gray-500 font-satoshi mt-1">
                            {staffUser.status === 'active' ? 'Active' : staffUser.status}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 font-satoshi">User</p>
                        <p className="text-xs text-gray-500 font-satoshi">Not logged in</p>
                      </>
                    )
                  ) : (
                    adminLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                      </div>
                    ) : adminUser ? (
                      <>
                        <p className="text-sm font-medium text-gray-900 font-satoshi">{adminUser.name || 'Admin User'}</p>
                        <p className="text-xs text-gray-600 font-satoshi">{adminUser.email || 'No email'}</p>
                        {currentAssignment && (currentAssignment.department || currentAssignment.position) && (
                          <div className="text-xs text-gray-500 font-satoshi mt-1">
                            {currentAssignment.department && <span>{currentAssignment.department}</span>}
                            {currentAssignment.department && currentAssignment.position && <span> &middot; </span>}
                            {currentAssignment.position && <span>{currentAssignment.position}</span>}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 font-satoshi">Admin User</p>
                        <p className="text-xs text-gray-500 font-satoshi">Not logged in</p>
                      </>
                    )
                  )}
                </div>
                
                <div className="p-1 bg-white">
                  <Link
                    href={isStaffPage ? "/staff/profile" : "/admin/account"}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-800 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 font-satoshi mb-1 bg-white"
                    aria-label="Account Settings"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-satoshi bg-white ${
                      isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    aria-label={isLoggingOut ? 'Logging out...' : 'Logout'}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Search Results Modal */}
      {showSearchModal && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 border border-[#F23E2E]/20 relative max-h-[80vh] overflow-hidden flex flex-col">
            <button
              onClick={() => setShowSearchModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              aria-label="Close search results"
            >
              ×
            </button>
            <h2 className="text-xl font-bold font-asgard text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0">
              <Search className="w-6 h-6 text-[#F23E2E]" /> Search Results
            </h2>
            <div className="flex-1 overflow-y-auto">
              {searchLoading && <div className="text-gray-700 font-satoshi">Searching...</div>}
              {searchError && <div className="text-red-600 font-satoshi">{searchError}</div>}
              {!searchLoading && searchResults && (
                <div className="space-y-6">
                {(Object.entries(searchResults) as [string, any[]][]).map(([type, items], idx) => (
                  items.length > 0 && (
                    <div key={type}>
                      <h3 className="text-lg font-bold font-asgard text-[#F23E2E] mb-2 capitalize">{type.replace(/([A-Z])/g, ' $1')}</h3>
                      <ul className="space-y-2">
                        {items.map((item, idx) => (
                          <li key={item._id || idx} className="bg-[#F23E2E]/10 rounded-lg p-3 border border-[#F23E2E]/20 text-gray-900">
                            {item.name && <div className="font-bold">{item.name}</div>}
                            {item.title && <div className="font-bold">{item.title}</div>}
                            {item.email && <div className="text-sm text-gray-700">{item.email}</div>}
                            {item.description && <div className="text-sm text-gray-700">{item.description}</div>}
                            {item.summary && <div className="text-xs text-gray-600">{item.summary}</div>}
                            {item.status && <div className="text-xs text-gray-600">Status: {item.status}</div>}
                            {item.role && <div className="text-xs text-gray-600">Role: {item.role}</div>}
                            {item.department && <div className="text-xs text-gray-600">Department: {item.department}</div>}
                            {item.location && <div className="text-xs text-gray-600">Location: {item.location}</div>}
                            {item.activityType && <div className="text-xs text-gray-600">Type: {item.activityType}</div>}
                            {item.action && <div className="text-xs text-gray-600">Action: {item.action}</div>}
                            {item.service && <div className="text-xs text-gray-600">Service: {item.service}</div>}
                            {item.key && <div className="text-xs text-gray-600">Key: {item.key}</div>}
                            {item.value && <div className="text-xs text-gray-600">Value: {item.value}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
                {Object.values(searchResults).every((items: any) => items.length === 0) && (
                  <div className="text-gray-700 font-satoshi">No results found.</div>
                )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
        placeholder={isAdminPage ? "Search admin panel..." : "Search staff portal..."}
        isLoading={searchLoading}
        recentSearches={recentSearches}
        onClearRecent={handleClearRecentSearches}
      />

      {/* App Selector Modal */}
      {showAppSelector && typeof window !== 'undefined' && createPortal(
        <>
          {/* Fullscreen loading overlay for Staff Portal navigation */}
          {staffPortalLoading && (
            <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-lg">
              <User className="w-16 h-16 text-[#F23E2E] animate-spin mb-6" />
              <span className="font-asgard text-2xl text-gray-900">Taking you to Staff Portal...</span>
            </div>
          )}
          <div className="fixed inset-0 z-[1200] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="App selector">
            {/* Overlay (dim) */}
            <div className={`${deviceInfo.isMobile ? 'bg-white' : 'bg-black/40'} absolute inset-0 pointer-events-none`} />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`relative z-[1300] flex items-center justify-center w-full h-full pointer-events-auto`}
              onClick={e => e.stopPropagation()}
            >
              <GlassCard className={`rounded-2xl z-[1300] pointer-events-auto ${deviceInfo.isMobile ? 'w-full h-full p-6' : 'p-8'} border-[#F23E2E]/20 shadow-2xl flex flex-col items-center justify-center`}>
                <button
                  onClick={() => setShowAppSelector(false)}
                  className={`absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold`}
                  aria-label="Close app selector"
                >
                  ×
                </button>
                <h2 className="text-2xl font-bold font-asgard text-gray-900 mb-6">Apps & Workspaces</h2>
                <div className={`grid ${deviceInfo.isMobile ? 'grid-cols-2 gap-6' : 'grid-cols-3 gap-6'} w-full max-w-xs mx-auto`}>
                  <a
                    href="/admin"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F23E2E]/10 focus:bg-[#F23E2E]/20 transition-colors"
                    aria-label="Go to Admin Dashboard"
                  >
                    <Home className="w-8 h-8 text-[#F23E2E]" />
                    <span className="font-satoshi text-sm font-medium text-gray-900">Admin</span>
                  </a>
                  <a
                    href="https://collaboration.cribnosh.com/cribnosh/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F23E2E]/10 focus:bg-[#F23E2E]/20 transition-colors"
                    aria-label="Open CribNosh Collaboration Workspace"
                  >
                    <Users className="w-8 h-8 text-[#F23E2E]" />
                    <span className="font-satoshi text-sm font-medium text-gray-900">Collab</span>
                  </a>
                  {/* Convex DB Link */}
                  <a
                    href="https://dashboard.convex.dev/t/cribnosh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F23E2E]/10 focus:bg-[#F23E2E]/20 transition-colors"
                    aria-label="Open Convex DB Dashboard"
                  >
                    {/* Database icon using Lucide's LayoutGrid for now, or swap for a DB icon if available */}
                    <LayoutGrid className="w-8 h-8 text-[#F23E2E]" />
                    <span className="font-satoshi text-sm font-medium text-gray-900 whitespace-nowrap">Convex DB</span>
                  </a>
                  {/* Staff Portal Link with loading state */}
                  {!staffPortalLoading && (
                    <button
                      type="button"
                      onClick={async () => {
                        setStaffPortalLoading(true);
                        await new Promise(r => setTimeout(r, 400)); // brief delay for UX
                        router.push('/staff/portal');
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F23E2E]/10 focus:bg-[#F23E2E]/20 transition-colors whitespace-nowrap"
                      aria-label="Go to Staff Portal"
                    >
                      <User className="w-8 h-8 text-[#F23E2E]" />
                      <span className="font-satoshi text-sm font-medium text-gray-900 whitespace-nowrap">Staff Portal</span>
                    </button>
                  )}
                  <a
                    href={process.env.NEXT_PUBLIC_HULY_URL || 'https://app.huly.io'}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-[#F23E2E]/10 focus:bg-[#F23E2E]/20 transition-colors"
                    aria-label="Open Huly"
                  >
                    <BookOpen className="w-8 h-8 text-[#F23E2E]" />
                    <span className="font-satoshi text-sm font-medium text-gray-900">Huly</span>
                  </a>
                  {/* Add more apps here as needed */}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>,
        document.body
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="admin-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation menu"
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] bg-white h-screen flex flex-col overflow-y-auto"
            onTouchStart={deviceInfo.hasTouchScreen ? handleTouchStart : undefined}
            onTouchMove={deviceInfo.hasTouchScreen ? handleTouchMove : undefined}
          >
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-200 bg-white safe-area-top">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-full transition-colors active:scale-90 mr-3 text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="relative h-8 w-auto">
                <Image src="/logo.svg" alt="CribNosh Logo" width={100} height={32} className="h-8 w-auto" priority />
              </div>
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-600 font-satoshi">
                  {isAdminPage ? 'Admin Panel' : 'Staff Portal'}
                </span>
              </div>
            </div>
            {/* Menu content */}
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {currentNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={toggleMenu}
                    className="block px-4 py-4 text-lg font-asgard rounded-xl text-gray-800 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            {/* Footer: Logout button */}
            <div className="p-4 border-t border-gray-200 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-red-100/80 hover:bg-red-200/80 rounded-lg transition-colors font-satoshi text-base"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Limited Functionality Notice Bar (mobile only, admin only) */}
      {isMobile && isAdminPage && (
        <div className="fixed top-16 left-0 w-full z-[60] bg-yellow-100 text-yellow-900 text-center py-2 px-4 font-satoshi text-sm shadow-md sm:hidden">
          <span className="font-bold">Notice:</span> Some admin features are limited on mobile for your security and best experience. For full access, please use a desktop device.
        </div>
      )}
    </div>
  );
}