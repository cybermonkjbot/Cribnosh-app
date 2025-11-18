import { DishRecommendation } from '@/types/customer';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { ProductCardProps } from '@/components/ui/AISearchResponseOverlay';

/**
 * Send AI chat message using Convex
 */
export async function sendChatMessage(data: {
  message: string;
  conversation_id?: string;
  location?: { latitude: number; longitude: number };
}) {
  const convex = getConvexClient();
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    throw new Error('Not authenticated');
  }

  const result = await convex.action(api.actions.users.customerSendAIChatMessage, {
    sessionToken,
    message: data.message,
    conversation_id: data.conversation_id,
    location: data.location,
  });

  if (result.success === false) {
    // Throw error with the user-friendly message from the server
    const errorMessage = result.error || 'Failed to send chat message';
    const error = new Error(errorMessage);
    // Add a flag to indicate this is a user-friendly error
    (error as any).isUserFriendly = true;
    throw error;
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Transform dish recommendation to product card props
 * This is extracted from AIChatDrawer for reuse
 */
export function transformDishToProductCard(dish: DishRecommendation): ProductCardProps {
  const imageSource = dish.image_url 
    ? { uri: dish.image_url.startsWith('http') ? dish.image_url : `https://cribnosh.com${dish.image_url}` }
    : require('../assets/images/cribnoshpackaging.png');

  let badgeType: 'hot' | 'bestfit' | 'highprotein' | undefined;
  let badgeText: string | undefined;
  
  if (dish.badge) {
    const badgeUpper = dish.badge.toUpperCase();
    if (badgeUpper === 'BUSSIN') {
      badgeType = 'hot';
      badgeText = 'Bussin';
    } else if (badgeUpper === 'BEST FIT' || badgeUpper === 'BESTFIT') {
      badgeType = 'bestfit';
      badgeText = 'Best fit';
    } else if (badgeUpper === 'HIGH PROTEIN' || badgeUpper === 'HIGHPROTEIN') {
      badgeType = 'highprotein';
      badgeText = 'High Protein';
    } else {
      badgeText = dish.badge;
    }
  }

  const hasFireEmoji = dish.badge?.toUpperCase() === 'BUSSIN';

  return {
    dish_id: dish.dish_id,
    name: dish.name,
    price: `£${(dish.price / 100).toFixed(0)}`,
    image: imageSource,
    badge: badgeText ? { text: badgeText, type: badgeType } : undefined,
    hasFireEmoji,
  };
}

