"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EmailOTPVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
  testOtp?: string | null;
}

export function EmailOTPVerification({
  email,
  onBack,
  onSuccess,
  onError,
  testOtp: initialTestOtp,
}: EmailOTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [error, setError] = useState("");
  const [testOtp, setTestOtp] = useState<string | null>(initialTestOtp || null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyAndLogin = useAction(api.actions.users.customerEmailVerifyAndLogin);
  const sendEmailOTP = useAction(api.actions.users.customerEmailSendOTP);

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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(0, 1);

    if (digit) {
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setError("");

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Allow backspace to clear
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      setError("");
      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const data = await verifyAndLogin({
        email,
        otp: otpString,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      });

      if (data.success) {
        // Handle response structure: data.sessionToken and data.user
        const token = data.sessionToken;
        const user = data.user;

        if (token) {
          onSuccess(token, user);
        } else {
          setError("Authentication failed. Please try again.");
          setIsVerifying(false);
        }
      } else if (data.requires2FA) {
        // Handle 2FA if needed (not currently implemented in this modal but action supports it)
        setError("2FA required - please complete on mobile or contact support.");
        setIsVerifying(false);
      } else {
        setError(data.error || "Verification failed. Please check and try again.");
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Network error. Please check your connection and try again.");
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");

    try {
      const data = await sendEmailOTP({ email });

      if (data.success) {
        // In development, show the test OTP
        if (data.testOtp) {
          setTestOtp(data.testOtp);
          console.log('🔐 Development OTP Code:', data.testOtp);
          toast.info('Development Mode', {
            description: `OTP Code: ${data.testOtp}`,
            duration: 10000,
          });
        }
        setTimeLeft(300); // Reset timer
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setError(""); // Clear any previous errors
        toast.success('Code Resent', {
          description: 'A new verification code has been sent to your email.',
        });
      } else {
        const errorMessage = data.error || "Failed to resend code";
        setError(errorMessage);
        toast.error('Failed to Resend Code', {
          description: errorMessage,
        });
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const otpString = otp.join("");
  const isComplete = otpString.length === 6;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[32px] leading-[40px] font-bold text-white mb-5 font-asgard tracking-[-0.5px]">
          Enter verification code
        </h2>
        <p className="text-[17px] leading-6 text-[#E5E7EB] mb-2 opacity-90 font-satoshi max-w-[320px]">
          We sent a 6-digit verification code to
        </p>
        <p className="text-[17px] leading-6 text-white font-medium font-satoshi mb-4">
          {email}
        </p>
        {/* Development OTP Display - Show if testOtp is available */}
        {testOtp && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-sm text-yellow-200 font-satoshi">
              <strong>Development Mode:</strong> Use code <code className="font-mono font-bold text-yellow-100">{testOtp}</code>
            </p>
          </div>
        )}
      </div>

      {/* OTP Input */}
      <form onSubmit={handleVerifyOTP} className="space-y-6">
        <div className="flex gap-3 justify-start">
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
              className="w-14 h-16 text-center text-2xl font-bold text-white bg-transparent border border-white/20 rounded-lg focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/20 font-mono outline-none transition-all"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <span>{error}</span>
          </motion.div>
        )}

        {/* Timer */}
        <div className="flex items-center gap-2 text-sm text-[#E5E7EB] opacity-70">
          <span>
            {timeLeft > 0
              ? `Code expires in ${formatTime(timeLeft)}`
              : "Code expired"}
          </span>
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          disabled={!isComplete || isVerifying || timeLeft === 0}
          className="w-full max-w-[400px] h-16 bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-white font-semibold text-lg rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </div>
          ) : (
            "Verify Email"
          )}
        </Button>

        {/* Resend Button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={isResending || timeLeft > 240}
            className="text-sm text-[#4ADE80] hover:text-[#4ADE80]/80 disabled:text-[#E5E7EB]/40 disabled:cursor-not-allowed transition-colors font-satoshi"
          >
            {isResending ? "Sending..." : "Didn't get the code? Tap to resend"}
          </button>
        </div>
      </form>

      {/* Back Button */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#E5E7EB] hover:text-white transition-colors font-satoshi"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </motion.div>
  );
}

