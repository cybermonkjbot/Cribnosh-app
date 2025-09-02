import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Icons
const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const clockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99995 1.69995C11.6415 1.69995 13.2462 2.18694 14.6112 3.09896C15.976 4.01095 17.0403 5.30686 17.6686 6.82342C18.2967 8.34003 18.4606 10.0094 18.1403 11.6194C17.82 13.2294 17.0298 14.7084 15.8691 15.8691C14.7084 17.0298 13.2294 17.82 11.6194 18.1403C10.0094 18.4606 8.34003 18.2967 6.82342 17.6686C5.30686 17.0403 4.01095 15.976 3.09896 14.6112C2.18694 13.2462 1.69995 11.6415 1.69995 9.99995C1.69995 9.54154 2.07156 9.16995 2.52995 9.16995C2.98834 9.16995 3.35995 9.54154 3.35995 9.99995C3.35995 11.3133 3.7497 12.5968 4.47931 13.6887C5.20889 14.7807 6.24566 15.6316 7.45889 16.1341C8.67212 16.6367 10.0073 16.7689 11.2952 16.5127C12.5832 16.2565 13.7668 15.624 14.6954 14.6954C15.624 13.7668 16.2565 12.5832 16.5127 11.2952C16.7689 10.0073 16.6367 8.67212 16.1341 7.45889C15.6316 6.24566 14.7807 5.20889 13.6887 4.47931C12.5973 3.75 11.3143 3.36027 10.0016 3.35995C8.12799 3.36739 6.32976 4.09864 4.98267 5.4009L3.11679 7.26679C2.79265 7.59093 2.26725 7.59093 1.94312 7.26679C1.61898 6.94265 1.61898 6.41725 1.94312 6.09312L3.81872 4.21751L4.14537 3.91598C5.76066 2.49844 7.838 1.7081 9.99671 1.69995H9.99995Z" fill="#8E8E93"/>
<path d="M1.67505 2.50505C1.67505 2.04666 2.04666 1.67505 2.50505 1.67505C2.96344 1.67505 3.33505 2.04666 3.33505 2.50505L3.33505 5.82505L6.65505 5.82505C7.11344 5.82505 7.48505 6.19666 7.48505 6.65505C7.48505 7.11344 7.11344 7.48505 6.65505 7.48505L2.50505 7.48505C2.04666 7.48505 1.67505 7.11344 1.67505 6.65505L1.67505 2.50505Z" fill="#8E8E93"/>
<path d="M9.17993 5.84514C9.17993 5.38674 9.55152 5.01514 10.0099 5.01514C10.4683 5.01514 10.8399 5.38674 10.8399 5.84514L10.8399 9.48203L13.7012 10.9127L13.7749 10.9548C14.1303 11.18 14.2646 11.642 14.0724 12.0264C13.8802 12.4108 13.4299 12.5808 13.0365 12.4316L12.9587 12.3976L9.63867 10.7376C9.35755 10.597 9.17993 10.3095 9.17993 9.99514L9.17993 5.84514Z" fill="#8E8E93"/>
</svg>`;

const applePayIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.31-.38.92-.77 1.53-.64.27.12.51.4.66.69.14.31.19.76.08 1.13-.1.37-.31.69-.62.96-.31.27-.82.49-1.13.38-.27-.12-.51-.4-.66-.69-.14-.31-.19-.76-.08-1.13.1-.37.31-.69.62-.96" fill="#000000"/>
</svg>`;

const cardIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#FF3B30" stroke-width="2"/>
  <path d="M2 10H22" stroke="#FF3B30" stroke-width="2"/>
</svg>`;

const plusIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 11C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13L5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11L19 11Z" fill="#094327"/>
<path d="M11 19L11 5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5L13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19Z" fill="#094327"/>
</svg>`;

const familyIconSVG = `<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_174_1246)">
<path d="M16 21.2285V19.2285C16 18.1676 15.5786 17.1502 14.8284 16.4001C14.0783 15.6499 13.0609 15.2285 12 15.2285H6C4.93913 15.2285 3.92172 15.6499 3.17157 16.4001C2.42143 17.1502 2 18.1676 2 19.2285V21.2285M16 3.35652C16.8578 3.57889 17.6174 4.07978 18.1597 4.78058C18.702 5.48138 18.9962 6.3424 18.9962 7.22852C18.9962 8.11463 18.702 8.97566 18.1597 9.67645C17.6174 10.3773 16.8578 10.8781 16 11.1005M22 21.2285V19.2285C21.9993 18.3422 21.7044 17.4813 21.1614 16.7808C20.6184 16.0804 19.8581 15.5801 19 15.3585M13 7.22852C13 9.43765 11.2091 11.2285 9 11.2285C6.79086 11.2285 5 9.43765 5 7.22852C5 5.01938 6.79086 3.22852 9 3.22852C11.2091 3.22852 13 5.01938 13 7.22852Z" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_174_1246">
<rect width="24" height="24" fill="white" transform="translate(0 0.228516)"/>
</clipPath>
</defs>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('apple-pay');
  const [isAddingCard, setIsAddingCard] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleAddCard = () => {
    Alert.alert(
      'Add Payment Method',
      'This would open the card addition flow. In a real app, this would integrate with your payment processor.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => setIsAddingCard(true) }
      ]
    );
  };

  const handleFamilyProfile = () => {
    Alert.alert(
      'Family Profile',
      'This would open the family profile setup. In a real app, this would allow users to add family members and manage shared payment methods.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Setup', onPress: () => console.log('Opening family profile setup') }
      ]
    );
  };

  const handleBalanceInfo = () => {
    Alert.alert(
      'Cribnosh Balance',
      'Cribnosh balance is a digital wallet that allows you to store funds and use them for orders. It\'s not available with all payment methods.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleBalanceTransactions = () => {
    Alert.alert(
      'Balance Transactions',
      'This would show your balance transaction history. In a real app, this would display a list of all deposits, withdrawals, and usage.',
      [{ text: 'View', onPress: () => console.log('Opening transaction history') }]
      );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Payment'
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
          <Text style={styles.mainTitle}>Payment</Text>
          
          {/* Cribnosh Balance Section */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Cribnosh balance</Text>
              <Text style={styles.balanceAmount}>£0.00</Text>
              <Text style={styles.balanceDescription}>
                Cribnosh balance is not available with this payment method
              </Text>
            </View>
            
            <TouchableOpacity style={styles.balanceItem} onPress={handleBalanceInfo}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <SvgXml xml={checkIconSVG} width={20} height={20} />
                </View>
                <Text style={styles.itemText}>What is Cribnosh balance?</Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.balanceItem} onPress={handleBalanceTransactions}>
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <SvgXml xml={clockIconSVG} width={20} height={20} />
                </View>
                <Text style={styles.itemText}>See balance transactions</Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Payment Methods Section */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment methods</Text>
            
            <View style={styles.paymentMethodsCard}>
              <TouchableOpacity 
                style={styles.paymentMethodItem} 
                onPress={() => handlePaymentMethodSelect('apple-pay')}
                activeOpacity={0.7}
              >
                <View style={styles.methodLeft}>
                  <View style={styles.methodIcon}>
                    <SvgXml xml={applePayIconSVG} width={24} height={24} />
                  </View>
                  <Text style={styles.methodText}>Apple Pay</Text>
                </View>
                <View style={[
                  styles.radioButton, 
                  selectedPaymentMethod === 'apple-pay' && styles.radioButtonSelected
                ]} />
              </TouchableOpacity>
              
              <View style={styles.paymentMethodSeparator} />
              
              <TouchableOpacity 
                style={styles.paymentMethodItem} 
                onPress={() => handlePaymentMethodSelect('card')}
                activeOpacity={0.7}
              >
                <View style={styles.methodLeft}>
                  <View style={styles.methodIcon}>
                    <SvgXml xml={cardIconSVG} width={24} height={24} />
                  </View>
                  <Text style={styles.methodText}>... 8601</Text>
                </View>
                <View style={[
                  styles.radioButton, 
                  selectedPaymentMethod === 'card' && styles.radioButtonSelected
                ]} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addCardItem} 
              onPress={handleAddCard}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <SvgXml xml={plusIconSVG} width={20} height={20} />
                </View>
                <Text style={styles.itemText}>Add debit/credit card</Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>

          {/* Family Profile Section */}
          <View style={styles.familySection}>
            <TouchableOpacity 
              style={styles.familyItem} 
              onPress={handleFamilyProfile}
              activeOpacity={0.7}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <SvgXml xml={familyIconSVG} width={20} height={20} />
                </View>
                <Text style={styles.itemText}>Setup a family profile</Text>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginBottom: 24,
  },
  // Balance Section
  balanceSection: {
    marginBottom: 32,
  },
  balanceCard: {
    backgroundColor: 'rgba(244, 255, 245, 0.79)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
    marginRight: 6,
  },
  statusText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  balanceTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    marginBottom: 8,
  },
  balanceDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Payment Methods Section
  paymentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  paymentMethodsCard: {
    backgroundColor: '#FAFFFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(23, 26, 31, 0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 3,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodSeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    marginRight: 16,
  },
  methodText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioButtonSelected: {
    borderColor: '#0B9E58',
    backgroundColor: '#0B9E58',
  },
  addCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Family Section
  familySection: {
    marginBottom: 32,
  },
  familyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Common Item Styles
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
});
