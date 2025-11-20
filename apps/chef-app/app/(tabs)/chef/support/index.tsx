import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LiveChatDrawer } from '@/components/ui/LiveChatDrawer';
import { MessageCircle, Plus, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react-native';

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

  // Get chef's support cases
  const supportCases = useQuery(
    api.queries.supportCases.getByUserId,
    user?._id
      ? { userId: user._id }
      : 'skip'
  ) as any[] | undefined;

  const createSupportCase = useMutation(api.mutations.supportCases.create);

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
              isLoading={isCreating}
              style={styles.submitButton}
            >
              Submit Support Case
            </Button>
          </View>
        )}

        {/* Quick Help */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <HelpCircle size={24} color="#007AFF" />
            <Text style={styles.helpTitle}>Quick Help</Text>
          </View>
          <Text style={styles.helpText}>
            Need help? Create a support case and our team will assist you. For urgent matters, select "High" priority.
          </Text>
        </View>

        {/* Open Cases */}
        {openCases.length > 0 && (
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

        {/* Resolved Cases */}
        {resolvedCases.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolved Cases ({resolvedCases.length})</Text>
            {resolvedCases.slice(0, 5).map((supportCase: any) => (
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
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!showCreateForm && (!supportCases || supportCases.length === 0) && (
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
});

