import { useCallback, useState } from 'react';
import {
  Image,
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
import { Ionicons } from '@expo/vector-icons';

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
  onViewDetails: (itemId: string) => void;
}

export function OrderAgainQuickActionModal({
  isVisible,
  onClose,
  item,
  onAddItem,
  onAddEntireOrder,
  onViewDetails,
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

  const handleViewDetails = useCallback(() => {
    if (!item || isLoading) return;
    onViewDetails(item.id);
    onClose();
  }, [item, onViewDetails, onClose, isLoading]);

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
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Item Info */}
            <View style={styles.itemInfo}>
              <Image
                source={{ uri: item.image }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
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
                  <>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Add just this item</Text>
                  </>
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
                    <ActivityIndicator color="#094327" size="small" />
                  ) : (
                    <>
                      <Ionicons name="receipt-outline" size={20} color="#094327" />
                      <Text style={styles.secondaryButtonText}>Add entire last order</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleViewDetails}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.tertiaryButtonText}>View Details</Text>
              </TouchableOpacity>
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
    backgroundColor: '#FAFFFA',
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
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#111827',
    marginBottom: 6,
  },
  itemPrice: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#094327',
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
    backgroundColor: '#094327',
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  secondaryButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#094327',
  },
  secondaryButtonText: {
    fontFamily: 'Inter',
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    fontFamily: 'Inter',
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
});

