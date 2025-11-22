/**
 * Time calculation utilities for delivery times, expiration times, and time formatting
 */

import { calculateDistance } from '../types/livestream';

/**
 * Configuration constants for delivery time calculations
 */
const AVERAGE_DRIVING_SPEED_KMH = 30; // Average city driving speed in km/h
const BASE_PREP_TIME_MINUTES = 15; // Base preparation time in minutes
const PICKUP_TIME_MINUTES = 5; // Time to pick up from kitchen
const BUFFER_TIME_MINUTES = 5; // Buffer time for unexpected delays

/**
 * Calculate estimated delivery time based on distance and prep time
 * @param distanceKm - Distance in kilometers
 * @param prepTimeMinutes - Meal preparation time in minutes (optional)
 * @returns Estimated delivery time in minutes
 */
export function calculateDeliveryTime(
  distanceKm: number,
  prepTimeMinutes?: number | null
): number {
  // Calculate driving time (distance / speed, converted to minutes)
  const drivingTimeMinutes = (distanceKm / AVERAGE_DRIVING_SPEED_KMH) * 60;
  
  // Use provided prep time or default
  const prepTime = prepTimeMinutes ?? BASE_PREP_TIME_MINUTES;
  
  // Total time = prep + pickup + driving + buffer
  const totalMinutes = prepTime + PICKUP_TIME_MINUTES + drivingTimeMinutes + BUFFER_TIME_MINUTES;
  
  // Round to nearest 5 minutes for cleaner display
  return Math.ceil(totalMinutes / 5) * 5;
}

/**
 * Calculate delivery time between two locations
 * @param chefLat - Chef's latitude
 * @param chefLng - Chef's longitude
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param prepTimeMinutes - Meal preparation time in minutes (optional)
 * @returns Estimated delivery time in minutes
 */
export function calculateDeliveryTimeFromLocations(
  chefLat: number,
  chefLng: number,
  userLat: number,
  userLng: number,
  prepTimeMinutes?: number | null
): number {
  const distanceKm = calculateDistance(chefLat, chefLng, userLat, userLng);
  return calculateDeliveryTime(distanceKm, prepTimeMinutes);
}

/**
 * Format delivery time as a human-readable string
 * @param minutes - Time in minutes
 * @returns Formatted string like "25-30 min" or "1 hour"
 */
export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    // For times under an hour, show range (e.g., "25-30 min")
    const lowerBound = Math.floor(minutes / 5) * 5;
    const upperBound = Math.ceil((minutes + 5) / 5) * 5;
    
    if (lowerBound === upperBound) {
      return `${lowerBound} min`;
    }
    return `${lowerBound}-${upperBound} min`;
  } else {
    // For times over an hour, show hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Calculate remaining time until expiration
 * @param expiresAt - Expiration timestamp (milliseconds)
 * @returns Object with remaining time details
 */
export function calculateRemainingTime(expiresAt: number): {
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  formatted: string;
  shortFormatted: string; // For badges like "in 30 Min"
} {
  const now = Date.now();
  const diff = expiresAt - now;
  
  if (diff <= 0) {
    return {
      totalMinutes: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      formatted: 'Expired',
      shortFormatted: 'Expired',
    };
  }
  
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  
  // Format for display
  let formatted = '';
  if (days > 0) {
    formatted = `${days} ${days === 1 ? 'day' : 'days'} left`;
  } else if (hours > 0) {
    formatted = `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
  } else if (minutes > 0) {
    formatted = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
  } else {
    formatted = 'Expiring soon';
  }
  
  // Short format for badges (e.g., "in 30 Min")
  let shortFormatted = '';
  if (days > 0) {
    shortFormatted = `${days}d`;
  } else if (hours > 0) {
    shortFormatted = `${hours}h`;
  } else if (minutes > 0) {
    shortFormatted = `in ${minutes} Min`;
  } else {
    shortFormatted = 'Soon';
  }
  
  return {
    totalMinutes,
    days,
    hours,
    minutes,
    isExpired: false,
    formatted,
    shortFormatted,
  };
}

/**
 * Format time remaining for "Too Fresh To Waste" items
 * @param expiresAt - Expiration timestamp (milliseconds)
 * @returns Formatted string like "in 30 Min"
 */
export function formatExpirationBadge(expiresAt: number): string {
  const remaining = calculateRemainingTime(expiresAt);
  return remaining.shortFormatted;
}

/**
 * Calculate and format delivery time for a meal/kitchen
 * @param chefLat - Chef's latitude
 * @param chefLng - Chef's longitude
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param prepTimeMinutes - Meal preparation time in minutes (optional)
 * @returns Formatted delivery time string
 */
export function getFormattedDeliveryTime(
  chefLat: number,
  chefLng: number,
  userLat: number,
  userLng: number,
  prepTimeMinutes?: number | null
): string {
  const deliveryMinutes = calculateDeliveryTimeFromLocations(
    chefLat,
    chefLng,
    userLat,
    userLng,
    prepTimeMinutes
  );
  return formatDeliveryTime(deliveryMinutes);
}

/**
 * Format time for "Order Again" section (e.g., "15m")
 * @param lastOrderedAt - Timestamp when item was last ordered
 * @returns Formatted string like "15m" or "2h"
 */
export function formatLastOrderedTime(lastOrderedAt: number): string {
  const now = Date.now();
  const diff = now - lastOrderedAt;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

