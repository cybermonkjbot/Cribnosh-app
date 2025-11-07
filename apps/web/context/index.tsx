"use client";

import { createContext, useContext, useState } from 'react';
import { ThemeProvider } from "next-themes";
import { env } from "@/lib/config/env";
import { QueryProvider } from "@/app/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

type MobileMenuContextType = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
};

export const MobileMenuContext = createContext<MobileMenuContextType>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}

/**
 * Provides mobile menu state and theme context to its child components.
 *
 * Wraps children with both the mobile menu context and a theme provider, managing mobile menu open state and enforcing theme settings based on environment configuration. If dark mode is disabled via environment, the theme is forced to light mode.
 *
 * @param children - The React nodes to render within the providers
 * @param defaultTheme - The default theme to use if not overridden or if system theme is enabled
 * @param forcedTheme - The theme to force for all children, unless dark mode is disabled
 */
export function Providers({
  children,
  defaultTheme,
  forcedTheme,
}: {
  children: React.ReactNode;
  defaultTheme?: string;
  forcedTheme?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // If dark mode is disabled, force light theme while still allowing section theming
  const actualForcedTheme = env.DISABLE_DARK_MODE ? "light" : forcedTheme;

  return (
    <QueryProvider>
      <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
        <ThemeProvider
          enableSystem
          disableTransitionOnChange
          attribute="class"
          defaultTheme={env.DISABLE_DARK_MODE ? "light" : (defaultTheme || "system")}
          forcedTheme={actualForcedTheme}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </MobileMenuContext.Provider>
    </QueryProvider>
  );
}
