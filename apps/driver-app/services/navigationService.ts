import { Alert, Linking } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface NavigationOptions {
  destination: Location;
  destinationName?: string;
}

/**
 * Navigation service for opening external navigation apps
 */
export class NavigationService {
  /**
   * Open navigation to a destination
   * This will show options for available navigation apps
   */
  static async openNavigation(options: NavigationOptions): Promise<void> {
    const { destination, destinationName } = options;
    const destinationNameText = destinationName || 'Destination';
    
    // Create the destination URL for different navigation apps
    const urls = {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`,
      appleMaps: `http://maps.apple.com/?daddr=${destination.latitude},${destination.longitude}`,
      waze: `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`,
    };

    // Check which apps are available and show options
    const availableApps = await this.getAvailableNavigationApps();
    
    if (availableApps.length === 0) {
      Alert.alert(
        'No Navigation Apps',
        'No navigation apps are available on this device. Please install Google Maps, Apple Maps, or Waze.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (availableApps.length === 1) {
      // Only one app available, open directly
      await Linking.openURL(availableApps[0].url);
      return;
    }

    // Multiple apps available, show selection
    const buttons = availableApps.map(app => ({
      text: app.name,
      onPress: () => Linking.openURL(app.url),
    }));

    buttons.push({ text: 'Cancel', onPress: async () => {} });

    Alert.alert(
      'Choose Navigation App',
      `Navigate to ${destinationNameText}`,
      buttons
    );
  }

  /**
   * Check which navigation apps are available on the device
   */
  private static async getAvailableNavigationApps(): Promise<Array<{ name: string; url: string }>> {
    const apps = [];
    
    // Check Google Maps
    const googleMapsUrl = 'comgooglemaps://';
    const googleMapsAvailable = await Linking.canOpenURL(googleMapsUrl);
    if (googleMapsAvailable) {
      apps.push({
        name: 'Google Maps',
        url: googleMapsUrl,
      });
    }

    // Check Apple Maps (iOS only)
    const appleMapsUrl = 'http://maps.apple.com/';
    const appleMapsAvailable = await Linking.canOpenURL(appleMapsUrl);
    if (appleMapsAvailable) {
      apps.push({
        name: 'Apple Maps',
        url: appleMapsUrl,
      });
    }

    // Check Waze
    const wazeUrl = 'waze://';
    const wazeAvailable = await Linking.canOpenURL(wazeUrl);
    if (wazeAvailable) {
      apps.push({
        name: 'Waze',
        url: wazeUrl,
      });
    }

    // If no native apps are available, fall back to web versions
    if (apps.length === 0) {
      apps.push(
        {
          name: 'Google Maps (Web)',
          url: 'https://www.google.com/maps/',
        },
        {
          name: 'Apple Maps (Web)',
          url: 'http://maps.apple.com/',
        }
      );
    }

    return apps;
  }

  /**
   * Open navigation with specific coordinates
   */
  static async navigateToCoordinates(
    latitude: number, 
    longitude: number, 
    destinationName?: string
  ): Promise<void> {
    await this.openNavigation({
      destination: { latitude, longitude },
      destinationName,
    });
  }

  /**
   * Open navigation to supplier location for pickup
   */
  static async navigateToSupplier(supplierLocation: Location, supplierName?: string): Promise<void> {
    await this.openNavigation({
      destination: supplierLocation,
      destinationName: supplierName ? `Pickup at ${supplierName}` : 'Supplier Location',
    });
  }

  /**
   * Open navigation to customer location for delivery
   */
  static async navigateToCustomer(customerLocation: Location, customerName?: string): Promise<void> {
    await this.openNavigation({
      destination: customerLocation,
      destinationName: customerName ? `Delivery to ${customerName}` : 'Customer Location',
    });
  }
}
