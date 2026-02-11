"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { FooterGeometric } from "./footer-geometric";
import { FooterLogo } from "./footer-logo";
import { FooterSocialLinks } from "./footer-social-links";

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
    { label: "Dietary Memory", href: "/features#dietary" },
    { label: "Allergen Safeguard", href: "/features#allergen" },
    { label: "Smart Ordering", href: "/features#ordering" },
  ];

  const companyLinks: FooterLinkItem[] = [
    { label: "About Us", href: "/about" },
    { label: "Founders Story", href: "/founders-story" },
    { label: "Careers", href: "/careers" },
    { label: "History", href: "/history" },
    { label: "Manifesto", href: "/manifesto" },
    { label: "Blog", href: "/blog" },
  ];

  const communityLinks: FooterLinkItem[] = [
    { label: "Work with Cribnosh", href: "/work-with-cribnosh" },
    // Community page usually exists, if not we keep it or point to community resources
    { label: "Community", href: "/community" },
    { label: "Contact", href: "/contact" },
    { label: "Support", href: "/support" },
  ];

  const safetyLinks: FooterLinkItem[] = [
    { label: "Kitchen Certification", href: "/certification" },
    { label: "Food Safety Compliance", href: "/compliance" },
    { label: "FSA Rating", href: "https://ratings.food.gov.uk", isExternal: true },
  ];

  const legalLinks: FooterLinkItem[] = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Modern Slavery Statement", href: "/modern-slavery-statement" },
  ];

  const renderLinks = (links: FooterLinkItem[]) => (
    <ul className="space-y-2">
      {links.map((link, index) => (
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
  );

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
            {renderLinks(productLinks)}
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Company</h4>
            {renderLinks(companyLinks)}
          </div>

          <div className="space-y-4">
            {/* Combined Community & Safety to balance columns if needed, but let's keep Safety separate as it's important for this domain */}
            {/* Actually, let's swap "Community" in place of "Contact" wrapper or just utilize the space well */}
            <div className="flex flex-col gap-8">
              <div>
                <h4 className="font-bold text-[#ff3b30]">Community</h4>
                {renderLinks(communityLinks)}
              </div>
              <div>
                <h4 className="font-bold text-[#ff3b30]">Safety</h4>
                {renderLinks(safetyLinks)}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[#ff3b30]">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link, index) => (
                <li key={index} className="text-sm hover:text-[#ff3b30] transition-colors">
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
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

      {/* UK Corporate Compliance Information */}
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-[10px] text-gray-500 text-center">
        <p>
          CribNosh Ltd is a company registered in England and Wales (Company No. 12345678).
          <br className="md:hidden" />
          <span className="hidden md:inline"> | </span>
          Registered Office: 123 Foodie Lane, London, United Kingdom.
          <br className="md:hidden" />
          <span className="hidden md:inline"> | </span>
          VAT Registration No. GB 123 456 789.
        </p>
      </div>
    </footer>
  );
} 