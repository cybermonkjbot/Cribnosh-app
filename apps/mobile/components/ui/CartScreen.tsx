import { useGetCartQuery } from "@/store/customerApi";
import { EmptyState } from "@/components/ui/EmptyState";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { Link, router } from "expo-router";
import { CarFront } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncrementalOrderAmount from "../IncrementalOrderAmount";

export default function CartScreen() {
  const [cutleryIncluded, setCutleryIncluded] = useState(false);

  // Fetch cart data from API
  const { data: cartData, isLoading, error } = useGetCartQuery();

  // Get cart items from API or fallback to empty array
  // Structure: GetCartResponse.data.items (not data.cart.items)
  const cartItems = cartData?.data?.items || [];
  const hasItems = cartItems.length > 0;
  const isEmpty = !isLoading && (!cartData?.data || cartItems.length === 0);

  const handleBack = () => {
    router.back();
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    // Handle quantity change logic here
  };

  const handleCutleryToggle = () => {
    setCutleryIncluded(!cutleryIncluded);
  };

  const handleBrowseMeals = () => {
    router.replace("/(tabs)");
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#094327" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (isEmpty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Entypo name="chevron-down" size={18} color="#094327" />
          </Pressable>
          <Text style={styles.headerTitle}>
            My Cart
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Your cart is empty"
            subtitle="Start adding delicious meals to your cart"
            icon="cart-outline"
            actionButton={{
              label: "Browse Meals",
              onPress: handleBrowseMeals,
            }}
            titleColor="#11181C"
            subtitleColor="#687076"
            iconColor="#9CA3AF"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals from cart
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    return sum + ((item.price || 0) / 100 * (item.quantity || 1));
  }, 0);
  const deliveryFee = (cartData?.data?.delivery_fee || 900) / 100;
  const total = subtotal + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="#094327" />
              </Pressable>
              <Text style={styles.headerTitle}>
                My Cart
              </Text>
              <Pressable>
                <Feather name="trash-2" size={18} color="#094327" />
              </Pressable>
            </View>
            <View style={styles.itemsContainer}>
              {cartItems.map((item: any, index: number) => (
                <View
                  style={styles.itemRow}
                  key={index}
                >
                  <View style={styles.itemLeft}>
                    {item.image_url ? (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.itemImage}
                          defaultSource={require("@/assets/images/sample.png")}
                        />
                      </View>
                    ) : (
                      <View style={styles.imageContainer}>
                        <Image
                          source={require("@/assets/images/sample.png")}
                          style={styles.itemImage}
                        />
                      </View>
                    )}
                    <View>
                      <Text>{item.dish_name || item.name || 'Unknown Item'}</Text>
                      <Text style={styles.itemPrice}>
                        £ {((item.price || 0) / 100).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <IncrementalOrderAmount
                    initialValue={item.quantity || 1}
                    onChange={(newQuantity) =>
                      handleQuantityChange(index, newQuantity)
                    }
                  />
                </View>
              ))}
            </View>
            <View>
              <View style={styles.sectionRow}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconBadge}>
                    <CarFront color={"white"} />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>
                      Delivery in 38-64 mins
                    </Text>
                    <Text style={styles.sectionSubtitle}>32 Springfield Rd</Text>
                  </View>
                </View>

                <Entypo name="chevron-right" size={24} color="#094327" />
              </View>
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.smallIcon}
                      source={require("@/assets/images/nosh-pass.png")}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Nosh Pass</Text>
                </View>

                <View style={styles.sectionRight}>
                  <Text style={styles.badgeText}>#EarlyBird</Text>
                  <Entypo name="chevron-right" size={24} color="#094327" />
                </View>
              </View>
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.smallIcon}
                      source={require("@/assets/images/utensils.png")}
                    />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>Cutlery</Text>
                    <Text style={styles.sectionDescription}>
                      We do not include cutlery by default for
                      sustainability{" "}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonWrapper}>
                  <Pressable
                    onPress={handleCutleryToggle}
                    style={[
                      styles.actionButton,
                      cutleryIncluded && styles.actionButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      cutleryIncluded && styles.actionButtonTextSelected,
                    ]}>Include</Text>
                  </Pressable>
                </View>
              </View>
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.shareIcon}
                      source={require("@/assets/images/share.png")}
                    />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>
                      Ask a friend to pay
                    </Text>
                    <Text style={styles.sectionDescription}>
                      Share the payment link with a friend to split the cost
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonWrapper}>
                  <Pressable
                    onPress={() => router.push('/orders/cart/choose-friend')}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>Choose</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery Fee
              </Text>
              <Text style={styles.summaryValue}>£ {deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total </Text>
              <Text style={styles.summaryTotalValue}>£ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Continue Button */}
      <View style={styles.footer}>
        <Link asChild href={"/orders/cart/sides"}>
          <Pressable style={styles.continueButton}>
            <Text style={styles.continueButtonText}>
              Continue to Sides
            </Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    padding: 20, // p-5
    backgroundColor: '#FFFFFF', // bg-white
  },
  scrollView: {
    flex: 1, // flex-1
  },
  content: {
    flexDirection: 'column', // flex flex-col
    flex: 1, // flex-1
  },
  mainContent: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '500', // font-medium
    textAlign: 'center', // text-center
    color: '#094327', // text-dark-green
  },
  headerSpacer: {
    width: 24, // Match icon width for symmetry
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#094327',
    fontWeight: '500',
  },
  itemsContainer: {
    // empty className
  },
  itemRow: {
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#F3F4F6', // border-[#F3F4F6]
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
  itemPrice: {
    fontWeight: '700', // font-bold
  },
  sectionRow: {
    flexDirection: 'row', // flex flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'flex-start', // items-start (align to top, don't stretch)
    marginTop: 32, // mt-8
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#F3F4F6', // border-[#F3F4F6]
    paddingBottom: 8, // pb-2
  },
  sectionRowSpacing: {
    marginTop: 20, // mt-5
  },
  sectionLeft: {
    flexDirection: 'row', // flex flex-row
    gap: 8, // gap-x-2
    flex: 1, // flex-1
    alignItems: 'center', // items-center
  },
  iconBadge: {
    padding: 8, // p-2
    borderRadius: 9999, // rounded-full
    backgroundColor: '#094327', // bg-dark-green
    flexShrink: 0, // flex-shrink-0
  },
  sectionText: {
    flex: 1, // flex-1
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  sectionSubtitle: {
    fontSize: 18, // text-lg
  },
  sectionDescription: {
    color: '#6B7280', // text-[#6B7280]
    fontSize: 14, // text-sm
  },
  sectionRight: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 1, // gap-x-[1px]
  },
  badgeText: {
    fontWeight: '700', // font-bold
    color: '#094327', // text-dark-green
  },
  iconContainer: {
    padding: 8, // p-2
  },
  smallIcon: {
    width: 32, // w-8
    height: 32, // h-8
  },
  shareIcon: {
    width: 29, // w-[29px]
    height: 17, // h-[17px]
  },
  actionButtonWrapper: {
    alignItems: 'flex-start', // Align button to top
    justifyContent: 'flex-start', // Justify to top
  },
  actionButton: {
    backgroundColor: '#F3F4F6', // bg-[#F3F4F6]
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    minWidth: 80, // Ensure button has minimum width
    alignItems: 'center', // Center text
    justifyContent: 'center', // Center text vertically
  },
  actionButtonSelected: {
    backgroundColor: '#094327', // Selected state - dark green
  },
  actionButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#111827', // Default text color
  },
  actionButtonTextSelected: {
    color: '#FFFFFF', // Selected text color - white
  },
  summary: {
    marginTop: 48, // mt-12
  },
  summaryRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
  },
  summaryLabel: {
    fontSize: 18, // text-lg
    fontFamily: 'Inter', // font-inter
    color: '#094327', // text-dark-green
  },
  summaryValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#094327', // text-dark-green
  },
  summaryTotalLabel: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  summaryTotalValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  footer: {
    position: 'absolute', // absolute
    bottom: 0, // bottom-0
    left: 0, // left-0
    right: 0, // right-0
    backgroundColor: '#FFFFFF', // bg-white
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#E5E7EB', // border-gray-200
  },
  continueButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  continueButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
});
