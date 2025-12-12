import { useCallback } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { SupportCase } from '../../types/customer';
import { formatOrderDate } from '../../utils/dateFormat';
import { SkeletonWithTimeout } from './SkeletonWithTimeout';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Message icon SVG
const messageIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 4H2C1.45 4 1 4.45 1 5V15C1 15.55 1.45 16 2 16H6L10 20L14 16H18C18.55 16 19 15.55 19 15V5C19 4.45 18.55 4 18 4Z" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Empty state icon SVG
const emptyIconSVG = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" stroke="#E5E7EB" stroke-width="2"/>
  <path d="M32 24V32M32 40H32.01" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
</svg>`;

interface SupportCasesSheetProps {
  isVisible: boolean;
  onClose: () => void;
  cases: SupportCase[];
  isLoading: boolean;
  onSelectCase: (caseId: string) => void;
  onRefresh?: () => void;
}

export function SupportCasesSheet({
  isVisible,
  onClose,
  cases,
  isLoading,
  onSelectCase,
}: SupportCasesSheetProps) {
  const insets = useSafeAreaInsets();
  const handleCasePress = useCallback((caseId: string) => {
    onSelectCase(caseId);
    onClose();
  }, [onSelectCase, onClose]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
            <Text style={styles.title}>Support Cases</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <SkeletonWithTimeout isLoading={isLoading}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
                <Text style={styles.loadingText}>Loading support cases...</Text>
              </View>
            </SkeletonWithTimeout>
          ) : cases.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SvgXml xml={emptyIconSVG} width={64} height={64} />
              <Text style={styles.emptyTitle}>No open support cases</Text>
              <Text style={styles.emptySubtitle}>
                You don&apos;t have any open support cases at the moment. Start a new chat to get help.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {cases.map((supportCase) => {
                const createdAt = new Date(supportCase.created_at);
                const formattedDate = formatOrderDate(createdAt.getTime());

                return (
                  <TouchableOpacity
                    key={supportCase.id}
                    style={styles.caseItem}
                    onPress={() => handleCasePress(supportCase.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.caseLeft}>
                      <View style={styles.messageIconContainer}>
                        <SvgXml xml={messageIconSVG} width={20} height={20} />
                      </View>
                      <View style={styles.caseContent}>
                        <Text style={styles.caseSubject} numberOfLines={1}>
                          {supportCase.subject}
                        </Text>
                        {supportCase.last_message ? (
                          <Text style={styles.caseMessage} numberOfLines={2}>
                            {supportCase.last_message}
                          </Text>
                        ) : (
                          <Text style={styles.caseMessage} numberOfLines={2}>
                            {supportCase.category}
                          </Text>
                        )}
                        <Text style={styles.caseDate}>{formattedDate}</Text>
                      </View>
                    </View>
                    <View style={styles.caseStatus}>
                      <View style={[
                        styles.statusBadge,
                        supportCase.status === 'open' && styles.statusBadgeOpen,
                        supportCase.status === 'in_progress' && styles.statusBadgeInProgress,
                        supportCase.status === 'resolved' && styles.statusBadgeResolved,
                        supportCase.status === 'closed' && styles.statusBadgeClosed,
                      ]}>
                        <Text style={styles.statusText}>{supportCase.status}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 24,
    backgroundColor: '#FAFFFA',
    marginHorizontal: -16,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    flex: 1,
    textAlign: 'left',
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
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  caseItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  caseLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  messageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  caseContent: {
    flex: 1,
  },
  caseSubject: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  caseMessage: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 4,
  },
  caseDate: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  caseStatus: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeOpen: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeInProgress: {
    backgroundColor: '#DBEAFE',
  },
  statusBadgeResolved: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeClosed: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
});

