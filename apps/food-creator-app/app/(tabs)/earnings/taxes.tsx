import { GradientBackground } from '@/components/ui/GradientBackground';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Calendar, Download } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TaxesScreen() {
  const { foodCreator, sessionToken } = useFoodCreatorAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTaxYear, setSelectedTaxYear] = useState<number | null>(null);

  const availableTaxYears = useQuery(
    api.queries.chefTax.getAvailableTaxYears,
    foodCreator?._id && sessionToken
      ? { foodCreatorId: foodCreator._id, sessionToken }
      : 'skip'
  );

  const taxYearSummary = useQuery(
    api.queries.chefTax.getTaxYearSummary,
    foodCreator?._id && sessionToken && selectedTaxYear
      ? { foodCreatorId: foodCreator._id, taxYear: selectedTaxYear, sessionToken }
      : 'skip'
  );

  // Set default tax year to current year if available
  React.useEffect(() => {
    if (availableTaxYears && availableTaxYears.length > 0 && !selectedTaxYear) {
      setSelectedTaxYear(availableTaxYears[0]);
    }
  }, [availableTaxYears, selectedTaxYear]);

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const handleGeneratePDF = async () => {
    if (!taxYearSummary) {
      Alert.alert('No Data', 'Please select a tax year first');
      return;
    }

    try {
      // Generate tax document content
      const taxYear = taxYearSummary.taxYear;
      const startDate = new Date(taxYearSummary.startDate).toLocaleDateString('en-GB');
      const endDate = new Date(taxYearSummary.endDate).toLocaleDateString('en-GB');

      let content = `TAX YEAR SUMMARY ${taxYear}-${taxYear + 1}\n`;
      content += `Period: ${startDate} to ${endDate}\n\n`;
      content += `TOTAL EARNINGS: ${formatAmount(taxYearSummary.totalEarnings)}\n`;
      content += `PLATFORM FEES: ${formatAmount(taxYearSummary.totalPlatformFees)}\n`;
      content += `REFUNDS: ${formatAmount(taxYearSummary.totalRefunds)}\n`;
      content += `NET EARNINGS: ${formatAmount(taxYearSummary.netEarnings)}\n`;
      content += `TOTAL PAYOUTS: ${formatAmount(taxYearSummary.totalPayouts)}\n\n`;
      content += `MONTHLY BREAKDOWN:\n`;
      content += `----------------------------------------\n`;

      taxYearSummary.monthlyBreakdown.forEach((month: any) => {
        content += `${formatMonth(month.month)}:\n`;
        content += `  Earnings: ${formatAmount(month.earnings)}\n`;
        content += `  Fees: ${formatAmount(month.fees)}\n`;
        content += `  Net: ${formatAmount(month.net)}\n\n`;
      });

      // Save to file
      const fileName = `tax_summary_${taxYear}_${taxYear + 1}.txt`;
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: (FileSystem as any).EncodingType.UTF8,
      });

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Tax Summary',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${fileUri}`);
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Failed to generate tax document');
    }
  };

  if (!foodCreator) {
    return (
      <GradientBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#0B9E58" />
          <Text style={styles.loadingText}>Loading tax information...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#094327" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Tax Information</Text>
          </View>
          <TouchableOpacity onPress={handleGeneratePDF} style={styles.exportButton}>
            <Download size={20} color="#094327" />
          </TouchableOpacity>
        </View>

        {/* Tax Year Selector */}
        {availableTaxYears && availableTaxYears.length > 0 && (
          <View style={styles.taxYearSelector}>
            <Calendar size={20} color="#094327" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.taxYearScroll}
              contentContainerStyle={styles.taxYearContent}
            >
              {availableTaxYears.map((year: number) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.taxYearButton,
                    selectedTaxYear === year && styles.taxYearButtonActive
                  ]}
                  onPress={() => setSelectedTaxYear(year)}
                >
                  <Text
                    style={[
                      styles.taxYearButtonText,
                      selectedTaxYear === year && styles.taxYearButtonTextActive
                    ]}
                  >
                    {year}-{year + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tax Summary */}
        {taxYearSummary === undefined ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0B9E58" />
            <Text style={styles.loadingText}>Loading tax summary...</Text>
          </View>
        ) : taxYearSummary ? (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Earnings</Text>
                <Text style={styles.summaryValue}>
                  {formatAmount(taxYearSummary.totalEarnings)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Platform Fees</Text>
                <Text style={[styles.summaryValue, styles.summaryValueNegative]}>
                  -{formatAmount(taxYearSummary.totalPlatformFees)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Refunds</Text>
                <Text style={[styles.summaryValue, styles.summaryValueNegative]}>
                  -{formatAmount(taxYearSummary.totalRefunds)}
                </Text>
              </View>
              <View style={[styles.summaryCard, styles.summaryCardHighlight]}>
                <Text style={styles.summaryLabel}>Net Earnings</Text>
                <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
                  {formatAmount(taxYearSummary.netEarnings)}
                </Text>
              </View>
            </View>

            {/* Monthly Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
              {taxYearSummary.monthlyBreakdown.map((month: any) => (
                <View key={month.month} style={styles.monthCard}>
                  <Text style={styles.monthTitle}>{formatMonth(month.month)}</Text>
                  <View style={styles.monthDetails}>
                    <View style={styles.monthDetailRow}>
                      <Text style={styles.monthDetailLabel}>Earnings:</Text>
                      <Text style={styles.monthDetailValue}>
                        {formatAmount(month.earnings)}
                      </Text>
                    </View>
                    <View style={styles.monthDetailRow}>
                      <Text style={styles.monthDetailLabel}>Fees:</Text>
                      <Text style={[styles.monthDetailValue, styles.monthDetailValueNegative]}>
                        -{formatAmount(month.fees)}
                      </Text>
                    </View>
                    <View style={[styles.monthDetailRow, styles.monthDetailRowTotal]}>
                      <Text style={styles.monthDetailLabel}>Net:</Text>
                      <Text style={[styles.monthDetailValue, styles.monthDetailValueTotal]}>
                        {formatAmount(month.net)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Tax Year Information</Text>
              <Text style={styles.infoText}>
                UK tax year runs from April 6 to April 5. This summary covers the period from{' '}
                {new Date(taxYearSummary.startDate).toLocaleDateString('en-GB')} to{' '}
                {new Date(taxYearSummary.endDate).toLocaleDateString('en-GB')}.
              </Text>
              <Text style={styles.infoText}>
                You can download this summary as a text file for your records or to share with your accountant.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Tax Data Available</Text>
            <Text style={styles.emptyText}>
              Tax information will appear here once you have earnings for the selected tax year.
            </Text>
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
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
  },
  exportButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxYearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  taxYearScroll: {
    flex: 1,
  },
  taxYearContent: {
    gap: 8,
  },
  taxYearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  taxYearButtonActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  taxYearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  taxYearButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryCardHighlight: {
    borderColor: '#094327',
    borderWidth: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B9E58',
    fontFamily: 'Inter',
  },
  summaryValueNegative: {
    color: '#EF4444',
  },
  summaryValueHighlight: {
    color: '#094327',
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  monthDetails: {
    gap: 8,
  },
  monthDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthDetailRowTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  monthDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  monthDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B9E58',
    fontFamily: 'Inter',
  },
  monthDetailValueNegative: {
    color: '#EF4444',
  },
  monthDetailValueTotal: {
    fontSize: 16,
    color: '#094327',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter',
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
});

