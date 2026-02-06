"use client";

import { useIsMobile } from '@/hooks/useIsMobile';
import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getCursorTitle } from "../components/layout/client-layout";
import { FollowerPointerCard } from "../components/ui/followingpointer";

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({
  children
}: RootLayoutClientProps) {
  const pathname = usePathname();
  // Disable custom pointer by default to prevent cursor issues
  const useCustomPointer = process.env.NEXT_PUBLIC_USE_CUSTOM_POINTER === "true";
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.setAttribute("data-custom-pointer", useCustomPointer ? "true" : "false");
    return () => {
      document.body.removeAttribute("data-custom-pointer");
    };
  }, [useCustomPointer]);

  useEffect(() => {
    document.body.style.paddingTop = 'env(safe-area-inset-top)';
    document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
    document.body.style.paddingLeft = 'env(safe-area-inset-left)';
    document.body.style.paddingRight = 'env(safe-area-inset-right)';

    // Global listener for unhandled rejections to catch Server Action failures
    // which happen when the client version mismatches the server version
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || '';

      // Specifically target Server Action mismatch errors
      // Use common strings found in Next.js mismatch errors
      if (
        errorMessage.includes('Failed to find Server Action') ||
        errorMessage.includes('NEXT_NOT_FOUND') ||
        (error?.digest && error.digest.includes('NEXT_NOT_FOUND'))
      ) {
        console.warn('Detected Server Action version mismatch. Reloading page to sync with latest deployment...');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      document.body.style.paddingTop = '';
      document.body.style.paddingBottom = '';
      document.body.style.paddingLeft = '';
      document.body.style.paddingRight = '';
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>
      {useCustomPointer ? (
        <FollowerPointerCard title={getCursorTitle(pathname)}>
          {children}
        </FollowerPointerCard>
      ) : (
        children
      )}
    </MotionConfig>
  );
}