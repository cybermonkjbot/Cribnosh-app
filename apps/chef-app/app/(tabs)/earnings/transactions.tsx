import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft, Search, Download, Filter, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type TransactionType = 'all' | 'earning' | 'payout' | 'fee' | 'refund';

export default function TransactionsScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const transactionsData = useQuery(
    api.queries.chefTransactions.getByChefId,
    chef?._id && sessionToken
      ? {
          chefId: chef._id,
          sessionToken,
          type: typeFilter === 'all' ? undefined : typeFilter,
          startDate: startDate ? startDate.getTime() : undefined,
          endDate: endDate ? endDate.getTime() : undefined,
          limit,
          offset,
        }
      : 'skip'
  );

  const typeCounts = useQuery(
    api.queries.chefTransactions.getCountByType,
    chef?._id && sessionToken
      ? { chefId: chef._id, sessionToken }
      : 'skip'
  );

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}£${Math.abs(amount / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earning':
        return 'Earning';
      case 'payout':
        return 'Payout';
      case 'fee':
        return 'Fee';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earning':
        return '#0B9E58';
      case 'payout':
        return '#007AFF';
      case 'fee':
        return '#FF9800';
      case 'refund':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#0B9E58';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const filteredTransactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];
    
    let filtered = transactionsData.transactions;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(query) ||
        tx.reference?.toLowerCase().includes(query) ||
        tx.order_id?.toString().toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [transactionsData?.transactions, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = async () => {
    if (!transactionsData?.transactions || transactionsData.transactions.length === 0) {
      Alert.alert('No Data', 'No transactions to export');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Date', 'Type', 'Amount', 'Description', 'Status', 'Order ID', 'Reference'];
      const rows = filteredTransactions.map(tx => [
        formatDate(tx.createdAt),
        getTypeLabel(tx.type),
        formatAmount(tx.amount),
        tx.description,
        tx.status,
        tx.order_id || '',
        tx.reference || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Save to file
      const fileName = `transactions_${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Failed to export transactions');
    }
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (!chef) {
    return (
      <View style={styles.mainContainer}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#0B9E58" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#094327" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Transactions</Text>
          </View>
          <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
            <Download size={20} color="#094327" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            onPress={() => setTypeFilter('all')}
            style={[styles.filterChip, typeFilter === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, typeFilter === 'all' && styles.filterTextActive]}>
              All ({typeCounts?.all || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTypeFilter('earning')}
            style={[styles.filterChip, typeFilter === 'earning' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, typeFilter === 'earning' && styles.filterTextActive]}>
              Earnings ({typeCounts?.earning || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTypeFilter('payout')}
            style={[styles.filterChip, typeFilter === 'payout' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, typeFilter === 'payout' && styles.filterTextActive]}>
              Payouts ({typeCounts?.payout || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTypeFilter('fee')}
            style={[styles.filterChip, typeFilter === 'fee' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, typeFilter === 'fee' && styles.filterTextActive]}>
              Fees ({typeCounts?.fee || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTypeFilter('refund')}
            style={[styles.filterChip, typeFilter === 'refund' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, typeFilter === 'refund' && styles.filterTextActive]}>
              Refunds ({typeCounts?.refund || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Date Range Filters */}
        <View style={styles.dateFilterContainer}>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('start')}
            >
              <Filter size={16} color="#094327" />
              <Text style={styles.dateButtonText}>
                {startDate ? startDate.toLocaleDateString('en-GB') : 'Start Date'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>to</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker('end')}
            >
              <Filter size={16} color="#094327" />
              <Text style={styles.dateButtonText}>
                {endDate ? endDate.toLocaleDateString('en-GB') : 'End Date'}
              </Text>
            </TouchableOpacity>
            {(startDate || endDate) && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={handleClearDates}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Transactions List */}
        {transactionsData === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0B9E58" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || startDate || endDate || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Your transaction history will appear here'}
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <View key={transaction._id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: getTypeColor(transaction.type) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: getTypeColor(transaction.type) },
                        ]}
                      >
                        {getTypeLabel(transaction.type)}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(transaction.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.amountText,
                      { color: transaction.amount >= 0 ? '#0B9E58' : '#EF4444' },
                    ]}
                  >
                    {formatAmount(transaction.amount)}
                  </Text>
                </View>
                <Text style={styles.descriptionText}>{transaction.description}</Text>
                <View style={styles.transactionFooter}>
                  <Text style={styles.dateText}>{formatDate(transaction.createdAt)}</Text>
                  {transaction.order_id && (
                    <Text style={styles.orderIdText}>Order: {transaction.order_id}</Text>
                  )}
                </View>
                {transaction.reference && (
                  <Text style={styles.referenceText}>Ref: {transaction.reference}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Load More */}
        {transactionsData?.hasMore && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setOffset(offset + limit)}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? (startDate || new Date()) : (endDate || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(null);
            }
            if (selectedDate) {
              if (showDatePicker === 'start') {
                setStartDate(selectedDate);
              } else {
                setEndDate(selectedDate);
              }
              if (Platform.OS === 'ios') {
                setShowDatePicker(null);
              }
            }
          }}
          onTouchCancel={() => setShowDatePicker(null)}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerModalHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                <Text style={styles.datePickerModalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerModalTitle}>
                Select {showDatePicker === 'start' ? 'Start' : 'End'} Date
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (showDatePicker === 'start') {
                    setStartDate(new Date());
                  } else {
                    setEndDate(new Date());
                  }
                  setShowDatePicker(null);
                }}
              >
                <Text style={styles.datePickerModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={showDatePicker === 'start' ? (startDate || new Date()) : (endDate || new Date())}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  if (showDatePicker === 'start') {
                    setStartDate(selectedDate);
                  } else {
                    setEndDate(selectedDate);
                  }
                }
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#031D11',
    fontFamily: 'Inter',
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateFilterContainer: {
    marginBottom: 20,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
  },
  dateSeparator: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  clearDateButton: {
    padding: 8,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
    textTransform: 'capitalize',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  descriptionText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  orderIdText: {
    fontSize: 12,
    color: '#094327',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  referenceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  loadMoreButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
  datePickerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  datePickerModalCancel: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  datePickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
});

