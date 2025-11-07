"use client";

import { ArrowRight } from "lucide-react";
import { SocialSignIn } from "./social-sign-in";

interface SignInSocialSelectionCardProps {
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  onEmailSignIn?: () => void;
  isAppleSignInAvailable?: boolean | null;
  isAppleSignInLoading?: boolean;
  isGoogleSignInLoading?: boolean;
  isAuthenticated?: boolean;
}

export function SignInSocialSelectionCard({
  onGoogleSignIn,
  onAppleSignIn,
  onEmailSignIn,
  isAppleSignInAvailable,
  isAppleSignInLoading,
  isGoogleSignInLoading,
  isAuthenticated = false,
}: SignInSocialSelectionCardProps) {
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full bg-[rgba(2,18,10,0.98)] rounded-t-[30px] px-6 pt-10 pb-8 shadow-lg">
      {/* Title and Email Sign In Button */}
      <div className="flex justify-between items-start w-full mb-4">
        <h2 className="text-[32px] leading-[40px] font-bold text-white font-asgard tracking-[-0.5px] flex-1">
          Ready?{'\n'}Set, Eat
        </h2>
        <button
          onClick={onEmailSignIn}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-transparent border-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-[13px] leading-4 font-medium text-white/70 font-satoshi">
            Sign in with Email
          </span>
          <ArrowRight className="w-4 h-4 text-[#4ADE80]" />
        </button>
      </div>

      {/* Divider Line */}
      <div className="w-8 h-0.5 bg-[#4ADE80] rounded mb-4" />

      {/* Description */}
      <p className="text-base leading-6 text-[#E5E7EB] text-left mb-8 opacity-90 font-satoshi tracking-[-0.2px]">
        Welcome. Let&apos;s start by creating your{'\n'}account or sign in if you already have one
      </p>

      {/* Social Sign In Buttons */}
      <div className="w-full">
        <SocialSignIn
          onGoogleSignIn={onGoogleSignIn}
          onAppleSignIn={onAppleSignIn}
          isAppleSignInAvailable={isAppleSignInAvailable}
          isAppleSignInLoading={isAppleSignInLoading}
          isGoogleSignInLoading={isGoogleSignInLoading}
        />
      </div>
    </div>
  );
}

