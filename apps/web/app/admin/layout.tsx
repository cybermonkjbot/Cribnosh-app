"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GlassNavbar } from "@/components/admin/glass-navbar";
import { GlassSidebar } from "@/components/admin/glass-sidebar";
import { motion, AnimatePresence } from "motion/react";
import React from "react";
import { AdminUserProvider, useAdminUser } from "./AdminUserProvider";
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const { user: adminUser, loading: adminLoading } = useAdminUser();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // Clear the session cookie by setting it to expire
      document.cookie = 'convex-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Clear admin email from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminEmail');
      }
      router.push('/admin/login');
    } catch {
      // Handle logout error silently
    }
  };

  // Auto-hide sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen]);

  // Determine environment for indicator
  const isProduction = process.env.NODE_ENV === 'production';
  const envLabel = isProduction ? 'Production' : 'Development';
  const envColor = isProduction ? 'bg-green-500' : 'bg-yellow-400';
  const envText = isProduction ? 'text-green-700' : 'text-yellow-700';

  const { isMobile } = useMobileDevice();

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading state while checking authentication
  if (adminLoading) {
    return <UnauthenticatedState type="loading" role="admin" />;
  }

  // Show unauthenticated state if not authenticated
  if (!adminUser) {
    return <UnauthenticatedState type="unauthenticated" role="admin" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile-only sticky notice (hide if sidebar open) */}
        {!(sidebarOpen && isMobile) && (
          <div
            className="sm:hidden fixed top-0 left-0 w-full z-40 bg-blue-50/95 backdrop-blur border-b border-blue-200 text-blue-800 font-satoshi text-xs px-3 py-2 flex items-center justify-center shadow-sm"
            role="alert"
            aria-live="polite"
          >
            <span className="font-medium">📱 Mobile Admin View - Swipe left for menu</span>
          </div>
        )}
        {/* Enhanced Navbar (hide if sidebar open on mobile) */}
        {!(sidebarOpen && isMobile) && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <GlassNavbar 
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              notifications={notifications}
              onNotificationClick={() => setNotifications(0)}
            />
          </motion.div>
        )}
        {/* Sidebar Overlay (mobile only) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        {/* Sidebar: fixed on mobile, static on desktop */}
        <div
          className={`lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 z-[101] lg:z-40 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}
          style={{ 
            transition: 'transform 0.3s ease-in-out', 
            transform: sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 'translateX(0)' : 'translateX(-100%)' 
          }}
        >
          <GlassSidebar 
            isOpen={sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)}
            onClose={() => setSidebarOpen(false)}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className="flex">
          <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 ml-0 lg:ml-64 mt-16 lg:mt-20 transition-all duration-300">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Main content, with responsive top padding */}
              <main className="pt-20 sm:pt-24 lg:pt-0">
                {children}
              </main>
            </motion.div>
          </main>
        </div>

        {/* Admin Status Indicator - Glassmorphism for key component */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="fixed top-20 right-4 z-40"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-3 border border-white/20 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${envColor}`}></div>
                <span className={`text-xs font-medium font-satoshi ${envText}`}>{envLabel} Mode</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminUserProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminUserProvider>
  );
}
