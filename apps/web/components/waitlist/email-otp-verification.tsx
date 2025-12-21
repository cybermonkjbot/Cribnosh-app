"use client";

import { AlertCircle, ArrowLeft, Clock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

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
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [isCodeAlreadyUsed, setIsCodeAlreadyUsed] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Use refs to track in-flight requests and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const isVerifyingRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(0, 1);

    if (digit) {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setError('');
      setIsCodeAlreadyUsed(false);

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Allow backspace to clear
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      setIsCodeAlreadyUsed(false);
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    // Prevent double-clicking and race conditions
    if (isVerifyingRef.current || isVerifying) {
      return;
    }

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsVerifying(true);
    isVerifyingRef.current = true;
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
          otp: otpString,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (data.success) {
        // Handle response structure: data.data.sessionToken or data.data.token (for backwards compatibility)
        const token = data.data?.sessionToken || data.data?.token || data.sessionToken || data.token;
        const user = data.data?.user || data.user;
        await onSuccess(token, user);
      } else {
        const errorMessage = data.error || data.message || 'Verification failed. Please try again.';

        // Check if the error is about the code being already used
        if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
          setIsCodeAlreadyUsed(true);
          setError('This verification code has already been used. Please request a new code.');
        } else {
          setIsCodeAlreadyUsed(false);
          // Handle specific error cases
          if (response.status === 429) {
            setError('Too many attempts. Please wait before trying again.');
          } else if (response.status === 400) {
            setError(errorMessage);
          } else if (response.status === 404) {
            setError('Verification code not found. Please request a new one.');
          } else {
            setError(errorMessage);
          }
        }
        setAttempts(prev => prev + 1);
      }
    } catch (err) {
      // Don't handle errors if request was aborted (user clicked again or component unmounted)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('OTP verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your connection and try again.';

      // Check if the error is about the code being already used
      if (errorMessage.includes('already been used') || errorMessage.includes('already used')) {
        setIsCodeAlreadyUsed(true);
        setError('This verification code has already been used. Please request a new code.');
      } else {
        setIsCodeAlreadyUsed(false);
        setError(errorMessage);
      }
      setAttempts(prev => prev + 1);
    } finally {
      setIsVerifying(false);
      isVerifyingRef.current = false;
      abortControllerRef.current = null;
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
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setError('');
        setIsCodeAlreadyUsed(false);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = otp.join('').length === 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-6"
        >
          <Mail className="w-8 h-8 text-primary-600" />
        </motion.div>
        <h2 className="font-asgard text-3xl text-gray-900 mb-3">
          Check Your Email
        </h2>
        <div className="flex flex-col gap-1 px-4">
          <p className="font-satoshi text-gray-600">
            We sent a 6-digit verification code to
          </p>
          <p className="font-satoshi text-gray-900 font-semibold truncate" title={email}>
            {email}
          </p>
        </div>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleVerifyOTP} className="space-y-8">
        <div className="flex gap-2 sm:gap-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-12 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 font-mono outline-none transition-all"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-3 ${isCodeAlreadyUsed ? 'p-4 rounded-xl bg-red-50 border border-red-200' : ''}`}
          >
            <div className="flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
            {isCodeAlreadyUsed && (
              <motion.button
                type="button"
                whileHover={{ scale: !isResending ? 1.02 : 1 }}
                whileTap={{ scale: !isResending ? 0.98 : 1 }}
                onClick={handleResendOTP}
                disabled={isResending}
                className="w-full h-11 border-2 border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-semibold transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isResending ? 'Sending new code...' : 'Request New Verification Code'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Timer and Buttons Container */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">
              {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code expired'}
            </span>
          </div>

          <div className="space-y-4">
            <motion.button
              type="submit"
              whileHover={{ scale: isComplete && !isVerifying ? 1.02 : 1 }}
              whileTap={{ scale: isComplete && !isVerifying ? 0.98 : 1 }}
              disabled={isVerifying || !isComplete || timeLeft === 0}
              className="w-full h-14 bg-[#ff3b30] hover:bg-[#ff5e54] text-white font-bold text-lg rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </div>
              ) : (
                'Verify Email'
              )}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending || timeLeft > 240}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? 'Sending...' : "Didn't get the code? Resend Code"}
              </button>
            </div>
          </div>
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
