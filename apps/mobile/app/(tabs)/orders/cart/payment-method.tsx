import { AddPaymentMethodModal } from "@/components/AddPaymentMethodScreen";
import { Entypo, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Users } from "lucide-react-native";
import { useEffect, useState, useCallback } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useAuthContext } from "@/contexts/AuthContext";
import { TopUpBalanceSheet } from "@/components/ui/TopUpBalanceSheet";
import { AddCardSheet } from "@/components/ui/AddCardSheet";
import { usePayments } from "@/hooks/usePayments";
import { Alert } from "react-native";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PAYMENT_METHOD_STORAGE_KEY = "cart_selected_payment_method";

export default function PaymentMethodSelection() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isAddPaymentMethodModalVisible, setIsAddPaymentMethodModalVisible] = useState(false);
  const [isTopUpSheetVisible, setIsTopUpSheetVisible] = useState(false);
  const [isAddCardSheetVisible, setIsAddCardSheetVisible] = useState(false);
  const { isAuthenticated } = useAuthContext();
  const [familyProfileData, setFamilyProfileData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const { getPaymentMethods, removePaymentMethod } = usePayments();

  // Fetch family profile from Convex
  const fetchFamilyProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.users.customerGetFamilyProfile, {
        sessionToken,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setFamilyProfileData({
        data: {
          member_user_ids: result.member_user_ids || [],
          settings: result.settings || {},
        },
      });
    } catch (error: any) {
      console.error('Error fetching family profile:', error);
    }
  }, [isAuthenticated]);

  // Fetch balance from Convex
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        return;
      }

      const result = await convex.action(api.actions.payments.customerGetBalance, {
        sessionToken,
      });

      if (result.success === false) {
        return;
      }

      // Transform to match expected format
      setBalanceData({
        data: {
          balance: result.balance?.balance || 0,
          is_available: true,
        },
      });
    } catch (error: any) {
      console.error('Error fetching balance:', error);
    }
  }, [isAuthenticated]);

  // Fetch saved payment methods (cards)
  const fetchSavedCards = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const methods = await getPaymentMethods();
      if (methods) {
        // Filter to only show card payment methods
        const cards = methods.filter((m: any) => m.type === 'card');
        setSavedCards(cards);
      }
    } catch (error: any) {
      console.error('Error fetching saved cards:', error);
    }
  }, [isAuthenticated, getPaymentMethods]);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchFamilyProfile();
      fetchBalance();
      fetchSavedCards();
    }
  }, [isAuthenticated, fetchFamilyProfile, fetchBalance, fetchSavedCards]);

  // Load currently selected payment method
  useEffect(() => {
    const loadPaymentMethod = async () => {
      try {
        const stored = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
        if (stored) {
          const paymentMethod = JSON.parse(stored);
          setSelectedPaymentMethod(paymentMethod.id);
        }
      } catch (error) {
        console.error("Error loading payment method:", error);
        // Don't set default - let user select or use first available
        // If payment methods exist, will be set below
      }
    };
    loadPaymentMethod();
  }, []);

  // Check if user is a family member
  const isFamilyMember = familyProfileData?.data?.member_user_ids?.includes('current_user_id' as any) || false;
  const familyPaymentEnabled = familyProfileData?.data?.settings?.shared_payment_methods || false;

  // Build payment methods list with saved cards
  const paymentMethods = [
    ...(isFamilyMember && familyPaymentEnabled
      ? [
          {
            id: 'family',
            name: 'Family Payment Method',
            icon: null,
            description: 'Using parent account payment',
            isDefault: true,
            isFamily: true,
          },
        ]
      : []),
    // Add saved cards
    ...savedCards.map((card: any) => ({
      id: card.id,
      name: card.brand ? `${card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} Card` : "Credit/Debit Card",
      icon: require("@/assets/images/mastercard-logo.png"),
      description: card.last4 ? `**** **** **** ${card.last4}` : "Card",
      isDefault: card.is_default || false,
      isCard: true,
      last4: card.last4,
    })),
    // Add generic card option if no saved cards
    ...(savedCards.length === 0 ? [{
      id: "card",
      name: "Credit/Debit Card",
      icon: require("@/assets/images/mastercard-logo.png"),
      description: "Add a card to pay",
      isDefault: !isFamilyMember || !familyPaymentEnabled,
    }] : []),
    {
      id: "apple",
      name: "Apple Pay",
      icon: null,
      description: "Quick and secure payment",
      isDefault: false,
    },
    {
      id: "balance",
      name: "Cribnosh Balance",
      icon: require("@/assets/images/nosh-pass.png"),
      description: balanceData?.data?.is_available 
        ? `£${((balanceData.data.balance || 0) / 100).toFixed(2)} available`
        : "Balance not available",
      isDefault: false,
      disabled: !balanceData?.data?.is_available || (balanceData?.data?.balance || 0) <= 0,
    },
  ];

  // Set default to family payment if available
  useEffect(() => {
    if (isFamilyMember && familyPaymentEnabled && paymentMethods.find((m) => m.id === 'family')) {
      setSelectedPaymentMethod('family');
    }
  }, [isFamilyMember, familyPaymentEnabled]);

  const handleBack = () => {
    router.back();
  };

  const handleConfirm = async () => {
    // Save selected payment method to secure store
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod) {
      await SecureStore.setItemAsync(
        PAYMENT_METHOD_STORAGE_KEY,
        JSON.stringify({
          id: selectedPaymentMethod,
          name: selectedMethod.name,
          description: selectedMethod.description,
          iconType: selectedMethod.icon ? "card" : selectedMethod.id === "apple" ? "apple" : "balance",
        })
      );
    }
    router.back();
  };

  const handleAddPaymentMethod = () => {
    setIsAddPaymentMethodModalVisible(true);
  };

  const handleCloseAddPaymentMethodModal = () => {
    setIsAddPaymentMethodModalVisible(false);
  };

  const handleBalancePress = () => {
    // If balance is available, allow selection
    if (balanceData?.data?.is_available) {
      // If balance is low or zero, open top-up sheet
      if ((balanceData.data.balance || 0) <= 0) {
        setIsTopUpSheetVisible(true);
      } else {
        // Otherwise, just select it as payment method
        setSelectedPaymentMethod("balance");
      }
    } else {
      // If balance is not available, open top-up sheet to potentially enable it
      setIsTopUpSheetVisible(true);
    }
  };

  const handleBalanceLongPress = () => {
    // Long press always opens top-up sheet
    setIsTopUpSheetVisible(true);
  };

  const handleCloseTopUpSheet = () => {
    setIsTopUpSheetVisible(false);
    // Refresh balance after top-up
    fetchBalance();
  };

  const handleCardAdd = () => {
    setIsAddPaymentMethodModalVisible(false);
    setIsAddCardSheetVisible(true);
  };

  const handleCloseAddCardSheet = () => {
    setIsAddCardSheetVisible(false);
  };

  const handleCardAdded = async () => {
    // Refresh payment methods after adding a card
    await fetchSavedCards();
  };

  const handleRemoveCard = async (cardId: string, last4?: string) => {
    Alert.alert(
      'Remove Card',
      `Are you sure you want to remove card ending in ${last4 || '****'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removePaymentMethod(cardId);
            if (success) {
              await fetchSavedCards();
              // If the removed card was selected, reset to first available or null
              if (selectedPaymentMethod === cardId) {
                // Refresh payment methods list
                const updatedMethods = await getPaymentMethods();
                // Find first available payment method (family, saved card, or generic card)
                if (isFamilyMember && familyPaymentEnabled) {
                  setSelectedPaymentMethod('family');
                } else if (updatedMethods && updatedMethods.length > 0) {
                  // Select first saved card
                  setSelectedPaymentMethod(updatedMethods[0].id);
                } else {
                  // No saved cards, select generic card option if available
                  setSelectedPaymentMethod("card");
                }
              }
            }
          },
        },
      ]
    );
  };

  const renderPaymentMethodIcon = (method: any) => {
    if (method.icon) {
      return (
        <Image
          source={method.icon}
          style={styles.methodIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Fallback for Apple Pay
    if (method.id === "apple") {
      return (
        <View style={styles.appleIconContainer}>
          <Text style={styles.appleIconText}>Apple</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Entypo name="chevron-down" size={24} color="#094327" />
          </Pressable>
          <Text style={styles.headerTitle}>
            Payment Method
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Payment Methods */}
        <View style={styles.methodsContainer}>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => {
                if (method.id === "balance") {
                  handleBalancePress();
                } else if (method.id === "card" && savedCards.length === 0) {
                  // If no saved cards and clicking generic "card", open add card sheet
                  handleAddPaymentMethod();
                } else if (!('disabled' in method && method.disabled)) {
                  setSelectedPaymentMethod(method.id);
                }
              }}
              onLongPress={() => {
                if (method.id === "balance") {
                  handleBalanceLongPress();
                }
              }}
              style={[
                styles.methodCard,
                selectedPaymentMethod === method.id ? styles.methodCardSelected : styles.methodCardUnselected,
                'disabled' in method && method.disabled && styles.methodCardDisabled,
              ]}
              disabled={'disabled' in method && method.disabled && method.id !== "balance"}
            >
              <View style={styles.methodLeft}>
                {'isFamily' in method && method.isFamily ? (
                  <View style={styles.familyIconContainer}>
                    <Users size={24} color="#094327" />
                  </View>
                ) : (
                  renderPaymentMethodIcon(method)
                )}
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>
                    {method.name}
                  </Text>
                  <Text style={styles.methodDescription}>
                    {method.description}
                  </Text>
                  {method.isDefault && (
                    <Text style={styles.methodDefault}>
                      Default
                    </Text>
                  )}
                  {'isFamily' in method && method.isFamily && (
                    <Text style={styles.familyBudgetText}>
                      Budget limits apply
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.methodRight}>
                {method.id === "balance" && 
                 balanceData?.data?.is_available && 
                 (balanceData.data.balance || 0) <= 0 && (
                  <View style={styles.topUpBadge}>
                    <Text style={styles.topUpBadgeText}>Top Up</Text>
                  </View>
                )}
                {'isCard' in method && method.isCard && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveCard(method.id, 'last4' in method ? method.last4 : undefined);
                    }}
                    style={styles.deleteButton}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </Pressable>
                )}
                {selectedPaymentMethod === method.id && (
                  <View style={styles.checkIcon}>
                    <Feather name="check" size={16} color="white" />
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Add New Payment Method */}
        <View style={styles.addMethodContainer}>
          <Pressable 
            style={styles.addMethodButton}
            onPress={handleAddPaymentMethod}
          >
            <Feather name="plus" size={20} color="#6B7280" />
            <Text style={styles.addMethodText}>
              Add New Payment Method
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </Pressable>
      </View>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isVisible={isAddPaymentMethodModalVisible}
        onClose={handleCloseAddPaymentMethodModal}
        onCardAdd={handleCardAdd}
      />

      {/* Top Up Balance Sheet */}
      <TopUpBalanceSheet
        isVisible={isTopUpSheetVisible}
        onClose={handleCloseTopUpSheet}
      />

      {/* Add Card Sheet */}
      <AddCardSheet
        isVisible={isAddCardSheetVisible}
        onClose={handleCloseAddCardSheet}
        onSuccess={handleCardAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#FFFFFF', // bg-white
  },
  scrollView: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#E5E7EB', // border-gray-200
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    textAlign: 'center', // text-center
    color: '#111827', // text-gray-900
  },
  headerSpacer: {
    width: 24, // w-6
  },
  methodsContainer: {
    paddingHorizontal: 20, // px-5
    paddingVertical: 24, // py-6
  },
  sectionTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 16, // mb-4
  },
  methodCard: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    padding: 16, // p-4
    borderRadius: 16, // rounded-2xl
    marginBottom: 12, // mb-3
    borderWidth: 2, // border-2
  },
  methodCardSelected: {
    borderColor: '#FF3B30', // border-[#FF3B30]
    backgroundColor: '#FEF2F2', // bg-red-50
  },
  methodCardUnselected: {
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF', // bg-white
  },
  methodCardDisabled: {
    opacity: 0.5, // opacity-50
  },
  methodLeft: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    flex: 1, // flex-1
  },
  methodIcon: {
    width: 48, // w-12
    height: 32, // h-8
    marginRight: 16, // mr-4
  },
  appleIconContainer: {
    width: 48, // w-12
    height: 32, // h-8
    marginRight: 16, // mr-4
    backgroundColor: '#000000', // bg-black
    borderRadius: 8, // rounded-lg
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  appleIconText: {
    color: '#FFFFFF', // text-white
    fontWeight: '700', // font-bold
    fontSize: 12, // text-xs
  },
  methodInfo: {
    flex: 1, // flex-1
  },
  methodName: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  methodDescription: {
    fontSize: 14, // text-sm
    color: '#4B5563', // text-gray-600
  },
  methodDefault: {
    fontSize: 12, // text-xs
    color: '#FF3B30', // text-[#FF3B30]
    fontWeight: '500', // font-medium
    marginTop: 4, // mt-1
  },
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topUpBadge: {
    backgroundColor: '#094327',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topUpBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  checkIcon: {
    width: 24, // w-6
    height: 24, // h-6
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  addMethodContainer: {
    paddingHorizontal: 20, // px-5
    marginBottom: 24, // mb-6
  },
  addMethodButton: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    padding: 16, // p-4
    borderWidth: 2, // border-2
    borderStyle: 'dashed', // border-dashed
    borderColor: '#D1D5DB', // border-gray-300
    borderRadius: 16, // rounded-2xl
  },
  addMethodText: {
    color: '#4B5563', // text-gray-600
    marginLeft: 8, // ml-2
    fontWeight: '500', // font-medium
  },
  footer: {
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#FFFFFF', // bg-white
  },
  confirmButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    alignItems: 'center', // items-center
  },
  confirmButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  familyIconContainer: {
    width: 48, // w-12
    height: 32, // h-8
    marginRight: 16, // mr-4
    backgroundColor: '#E6FFE8', // bg-green-50
    borderRadius: 8, // rounded-lg
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  familyBudgetText: {
    fontSize: 12, // text-xs
    color: '#094327', // text-green-700
    fontWeight: '500', // font-medium
    marginTop: 4, // mt-1
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
});
