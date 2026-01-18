import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { PersistentBottomSheet } from './PersistentBottomSheet';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export interface Bank {
  _id: string;
  name: string;
  code: string;
  shortCode?: string;
}

interface BankPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  banks: Bank[] | undefined | null;
  selectedBankCode?: string | null;
  onSelect: (bankCode: string, bankName: string) => void;
}

export function BankPickerSheet({
  visible,
  onClose,
  banks,
  selectedBankCode,
  onSelect
}: BankPickerSheetProps) {
  return (
    <PersistentBottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Bank"
      height="70%"
    >
      <ThemedView style={styles.container}>
        <FlatList
          data={(Array.isArray(banks) ? banks : []) as Bank[]}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const isSelected = item.code === selectedBankCode;

            return (
              <TouchableOpacity
                style={[styles.bankRow, isSelected && styles.bankRowSelected]}
                onPress={() => {
                  onSelect(item.code, item.name);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name} bank`}
              >
                <View style={styles.icon}>
                  <Ionicons name="business-outline" size={20} color={Colors.light.primary} />
                </View>
                <View style={styles.bankInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.bankTitle}>
                    {item.name}
                  </ThemedText>
                  {item.shortCode && (
                    <ThemedText style={styles.bankSubtitle}>{item.shortCode}</ThemedText>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.light.primary} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={32} color={Colors.light.icon} />
              <ThemedText style={styles.emptyText}>No banks found</ThemedText>
            </View>
          )}
        />
      </ThemedView>
    </PersistentBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  bankRowSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankTitle: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 2,
  },
  bankSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  separator: {
    height: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: Colors.light.icon,
  },
});

