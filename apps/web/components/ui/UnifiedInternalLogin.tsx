import { Link } from '@/components/link';
import { GlassCard } from '@/components/ui/glass-card';
import { api } from '@/convex/_generated/api';
import { useUserIp } from '@/hooks/use-user-ip';
import { setAuthToken } from "@/lib/auth-client";
import { useAction } from 'convex/react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UnifiedInternalLoginProps {
  role: 'admin' | 'staff';
  apiEndpoint: string;
  redirectPath: string;
}

export default function UnifiedInternalLogin({ role, apiEndpoint, redirectPath }: UnifiedInternalLoginProps) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const userIp = useUserIp();
  const emailLoginAction = useAction(api.actions.auth.emailLogin);
  const verify2FAAction = useAction(api.actions.auth.verify2FA);

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
      const data = await emailLoginAction({
        email,
        password,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ipAddress: userIp || undefined,
      });

      if (data.success && data.sessionToken) {
        // Use auth-client to set session token
        setAuthToken(data.sessionToken);

        if (typeof window !== 'undefined') {
          if (role === 'admin') {
            localStorage.setItem('adminEmail', email);
          } else if (role === 'staff') {
            localStorage.setItem('staffEmail', email);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
      } else if (data.requires2FA) {
        setVerificationToken(data.verificationToken);
        setStep('2fa');
        toast.info('2FA Required', {
          description: 'Please enter the code from your authenticator app.',
        });
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('[LOGIN ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !verificationToken) return;
    setError(null);
    setLoading(true);

    try {
      const data = await verify2FAAction({
        verificationToken,
        code: twoFactorCode,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ipAddress: userIp || undefined,
      });

      if (data.success && data.sessionToken) {
        // Use auth-client to set session token
        setAuthToken(data.sessionToken);

        if (typeof window !== 'undefined') {
          if (role === 'admin') {
            localStorage.setItem('adminEmail', email);
          } else if (role === 'staff') {
            localStorage.setItem('staffEmail', email);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 2000);
      } else {
        setError(data.error || 'Verification failed. Please check your code.');
      }
    } catch (err) {
      setError('An unexpected error occurred during verification.');
      console.error('[2FA ERROR]', err);
    } finally {
      setLoading(false);
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

          {step === 'login' ? (
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
                <div className="flex justify-end mt-1 relative z-50">
                  <Link
                    href={`/${role}/forgot-password`}
                    className="text-xs text-[#ff3b30] hover:text-[#ff5e54] transition-colors font-satoshi"
                  >
                    Forgot password?
                  </Link>
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
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4" aria-label="2FA verification form">
              <div>
                <label className="block text-sm font-medium text-gray-900 font-satoshi mb-2" htmlFor="2fa-code">Verification Code</label>
                <div className="relative">
                  <input
                    id="2fa-code"
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full px-4 py-2 pl-12 bg-white/80 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 font-satoshi focus:outline-none focus:ring-2 focus:ring-[#ff3b30] focus:bg-white transition-all text-center tracking-widest text-xl"
                    placeholder="000000"
                    aria-label="2FA Code"
                    autoComplete="one-time-code"
                    disabled={loading}
                  />
                  <Lock className="w-5 h-5 text-[#ff3b30] absolute left-4 top-1/2 transform -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-700 mt-2 text-center font-satoshi">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-white text-[#ff3b30] hover:bg-white/90 active:scale-95 transition-all duration-150 rounded-xl font-asgard text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ff3b30]"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-sm text-gray-700 hover:text-gray-900 font-satoshi text-center mt-2 focus:outline-none"
                disabled={loading}
              >
                Back to Login
              </button>
            </form>
          )}

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
          <span>© 2026 CribNosh. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
} 