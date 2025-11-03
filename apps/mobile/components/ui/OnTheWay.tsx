import { Entypo, Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OnTheWayDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

const OnTheWay: React.FC<OnTheWayDrawerProps> = ({ isVisible, onClose }) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose}>
              <Entypo name="chevron-down" size={24} color="#094327" />
            </Pressable>
            <Text style={styles.headerTitle}>
              Order Confirmed
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.contentInner}>
              <View style={styles.checkIcon}>
                <Entypo name="check" size={48} color="#10B981" />
              </View>
              
              <Text style={styles.title}>
                Your order is on the way!
              </Text>
              
              <Text style={styles.description}>
                We've received your order and our kitchen is preparing it now. 
                You'll receive updates as your food makes its way to you.
              </Text>

              <View style={styles.deliveryCard}>
                <Text style={styles.deliveryLabel}>
                  Estimated Delivery
                </Text>
                <Text style={styles.deliveryTime}>
                  38-64 mins
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                style={styles.trackButton}
              >
                <Text style={styles.trackButtonText}>Track Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#FFFFFF', // bg-white
  },
  content: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    width: '100%', // w-full
    backgroundColor: '#FFFFFF', // bg-white
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#E5E7EB', // border-gray-200
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    textAlign: 'center', // text-center
    color: '#094327', // text-dark-green
  },
  headerSpacer: {
    width: 24, // w-6
  },
  contentContainer: {
    flex: 1, // flex-1
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    paddingHorizontal: 32, // px-8
  },
  contentInner: {
    alignItems: 'center', // items-center
  },
  checkIcon: {
    width: 96, // w-24
    height: 96, // h-24
    backgroundColor: '#D1FAE5', // bg-green-100
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    marginBottom: 24, // mb-6
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    textAlign: 'center', // text-center
    color: '#111827', // text-gray-900
    marginBottom: 16, // mb-4
  },
  description: {
    fontSize: 18, // text-lg
    textAlign: 'center', // text-center
    color: '#4B5563', // text-gray-600
    marginBottom: 32, // mb-8
    lineHeight: 24, // leading-6
  },
  deliveryCard: {
    backgroundColor: '#F9FAFB', // bg-gray-50
    borderRadius: 16, // rounded-2xl
    padding: 24, // p-6
    width: '100%', // w-full
    marginBottom: 24, // mb-6
  },
  deliveryLabel: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    textAlign: 'center', // text-center
    color: '#111827', // text-gray-900
    marginBottom: 12, // mb-3
  },
  deliveryTime: {
    fontSize: 30, // text-3xl
    fontWeight: '700', // font-bold
    textAlign: 'center', // text-center
    color: '#094327', // text-dark-green
  },
  trackButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    width: '100%', // w-full
    alignItems: 'center', // items-center
  },
  trackButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
});

export default OnTheWay;
