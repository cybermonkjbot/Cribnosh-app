// @ts-nocheck
/**
 * Calculate discount amount based on offer type and cart total
 */
export function calculateDiscountAmount(
  discountType: "percentage" | "fixed_amount" | "free_delivery",
  discountValue: number,
  cartTotal: number,
  maxDiscount?: number
): number {
  if (discountType === "percentage") {
    const discount = (cartTotal * discountValue) / 100;
    return maxDiscount ? Math.min(discount, maxDiscount) : discount;
  } else if (discountType === "fixed_amount") {
    return Math.min(discountValue, cartTotal); // Can't discount more than cart total
  }
  // free_delivery doesn't have a monetary discount
  return 0;
}

/**
 * Validate if cart meets minimum order amount for offer
 */
export function validateMinimumOrderAmount(
  cartTotal: number,
  minOrderAmount?: number
): boolean {
  if (!minOrderAmount) return true;
  return cartTotal >= minOrderAmount;
}

