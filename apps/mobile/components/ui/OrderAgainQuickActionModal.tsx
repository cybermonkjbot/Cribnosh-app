import { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { BlurEffect } from '@/utils/blurEffects';

interface OrderAgainQuickActionModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    price: string;
    image: string;
    lastOrderId?: string | null;
  } | null;
  onAddItem: (itemId: string) => Promise<void>;
  onAddEntireOrder: (orderId: string) => Promise<void>;
}

export function OrderAgainQuickActionModal({
  isVisible,
  onClose,
  item,
  onAddItem,
  onAddEntireOrder,
}: OrderAgainQuickActionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAddItem = useCallback(async () => {
    if (!item || isLoading) return;
    
    try {
      setIsLoading(true);
      setLoadingAction('add-item');
      await onAddItem(item.id);
      onClose();
    } catch (error) {
      // Error handling is done in the callback
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [item, onAddItem, onClose, isLoading]);

  const handleAddEntireOrder = useCallback(async () => {
    if (!item?.lastOrderId || isLoading) return;
    
    try {
      setIsLoading(true);
      setLoadingAction('add-order');
      await onAddEntireOrder(item.lastOrderId);
      onClose();
    } catch (error) {
      // Error handling is done in the callback
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }, [item, onAddEntireOrder, onClose, isLoading]);

  if (!isVisible || !item) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Blur Background */}
        <View style={StyleSheet.absoluteFill}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <BlurEffect
              intensity={80}
              tint="light"
              useGradient={true}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>

        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Order Again</Text>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeButton} 
                disabled={isLoading}
              >
                <X size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Item Info - Centered */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleAddItem}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {loadingAction === 'add-item' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Add just this item</Text>
                )}
              </TouchableOpacity>

              {item.lastOrderId && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleAddEntireOrder}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {loadingAction === 'add-order' ? (
                    <ActivityIndicator color="#ff3b30" size="small" />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Add entire last order</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  itemInfo: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
  },
  itemName: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  itemPrice: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#111827',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#ff3b30',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});

