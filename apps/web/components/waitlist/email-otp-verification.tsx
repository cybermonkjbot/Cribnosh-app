"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowLeft, Clock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface EmailOTPVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

export function EmailOTPVerification({ 
  email, 
  onBack, 
  onSuccess, 
  onError 
}: EmailOTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'verify',
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Handle response structure: data.data.sessionToken or data.data.token (for backwards compatibility)
        const token = data.data?.sessionToken || data.data?.token || data.sessionToken || data.token;
        const user = data.data?.user || data.user;
        onSuccess(token, user);
      } else {
        // Handle specific error cases
        if (response.status === 429) {
          setError('Too many attempts. Please wait before trying again.');
        } else if (response.status === 400) {
          setError(data.error || 'Invalid verification code. Please check and try again.');
        } else if (response.status === 404) {
          setError('Verification code not found. Please request a new one.');
        } else {
          setError(data.error || 'Verification failed. Please try again.');
        }
        setAttempts(prev => prev + 1);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please check your connection and try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/email-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action: 'send',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(300); // Reset timer
        setAttempts(0);
        setOtp('');
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary-100 mb-4 sm:mb-6">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
        </div>
        <h2 className="font-asgard text-2xl sm:text-3xl text-gray-900 mb-2">
          Check Your Email
        </h2>
        <p className="font-satoshi text-sm sm:text-base text-gray-600">
          We sent a 6-digit verification code to
        </p>
        <p className="font-satoshi text-sm sm:text-base text-gray-900 font-medium">
          {email}
        </p>
      </div>

        {/* OTP Form */}
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label htmlFor="otp" className="sr-only">
              Verification Code
            </label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code expired'}
            </span>
          </div>

          {/* Verify Button */}
          <Button
            type="submit"
            disabled={isVerifying || otp.length !== 6 || timeLeft === 0}
            className="w-full"
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              'Verify Email'
            )}
          </Button>

          {/* Resend Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending || timeLeft > 240} // Can resend after 1 minute
              className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>

      {/* Back Button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to signup
        </button>
      </div>
    </motion.div>
  );
}
