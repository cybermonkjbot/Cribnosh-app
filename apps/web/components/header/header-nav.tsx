"use client"

import * as React from "react"
import { motion, Variants } from "motion/react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMobileDevice } from '@/hooks/use-mobile-device';

interface NavItem {
  label: string
  href: string
  cursorText?: string
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Features",
    href: "/features",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Careers",
    href: "/careers",
  },
  {
    label: "Contact",
    href: "/contact",
  },
]

const itemVariants: Variants = {
  initial: { y: 0, opacity: 1 },
  hover: { y: -2, opacity: 1 },
}

const underlineVariants: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  hover: { 
    scaleX: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
}

interface HeaderNavProps {
  items: NavItem[];
  className?: string;
}

export function HeaderNav({ items, className = '' }: HeaderNavProps) {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { isMobile, hasTouchScreen } = useMobileDevice();

  useEffect(() => {
    // Update active item based on current path
    const matchingItem = items.find(item => 
      pathname === item.href || pathname?.startsWith(item.href + '/')
    );
    setActiveItem(matchingItem?.href || null);
  }, [pathname, items]);

  return (
    <nav 
      className={`relative ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="flex items-center gap-1 sm:gap-2">
        {items.map((item) => {
          const isActive = activeItem === item.href;
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`
                  relative px-3 py-2 rounded-lg
                  text-sm font-medium
                  transition-colors duration-200
                  ${isActive
                    ? 'text-blue-600 '
                    : 'text-gray-700 hover:text-gray-900  '
                  }
                  ${hasTouchScreen ? 'text-base touch-manipulation' : ''}
                `}
                onClick={() => setActiveItem(item.href)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="relative z-10">{item.label}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="nav-highlight"
                    className="absolute inset-0 bg-blue-50  rounded-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {!isMobile && item.cursorText && (
                  <span
                    className={`
                      absolute top-full left-1/2 -translate-x-1/2 mt-1
                      px-2 py-1 rounded text-xs
                      bg-gray-900 text-white
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      pointer-events-none
                      whitespace-nowrap
                    `}
                  >
                    {item.cursorText}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile touch feedback overlay */}
      {hasTouchScreen && (
        <div 
          className="absolute inset-0 touch-none pointer-events-none"
          style={{
            background: 'radial-gradient(circle at var(--touch-x, 50%) var(--touch-y, 50%), rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </nav>
  );
} 