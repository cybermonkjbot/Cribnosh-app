"use client";
// Core component that receives mouse positions and renders pointer and content

import { useMediaQuery } from "@/hooks/use-media-query";
import { env } from "@/lib/config/env";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export const FollowerPointerCard = ({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string | React.ReactNode;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (ref.current) {
      setRect(ref.current.getBoundingClientRect());
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rect) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      x.set(e.clientX - rect.left + scrollX);
      y.set(e.clientY - rect.top + scrollY);

      // Check if the target element has a data-cursor-text attribute
      const target = e.target as HTMLElement;
      const cursorText = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');
      setCurrentText(cursorText || null);
    }
  };

  const handleMouseLeave = () => {
    setIsInside(false);
    setCurrentText(null);
  };

  const handleMouseEnter = () => {
    setIsInside(true);
  };

  // Disable context menu when DISABLE_TRY_IT is true or on mobile
  const handleContextMenu = (e: React.MouseEvent) => {
    if (env.DISABLE_TRY_IT || !isDesktop) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <div
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      style={{
        cursor: isDesktop && !env.DISABLE_TRY_IT && process.env.NEXT_PUBLIC_USE_CUSTOM_POINTER === "true" ? "none" : "auto",
      }}
      ref={ref}
      className={cn("relative", className)}
    >
      <AnimatePresence>
        {isDesktop && isInside && !env.DISABLE_TRY_IT && process.env.NEXT_PUBLIC_USE_CUSTOM_POINTER === "true" && <FollowPointer x={x} y={y} title={currentText || title} />}
      </AnimatePresence>
      {children}
    </div>
  );
};

export const FollowPointer = ({
  x,
  y,
  title,
}: {
  x: any;
  y: any;
  title?: string | React.ReactNode;
}) => {
  const { theme } = useTheme();
  const [currentSectionTheme, setCurrentSectionTheme] = useState<'dark' | 'light' | 'brand'>('dark');

  const updateTheme = useCallback(() => {
    const element = document.elementFromPoint(
      typeof x === 'number' ? x : x.get(),
      typeof y === 'number' ? y : y.get()
    );
    if (element) {
      const section = element.closest('[data-section-theme]');
      const sectionTheme = section?.getAttribute('data-section-theme') as 'dark' | 'light' | 'brand';
      if (sectionTheme && sectionTheme !== currentSectionTheme) {
        setCurrentSectionTheme(sectionTheme);
      }
    }
  }, [x, y, currentSectionTheme]);

  useEffect(() => {
    // Update theme immediately
    updateTheme();
  }, [updateTheme]);

  // Keep the pointer visible over all elements
  useEffect(() => {
    // Add CSS to allow pointer to pierce through stacking contexts
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .following-pointer {
        z-index: 9999999 !important;
        position: fixed !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const colors = {
    dark: [
      "#ff3b30", // CribNosh primary red
      "#ff5e54", // CribNosh secondary red
      "#6366f1", // Indigo
      "#8b5cf6", // Purple
      "#06b6d4", // Cyan
    ],
    light: [
      "#ff3b30", // CribNosh primary red
      "#ff5e54", // CribNosh secondary red
      "#4f46e5", // Darker Indigo
      "#7c3aed", // Darker Purple
      "#0891b2", // Darker Cyan
    ],
    brand: [
      "#ffffff", // White
      "#ff5e54", // CribNosh secondary red
      "#fecaca", // Light red
      "#fef2f2", // Very light red
      "#fee2e2", // Very light red
    ],
  };

  // Memoize these values to prevent unnecessary recalculations
  const currentColors = useMemo(() => colors[currentSectionTheme], [currentSectionTheme]);
  // When dark mode is disabled, always use light theme styling but keep section theming
  const isDarkTheme = useMemo(() =>
    (env.DISABLE_DARK_MODE ? false : theme === 'dark') || currentSectionTheme === 'dark',
    [theme, currentSectionTheme]
  );
  const isBrandTheme = currentSectionTheme === 'brand';

  /* eslint-disable react-hooks/set-state-in-effect */
  const [randomColor, setRandomColor] = useState(currentColors[0]);
  useEffect(() => {
    setRandomColor(currentColors[Math.floor(Math.random() * currentColors.length)]);
  }, [currentColors]);

  return (
    <motion.div
      className="absolute z-[9999999] h-4 w-4 rounded-full following-pointer"
      style={{
        top: y,
        left: x,
        pointerEvents: "none",
      }}
      initial={{
        scale: 1,
        opacity: 1,
      }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      exit={{
        scale: 0,
        opacity: 0,
      }}
      onUpdate={updateTheme}
    >
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="1"
        viewBox="0 0 16 16"
        className={cn(
          "h-6 w-6 -translate-x-[12px] -translate-y-[10px] -rotate-[70deg] transform",
          {
            "stroke-[#ff3b30] text-[#ff3b30]": !isBrandTheme,
            "stroke-white text-white": isBrandTheme,
          }
        )}
        height="1em"
        width="1em"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z"></path>
      </svg>
      <motion.div
        style={{
          backgroundColor: randomColor,
        }}
        initial={{
          scale: 0.5,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        exit={{
          scale: 0.5,
          opacity: 0,
        }}
        className={cn(
          "min-w-max rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap shadow-lg backdrop-blur-sm",
          {
            "text-white": isDarkTheme || isBrandTheme,
            "text-gray-100": !isDarkTheme && !isBrandTheme,
          }
        )}
      >
        {title || "New Nosher"}
      </motion.div>
    </motion.div>
  );
};
