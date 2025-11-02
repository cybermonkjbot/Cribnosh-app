import IncrementalOrderAmount from "@/components/IncrementalOrderAmount";
import Entypo from "@expo/vector-icons/Entypo";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { AppleIcon } from "@/components/AppleIcon";

const PAYMENT_METHOD_STORAGE_KEY = "cart_selected_payment_method";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  iconType: string;
}

export default function CartScreen() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const OrderItems = [
    {
      name: "Sharwama",
      price: "16",
      image: require("@/assets/images/sample.png"),
      quantity: 1,
    },
    {
      name: "Lentil Soup",
      price: "18",
      image: require("@/assets/images/sushi.png"),
      quantity: 1,
    },
  ];

  // Load payment method when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadPaymentMethod = async () => {
        try {
          const stored = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
          if (stored) {
            setSelectedPaymentMethod(JSON.parse(stored));
          } else {
            // Default to card if nothing is stored
            setSelectedPaymentMethod({
              id: "card",
              name: "Credit/Debit Card",
              description: "**** **** **** 3095",
              iconType: "card",
            });
          }
        } catch (error) {
          console.error("Error loading payment method:", error);
          // Default to card on error
          setSelectedPaymentMethod({
            id: "card",
            name: "Credit/Debit Card",
            description: "**** **** **** 3095",
            iconType: "card",
          });
        }
      };
      loadPaymentMethod();
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  const handleProceedToPayment = () => {
    // Go directly to payment processing, not payment method selection
    router.push("/orders/cart/payment");
  };

  const handleChangePaymentMethod = () => {
    // This will lead to payment method selection
    router.push("/orders/cart/payment-method");
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Handle quantity change logic here
    console.log(`Item ${index} quantity changed to ${newQuantity}`);
  };

  // Render payment method icon based on type
  const renderPaymentMethodIcon = () => {
    if (!selectedPaymentMethod) return null;

    if (selectedPaymentMethod.iconType === "card") {
      return (
        <Image
          style={styles.cardIcon}
          source={require("@/assets/images/mastercard-logo.png")}
        />
      );
    }
    
    if (selectedPaymentMethod.iconType === "apple") {
      return (
        <View style={styles.appleIconContainer}>
          <AppleIcon size={20} />
        </View>
      );
    }

    if (selectedPaymentMethod.iconType === "balance") {
      return (
        <Image
          style={styles.cardIcon}
          source={require("@/assets/images/nosh-pass.png")}
        />
      );
    }

    return null;
  };

  // Render payment method text based on type
  const renderPaymentMethodText = () => {
    if (!selectedPaymentMethod) return "**** **** **** 3095";

    if (selectedPaymentMethod.iconType === "apple") {
      return selectedPaymentMethod.name || "Apple Pay";
    }

    return selectedPaymentMethod.description || "**** **** **** 3095";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="white" />
              </Pressable>
              <Text style={styles.headerTitle}>
                Sides & Extras
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.itemsContainer}>
              {OrderItems.map((item, index) => (
                <View
                  style={styles.itemRow}
                  key={index}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.imageContainer}>
                      <Image
                        source={item.image}
                        style={styles.itemImage}
                      />
                    </View>
                    <View>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>
                        £ {item.price}
                      </Text>
                    </View>
                  </View>

                  <IncrementalOrderAmount
                    initialValue={item.quantity}
                    onChange={(newQuantity) => handleQuantityChange(index, newQuantity)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment method</Text>
              <View style={styles.paymentMethodRow}>
                <View style={styles.paymentMethodLeft}>
                  {renderPaymentMethodIcon()}
                  <Text style={styles.cardNumber}>
                    {renderPaymentMethodText()}
                  </Text>
                </View>

                <Pressable 
                  onPress={handleChangePaymentMethod}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>Change</Text>
                </Pressable>
              </View>
              
              <View style={styles.dietSection}>
                <View style={styles.dietLeft}>
                  <Image
                    source={require("@/assets/images/livelogo.png")}
                    style={styles.liveLogo}
                  />
                  <Text style={styles.dietText}>
                    These options are limited by Your Diet Preferences{" "}
                    <Text style={styles.dietBoldText}>Update Diet</Text>
                  </Text>
                </View>
                <View />
              </View>
            </View>

            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>£ 9</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total </Text>
                <Text style={styles.summaryTotalValue}>£ 36</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Payment Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleProceedToPayment}
          style={styles.paymentButton}
        >
          <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#02120A', // bg-[#02120A]
  },
  scrollView: {
    flex: 1, // flex-1
  },
  content: {
    flexDirection: 'column', // flex flex-col
    justifyContent: 'space-between', // justify-between
    flex: 1, // flex-1
    padding: 20, // p-5
  },
  mainContent: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 24, // mb-6
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '500', // font-[500]
    textAlign: 'center', // text-center
    color: '#FFFFFF', // text-white
  },
  headerSpacer: {
    width: 24, // w-6
  },
  itemsContainer: {
    marginBottom: 48, // mb-12
  },
  itemRow: {
    paddingVertical: 20, // py-5
    flexDirection: 'row', // flex flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
  },
  itemLeft: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 12, // gap-3
  },
  imageContainer: {
    backgroundColor: '#EAEAEA', // bg-[#eaeaea]
    height: 80, // h-20
    width: 80, // w-20
    borderRadius: 12, // rounded-xl
    padding: 8, // p-2
  },
  itemImage: {
    width: '100%', // w-full
    height: '100%', // h-full
    borderRadius: 12, // rounded-xl
  },
  itemName: {
    color: '#FFFFFF', // text-white
  },
  itemPrice: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  paymentSection: {
    marginBottom: 32, // mb-8
  },
  paymentTitle: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginTop: 16, // mt-4
    marginBottom: 32, // mb-8
  },
  paymentMethodRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 20, // mb-5
    gap: 8, // gap-x-2
  },
  paymentMethodLeft: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 8, // gap-x-2
  },
  cardIcon: {
    width: 32.26, // w-[32.26px]
    height: 25, // h-[25px]
  },
  cardNumber: {
    color: '#FFFFFF', // text-white
  },
  appleIconContainer: {
    width: 32.26, // w-[32.26px]
    height: 25, // h-[25px]
    backgroundColor: '#000000', // bg-black
    borderRadius: 6, // rounded-md
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    paddingHorizontal: 4, // px-1
  },
  changeButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderWidth: 2, // border-2
    borderColor: '#FFFFFF', // border-white
    borderRadius: 9999, // rounded-full
  },
  changeButtonText: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  dietSection: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 20, // mb-5
    gap: 8, // gap-x-2
  },
  dietLeft: {
    width: '66.666667%', // w-2/3
    gap: 8, // gap-2
  },
  liveLogo: {
    width: 146.63, // w-[146.63px]
    height: 23, // h-[23px]
  },
  dietText: {
    color: '#FFFFFF', // text-white
    marginTop: 8, // mt-2
  },
  dietBoldText: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  summarySection: {
    paddingTop: 16, // pt-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#374151', // border-gray-700
  },
  summaryRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 12, // mb-3
  },
  summaryLabel: {
    fontSize: 18, // text-lg
    color: '#FFFFFF', // text-white
    fontFamily: 'Inter', // font-inter
  },
  summaryValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  summaryTotalLabel: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginBottom: 32, // mb-8
  },
  summaryTotalValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginBottom: 32, // mb-8
  },
  footer: {
    position: 'absolute', // absolute
    bottom: 0, // bottom-0
    left: 0, // left-0
    right: 0, // right-0
    backgroundColor: '#02120A', // bg-[#02120A]
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#374151', // border-gray-700
  },
  paymentButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  paymentButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
});
