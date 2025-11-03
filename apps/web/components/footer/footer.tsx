"use client";

import React from "react";
import { motion } from "motion/react";
import { FooterColumn } from "./footer-column";
import { FooterLink } from "./footer-link";
import { FooterSocialLinks } from "./footer-social-links";
import { FooterNewsletter } from "./footer-newsletter";
import { FooterCopyright } from "./footer-copyright";
import { FooterLogo } from "./footer-logo";
import { FooterGeometric } from "./footer-geometric";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { openCookieSettings } from "../layout/client-layout";

interface FooterProps {
  showNewsletter?: boolean;
  showSocialLinks?: boolean;
  className?: string;
}

interface FooterLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export function Footer({ 
  showNewsletter = false,
  showSocialLinks = true,
  className = '',
}: FooterProps) {
  const productLinks: FooterLinkItem[] = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Changelog", href: "/changelog" },
  ];

  const companyLinks: FooterLinkItem[] = [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Manifesto", href: "/manifesto" },
  ];

  const resourceLinks: FooterLinkItem[] = [
    { label: "Community", href: "/community" },
    { label: "Contact", href: "/contact" },
    { label: "Support", href: "/support" },
    { label: "Terms", href: "/terms", isExternal: true },
  ];

  const safetyLinks: FooterLinkItem[] = [
    { label: "Kitchen Certification", href: "/certification" },
    { label: "Food Safety Compliance", href: "/compliance" },
    { label: "FSA Rating", href: "https://ratings.food.gov.uk", isExternal: true },
  ];

  return (
    <footer className={cn(
      "relative z-10 mt-20 py-12",
      "bg-white/90  backdrop-blur-lg border-t border-white/30",
      "text-[#333] ",
      className
    )}>
      <FooterGeometric />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="space-y-4 md:col-span-1">
            <FooterLogo className="w-32 h-auto text-[#ff3b30]" />
            <p className="text-sm mt-2">Personalized home-cooked meals, matched to your taste, cooked by real people near you.</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Features</h4>
            <ul className="space-y-2">
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/features#dietary">Dietary Memory</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/features#allergen">Allergen Safeguard</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/features#ordering">Smart Ordering</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Company</h4>
            <ul className="space-y-2">
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/about">About Us</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/careers">Careers</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/history">History</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Safety & Standards</h4>
            <ul className="space-y-2">
              {safetyLinks.map((link, index) => (
                <li key={index} className="text-sm hover:text-[#ff3b30] transition-colors">
                  {link.isExternal ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      {link.label}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        className="w-3 h-3 inline-block"
                      >
                        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                      </svg>
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Legal</h4>
            <ul className="space-y-2">
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <Link href="/terms">Terms of Service</Link>
              </li>
              <li className="text-sm hover:text-[#ff3b30] transition-colors">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                  data-cursor-text="Manage your cookie preferences"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-white/30 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-[#666]">© {new Date().getFullYear()} CribNosh. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <FooterSocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
} 