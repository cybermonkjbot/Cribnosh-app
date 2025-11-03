'use client'

import React from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

// Default Link component for general use
export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof NextLink>
>(({ className, ...props }, ref) => {
  return (
    <NextLink
      ref={ref}
      className={clsx(
        'text-amber-600 hover:text-amber-700 transition-colors duration-200',
        className
      )}
      {...props}
    />
  )
})
Link.displayName = 'Link'

// NavbarLink component
export const NavbarLink = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => {
  const pathname = usePathname()
  return (
    <NextLink
      href={href}
      className={`relative text-sm font-medium py-1 px-3 transition-colors duration-200 text-slate-12 w-[90px] flex items-center justify-center
        ${pathname === href ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
    >
      {children}
    </NextLink>
  )
}

// NavbarLinkBackground component
export const NavbarLinkBackground = ({ links }: { links: string[] }) => {
  const pathname = usePathname()
  const activeIndex = links.indexOf(pathname)

  return (
    <div
      className={clsx(
        'absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-slate-3'
      )}
      style={{
        width: `90px`,
        left: `calc((${activeIndex} * 90px) + 4px)`,
      }}
    />
  )
}
