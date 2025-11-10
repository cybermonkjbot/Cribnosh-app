import * as Haptics from 'expo-haptics';
import { logger } from '../utils/Logger';

class DriverOrderNotificationService {
  async initialize() {
    // Audio initialization will be handled by React components using useAudioPlayer hook
    // This service focuses on haptic feedback and coordination
  }

  async playNewOrderNotification() {
    try {
      // Play haptic feedback for new order
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Audio playback should be handled by React components using useAudioPlayer hook
      // This service focuses on haptic feedback
    } catch (error) {
      logger.info('Error playing new order notification:', error);
    }
  }

  async playOrderAccepted() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.info('Error playing acceptance feedback:', error);
    }
  }

  async playOrderRejected() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      logger.info('Error playing rejection feedback:', error);
    }
  }

  async playOrderTimeout() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      logger.info('Error playing timeout feedback:', error);
    }
  }

  async playDeliveryCompleted() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.info('Error playing delivery completion feedback:', error);
    }
  }

  async playUrgentOrder() {
    try {
      // More intense haptic feedback for urgent orders
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.info('Error playing urgent order feedback:', error);
    }
  }

  async cleanup() {
    // Cleanup is handled automatically by React components using useAudioPlayer hook
  }
}

export const driverOrderNotificationService = new DriverOrderNotificationService();
