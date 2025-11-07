"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CustomHomeIcon } from '../ui/CustomHomeIcon';
import { CustomOrdersIcon } from '../ui/CustomOrdersIcon';
import { CustomProfileIcon } from '../ui/CustomProfileIcon';

const ACTIVE_COLOR = '#0B9E58';
const INACTIVE_COLOR = '#6B7280';
const ICON_SIZE = 48;

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

const navItems: NavItem[] = [
  {
    name: 'Home',
    href: '/try-it',
    icon: CustomHomeIcon,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: CustomOrdersIcon,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: CustomProfileIcon,
  },
];

export function FloatingBottomMenu() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/try-it') {
      return pathname === '/try-it' || pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[999999] h-[95px] pointer-events-none"
      role="navigation"
      aria-label="Bottom navigation"
    >
      {/* Background layer */}
      <div className="absolute inset-0 bg-white pointer-events-none" />
      
      {/* Blur container */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[12px] -webkit-backdrop-blur-[12px] pointer-events-none" />
      
      {/* Tab bar container */}
      <div className="relative h-full flex items-center justify-center px-[30px] pointer-events-auto">
        <div className="flex items-center justify-between w-full max-w-[calc(100%-60px)]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex-1 flex items-center justify-center h-[55px] touch-feedback cursor-pointer"
                aria-label={item.name}
                aria-current={active ? 'page' : undefined}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <Icon
                    size={ICON_SIZE}
                    color={active ? ACTIVE_COLOR : INACTIVE_COLOR}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

