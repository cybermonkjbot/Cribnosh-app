import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveChatDrawer } from '@/components/ui/LiveChatDrawer';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { CheckCircle, Clock, Filter, HelpCircle, MessageCircle, Plus, Search, Star, X, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SupportCategory = 'order' | 'payment' | 'account' | 'technical' | 'other';
type SupportPriority = 'low' | 'medium' | 'high';
type SupportStatus = 'open' | 'closed' | 'resolved';

export default function SupportScreen() {
  const { chef, user, sessionToken } = useChefAuth();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'other' as SupportCategory,
    priority: 'medium' as SupportPriority,
  });
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SupportCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilterStart, setDateFilterStart] = useState<Date | null>(null);
  const [dateFilterEnd, setDateFilterEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [ratingCaseId, setRatingCaseId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');

  // Get chef's support cases
  const supportCases = useQuery(
    api.queries.supportCases.getByUserId,
    user?._id
      ? { userId: user._id }
      : 'skip'
  ) as any[] | undefined;

  const createSupportCase = useMutation(api.mutations.supportCases.create);
  const rateCase = useMutation(api.mutations.supportCases.rateCase);

  const handleCreateCase = async () => {
    if (!user?._id || !sessionToken) {
      showError('Error', 'User information not available');
      return;
    }

    if (!formData.subject.trim()) {
      showError('Validation Error', 'Subject is required');
      return;
    }

    if (!formData.message.trim()) {
      showError('Validation Error', 'Message is required');
      return;
    }

    setIsCreating(true);
    try {
      await createSupportCase({
        userId: user._id,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        category: formData.category,
        priority: formData.priority,
        attachments: [],
      });

      showSuccess('Support Case Created', 'Your support case has been created. We will get back to you soon!');
      setShowCreateForm(false);
      setFormData({ subject: '', message: '', category: 'other', priority: 'medium' });
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create support case');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: SupportStatus) => {
    switch (status) {
      case 'open':
        return '#FF9800';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: SupportStatus) => {
    switch (status) {
      case 'open':
        return <Clock size={16} color="#FF9800" />;
      case 'resolved':
        return <CheckCircle size={16} color="#4CAF50" />;
      case 'closed':
        return <XCircle size={16} color="#9E9E9E" />;
      default:
        return <HelpCircle size={16} color="#666" />;
    }
  };

  const getCategoryLabel = (category: SupportCategory) => {
    switch (category) {
      case 'order':
        return 'Order';
      case 'payment':
        return 'Payment';
      case 'account':
        return 'Account';
      case 'technical':
        return 'Technical';
      case 'other':
        return 'Other';
      default:
        return category;
    }
  };

  const getPriorityLabel = (priority: SupportPriority) => {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      default:
        return priority;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const openCases = supportCases?.filter(c => c.status === 'open') || [];
  const resolvedCases = supportCases?.filter(c => c.status === 'resolved' || c.status === 'closed') || [];

  // Filter cases for history tab
  const filteredHistoryCases = React.useMemo(() => {
    let filtered = resolvedCases;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.subject?.toLowerCase().includes(query) ||
        c.message?.toLowerCase().includes(query) ||
        c.last_message?.toLowerCase().includes(query) ||
        c.support_reference?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    // Apply date range filter
    if (dateFilterStart) {
      filtered = filtered.filter(c => c.created_at >= dateFilterStart.getTime());
    }
    if (dateFilterEnd) {
      const endTime = dateFilterEnd.getTime() + 24 * 60 * 60 * 1000 - 1; // End of day
      filtered = filtered.filter(c => c.created_at <= endTime);
    }

    return filtered;
  }, [resolvedCases, searchQuery, statusFilter, categoryFilter, dateFilterStart, dateFilterEnd]);

  const handleRateCase = async (caseId: string) => {
    if (ratingValue === 0) {
      showError('Validation Error', 'Please select a rating');
      return;
    }

    try {
      await rateCase({
        caseId: caseId as any,
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      });
      showSuccess('Rating Submitted', 'Thank you for your feedback!');
      setRatingCaseId(null);
      setRatingValue(0);
      setRatingComment('');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to submit rating');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Support & Help</Text>
          {!showCreateForm && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>New Case</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Create Case Form */}
        {showCreateForm && (
          <View style={styles.createCard}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>Create Support Case</Text>
              <TouchableOpacity onPress={() => setShowCreateForm(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="Brief description of your issue"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {(['order', 'payment', 'account', 'technical', 'other'] as SupportCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      formData.category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {getCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Priority *</Text>
              <View style={styles.priorityButtons}>
                {(['low', 'medium', 'high'] as SupportPriority[]).map((pri) => (
                  <TouchableOpacity
                    key={pri}
                    style={[
                      styles.priorityButton,
                      formData.priority === pri && styles.priorityButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, priority: pri })}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        formData.priority === pri && styles.priorityButtonTextActive,
                      ]}
                    >
                      {getPriorityLabel(pri)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Describe your issue in detail..."
                multiline
                numberOfLines={6}
              />
            </View>

            <Button
              onPress={handleCreateCase}
              disabled={isCreating || !formData.subject.trim() || !formData.message.trim()}
              loading={isCreating}
              style={styles.submitButton}
            >
              Submit Support Case
            </Button>
          </View>
        )}

        {/* Quick Help */}
        {!showCreateForm && (
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <HelpCircle size={24} color="#007AFF" />
              <Text style={styles.helpTitle}>Quick Help</Text>
            </View>
            <Text style={styles.helpText}>
              Need help? Create a support case and our team will assist you. For urgent matters, select "High" priority.
            </Text>
          </View>
        )}

        {/* Tabs */}
        {!showCreateForm && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'open' && styles.tabActive]}
              onPress={() => setActiveTab('open')}
            >
              <Text style={[styles.tabText, activeTab === 'open' && styles.tabTextActive]}>
                Open ({openCases.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                History ({resolvedCases.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search and Filters for History */}
        {!showCreateForm && activeTab === 'history' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search history..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} color="#007AFF" />
              <Text style={styles.filterButtonText}>Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Options */}
        {!showCreateForm && activeTab === 'history' && showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {(['all', 'resolved', 'closed'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                {(['all', 'order', 'payment', 'account', 'technical', 'other'] as const).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.filterChip, categoryFilter === category && styles.filterChipActive]}
                    onPress={() => setCategoryFilter(category)}
                  >
                    <Text style={[styles.filterChipText, categoryFilter === category && styles.filterChipTextActive]}>
                      {category === 'all' ? 'All' : getCategoryLabel(category)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <View style={styles.dateFilterRow}>
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Text style={styles.dateFilterText}>
                    {dateFilterStart ? formatDate(dateFilterStart.getTime()) : 'Start Date'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.dateFilterSeparator}>to</Text>
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowDatePicker('end')}
                >
                  <Text style={styles.dateFilterText}>
                    {dateFilterEnd ? formatDate(dateFilterEnd.getTime()) : 'End Date'}
                  </Text>
                </TouchableOpacity>
                {(dateFilterStart || dateFilterEnd) && (
                  <TouchableOpacity
                    style={styles.dateFilterClear}
                    onPress={() => {
                      setDateFilterStart(null);
                      setDateFilterEnd(null);
                    }}
                  >
                    <X size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Open Cases */}
        {!showCreateForm && activeTab === 'open' && openCases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Cases ({openCases.length})</Text>
            {openCases.map((supportCase: any) => (
              <View key={supportCase._id} style={styles.caseCard}>
                <View style={styles.caseHeader}>
                  <View style={styles.caseTitleRow}>
                    <Text style={styles.caseSubject}>{supportCase.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supportCase.status) + '20' }]}>
                      {getStatusIcon(supportCase.status)}
                      <Text style={[styles.statusText, { color: getStatusColor(supportCase.status) }]}>
                        {supportCase.status.charAt(0).toUpperCase() + supportCase.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.caseReference}>Ref: {supportCase.support_reference}</Text>
                </View>
                <Text style={styles.caseMessage} numberOfLines={2}>
                  {supportCase.last_message || supportCase.message}
                </Text>
                <View style={styles.caseFooter}>
                  <View style={styles.caseMeta}>
                    <Text style={styles.caseCategory}>{getCategoryLabel(supportCase.category)}</Text>
                    <Text style={styles.caseSeparator}>•</Text>
                    <Text style={styles.casePriority}>{getPriorityLabel(supportCase.priority)} Priority</Text>
                  </View>
                  <Text style={styles.caseDate}>{formatDate(supportCase.created_at)}</Text>
                </View>
                {supportCase.chat_id && (
                  <Button
                    variant="outline"
                    onPress={() => {
                      setSelectedCaseId(supportCase._id);
                      setIsChatVisible(true);
                    }}
                    style={styles.chatButton}
                  >
                    <MessageCircle size={16} color="#007AFF" />
                    <Text style={styles.chatButtonText}>Open Chat</Text>
                  </Button>
                )}
              </View>
            ))}
          </View>
        )}

        {/* History Cases */}
        {!showCreateForm && activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              History {filteredHistoryCases.length !== resolvedCases.length
                ? `(${filteredHistoryCases.length} of ${resolvedCases.length})`
                : `(${resolvedCases.length})`}
            </Text>
            {filteredHistoryCases.length === 0 ? (
              <View style={styles.emptyHistoryContainer}>
                <Text style={styles.emptyHistoryText}>
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dateFilterStart || dateFilterEnd
                    ? 'No cases match your filters'
                    : 'No resolved cases yet'}
                </Text>
              </View>
            ) : (
              filteredHistoryCases.map((supportCase: any) => (
                <View key={supportCase._id} style={styles.caseCard}>
                  <View style={styles.caseHeader}>
                    <View style={styles.caseTitleRow}>
                      <Text style={styles.caseSubject}>{supportCase.subject}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supportCase.status) + '20' }]}>
                        {getStatusIcon(supportCase.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(supportCase.status) }]}>
                          {supportCase.status.charAt(0).toUpperCase() + supportCase.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.caseReference}>Ref: {supportCase.support_reference}</Text>
                  </View>
                  <Text style={styles.caseMessage} numberOfLines={2}>
                    {supportCase.last_message || supportCase.message}
                  </Text>
                  <View style={styles.caseFooter}>
                    <View style={styles.caseMeta}>
                      <Text style={styles.caseCategory}>{getCategoryLabel(supportCase.category)}</Text>
                      <Text style={styles.caseSeparator}>•</Text>
                      <Text style={styles.casePriority}>{getPriorityLabel(supportCase.priority)} Priority</Text>
                    </View>
                    <Text style={styles.caseDate}>{formatDate(supportCase.created_at)}</Text>
                  </View>
                  {supportCase.resolved_at && (
                    <View style={styles.resolutionInfo}>
                      <CheckCircle size={14} color="#4CAF50" />
                      <Text style={styles.resolutionText}>
                        Resolved {formatDate(supportCase.resolved_at)}
                      </Text>
                    </View>
                  )}
                  {supportCase.rating ? (
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingLabel}>Your Rating:</Text>
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            color={star <= supportCase.rating ? '#FFB800' : '#E5E7EB'}
                            fill={star <= supportCase.rating ? '#FFB800' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actionButtons}>
                      <Button
                        variant="outline"
                        onPress={() => {
                          setSelectedCaseId(supportCase._id);
                          setIsChatVisible(true);
                        }}
                        style={styles.chatButton}
                      >
                        <MessageCircle size={16} color="#007AFF" />
                        <Text style={styles.chatButtonText}>View Chat</Text>
                      </Button>
                      <Button
                        variant="outline"
                        onPress={() => {
                          setRatingCaseId(supportCase._id);
                          setRatingValue(0);
                          setRatingComment('');
                        }}
                        style={styles.rateButton}
                      >
                        <Star size={16} color="#FFB800" />
                        <Text style={styles.rateButtonText}>Rate</Text>
                      </Button>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Empty State */}
        {!showCreateForm && (!supportCases || supportCases.length === 0) && activeTab === 'open' && (
          <EmptyState
            title="No support cases yet"
            subtitle="If you need help, create a new support case and our team will assist you."
            icon="chatbubbles-outline"
            actionButton={{
              label: 'Create Support Case',
              onPress: () => setShowCreateForm(true)
            }}
            style={{ paddingVertical: 40 }}
          />
        )}
      </ScrollView>

      {/* Live Chat Drawer */}
      <LiveChatDrawer
        isVisible={isChatVisible}
        onClose={() => {
          setIsChatVisible(false);
          setSelectedCaseId(null);
        }}
        caseId={selectedCaseId || undefined}
      />

      {/* Rating Modal */}
      <Modal
        visible={ratingCaseId !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRatingCaseId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Support Case</Text>
              <TouchableOpacity onPress={() => setRatingCaseId(null)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>How would you rate your support experience?</Text>
            <View style={styles.ratingStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingValue(star)}
                  style={styles.ratingStarButton}
                >
                  <Star
                    size={40}
                    color={star <= ratingValue ? '#FFB800' : '#E5E7EB'}
                    fill={star <= ratingValue ? '#FFB800' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.commentLabel}>Optional Comment</Text>
            <TextInput
              style={styles.commentInput}
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Share your feedback..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => {
                  setRatingCaseId(null);
                  setRatingValue(0);
                  setRatingComment('');
                }}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
              <Button
                onPress={() => ratingCaseId && handleRateCase(ratingCaseId)}
                disabled={ratingValue === 0}
                style={styles.modalSubmitButton}
              >
                Submit Rating
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start'
            ? (dateFilterStart || new Date())
            : (dateFilterEnd || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(null);
            }
            if (selectedDate) {
              if (showDatePicker === 'start') {
                setDateFilterStart(selectedDate);
              } else {
                setDateFilterEnd(selectedDate);
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
                    setDateFilterStart(new Date());
                  } else {
                    setDateFilterEnd(new Date());
                  }
                  setShowDatePicker(null);
                }}
              >
                <Text style={styles.datePickerModalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={showDatePicker === 'start'
                ? (dateFilterStart || new Date())
                : (dateFilterEnd || new Date())}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  if (showDatePicker === 'start') {
                    setDateFilterStart(selectedDate);
                  } else {
                    setDateFilterEnd(selectedDate);
                  }
                }
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createCard: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priorityButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    marginTop: 8,
  },
  helpCard: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  caseCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  caseHeader: {
    marginBottom: 8,
  },
  caseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  caseSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  caseReference: {
    fontSize: 12,
    color: '#999',
  },
  caseMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caseCategory: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  caseSeparator: {
    fontSize: 12,
    color: '#999',
  },
  casePriority: {
    fontSize: 12,
    color: '#666',
  },
  caseDate: {
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatButtonText: {
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Inter',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    fontFamily: 'Inter',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyHistoryContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  resolutionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resolutionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Inter',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  ratingStarButton: {
    padding: 4,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSubmitButton: {
    flex: 1,
  },
  // Date Filter Styles
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateFilterText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter',
  },
  dateFilterSeparator: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  dateFilterClear: {
    padding: 8,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateButtonText: {
    marginLeft: 4,
  },
  // Date Picker Modal Styles
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerModalCancel: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Inter',
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter',
  },
  datePickerModalDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

