import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface BalanceInfoSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function BalanceInfoSheet({
  isVisible,
  onClose,
}: BalanceInfoSheetProps) {
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>What is Cribnosh balance?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.sectionText}>
              Cribnosh balance is a digital wallet that allows you to store funds and use them for orders. It provides a convenient way to manage your payments and streamline your ordering experience.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Quick and easy payments for orders</Text>
              <Text style={styles.bulletPoint}>• Pre-load funds for faster checkout</Text>
              <Text style={styles.bulletPoint}>• Track your spending with transaction history</Text>
              <Text style={styles.bulletPoint}>• Secure and protected payments</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to use</Text>
            <Text style={styles.sectionText}>
              You can top up your balance using any of your saved payment methods. Once funds are added, you can use your balance to pay for orders during checkout. Your balance will be automatically deducted when you select it as your payment method.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <Text style={styles.sectionText}>
              Cribnosh balance is available when you have a debit or credit card as your payment method. It may not be available with certain payment methods like Apple Pay.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <Text style={styles.sectionText}>
              Your balance is securely stored and protected. All transactions are encrypted and monitored for security. You can view your transaction history at any time to keep track of your balance usage.
            </Text>
          </View>
        </ScrollView>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 12,
  },
  sectionText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  bulletList: {
    gap: 8,
  },
  bulletPoint: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
});

