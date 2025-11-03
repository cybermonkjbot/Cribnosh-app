import { motion } from "motion/react";
import React from "react";

interface SocialLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  cursorText?: string;
}

const socialLinks: SocialLinkProps[] = [
  {
    href: "https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    ),
    label: "X (Twitter)",
    color: "hover:bg-black/10 hover:text-black",
    cursorText: "Follow us on X (Twitter)"
  },
  {
    href: "https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    label: "Instagram",
    color: "hover:bg-pink-500/10 hover:text-pink-500",
    cursorText: "Follow us on Instagram"
  },
  {
    href: "https://www.facebook.com/share/16yzxEUqpx/",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
    label: "Facebook",
    color: "hover:bg-blue-600/10 hover:text-blue-600",
    cursorText: "Follow us on Facebook"
  },
];

export function FooterSocialLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {socialLinks.map((link, index) => (
        <motion.a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-full transition-colors duration-300 ${link.color}`}
          aria-label={link.label}
          data-cursor-text={link.cursorText}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3,
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 15
          }}
          whileHover={{ 
            scale: 1.15,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.95 }}
        >
          {link.icon}
          <span className="sr-only">{link.label}</span>
        </motion.a>
      ))}
    </div>
  );
} 