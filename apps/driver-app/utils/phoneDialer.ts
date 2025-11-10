import { Alert, Linking, Platform } from 'react-native';
import { logger } from './Logger';

/**
 * Phone dialer utility for fallback when WebRTC is not available
 * Opens native phone dialer with formatted phone number
 */

/**
 * Format phone number for tel: scheme
 * Removes spaces, dashes, and ensures proper formatting
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters except +
  let formatted = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure phone number starts with + for international format
  // If it doesn't start with + and doesn't start with a country code, assume local format
  if (!formatted.startsWith('+')) {
    // For local numbers, keep as is (will work for most countries)
    // You can add country code logic here if needed
    formatted = formatted;
  }
  
  return formatted;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;
  
  const cleaned = formatPhoneNumber(phoneNumber);
  // Basic validation: at least 10 digits (adjust as needed for your use case)
  const digitsOnly = cleaned.replace(/\D/g, '');
  return digitsOnly.length >= 10;
}

/**
 * Open native phone dialer with phone number
 */
export async function openPhoneDialer(phoneNumber: string, recipientName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formatted = formatPhoneNumber(phoneNumber);
    
    if (!formatted) {
      return { success: false, error: 'Phone number is required' };
    }
    
    if (!validatePhoneNumber(formatted)) {
      return { success: false, error: 'Invalid phone number format' };
    }
    
    const phoneUrl = `tel:${formatted}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);
    
    if (!canOpen) {
      return { 
        success: false, 
        error: Platform.OS === 'ios' 
          ? 'Cannot make phone calls on this device' 
          : 'Phone dialer not available on this device' 
      };
    }
    
    await Linking.openURL(phoneUrl);
    logger.info('Opened phone dialer', { phoneNumber: formatted, recipientName });
    
    return { success: true };
  } catch (error) {
    logger.error('Error opening phone dialer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open phone dialer',
    };
  }
}

/**
 * Show dialog before opening phone dialer (optional confirmation)
 */
export function showPhoneCallDialog(
  phoneNumber: string,
  recipientName: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  Alert.alert(
    'Call',
    `Call ${recipientName} at ${formatPhoneNumber(phoneNumber)}?`,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { 
        text: 'Call', 
        onPress: async () => {
          const result = await openPhoneDialer(phoneNumber, recipientName);
          if (!result.success && result.error) {
            Alert.alert('Call Failed', result.error);
          }
          onConfirm();
        }
      },
    ]
  );
}

