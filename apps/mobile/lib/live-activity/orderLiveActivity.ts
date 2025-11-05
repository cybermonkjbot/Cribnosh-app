import * as LiveActivity from 'expo-live-activity';
import { Platform } from 'react-native';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface OrderLiveActivityState {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  statusText: string;
  estimatedDeliveryTime?: string;
  estimatedMinutes?: number;
  totalAmount: number;
  restaurantName?: string;
  deliveryPersonName?: string;
}

// Store active Live Activity IDs per order
const activeLiveActivities = new Map<string, string>();

/**
 * Check if Live Activities are supported on this device
 */
export function isLiveActivitySupported(): boolean {
  if (Platform.OS !== 'ios') {
    return false;
  }
  // Live Activities require iOS 16.2+
  try {
    // Check if the module is available
    return typeof LiveActivity !== 'undefined' && (LiveActivity.isSupported?.() ?? false);
  } catch {
    return false;
  }
}

/**
 * Get status text for display in Live Activity
 */
function getStatusText(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Order Confirmed';
    case 'confirmed':
      return 'Order Confirmed';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready for Pickup';
    case 'out_for_delivery':
    case 'on_the_way':
      return 'On the Way';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Processing';
  }
}

/**
 * Start a Live Activity for an order
 */
export async function startOrderLiveActivity(
  order: OrderLiveActivityState
): Promise<string | null> {
  try {
    if (!isLiveActivitySupported()) {
      console.log('Live Activities not supported on this device');
      return null;
    }

    // Check if there's already an active Live Activity for this order
    const existingActivityId = activeLiveActivities.get(order.orderId);
    if (existingActivityId) {
      // Update existing activity instead of creating new one
      return await updateOrderLiveActivity(order.orderId, order);
    }

    const statusText = getStatusText(order.status);
    
    const activityState: OrderLiveActivityState = {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      statusText: order.statusText || statusText,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      estimatedMinutes: order.estimatedMinutes,
      totalAmount: order.totalAmount,
      restaurantName: order.restaurantName,
      deliveryPersonName: order.deliveryPersonName,
    };

    // Map order data to expo-live-activity structure
    const estimatedDeliveryDate = order.estimatedDeliveryTime 
      ? new Date(order.estimatedDeliveryTime).getTime()
      : order.estimatedMinutes 
        ? Date.now() + (order.estimatedMinutes * 60 * 1000)
        : undefined;

    // Format title and subtitle for Live Activity
    const title = order.statusText || getStatusText(order.status);
    const subtitle = order.restaurantName 
      ? `Order #${order.orderNumber} • ${order.restaurantName}`
      : `Order #${order.orderNumber}`;
    
    // Format total amount in pounds
    const totalInPounds = (order.totalAmount / 100).toFixed(2);
    const amountText = `£${totalInPounds}`;

    // Build activity attributes matching expo-live-activity structure
    const activityAttributes = {
      name: 'OrderStatus',
      backgroundColor: '#02120A', // Cribnosh brand color
      titleColor: '#E6FFE8', // Light green text
      subtitleColor: '#C0DCC0', // Lighter green for subtitle
      progressViewTint: '#10B981', // Green progress bar
      deepLinkUrl: `cribnoshapp://order-status-tracking?id=${order.orderId}`,
      timerType: 'circular' as const,
    };

    const contentState = {
      title: title,
      subtitle: subtitle,
      timerEndDateInMilliseconds: estimatedDeliveryDate,
      progress: undefined, // We'll use timer instead of progress
      imageName: undefined, // Can add order icon later if needed
      dynamicIslandImageName: undefined,
    };

    // Try different API patterns based on expo-live-activity version
    let activityId: string | null = null;
    
    try {
      // Try startActivityAsync pattern (most common)
      if (typeof LiveActivity.startActivityAsync === 'function') {
        activityId = await LiveActivity.startActivityAsync({
          attributes: activityAttributes,
          contentState: contentState,
        });
      } 
      // Try startActivity pattern
      else if (typeof LiveActivity.startActivity === 'function') {
        activityId = await LiveActivity.startActivity({
          attributes: activityAttributes,
          contentState: contentState,
        });
      }
      // Try alternative API format
      else if (typeof (LiveActivity as any).start === 'function') {
        activityId = await (LiveActivity as any).start(activityAttributes, contentState);
      }
    } catch (apiError) {
      console.error('Error calling Live Activity API:', apiError);
      return null;
    }

    if (activityId) {
      activeLiveActivities.set(order.orderId, activityId);
      console.log(`Live Activity started for order ${order.orderId}: ${activityId}`);
      return activityId;
    }

    return null;
  } catch (error) {
    console.error('Error starting Live Activity:', error);
    return null;
  }
}

/**
 * Update an existing Live Activity for an order
 */
export async function updateOrderLiveActivity(
  orderId: string,
  order: Partial<OrderLiveActivityState>
): Promise<string | null> {
  try {
    if (!isLiveActivitySupported()) {
      return null;
    }

    const activityId = activeLiveActivities.get(orderId);
    if (!activityId) {
      console.log(`No active Live Activity found for order ${orderId}`);
      // Try to start a new one if we have full order data
      if (order.orderId && order.orderNumber && order.status && order.totalAmount) {
        return await startOrderLiveActivity(order as OrderLiveActivityState);
      }
      return null;
    }

    const statusText = order.status ? getStatusText(order.status) : undefined;
    
    // Calculate estimated delivery date if provided
    const estimatedDeliveryDate = order.estimatedDeliveryTime 
      ? new Date(order.estimatedDeliveryTime).getTime()
      : order.estimatedMinutes 
        ? Date.now() + (order.estimatedMinutes * 60 * 1000)
        : undefined;

    // Build updated content state
    const updatedContentState: any = {
      title: order.statusText || statusText || 'Order Update',
      subtitle: order.restaurantName 
        ? `Order #${order.orderNumber || orderId.substring(0, 8)} • ${order.restaurantName}`
        : `Order #${order.orderNumber || orderId.substring(0, 8)}`,
    };

    if (estimatedDeliveryDate) {
      updatedContentState.timerEndDateInMilliseconds = estimatedDeliveryDate;
    }

    if (order.deliveryPersonName) {
      updatedContentState.subtitle = `${updatedContentState.subtitle} • ${order.deliveryPersonName}`;
    }

    // Try different API patterns
    try {
      if (typeof LiveActivity.updateActivityAsync === 'function') {
        await LiveActivity.updateActivityAsync(activityId, {
          contentState: updatedContentState,
        });
      } else if (typeof LiveActivity.updateActivity === 'function') {
        await LiveActivity.updateActivity(activityId, {
          contentState: updatedContentState,
        });
      } else if (typeof (LiveActivity as any).update === 'function') {
        await (LiveActivity as any).update(activityId, updatedContentState);
      }
    } catch (apiError) {
      console.error('Error calling Live Activity update API:', apiError);
      // Remove from map if update fails (activity might have ended)
      activeLiveActivities.delete(orderId);
      return null;
    }

    console.log(`Live Activity updated for order ${orderId}`);
    return activityId;
  } catch (error) {
    console.error('Error updating Live Activity:', error);
    // Remove from map if update fails (activity might have ended)
    activeLiveActivities.delete(orderId);
    return null;
  }
}

/**
 * End a Live Activity for an order
 */
export async function endOrderLiveActivity(
  orderId: string,
  finalStatus?: OrderStatus
): Promise<boolean> {
  try {
    if (!isLiveActivitySupported()) {
      return false;
    }

    const activityId = activeLiveActivities.get(orderId);
    if (!activityId) {
      console.log(`No active Live Activity found for order ${orderId}`);
      return false;
    }

    // If final status is provided, update before ending
    if (finalStatus) {
      const statusText = getStatusText(finalStatus);
      await updateOrderLiveActivity(orderId, {
        status: finalStatus,
        statusText,
      });
    }

    // Try different API patterns
    try {
      const dismissalPolicy = finalStatus === 'delivered' ? 'immediate' : 'default';
      
      if (typeof LiveActivity.endActivityAsync === 'function') {
        await LiveActivity.endActivityAsync(activityId, {
          dismissalPolicy,
        });
      } else if (typeof LiveActivity.endActivity === 'function') {
        await LiveActivity.endActivity(activityId, {
          dismissalPolicy,
        });
      } else if (typeof (LiveActivity as any).end === 'function') {
        await (LiveActivity as any).end(activityId);
      } else if (typeof LiveActivity.removeActivity === 'function') {
        await LiveActivity.removeActivity(activityId);
      }
    } catch (apiError) {
      console.error('Error calling Live Activity end API:', apiError);
    }

    activeLiveActivities.delete(orderId);
    console.log(`Live Activity ended for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error ending Live Activity:', error);
    // Remove from map even if ending fails
    activeLiveActivities.delete(orderId);
    return false;
  }
}

/**
 * Get the active Live Activity ID for an order
 */
export function getActiveLiveActivityId(orderId: string): string | undefined {
  return activeLiveActivities.get(orderId);
}

/**
 * Check if there's an active Live Activity for an order
 */
export function hasActiveLiveActivity(orderId: string): boolean {
  return activeLiveActivities.has(orderId);
}

/**
 * Clear all active Live Activities (useful for cleanup)
 */
export function clearAllLiveActivities(): void {
  activeLiveActivities.clear();
}

