"use client";

import { GlassNavbar } from "@/components/admin/glass-navbar";
import { GlassSidebar } from "@/components/admin/glass-sidebar";
import { UnauthenticatedState } from '@/components/ui/UnauthenticatedState';
import { api } from "@/convex/_generated/api";
import { useMobileDevice } from '@/hooks/use-mobile-device';
import { useConvex } from "convex/react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { AdminUserProvider, useAdminUser } from "./AdminUserProvider";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = ['/admin/login', '/admin/forgot-password', '/admin/reset-password'];
  const isPublicPage = publicPaths.includes(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const { user: adminUser, loading: adminLoading } = useAdminUser();

  const convex = useConvex();

  const handleLogout = async () => {
    try {
      if (typeof document !== 'undefined') {
        const getCookie = (name: string) => {
          const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
          return match ? match[2] : null;
        };
        const token = getCookie('convex-auth-token');

        if (token) {
          // Call Convex mutation to delete session
          await convex.mutation(api.mutations.sessions.deleteSessionByToken, {
            sessionToken: token,
          });
        }

        // Clear the session cookie
        document.cookie = 'convex-auth-token=; path=/; max-age=0; SameSite=Lax';

        // Clear admin email from localStorage
        localStorage.removeItem('adminEmail');
      }
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still attempt to clear cookie and redirect
      document.cookie = 'convex-auth-token=; path=/; max-age=0; SameSite=Lax';
      router.push('/admin/login');
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

  const { isMobile } = useMobileDevice();

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Authentication is session-based via session token in cookies (convex-auth-token)
  // The session token is validated server-side by middleware (proxy.ts) and API routes
  // Client-side hook (useAdminUser) checks for session token and fetches user data

  // Show loading state while checking session token and fetching user data
  if (adminLoading) {
    return <UnauthenticatedState type="loading" role="admin" />;
  }

  // Show unauthenticated state if session token is missing or invalid
  if (!adminUser) {
    return <UnauthenticatedState type="unauthenticated" role="admin" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
            className="pt-20 sm:pt-24 lg:pt-0"
          >
            <Suspense fallback={<div className="flex h-full items-center justify-center pt-20"><Loader2 className="w-8 h-8 animate-spin text-[#F23E2E]" /></div>}>
              {children}
            </Suspense>
          </motion.div>
        </main>
      </div>
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
