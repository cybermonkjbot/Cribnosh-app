"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCartItemCount } from "@/hooks/use-cart";
import { CartPopup } from "./cart-popup";

export function FloatingCartIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const itemCount = useCartItemCount();
  const pathname = usePathname();
  
  // Don't show on admin or staff routes
  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const isStaffRoute = pathname?.startsWith('/staff') ?? false;
  
  if (isAdminRoute || isStaffRoute) {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-[999998] h-14 px-6 rounded-full bg-[#ff3b30] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open cart"
      >
        <span className="font-medium">Cart</span>
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#ff3b30] text-xs font-bold"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.span>
          )}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <CartPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

