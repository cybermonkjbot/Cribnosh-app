"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { env } from "@/lib/config/env";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Renders a button that toggles between light and dark themes, with animated icon transitions.
 *
 * The component respects environment variables to optionally disable dark mode or the context menu on the button. It avoids hydration mismatches by rendering only after mounting.
 *
 * @returns The theme switcher button, or `null` if dark mode is disabled.
 */
export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If dark mode is disabled, don't render the switcher
  if (env.DISABLE_DARK_MODE) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-transparent" />
    );
  }

  const isDark = theme === "dark";

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (env.DISABLE_TRY_IT || isMobile) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      onContextMenu={handleContextMenu}
      className="w-9 h-9 rounded-lg flex items-center justify-center bg-background/50 border border-border/50 backdrop-blur-sm"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.5, ease: "anticipate" }}
        className="relative w-5 h-5"
      >
        {isDark ? (
          <Moon className="absolute inset-0 h-5 w-5 text-foreground" />
        ) : (
          <Sun className="absolute inset-0 h-5 w-5 text-foreground" />
        )}
      </motion.div>
    </motion.button>
  );
} 