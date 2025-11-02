import { Entypo, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { AddPaymentMethodModal } from "@/components/AddPaymentMethodScreen";

const PAYMENT_METHOD_STORAGE_KEY = "cart_selected_payment_method";

export default function PaymentMethodSelection() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [isAddPaymentMethodModalVisible, setIsAddPaymentMethodModalVisible] = useState(false);

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
        // Default to card on error
        setSelectedPaymentMethod("card");
      }
    };
    loadPaymentMethod();
  }, []);

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: require("@/assets/images/mastercard-logo.png"),
      description: "**** **** **** 3095",
      isDefault: true,
    },
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
      description: "Use your available balance",
      isDefault: false,
      disabled: true,
    },
  ];

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

  const handleCardAdd = () => {
    // TODO: Implement card addition flow (e.g., open card form or payment processor SDK)
    console.log("Add card payment method");
    setIsAddPaymentMethodModalVisible(false);
    // Show a toast or navigate to card form
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
          <Text style={styles.sectionTitle}>
            Choose Payment Method
          </Text>
          
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              onPress={() => !method.disabled && setSelectedPaymentMethod(method.id)}
              style={[
                styles.methodCard,
                selectedPaymentMethod === method.id ? styles.methodCardSelected : styles.methodCardUnselected,
                method.disabled && styles.methodCardDisabled,
              ]}
              disabled={method.disabled}
            >
              <View style={styles.methodLeft}>
                {renderPaymentMethodIcon(method)}
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
                </View>
              </View>
              
              {selectedPaymentMethod === method.id && (
                <View style={styles.checkIcon}>
                  <Feather name="check" size={16} color="white" />
                </View>
              )}
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
});
