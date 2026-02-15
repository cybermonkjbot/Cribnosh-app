/**
 * Device identification utilities for mobile apps
 * Generates and manages device IDs for session tracking
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'cribnosh_device_id';
const DEVICE_NAME_KEY = 'cribnosh_device_name';

// Try to import expo-device if available (optional dependency)
let Device: any = null;
try {
  Device = require('expo-device');
} catch {
  // expo-device not installed, we'll use fallbacks
}

/**
 * Generate a unique device ID and store it in SecureStore
 * Returns the same ID on subsequent calls (persists across app restarts)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // Check if we already have a device ID
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Try to use device's unique identifier if expo-device is available
      if (Device?.modelId) {
        // Use device model ID as base, but add a random component for uniqueness
        deviceId = `device_${Device.modelId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      } else {
        // Generate a new device ID using platform info
        const platform = Platform.OS;
        const platformVersion = Platform.Version;
        const deviceInfo = `${platform}_${platformVersion}_${Date.now()}`;
        const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        deviceId = `mobile_${deviceInfo}_${random}`;
      }
      
      // Store it for future use
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // If SecureStore is not available, generate a temporary ID
    console.warn('Failed to access SecureStore for device ID:', error);
    const fallbackId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return fallbackId;
  }
}

/**
 * Get or create a human-readable device name
 * Uses device model and OS information to create a descriptive name
 */
export async function getOrCreateDeviceName(): Promise<string> {
  try {
    // Check if user has set a custom device name
    let deviceName = await SecureStore.getItemAsync(DEVICE_NAME_KEY);
    
    if (deviceName) {
      return deviceName;
    }

    // Generate a device name from device information
    let name = 'Unknown Device';

    if (Device) {
      // Use expo-device if available
      const brand = Device.brand || '';
      const modelName = Device.modelName || '';
      const deviceType = Device.deviceType;
      const osName = Device.osName || '';
      const osVersion = Device.osVersion || '';

      // Build device name
      if (modelName) {
        // Use model name if available (e.g., "iPhone 14 Pro", "Pixel 7")
        name = modelName;
      } else if (brand) {
        // Fallback to brand (e.g., "Apple", "Samsung")
        name = brand;
      }

      // Add device type if it's a tablet
      if (deviceType === Device.DeviceType?.TABLET) {
        name = `${name} (Tablet)`;
      }

      // Add OS version for better identification
      if (osName && osVersion) {
        name = `${name} - ${osName} ${osVersion}`;
      } else if (osName) {
        name = `${name} - ${osName}`;
      }
    } else {
      // Fallback: use Platform info
      const platform = Platform.OS;
      const platformVersion = Platform.Version;
      name = `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${platformVersion}`;
    }

    // Store it for future use
    await SecureStore.setItemAsync(DEVICE_NAME_KEY, name);
    
    return name;
  } catch (error) {
    console.warn('Failed to generate device name:', error);
    // Fallback device name
    return Platform.OS === 'ios' ? 'iOS Device' : 'Android Device';
  }
}

/**
 * Set a custom device name (optional - allows users to rename their device)
 */
export async function setDeviceName(name: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DEVICE_NAME_KEY, name);
  } catch (error) {
    console.warn('Failed to set device name:', error);
  }
}

/**
 * Get device information for session creation
 * Returns both deviceId and deviceName
 */
export async function getDeviceInfo(): Promise<{ deviceId: string; deviceName: string }> {
  const [deviceId, deviceName] = await Promise.all([
    getOrCreateDeviceId(),
    getOrCreateDeviceName(),
  ]);

  return {
    deviceId,
    deviceName,
  };
}

