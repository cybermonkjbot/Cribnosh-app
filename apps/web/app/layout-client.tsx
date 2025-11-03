"use client";

import { usePathname } from "next/navigation";
import { FollowerPointerCard } from "../components/ui/followingpointer";
import { getCursorTitle } from "../components/layout/client-layout";
import { MotionConfig } from "motion/react";
import { useIsMobile } from '@/hooks/useIsMobile';
import { useEffect } from "react";

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
    return () => {
      document.body.style.paddingTop = '';
      document.body.style.paddingBottom = '';
      document.body.style.paddingLeft = '';
      document.body.style.paddingRight = '';
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