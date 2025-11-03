import { Link } from '@/components/link';
import { GlassCard } from '@/components/ui/glass-card';
import { useUserIp } from '@/hooks/use-user-ip';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface UnifiedInternalLoginProps {
  role: 'admin' | 'staff';
  apiEndpoint: string;
  redirectPath: string;
}

// Utility to get a cookie value by name (client-side only)
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export default function UnifiedInternalLogin({ role, apiEndpoint, redirectPath }: UnifiedInternalLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const userIp = useUserIp();

  // Focus error for accessibility
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (userIp) {
      console.log('[User IP]', userIp);
    }
  }, [userIp]);

  // Debug: Log when component mounts/unmounts (admin only)
  useEffect(() => {
    if (role === 'admin') {
      console.log('[ADMIN LOGIN DEBUG] UnifiedInternalLogin mounted');
      return () => {
        console.log('[ADMIN LOGIN DEBUG] UnifiedInternalLogin unmounted');
      };
    }
  }, [role]);

  // Email and password validation
  const isValidEmail = (email: string) => /.+@.+\..+/.test(email);
  const isValidPassword = (pw: string) => pw.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submit
    setError(null);

    if (role === 'admin') {
      console.log('[ADMIN LOGIN DEBUG] Form submitted', { email });
    }

    // Client-side validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      if (role === 'admin') {
        console.log('[ADMIN LOGIN DEBUG] Invalid email');
      }
      return;
    }
    if (!isValidPassword(password)) {
      setError('Password must be at least 6 characters.');
      if (role === 'admin') {
        console.log('[ADMIN LOGIN DEBUG] Invalid password');
      }
      return;
    }

    setLoading(true);
    try {
      // Always fetch a fresh CSRF token before login
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' });
      const csrfData = await csrfRes.json();
      const freshCsrfToken = csrfData.csrfToken;

      // Debug: Log CSRF cookie and header values before login
      if (role === 'admin') {
        console.log('[ADMIN LOGIN DEBUG] CSRF', { cookieValue: getCookie('csrf_token'), freshCsrfToken });
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': freshCsrfToken,
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Ensure cookies are sent
      });
      let data: any = {};
      try {
        data = await response.json();
        if (role === 'admin') {
          console.log('[ADMIN LOGIN DEBUG] API response', { status: response.status, data });
        }
      } catch (jsonErr) {
        console.error('[LOGIN] Failed to parse JSON:', jsonErr);
        if (role === 'admin') {
          console.log('[ADMIN LOGIN DEBUG] Failed to parse JSON', { jsonErr });
        }
        setError('Unexpected server response. Please try again.');
        setLoading(false);
        return;
      }
      if (response.ok && (role === 'admin' ? data.success : true)) {
        if (data.token) {
          if (role === 'admin') {
            localStorage.setItem('adminToken', data.token);
          } else if (role === 'staff') {
            localStorage.setItem('staffToken', data.token);
          }
        }
        if (data.sessionToken) {
          const isProd = process.env.NODE_ENV === 'production';
          // Remove all lines like:
          // localStorage.setItem('convex-auth-token', data.sessionToken);
          // convexAuthToken: typeof window !== 'undefined' ? localStorage.getItem('convex-auth-token') : null,
          // Instead, rely on the cookie for session management.
        }
        if (typeof window !== 'undefined') {
          if (role === 'admin') {
            localStorage.setItem('adminEmail', email);
          } else if (role === 'staff') {
            localStorage.setItem('staffEmail', email);
          }
        }
        if (role === 'admin') {
          console.log('[ADMIN LOGIN DEBUG] Login success, sessionToken and email set in localStorage', {
            // Remove all lines like:
            // convexAuthToken: typeof window !== 'undefined' ? localStorage.getItem('convex-auth-token') : null,
            staffEmail: typeof window !== 'undefined' ? localStorage.getItem('staffEmail') : null,
            cookies: typeof document !== 'undefined' ? document.cookie : null
          });
        }
        setSuccess(true);
        setTimeout(() => {
          if (role === 'admin') {
            console.log('[ADMIN LOGIN DEBUG] Redirecting to', redirectPath);
          }
          // Use window.location.href instead of router.push to ensure full page reload
          // This ensures the middleware runs with the fresh cookie
          window.location.href = redirectPath;
        }, 3000); // Increased delay to ensure cookie is set and provider can detect it
        console.log('[LOGIN SUCCESS]', { email, role });
      } else {
        // Mask all errors
        setError('Login failed. Please check your credentials and try again.');
        console.warn('[LOGIN FAILURE]', { email, role, serverMessage: data.error || data.message });
        if (role === 'admin') {
          console.log('[ADMIN LOGIN DEBUG] Login failed', { data, cookies: typeof document !== 'undefined' ? document.cookie : null });
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('[LOGIN ERROR]', { email, role, err });
      if (role === 'admin') {
        console.log('[ADMIN LOGIN DEBUG] Network error', { err });
      }
    } finally {
      setLoading(false);
      if (role === 'admin') {
        console.log('[ADMIN LOGIN DEBUG] Loading set to false');
      }
    }
  };

  // Debug: Log localStorage and cookies on mount for admin
  useEffect(() => {
    if (role === 'admin') {
      console.log('[ADMIN LOGIN DEBUG] On mount localStorage/cookies', {
        // Remove all lines like:
        // convexAuthToken: typeof window !== 'undefined' ? localStorage.getItem('convex-auth-token') : null,
        staffEmail: typeof window !== 'undefined' ? localStorage.getItem('staffEmail') : null,
        cookies: typeof document !== 'undefined' ? document.cookie : null
      });
    }
  }, [role]);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
        {/* Stained red accent */}
        <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#ff3b30]/15 blur-3xl z-0" />
        <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#ff5e54]/10 blur-2xl z-0" />
        <GlassCard className="p-8 text-center max-w-md shadow-2xl backdrop-blur-xl relative z-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-asgard text-gray-900 mb-4">Login Successful!</h1>
          <p className="text-gray-700 font-satoshi mb-6">Redirecting to your {role === 'admin' ? 'admin dashboard' : 'staff portal'}...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff3b30] mx-auto"></div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-white overflow-hidden">
      {/* Stained red accent */}
      <div className="pointer-events-none select-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#ff3b30]/15 blur-3xl z-0" />
      <div className="pointer-events-none select-none absolute bottom-0 right-0 w-[320px] h-[320px] rounded-full bg-[#ff5e54]/10 blur-2xl z-0" />
      <main className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen py-8 px-2">
        <GlassCard className="p-3 sm:p-4 max-w-sm w-full shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-2">
            {/* CribNosh Logo */}
            <div className="w-24 h-10 flex items-center justify-center mb-2">
              <img
                src="/logo.svg"
                alt="CribNosh Logo"
                className="h-10 w-auto object-contain select-none"
                draggable="false"
                aria-label="CribNosh Logo"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-asgard text-gray-900 mb-1 drop-shadow-sm text-center">{role === 'admin' ? 'Admin Access' : 'Welcome to CribNosh Staff'}</h1>
            <p className="text-xs sm:text-sm font-satoshi text-center text-gray-800/90 font-medium mb-1">
              {role === 'admin' ? 'Sign in to manage CribNosh platform' : 'Your personalized, culturally-rich staff portal. Please sign in to continue.'}
            </p>
          </div>

          {error && (
            <div ref={errorRef} tabIndex={-1} aria-live="assertive" className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg focus:outline-none">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 font-satoshi">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" aria-label={`${role} login form`}>
            <div>
              <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="email">Email Address</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 pl-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:bg-white transition-all"
                  placeholder={role === 'admin' ? 'admin@cribnosh.com' : 'Enter your work email'}
                  aria-label="Email"
                  autoComplete="email"
                  disabled={loading}
                />
                <User className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pl-12 pr-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:bg-white transition-all"
                  placeholder="Enter your password"
                  aria-label="Password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <Lock className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#ff3b30] hover:text-[#ff5e54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff3b30]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-white text-[#ff3b30] hover:bg-white/90 active:scale-95 transition-all duration-150 rounded-xl font-asgard text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ff3b30]"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Security Notice for Admin */}
          {role === 'admin' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 sm:mt-6 p-2 sm:p-3 bg-gray-100/80 rounded-xl border border-gray-200/60"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <Lock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800 font-satoshi mb-1">Secure Access</p>
                  <p className="text-xs text-gray-700 font-satoshi">
                    This is a restricted admin area. All login attempts are logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Support for both roles */}
          <div className="mt-4 text-center">
            <p className="text-gray-800 text-sm font-satoshi">
              Need help? Contact{' '}
              <Link href="/contact" className="text-[#ff3b30] hover:text-[#ff5e54] underline focus:outline-none focus:ring-2 focus:ring-[#ff3b30]">
                Support
              </Link>
            </p>
          </div>

          {role === 'staff' && (
            <div className="mt-4 text-center">
              <Link href="/staff/onboarding" className="text-[#ff3b30] hover:text-[#ff5e54] font-satoshi underline text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3b30]" aria-label="Onboard as new staff">
                New here? Onboard yourself and join the CribNosh family
              </Link>
            </div>
          )}
        </GlassCard>
        <footer className="mt-4 text-center text-gray-500 font-satoshi text-xs">
          <span>© 2025 CribNosh. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
} 