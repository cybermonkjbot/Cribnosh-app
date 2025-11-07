"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCartItemCount } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const itemCount = useCartItemCount();

  return (
    <Link href="/cart" className={cn("relative inline-flex items-center justify-center", className)}>
      <div className="relative">
        <ShoppingCart className="w-6 h-6 text-gray-700 hover:text-[#ff3b30] transition-colors" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff3b30] text-xs font-bold text-white">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>
    </Link>
  );
}

