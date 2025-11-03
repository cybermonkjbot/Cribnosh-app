import { motion } from "motion/react";
import Link from "next/link";
import React from "react";

interface FooterLinkProps {
  href: string;
  label: string;
  isExternal?: boolean;
  cursorText?: string;
}

export function FooterLink({ 
  href, 
  label, 
  isExternal = false,
  cursorText
}: FooterLinkProps) {
  const defaultCursorText = isExternal ? `Visit ${label} (opens in new tab)` : `Go to ${label}`;
  const finalCursorText = cursorText || defaultCursorText;

  return (
    <motion.div
      initial={{ opacity: 0.8 }}
      whileHover={{ 
        opacity: 1,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative group"
    >
      {isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-cursor-text={finalCursorText}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center"
        >
          {label}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1 h-3 w-3 opacity-70"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ) : (
        <Link
          href={href}
          data-cursor-text={finalCursorText}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          {label}
        </Link>
      )}
      <motion.span
        className="absolute -bottom-1 left-0 w-0 h-[1px] bg-foreground/70 group-hover:w-full transition-all duration-300"
        initial={{ width: 0 }}
        whileHover={{ width: "100%" }}
      />
    </motion.div>
  );
} 