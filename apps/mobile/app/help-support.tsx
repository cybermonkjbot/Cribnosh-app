import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useSupport } from '@/hooks/useSupport';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { HelpCategorySheet } from '../components/ui/HelpCategorySheet';
import { LiveChatDrawer } from '../components/ui/LiveChatDrawer';
import { SupportCasesSheet } from '../components/ui/SupportCasesSheet';
import { useToast } from '../lib/ToastContext';
import { formatOrderDate } from '../utils/dateFormat';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Chat icon SVG
const chatIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Message icon SVG
const messageIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 4H2C1.45 4 1 4.45 1 5V15C1 15.55 1.45 16 2 16H6L10 20L14 16H18C18.55 16 19 15.55 19 15V5C19 4.45 18.55 4 18 4Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Chevron right icon SVG
const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Burger icon SVG
const burgerIconSVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="20" fill="#F3F4F6"/>
  <path d="M12 16H28M12 20H28M12 24H28" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function HelpSupportScreen() {
  const router = useRouter();
  const { } = useToast();
  const { isAuthenticated } = useAuthContext();

  // Fetch support cases using new hook
  const { getSupportCases, isLoading: supportCasesLoading } = useSupport();
  const [supportCasesData, setSupportCasesData] = useState<any>(null);
  const [ordersData, setOrdersData] = useState<any>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    loadSupportCases();
  }, []);

  const loadSupportCases = async () => {
    try {
      const result = await getSupportCases({ page: 1, limit: 10, status: 'open' });
      if (result.success) {
        setSupportCasesData(result);
      }
    } catch (_error) {
      // Error already handled in hook
    }
  };

  // Fetch recent orders from Convex (limit to 1 most recent)
  const fetchRecentOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setOrdersLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.orders.customerGetOrders, {
        sessionToken,
        page: 1,
        limit: 1,
        status: 'all',
        order_type: 'all',
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setOrdersData({
        data: {
          orders: result.orders || [],
        },
      });
    } catch (error: any) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentOrders();
    }
  }, [isAuthenticated, fetchRecentOrders]);

  // Note: createSupportCase mutation is available for future use when creating support cases from this screen
  // const [createSupportCase] = useCreateSupportCaseMutation();
  const [isLiveChatVisible, setIsLiveChatVisible] = useState(false);
  const [isSupportCasesSheetVisible, setIsSupportCasesSheetVisible] = useState(false);
  const [selectedChatCaseId, setSelectedChatCaseId] = useState<string | null>(null);
  const [selectedHelpCategory, setSelectedHelpCategory] = useState<{
    title: string;
    content: string;
    sections?: {
      title: string;
      content: string;
    }[];
  } | null>(null);

  // Get the most recent order
  const recentOrder = useMemo(() => {
    if (ordersData?.data?.orders && ordersData.data.orders.length > 0) {
      return ordersData.data.orders[0];
    }
    return null;
  }, [ordersData]);

  // Format order items into a display string
  const orderDisplayText = useMemo(() => {
    if (!recentOrder?.order_items || recentOrder.order_items.length === 0) {
      return 'Order';
    }

    const items = recentOrder.order_items;
    const itemNames = items
      .map((item: any) => item.name)
      .filter((name: string) => name);

    if (itemNames.length === 0) {
      return 'Order';
    } else if (itemNames.length === 1) {
      return itemNames[0];
    } else if (itemNames.length === 2) {
      return `${itemNames[0]}, ${itemNames[1]}`;
    } else {
      return `${itemNames[0]} and ${itemNames.length - 1} more`;
    }
  }, [recentOrder]);

  // Format order date
  const orderDateText = useMemo(() => {
    if (!recentOrder?.createdAt) return '';
    return formatOrderDate(recentOrder.createdAt);
  }, [recentOrder]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenLiveChat = () => {
    setIsLiveChatVisible(true);
  };

  const handleCloseLiveChat = () => {
    setIsLiveChatVisible(false);
  };

  const handleSupportCasesPress = () => {
    setIsSupportCasesSheetVisible(true);
  };

  const handleSelectSupportCase = (caseId: string) => {
    setSelectedChatCaseId(caseId);
    setIsLiveChatVisible(true);
  };

  const handleCloseSupportCasesSheet = () => {
    setIsSupportCasesSheetVisible(false);
  };

  const handleRecentOrderPress = () => {
    if (recentOrder?._id || recentOrder?.order_id) {
      // Navigate to order details page where user can get help with this specific order
      // The order details page should allow creating a support case for this order
      // Use order_id (string) if available, otherwise fall back to _id
      const orderId = recentOrder.order_id || recentOrder._id;
      router.push(`/order-details?id=${orderId}&support=true`);
    }
  };

  const handleSelectOlderOrder = () => {
    router.push('/(tabs)/orders');
  };

  const handleFoodSafetyPress = () => {
    setSelectedHelpCategory({
      title: 'Food safety on Cribnosh',
      content: 'We take food safety seriously. All our food creators are certified and follow strict hygiene standards. Here&apos;s what you need to know about food safety on Cribnosh.',
      sections: [
        {
          title: 'Food Creator Certification',
          content: 'All food creators on Cribnosh are required to have valid food safety certifications. We verify these certifications before allowing food creators to join our platform.',
        },
        {
          title: 'FoodCreator Standards',
          content: 'All foodCreators must meet our strict hygiene and safety standards. We conduct regular inspections to ensure compliance.',
        },
        {
          title: 'Allergen Information',
          content: 'You can set your allergies and dietary preferences in your account settings. Food Creators will be notified of your requirements, and you\'ll see allergen information for each dish.',
        },
        {
          title: 'Reporting Issues',
          content: 'If you encounter any food safety concerns, please contact our support team immediately. We take all reports seriously and will investigate promptly.',
        },
      ],
    });
  };

  const handleAppFeaturesPress = () => {
    setSelectedHelpCategory({
      title: 'App and features',
      content: 'Cribnosh offers a variety of features to enhance your food ordering experience. Learn more about what you can do with the app.',
      sections: [
        {
          title: 'Ordering',
          content: 'Browse menus from local food creators, customize your orders, and track deliveries in real-time. You can also place custom orders for special occasions.',
        },
        {
          title: 'Group Orders',
          content: 'Share orders with friends and family. Create group orders to split costs and enjoy meals together.',
        },
        {
          title: 'Live Sessions',
          content: 'Watch food creators prepare meals live. Place orders directly from live culinary sessions and interact with food creators.',
        },
        {
          title: 'Personalization',
          content: 'Our AI learns your preferences to recommend dishes you\'ll love. Set dietary restrictions and preferences for personalized recommendations.',
        },
      ],
    });
  };

  const handleAccountDataPress = () => {
    setSelectedHelpCategory({
      title: 'Account and data',
      content: 'Manage your account settings, privacy preferences, and data. Your privacy is important to us.',
      sections: [
        {
          title: 'Account Settings',
          content: 'Update your profile, change your password, and manage your account preferences in the Account Details section.',
        },
        {
          title: 'Data Privacy',
          content: 'You control your data. Manage your data sharing preferences and download your account data at any time.',
        },
        {
          title: 'Delete Account',
          content: 'You can delete your account at any time. Your data will be permanently removed according to our privacy policy.',
        },
        {
          title: 'Data Download',
          content: 'Download a copy of all your account data, including order history, preferences, and profile information.',
        },
      ],
    });
  };

  const handlePaymentsPricingPress = () => {
    setSelectedHelpCategory({
      title: 'Payments and pricing',
      content: 'Learn about payment methods, pricing, refunds, and how to manage your payment information.',
      sections: [
        {
          title: 'Payment Methods',
          content: 'We accept various payment methods including credit cards, debit cards, and digital wallets. Add and manage payment methods in your account settings.',
        },
        {
          title: 'Pricing',
          content: 'Prices are set by individual food creators and include preparation costs. Delivery fees may apply based on your location.',
        },
        {
          title: 'Refunds',
          content: 'If you\'re not satisfied with your order, you can request a refund within 24 hours of delivery. Refunds are processed within 5-7 business days.',
        },
        {
          title: 'Payment Issues',
          content: 'If you experience payment issues, check your payment method and ensure sufficient funds. Contact support if problems persist.',
        },
      ],
    });
  };

  const handleUsingCribnoshPress = () => {
    setSelectedHelpCategory({
      title: 'Using Cribnosh',
      content: 'Get started with Cribnosh and learn how to make the most of our platform.',
      sections: [
        {
          title: 'Getting Started',
          content: 'Create an account, set your preferences, and start browsing local food creators. Add your delivery address to see available options.',
        },
        {
          title: 'Placing Orders',
          content: 'Browse menus, add items to your cart, customize your order, and checkout. You can track your order in real-time.',
        },
        {
          title: 'Custom Orders',
          content: 'Need something special? Place a custom order and describe what you\'re looking for. Food creators can create personalized meals for you.',
        },
        {
          title: 'Tips and Tricks',
          content: 'Follow your favorite food creators to see their latest dishes. Use the shake feature to let Cribnosh decide for you when you can\'t choose. Save your favorite dishes for quick reordering.',
        },
      ],
    });
  };

  const handleCloseHelpCategory = () => {
    setSelectedHelpCategory(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Help & Support'
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>How can we help?</Text>

          {/* Support Cases Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support cases</Text>
            {supportCasesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#094327" />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.supportCaseItem}
                onPress={handleSupportCasesPress}
              >
                <View style={styles.supportCaseLeft}>
                  <View style={styles.messageIcon}>
                    <SvgXml xml={messageIconSVG} width={20} height={20} />
                  </View>
                  <View style={styles.supportCaseText}>
                    <Text style={styles.supportCaseTitle}>Inbox</Text>
                    <Text style={styles.supportCaseSubtitle}>
                      {supportCasesData?.data?.cases && supportCasesData.data.cases.length > 0
                        ? `${supportCasesData.data.cases.length} open case(s)`
                        : "View open supports"}
                    </Text>
                  </View>
                </View>
                <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Order Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get help with a recent order</Text>
            {ordersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#094327" />
              </View>
            ) : recentOrder ? (
              <>
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={handleRecentOrderPress}
                  activeOpacity={0.7}
                  accessibilityLabel={`Get help with order from ${orderDateText}`}
                  accessibilityHint="Tap to create a support case for this order"
                >
                  <View style={styles.orderImageContainer}>
                    <View style={styles.orderImage}>
                      <SvgXml xml={burgerIconSVG} width={40} height={40} />
                    </View>
                  </View>
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderTitle} numberOfLines={2}>
                      {orderDisplayText}
                    </Text>
                    <Text style={styles.orderTime}>{orderDateText}</Text>
                  </View>
                  <Text style={styles.orderPrice}>
                    £{(recentOrder.total_amount || 0).toFixed(2)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.olderOrderLink}
                  onPress={handleSelectOlderOrder}
                  hitSlop={12}
                >
                  <Text style={styles.olderOrderText}>Select a much older order</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateCard}>
                  <View style={styles.orderImageContainer}>
                    <View style={styles.orderImage}>
                      <SvgXml xml={burgerIconSVG} width={40} height={40} />
                    </View>
                  </View>
                  <View style={styles.emptyStateText}>
                    <Text style={styles.emptyStateTitle}>No recent orders</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      You haven't placed any orders yet
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Other Help Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get help with something else</Text>
            <TouchableOpacity
              style={styles.helpCategoryItem}
              onPress={handleFoodSafetyPress}
            >
              <Text style={styles.helpCategoryText}>Food safety on Cribnosh</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.helpCategoryItem}
              onPress={handleAppFeaturesPress}
            >
              <Text style={styles.helpCategoryText}>App and features</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.helpCategoryItem}
              onPress={handleAccountDataPress}
            >
              <Text style={styles.helpCategoryText}>Account and data</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.helpCategoryItem}
              onPress={handlePaymentsPricingPress}
            >
              <Text style={styles.helpCategoryText}>Payments and pricing</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.helpCategoryItem}
              onPress={handleUsingCribnoshPress}
            >
              <Text style={styles.helpCategoryText}>Using Cribnosh</Text>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Floating Live Chat Icon */}
        <TouchableOpacity
          style={styles.floatingChatButton}
          onPress={handleOpenLiveChat}
          activeOpacity={0.8}
        >
          <SvgXml xml={chatIconSVG} width={24} height={24} />
        </TouchableOpacity>

        {/* Live Chat Drawer */}
        <LiveChatDrawer
          isVisible={isLiveChatVisible}
          onClose={handleCloseLiveChat}
          caseId={selectedChatCaseId || undefined}
        />

        {/* Help Category Sheet */}
        <HelpCategorySheet
          isVisible={selectedHelpCategory !== null}
          onClose={handleCloseHelpCategory}
          category={selectedHelpCategory}
        />
        {/* Support Cases Sheet */}
        <SupportCasesSheet
          isVisible={isSupportCasesSheetVisible}
          onClose={handleCloseSupportCasesSheet}
          cases={supportCasesData?.data?.cases || []}
          onRefresh={loadSupportCases}
          isLoading={supportCasesLoading}
          onSelectCase={handleSelectSupportCase}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  // Support Cases Styles
  supportCaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportCaseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportCaseText: {
    flex: 1,
  },
  supportCaseTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  supportCaseSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Order Card Styles
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  orderImageContainer: {
    marginRight: 16,
  },
  orderImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  orderTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  orderTime: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  orderPrice: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  olderOrderLink: {
    paddingVertical: 8,
  },
  olderOrderText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#FF3B30',
    textAlign: 'left',
  },
  // Help Category Styles
  helpCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  helpCategoryText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    marginBottom: 16,
  },
  emptyStateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    flex: 1,
    marginLeft: 16,
  },
  emptyStateTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});
