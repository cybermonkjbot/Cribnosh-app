import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/customer';
import { useRouter } from 'expo-router';
import { Bell, CheckCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { SkeletonBox } from './MealItemDetails/Skeletons/ShimmerBox';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

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
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

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
    const isHighPriority = item.priority === 'high' || item.priority === 'critical';
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationItemUnread,
          isHighPriority && styles.notificationItemHighPriority,
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
            {isHighPriority && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Important</Text>
              </View>
            )}
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

  const renderNotificationSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonHeader}>
              <SkeletonBox width={180} height={18} borderRadius={4} />
              <SkeletonBox width={8} height={8} borderRadius={4} />
            </View>
            <SkeletonBox width="100%" height={16} borderRadius={4} style={styles.skeletonMessage} />
            <SkeletonBox width={120} height={16} borderRadius={4} style={styles.skeletonMessage} />
            <View style={styles.skeletonFooter}>
              <SkeletonBox width={60} height={14} borderRadius={4} />
              <SkeletonBox width={70} height={20} borderRadius={6} />
            </View>
          </View>
        </View>
      ))}
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
          <View style={styles.headerRight}>
            {hasUnreadNotifications && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                disabled={isMarkingAll}
                style={styles.markAllButton}
                activeOpacity={0.7}
              >
                {isMarkingAll ? (
                  <ActivityIndicator size="small" color="#F23E2E" />
                ) : (
                  <>
                    <CheckCheck size={16} color="#F23E2E" />
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>

        {(isLoading || isLoadingNotifications) ? (
          <SkeletonWithTimeout isLoading={isLoading || isLoadingNotifications}>
            {renderNotificationSkeleton()}
          </SkeletonWithTimeout>
        ) : (
          <FlatList
            data={sortedNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={false}
          />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Inter',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F23E2E',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  skeletonContainer: {
    paddingBottom: 24,
  },
  skeletonItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  skeletonMessage: {
    marginBottom: 4,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationItemUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#F23E2E',
    borderWidth: 1.5,
  },
  notificationItemHighPriority: {
    borderLeftWidth: 4,
    borderLeftColor: '#F23E2E',
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
  priorityBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F23E2E',
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
});

