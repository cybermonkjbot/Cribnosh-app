import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';
import { SvgXml } from 'react-native-svg';
import { usePayments } from '@/hooks/usePayments';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface BalanceTransactionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function BalanceTransactionsSheet({
  isVisible,
  onClose,
}: BalanceTransactionsSheetProps) {
  const insets = useSafeAreaInsets();
  const { getBalanceTransactions } = usePayments();
  const [transactionsData, setTransactionsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load transactions when sheet becomes visible
  useEffect(() => {
    if (isVisible) {
      const loadTransactions = async () => {
        try {
          setIsLoading(true);
          const result = await getBalanceTransactions(1, 50);
          if (result && result.success) {
            setTransactionsData(result);
          } else {
            setTransactionsData(null);
          }
        } catch (error) {
          // Error already handled in hook
          setTransactionsData(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadTransactions();
    }
  }, [isVisible, getBalanceTransactions]);

  const refetch = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const result = await getBalanceTransactions(1, 50);
      if (result && result.success) {
        setTransactionsData(result);
      } else {
        setTransactionsData(null);
      }
    } catch (error) {
      // Error already handled in hook
      setTransactionsData(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [getBalanceTransactions]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, type: string) => {
    // Amount is already in pence, positive for credit, negative for debit
    const isCredit = amount > 0;
    const formatted = (Math.abs(amount) / 100).toFixed(2);
    const sign = isCredit ? '+' : '-';
    return `${sign}£${formatted}`;
  };

  const renderTransaction = ({ item }: { item: any }) => {
    // Amount is positive for credit, negative for debit
    const isCredit = item.amount > 0;
    const amountColor = isCredit ? '#0B9E58' : '#111827';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {formatAmount(item.amount, item.type)}
          </Text>
          <View style={[
            styles.statusBadge,
            item.status === 'completed' && styles.statusCompleted,
            item.status === 'pending' && styles.statusPending,
            item.status === 'failed' && styles.statusFailed,
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No transactions yet</Text>
      <Text style={styles.emptySubtext}>
        Your balance transactions will appear here once you make a top-up or use your balance for an order.
      </Text>
    </View>
  );

  const transactions = transactionsData?.transactions || [];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Balance Transactions</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <SkeletonWithTimeout isLoading={isLoading}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
              </View>
            </SkeletonWithTimeout>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmpty}
              showsVerticalScrollIndicator={false}
              onRefresh={refetch}
              refreshing={isRefreshing}
            />
          )}
        </View>
      </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    flex: 1,
    textAlign: 'left',
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 16,
  },
  transactionInfo: {
    gap: 4,
  },
  transactionDescription: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  transactionDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#111827',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});

