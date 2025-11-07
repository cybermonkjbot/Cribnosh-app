"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";

interface EmptyCartProps {
  className?: string;
}

export function EmptyCart({ className }: EmptyCartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-4 ${className || ''}`}
    >
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <ShoppingCart className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Start adding delicious meals to your cart
      </p>
      <Link href="/try-it">
        <Button className="bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white">
          Browse Meals
        </Button>
      </Link>
    </motion.div>
  );
}

