import { Avatar } from '@/components/ui/Avatar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroupOrders } from '@/hooks/useGroupOrders';
import { useAuthState } from '@/hooks/useAuthState';
import { useEffect, useState } from 'react';

export default function ParticipantSelectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ group_order_id?: string; participant_id?: string }>();
  const { user } = useAuthState();
  const groupOrderId = params.group_order_id || '';
  const participantId = params.participant_id || '';
  const { getParticipantSelections, getGroupOrder } = useGroupOrders();
  
  const [selectionsData, setSelectionsData] = useState<any>(null);
  const [groupOrderData, setGroupOrderData] = useState<any>(null);
  const [isLoadingSelections, setIsLoadingSelections] = useState(false);
  
  useEffect(() => {
    if (groupOrderId && participantId) {
      loadData();
    }
  }, [groupOrderId, participantId]);
  
  const loadData = async () => {
    try {
      setIsLoadingSelections(true);
      const [selectionsResult, orderResult] = await Promise.all([
        getParticipantSelections(groupOrderId, participantId),
        getGroupOrder(groupOrderId),
      ]);
      if (selectionsResult.success && selectionsResult.data?.selections) {
        setSelectionsData({ success: true, data: { selections: selectionsResult.data.selections } });
      }
      if (orderResult.success) {
        setGroupOrderData({ success: true, data: orderResult });
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsLoadingSelections(false);
    }
  };
  
  const groupOrder = groupOrderData?.data;
  const selections = selectionsData?.data?.selections?.[0];
  
  // Find participant details
  const participant = groupOrder?.participants?.find(
    (p: any) => p.user_id === participantId
  );
  
  if (isLoadingSelections) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading selections...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!selections || !participant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#E6FFE8" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Participant Selections</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No selections found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const isCurrentUser = participant.user_id === user?.user_id;
  const displayName = isCurrentUser ? 'You' : participant.user_name;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color="#E6FFE8" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayName}&apos;s Selections</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Participant Info */}
        <View style={styles.participantInfo}>
          <Avatar
            source={participant.avatar_url ? { uri: participant.avatar_url } : undefined}
            size="lg"
            initials={participant.user_initials || participant.user_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          />
          <Text style={styles.participantName}>{displayName}</Text>
          <Text style={styles.statusText}>
            {participant.selection_status === 'ready' ? 'Ready' : 'Not Ready'}
          </Text>
          {participant.budget_contribution > 0 && (
            <Text style={styles.budgetText}>
              Contributed: £{participant.budget_contribution.toFixed(2)}
            </Text>
          )}
        </View>
        
        {/* Selections */}
        {selections.order_items && selections.order_items.length > 0 ? (
          <View style={styles.selectionsContainer}>
            <Text style={styles.sectionTitle}>Selected Items</Text>
            {selections.order_items.map((item: any, index: number) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>£{item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                {item.special_instructions && (
                  <Text style={styles.itemInstructions}>
                    Note: {item.special_instructions}
                  </Text>
                )}
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalLabel}>Subtotal:</Text>
                  <Text style={styles.itemTotalAmount}>
                    £{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Contribution:</Text>
              <Text style={styles.totalAmount}>£{selections.total_contribution.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items selected yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#E6FFE8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  participantInfo: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: 'rgba(230, 255, 232, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.1)',
  },
  participantName: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#E6FFE8',
    fontSize: 16,
    marginBottom: 8,
  },
  budgetText: {
    color: '#EAEAEA',
    fontSize: 14,
    opacity: 0.8,
  },
  selectionsContainer: {
    gap: 16,
  },
  sectionTitle: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.1)',
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: '#E6FFE8',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  itemPrice: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  itemQuantity: {
    color: '#EAEAEA',
    fontSize: 14,
  },
  itemInstructions: {
    color: '#EAEAEA',
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 255, 232, 0.1)',
  },
  itemTotalLabel: {
    color: '#EAEAEA',
    fontSize: 14,
  },
  itemTotalAmount: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    marginTop: 8,
  },
  totalLabel: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
  },
  totalAmount: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#EAEAEA',
    fontSize: 16,
    opacity: 0.8,
  },
});

