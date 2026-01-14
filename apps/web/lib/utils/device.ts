/**
 * Device identification utilities for web browsers
 * Generates and manages device IDs for session tracking
 */

const DEVICE_ID_KEY = 'cribnosh_device_id';
const DEVICE_NAME_KEY = 'cribnosh_device_name';

/**
 * Generate a unique device ID and store it in localStorage
 * Returns the same ID on subsequent calls (persists across sessions)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID (won't persist, but that's okay for SSR)
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  try {
    // Check if we already have a device ID
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a new device ID using crypto if available, otherwise fallback
      if (crypto && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        // Fallback: generate a pseudo-random ID
        deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      }
      
      // Store it for future use
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // If localStorage is not available (e.g., private browsing), generate a temporary ID
    console.warn('Failed to access localStorage for device ID:', error);
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Get or create a human-readable device name
 * Uses browser and OS information to create a descriptive name
 */
export function getOrCreateDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Unknown Device';
  }

  try {
    // Check if user has set a custom device name
    const deviceName = localStorage.getItem(DEVICE_NAME_KEY);
    
    if (deviceName) {
      return deviceName;
    }

    // Generate a device name from user agent
    const ua = navigator.userAgent;
    let name = 'Unknown Device';

    // Detect browser
    let browser = 'Unknown Browser';
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
      browser = 'Opera';
    }

    // Detect OS
    let os = '';
    if (ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
      os = 'Mac';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    } else if (ua.includes('Android')) {
      os = 'Android';
    } else if (ua.includes('iOS') || (ua.includes('iPhone') || ua.includes('iPad'))) {
      os = 'iOS';
    }

    // Combine browser and OS
    if (os) {
      name = `${browser} on ${os}`;
    } else {
      name = browser;
    }

    // Store it for future use
    localStorage.setItem(DEVICE_NAME_KEY, name);
    
    return name;
  } catch (error) {
    console.warn('Failed to generate device name:', error);
    return 'Unknown Device';
  }
}

/**
 * Set a custom device name (optional - allows users to rename their device)
 */
export function setDeviceName(name: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(DEVICE_NAME_KEY, name);
  } catch (error) {
    console.warn('Failed to set device name:', error);
  }
}

/**
 * Get device information for session creation
 * Works both client-side (uses localStorage) and server-side (generates temp IDs)
 */
export function getDeviceInfo(): { deviceId: string; deviceName: string } {
  return {
    deviceId: getOrCreateDeviceId(),
    deviceName: getOrCreateDeviceName(),
  };
}

/**
 * Extract device information from a request body or generate it from headers
 * @param body - Optional parsed request body (if already parsed)
 * @param userAgent - Optional user agent string (if already extracted)
 */
export function getDeviceInfoFromBodyOrHeaders(
  body?: any,
  userAgent?: string
): { deviceId: string; deviceName: string } {
  // Try to get from request body first
  if (body && body.deviceId && body.deviceName) {
    return {
      deviceId: body.deviceId,
      deviceName: body.deviceName,
    };
  }
  
  // Fallback: generate device info from user agent
  const ua = (userAgent || '').toLowerCase();
  let deviceName = 'Unknown Device';
  
  // Generate device name from user agent
  let browser = 'Unknown Browser';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  }
  
  let os = '';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac')) {
    os = 'Mac';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
  }
  
  if (os) {
    deviceName = `${browser} on ${os}`;
  } else {
    deviceName = browser;
  }
  
  // Generate a temporary device ID (server-side can't use localStorage)
  const deviceId = `server_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return { deviceId, deviceName };
}

