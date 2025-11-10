import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: {
    orderId?: string;
    type?: 'order_assignment' | 'order_completion' | 'earnings_update' | 'system' | 'marketing';
    customerName?: string;
    address?: string;
    earnings?: number;
    totalEarnings?: number;
    [key: string]: unknown;
  };
}

export class DriverNotificationService {
  private static instance: DriverNotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): DriverNotificationService {
    if (!DriverNotificationService.instance) {
      DriverNotificationService.instance = new DriverNotificationService();
    }
    return DriverNotificationService.instance;
  }

  /**
   * Initialize the notification service for drivers
   */
  public async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    try {
      // Only include projectId if it's a valid UUID
      // Expo will automatically use the project ID from app.json if not provided
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      const isValidUuid = projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
      
      const token = await Notifications.getExpoPushTokenAsync(
        isValidUuid ? { projectId } : {}
      );
      this.expoPushToken = token.data;
      console.log('Expo push token:', this.expoPushToken);
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  /**
   * Get the current Expo push token
   */
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Send a local notification
   */
  public async sendNotification(notification: NotificationData): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Send order assignment notification
   */
  public async sendOrderAssignmentNotification(orderId: string, customerName: string, address: string): Promise<void> {
    await this.sendNotification({
      title: 'New Order Assignment!',
      body: `Order for ${customerName} at ${address}`,
      data: {
        orderId,
        type: 'order_assignment',
        customerName,
        address,
      },
    });
  }

  /**
   * Send order completion notification
   */
  public async sendOrderCompletionNotification(orderId: string, earnings: number): Promise<void> {
    await this.sendNotification({
      title: 'Order Completed!',
      body: `You earned ₦${earnings.toFixed(2)} for this delivery`,
      data: {
        orderId,
        type: 'order_completion',
        earnings,
      },
    });
  }

  /**
   * Send earnings update notification
   */
  public async sendEarningsUpdateNotification(totalEarnings: number): Promise<void> {
    await this.sendNotification({
      title: 'Earnings Updated',
      body: `Your total earnings: ₦${totalEarnings.toFixed(2)}`,
      data: {
        type: 'earnings_update',
        totalEarnings,
      },
    });
  }

  /**
   * Add notification response listener
   */
  public addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * Add notification received listener
   */
  public addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * Cancel all notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export const driverNotificationService = DriverNotificationService.getInstance();