"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { EmailOTPVerification } from "./email-otp-verification";

interface EmailSignInModalProps {
  isVisible: boolean;
  onClose: () => void;
  onEmailSubmit?: (email: string) => void;
  onSignInSuccess?: () => void;
}

export function EmailSignInModal({
  isVisible,
  onClose,
  onEmailSubmit,
  onSignInSuccess,
}: EmailSignInModalProps) {
  const [email, setEmail] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [error, setError] = useState("");
  const [testOtp, setTestOtp] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSendingOTP) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSendingOTP(true);
    setError("");

    try {
      onEmailSubmit?.(email);
      
      // Send OTP
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
        // In development, show the test OTP
        if (data.data?.testOtp) {
          setTestOtp(data.data.testOtp);
          console.log('🔐 Development OTP Code:', data.data.testOtp);
          toast.info('Development Mode', {
            description: `OTP Code: ${data.data.testOtp}`,
            duration: 10000,
          });
        }
        setShowOTPVerification(true);
      } else {
        const errorMessage = data.error || data.message || 'Failed to send verification code. Please try again.';
        setError(errorMessage);
        toast.error('Failed to Send Code', {
          description: errorMessage,
        });
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPSuccess = async (token: string, user: any) => {
    if (!token) {
      setError('Authentication failed. Please try again.');
      toast.error('Sign-In Failed', {
        description: 'Authentication failed. Please try again.',
      });
      return;
    }
    
    // Store token in cookie (same format as sign-in-screen.tsx)
    document.cookie = `convex-auth-token=${token}; path=/; max-age=7200; SameSite=Lax`;
    
    // Verify cookie was set using the same pattern as ConvexClientProvider
    const getCookie = (name: string) => {
      try {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? match[2] : null;
      } catch (error) {
        console.error('Error reading cookie:', error);
        return null;
      }
    };
    
    // Wait a moment to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const cookieToken = getCookie('convex-auth-token');
    if (!cookieToken) {
      console.error('Failed to set cookie - cookie not found after setting', {
        allCookies: document.cookie,
        tokenLength: token.length,
      });
      setError('Failed to set authentication cookie. Please try again.');
      toast.error('Sign-In Failed', {
        description: 'Failed to set authentication cookie. Please try again.',
      });
      return;
    }
    
    if (cookieToken !== token) {
      console.error('Cookie value mismatch', {
        expectedLength: token.length,
        actualLength: cookieToken.length,
        expectedStart: token.substring(0, 20),
        actualStart: cookieToken.substring(0, 20),
      });
      // Still proceed - sometimes cookies can have slight differences but still work
      console.warn('Cookie value differs but proceeding anyway');
    }
    
    console.log('[EmailSignIn] Cookie set successfully, token length:', token.length);
    
    // Show success toast
    toast.success('Sign-In Successful', {
      description: 'Welcome to CribNosh!',
    });
    
    // Close modal and notify parent
    onClose();
    setEmail("");
    setShowOTPVerification(false);
    onSignInSuccess?.();
    
    // Small delay before reload to ensure cookie is persisted
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const handleOTPError = (error: string) => {
    setError(error);
  };

  const handleBack = () => {
    setShowOTPVerification(false);
    setError("");
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase().trim());
    setError("");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md bg-[#02120A] rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-end items-center p-5 z-10 relative">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pt-4 pb-8 relative z-10">
                {!showOTPVerification ? (
                  <div>
                    <h2 className="text-[32px] leading-[40px] font-bold text-white mb-5 font-asgard tracking-[-0.5px]">
                      Get started with CribNosh
                    </h2>
                    <p className="text-[17px] leading-6 text-[#E5E7EB] mb-12 opacity-90 font-satoshi max-w-[320px]">
                      Enter your email to receive a verification code
                    </p>

                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E6FFE8] pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={handleEmailChange}
                          className="w-full max-w-[320px] h-14 bg-transparent border border-white/20 text-white placeholder:text-white/50 pl-12 pr-4"
                          required
                        />
                      </div>

                      {error && (
                        <div className="text-red-400 text-sm">{error}</div>
                      )}

                      <Button
                        type="submit"
                        disabled={!email || isSendingOTP}
                        className="w-full max-w-[400px] h-16 bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-white font-semibold text-lg rounded-lg shadow-lg"
                      >
                        {isSendingOTP ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : (
                          'Continue'
                        )}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <EmailOTPVerification
                    email={email}
                    onBack={handleBack}
                    onSuccess={handleOTPSuccess}
                    onError={handleOTPError}
                    testOtp={testOtp}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

