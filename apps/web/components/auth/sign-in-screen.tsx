"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { SignInSocialSelectionCard } from "./sign-in-social-card";
import { EmailSignInModal } from "./email-sign-in-modal";
import { useSession } from "@/lib/auth/use-session";

interface SignInScreenProps {
  onGoogleSignIn?: (idToken: string) => void;
  onAppleSignIn?: (idToken: string) => void;
  onClose?: () => void;
  backgroundImage?: string;
  notDismissable?: boolean;
}

export function SignInScreen({
  onGoogleSignIn,
  onAppleSignIn,
  onClose,
  backgroundImage = "/backgrounds/earlyaccess-background.png",
  notDismissable = false,
}: SignInScreenProps) {
  const { isAuthenticated } = useSession();
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState<boolean | null>(null);
  const [isAppleSignInLoading, setIsAppleSignInLoading] = useState(false);
  const [isGoogleSignInLoading, setIsGoogleSignInLoading] = useState(false);
  const [isEmailSignInModalVisible, setIsEmailSignInModalVisible] = useState(false);

  // Check Apple Sign-In availability (only on Safari/iOS)
  useEffect(() => {
    const checkAppleSignIn = () => {
      // Apple Sign-In is available on Safari and iOS devices
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsAppleSignInAvailable(isSafari || isIOS);
    };
    checkAppleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleSignInLoading(true);
    try {
      // Load Google Identity Services script if not already loaded
      if (typeof window !== 'undefined' && !(window as any).google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        
        script.onload = () => {
          initializeGoogleSignIn();
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Identity Services');
          setIsGoogleSignInLoading(false);
        };
      } else {
        initializeGoogleSignIn();
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsGoogleSignInLoading(false);
    }
  };

  const initializeGoogleSignIn = () => {
    if (typeof window === 'undefined') {
      setIsGoogleSignInLoading(false);
      return;
    }

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('Google Client ID not configured');
      setIsGoogleSignInLoading(false);
      return;
    }

    // Wait for Google to be available
    const checkGoogle = setInterval(() => {
      if ((window as any).google) {
        clearInterval(checkGoogle);
        const { google } = window as any;
        
        try {
          // Initialize Google Sign-In
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              try {
                // Use ID token for authentication
                const res = await fetch('/api/auth/google-signin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: response.credential }),
                });
                
                const data = await res.json();
                
                if (data.success && data.data?.token) {
                  // Store token in cookie
                  document.cookie = `convex-auth-token=${data.data.token}; path=/; max-age=7200; SameSite=Lax`;
                  // Reload to update auth state
                  window.location.reload();
                } else {
                  console.error('Google sign-in failed:', data);
                  setIsGoogleSignInLoading(false);
                }
              } catch (error) {
                console.error('Google sign-in error:', error);
                setIsGoogleSignInLoading(false);
              }
            },
          });

          // Prompt the user to sign in
          google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // If prompt is not displayed, use button click flow
              google.accounts.oauth2.initTokenClient({
                client_id: googleClientId,
                scope: 'openid profile email',
                callback: async (response: any) => {
                  try {
                    const res = await fetch('/api/auth/google-signin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accessToken: response.access_token }),
                    });
                    
                    const data = await res.json();
                    
                    if (data.success && data.data?.token) {
                      document.cookie = `convex-auth-token=${data.data.token}; path=/; max-age=7200; SameSite=Lax`;
                      window.location.reload();
                    } else {
                      setIsGoogleSignInLoading(false);
                    }
                  } catch (error) {
                    console.error('Google sign-in error:', error);
                    setIsGoogleSignInLoading(false);
                  }
                },
              }).requestAccessToken();
            }
          });
        } catch (error) {
          console.error('Google initialization error:', error);
          setIsGoogleSignInLoading(false);
        }
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkGoogle);
      if (!(window as any).google) {
        console.error('Google Identity Services failed to load');
        setIsGoogleSignInLoading(false);
      }
    }, 5000);
  };

  const handleAppleSignIn = async () => {
    setIsAppleSignInLoading(true);
    try {
      const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/api/auth/apple/callback`;
      
      if (!appleClientId) {
        console.error('Apple Client ID not configured');
        setIsAppleSignInLoading(false);
        return;
      }

      // Apple Sign-In configuration
      const config = {
        clientId: appleClientId,
        redirectURI: redirectUri,
        scope: 'name email',
        usePopup: false, // Use redirect flow for better compatibility
      };

      // Create Apple Sign-In button configuration
      const params = new URLSearchParams({
        client_id: appleClientId,
        redirect_uri: redirectUri,
        response_type: 'code id_token',
        scope: 'name email',
        response_mode: 'form_post',
        state: btoa(JSON.stringify({ redirect: window.location.href })),
      });

      // Redirect to Apple Sign-In
      window.location.href = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Apple sign-in error:', error);
      setIsAppleSignInLoading(false);
    }
  };

  const handleSignInSuccess = () => {
    setIsEmailSignInModalVisible(false);
    onClose?.();
  };

  // Don't render if authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Sign in background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Close Button */}
      {onClose && !notDismissable && (
        <button
          onClick={onClose}
          className="absolute top-12 right-5 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Social Selection Card at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <SignInSocialSelectionCard
          onGoogleSignIn={handleGoogleSignIn}
          onAppleSignIn={handleAppleSignIn}
          onEmailSignIn={() => setIsEmailSignInModalVisible(true)}
          isAuthenticated={isAuthenticated}
          isAppleSignInAvailable={isAppleSignInAvailable}
          isAppleSignInLoading={isAppleSignInLoading}
          isGoogleSignInLoading={isGoogleSignInLoading}
        />
      </div>

      {/* Email Sign In Modal */}
      <EmailSignInModal
        isVisible={isEmailSignInModalVisible}
        onClose={() => setIsEmailSignInModalVisible(false)}
        onEmailSubmit={(email) => {
          console.log('Email submitted:', email);
        }}
        onSignInSuccess={handleSignInSuccess}
      />
    </div>
  );
}

