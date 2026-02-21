"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { toast } from "sonner";

interface CartItemProps {
  item: {
    _id: string;
    dish_id: string;
    quantity: number;
    price: number;
    name?: string;
    dish_name?: string;
    image_url?: string;
    foodCreatorName?: string;
  };
}

export function CartItem({ item }: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const itemName = item.dish_name || item.name || 'Unknown Item';
  const itemPrice = item.price || 0;
  const itemImage = item.image_url || '/kitchenillus.png';

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity is 0
      await handleRemove();
      return;
    }

    setIsUpdating(true);
    try {
      await updateCartItem.mutateAsync({
        cartItemId: item._id,
        quantity: newQuantity,
      });
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast.error('Failed to update cart item. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await removeCartItem.mutateAsync(item._id);
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing cart item:', error);
      toast.error('Failed to remove item. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = () => {
    handleQuantityChange(item.quantity + 1);
  };

  const handleDecrement = () => {
    handleQuantityChange(item.quantity - 1);
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200">
      {/* Item Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={itemImage}
          alt={itemName}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{itemName}</h3>
        {item.foodCreatorName && (
          <p className="text-sm text-gray-500 truncate">{item.foodCreatorName}</p>
        )}
        <p className="text-lg font-bold text-gray-900 mt-1">
          £{itemPrice.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={isUpdating || item.quantity <= 1}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={isUpdating}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isUpdating}
          className="h-8 w-8 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

