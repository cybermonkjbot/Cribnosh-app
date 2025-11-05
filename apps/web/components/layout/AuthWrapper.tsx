"use client";

import { ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
  role?: 'admin' | 'staff';
}

/**
 * AuthWrapper component that simply renders children.
 * Authentication is handled by middleware, so no client-side auth checks are needed.
 */
export function AuthWrapper({ children, role }: AuthWrapperProps) {
  // Auth is handled by middleware, so we just render children
  return <>{children}</>;
} 