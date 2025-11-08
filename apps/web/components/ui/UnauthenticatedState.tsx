'use client';

import { AlertCircle, Loader2, Lock, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';

export type UnauthenticatedStateType = 
  | 'loading'
  | 'unauthenticated'
  | 'session-expired'
  | 'inactive-account'
  | 'unauthorized';

interface UnauthenticatedStateProps {
  type: UnauthenticatedStateType;
  role?: 'admin' | 'staff';
  loginPath?: string;
  message?: string;
  onRetry?: () => void;
}

export function UnauthenticatedState({
  type,
  role = 'admin',
  loginPath,
  message,
  onRetry,
}: UnauthenticatedStateProps) {
  const router = useRouter();
  const defaultLoginPath = role === 'admin' ? '/admin/login' : '/staff/login';
  const finalLoginPath = loginPath || defaultLoginPath;

  const handleRedirect = () => {
    router.push(finalLoginPath);
  };

  // Loading state
  if (type === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-gray-50 to-gray-100">
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
          <Loader2 className="w-12 h-12 text-[#F23E2E] mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-asgard text-gray-900 mb-2">
            {message || `Loading your ${role === 'admin' ? 'admin dashboard' : 'staff portal'}...`}
          </h1>
          <p className="text-gray-600 font-satoshi text-sm">
            Please wait while we verify your session
          </p>
        </GlassCard>
      </div>
    );
  }

  // Unauthenticated state
  if (type === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-gray-50 to-gray-100">
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
          <Lock className="w-12 h-12 text-[#F23E2E] mx-auto mb-4" />
          <h1 className="text-xl font-asgard text-gray-900 mb-2">
            {message || 'Authentication Required'}
          </h1>
          <p className="text-gray-600 font-satoshi text-sm mb-6">
            {role === 'admin' 
              ? 'Please log in to access the admin dashboard.'
              : 'Please log in to view your staff portal.'}
          </p>
          <button
            onClick={handleRedirect}
            className="w-full px-4 py-2 bg-[#F23E2E] text-white rounded-xl font-satoshi font-medium hover:bg-[#d6362a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E] focus:ring-offset-2"
          >
            Go to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  // Session expired state
  if (type === 'session-expired') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-amber-50 to-orange-100">
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h1 className="text-xl font-asgard text-gray-900 mb-2">
            {message || 'Session Expired'}
          </h1>
          <p className="text-gray-600 font-satoshi text-sm mb-6">
            Your session has expired. Please log in again to continue.
          </p>
          <button
            onClick={handleRedirect}
            className="w-full px-4 py-2 bg-[#F23E2E] text-white rounded-xl font-satoshi font-medium hover:bg-[#d6362a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E] focus:ring-offset-2"
          >
            Log In Again
          </button>
        </GlassCard>
      </div>
    );
  }

  // Inactive account state (staff only)
  if (type === 'inactive-account') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-red-50 to-red-100">
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
          <UserX className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-asgard text-gray-900 mb-2">
            {message || 'Account Not Active'}
          </h1>
          <p className="text-gray-600 font-satoshi text-sm mb-6">
            Your staff account is not active. Please contact support for assistance.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-xl font-satoshi font-medium hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 mb-3"
            >
              Retry
            </button>
          )}
          <button
            onClick={handleRedirect}
            className="w-full px-4 py-2 bg-[#F23E2E] text-white rounded-xl font-satoshi font-medium hover:bg-[#d6362a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E] focus:ring-offset-2"
          >
            Back to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  // Unauthorized state
  if (type === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-red-50 to-red-100">
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-asgard text-gray-900 mb-2">
            {message || 'Access Denied'}
          </h1>
          <p className="text-gray-600 font-satoshi text-sm mb-6">
            {role === 'admin'
              ? 'You do not have permission to access the admin dashboard.'
              : 'You do not have permission to access the staff portal.'}
          </p>
          <button
            onClick={handleRedirect}
            className="w-full px-4 py-2 bg-[#F23E2E] text-white rounded-xl font-satoshi font-medium hover:bg-[#d6362a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F23E2E] focus:ring-offset-2"
          >
            Back to Login
          </button>
        </GlassCard>
      </div>
    );
  }

  return null;
}

