"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";
import { EmptyCart } from "./empty-cart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useModalSheet } from "@/context/ModalSheetContext";

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPopup({ isOpen, onClose }: CartPopupProps) {
  const { data: cart, isLoading } = useCart();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setAnyModalOpen } = useModalSheet();

  // Prevent body scroll when popup is open and notify context
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setAnyModalOpen(true);
    } else {
      document.body.style.overflow = "";
      setAnyModalOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
      setAnyModalOpen(false);
    };
  }, [isOpen, setAnyModalOpen]);

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[999998]"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed ${
              isMobile
                ? "bottom-0 left-0 right-0 top-1/3 rounded-t-3xl"
                : "top-0 right-0 bottom-0 w-full max-w-md"
            } bg-white z-[999999] shadow-2xl flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 font-asgard">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff3b30]"></div>
                </div>
              ) : isEmpty ? (
                <div className="p-4">
                  <EmptyCart className="py-8" />
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {items.map((item) => (
                    <CartItem key={item._id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {!isEmpty && (
              <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                <CartSummary />
                <div className="space-y-2">
                  <Link href="/checkout" onClick={onClose} className="block">
                    <Button className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white py-6 text-lg font-semibold">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <Link href="/cart" onClick={onClose} className="block">
                    <Button variant="outline" className="w-full">
                      View Full Cart
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

