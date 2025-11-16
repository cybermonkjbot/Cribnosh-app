import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/customer';
import { useRouter } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { BlurEffect } from '@/utils/blurEffects';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface NotificationsSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function NotificationsSheet({
  isVisible,
  onClose,
}: NotificationsSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getNotifications, markNotificationRead, markAllNotificationsRead, isLoading } = useNotifications();
  const [notificationsData, setNotificationsData] = useState<any>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Load notifications when sheet becomes visible
  useEffect(() => {
    if (isVisible) {
      const loadNotifications = async () => {
        try {
          setIsLoadingNotifications(true);
          const result = await getNotifications({ limit: 50 });
          if (result.success) {
            setNotificationsData({ success: true, data: result.data });
          }
        } catch {
          // Error handling is done in the hook
          setNotificationsData(null);
        } finally {
          setIsLoadingNotifications(false);
        }
      };
      loadNotifications();
    }
  }, [isVisible, getNotifications]);

  const refetch = useCallback(async () => {
    try {
      setIsLoadingNotifications(true);
      const result = await getNotifications({ limit: 50 });
      if (result.success) {
        setNotificationsData({ success: true, data: result.data });
      }
    } catch {
      // Error handling is done in the hook
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [getNotifications]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
        // Refetch to update the UI
        await refetch();
      } catch (error) {
        // Silently fail - notification will still be shown
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      onClose();
      // Handle both internal routes and external URLs
      if (notification.actionUrl.startsWith('/')) {
        router.push(notification.actionUrl as any);
      } else if (notification.actionUrl.startsWith('http')) {
        // External URL - could open in browser or handle differently
        // For now, just log it
        console.log('External URL:', notification.actionUrl);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllNotificationsRead();
      // Refetch to update the UI
      await refetch();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationItemUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, isUnread && styles.notificationTitleUnread]}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationTime}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={48} color="#9CA3AF" />
      <Text style={styles.emptyText}>No notifications</Text>
      <Text style={styles.emptySubtext}>
        You&apos;re all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;
  const hasUnreadNotifications = unreadCount > 0;

  // Sort notifications: unread first, then by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read !== b.read) {
      return a.read ? 1 : -1; // Unread first
    }
    return b.timestamp - a.timestamp; // Newest first
  });

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sortedNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading || isLoadingNotifications}
        />

        {/* Floating Mark All Read Button */}
        {!isLoading && !isLoadingNotifications && (
          <View style={[styles.floatingButtonContainer, { bottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={[
                styles.floatingButton,
                !hasUnreadNotifications && styles.floatingButtonDisabled,
              ]}
              onPress={handleMarkAllAsRead}
              disabled={isMarkingAll || !hasUnreadNotifications}
              activeOpacity={0.8}
            >
              {/* Glassy/Frosted Blur Effect */}
              {hasUnreadNotifications && (
                <BlurEffect
                  intensity={20}
                  tint="light"
                  useGradient={true}
                  backgroundColor="rgba(242, 62, 46, 0.75)"
                  style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                />
              )}
              
              {/* Content container - positioned above blur */}
              <View style={styles.floatingButtonContent}>
                {isMarkingAll ? (
                  <ActivityIndicator size="small" color={hasUnreadNotifications ? "#FFFFFF" : "#9CA3AF"} />
                ) : (
                  <>
                    <CheckCheck size={16} color={hasUnreadNotifications ? "#FFFFFF" : "#9CA3AF"} />
                    <Text style={[
                      styles.floatingButtonText,
                      !hasUnreadNotifications && styles.floatingButtonTextDisabled,
                    ]}>
                      Mark all read
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationItemUnread: {
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F23E2E',
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  floatingButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(242, 62, 46, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  floatingButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
  },
  floatingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 10,
    width: '100%',
    height: '100%',
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  floatingButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

