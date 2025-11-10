import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// TODO: Use API endpoint for help/FAQs when available
import { Colors } from '../constants/Colors';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { logger } from '../utils/Logger';

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Fetch driver FAQs from backend
  // TODO: Use API endpoint for help/FAQs when available
  const faqItems = null as any;

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (faqItems === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Help & Support</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ gap: 12 }}>
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact our support team:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => {
            Linking.openURL('mailto:support@cribnosh.com?subject=Driver Support Request');
          }
        },
        {
          text: 'Phone',
          onPress: () => {
            Linking.openURL('tel:+2348001234567');
          }
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            Linking.openURL('https://wa.me/2348001234567');
          }
        }
      ]
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'What type of issue would you like to report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'App Bug',
          onPress: () => {
            logger.info('User reported app bug');
            Alert.alert('Bug Report', 'Thank you for reporting this bug. Our team will investigate and fix it as soon as possible.');
          }
        },
        {
          text: 'Payment Issue',
          onPress: () => {
            logger.info('User reported payment issue');
            Alert.alert('Payment Issue', 'We will investigate this payment issue and get back to you within 24 hours.');
          }
        },
        {
          text: 'Order Problem',
          onPress: () => {
            logger.info('User reported order problem');
            Alert.alert('Order Problem', 'We will look into this order issue and contact you with a resolution.');
          }
        },
        {
          text: 'Other',
          onPress: () => {
            logger.info('User reported other issue');
            Alert.alert('Other Issue', 'Please contact our support team directly for assistance with this issue.');
          }
        }
      ]
    );
  };

  const handleFaqToggle = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const quickActions = [
    {
      id: 'contact',
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: 'headset' as const,
      action: handleContactSupport,
    },
    {
      id: 'report',
      title: 'Report Issue',
      description: 'Report bugs or problems',
      icon: 'bug' as const,
      action: handleReportIssue,
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      description: 'Share your suggestions',
      icon: 'chatbubble' as const,
      action: () => {
        Alert.alert('Feedback', 'Thank you for your interest in providing feedback. Please contact support to share your suggestions.');
      },
    },
    {
      id: 'tutorial',
      title: 'App Tutorial',
      description: 'Learn how to use the app',
      icon: 'play-circle' as const,
      action: () => {
        Alert.alert('Tutorial', 'App tutorial feature will be available in a future update.');
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Help & Support</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Quick Actions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
          <ThemedText style={styles.description}>
            Get help quickly with these common actions.
          </ThemedText>
        </ThemedView>

        {quickActions.map((action) => (
          <ThemedView key={action.id} style={styles.actionCard}>
            <TouchableOpacity style={styles.actionButton} onPress={action.action}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.actionInfo}>
                <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                <ThemedText style={styles.actionDescription}>{action.description}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
            </TouchableOpacity>
          </ThemedView>
        ))}

        {/* FAQ Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Frequently Asked Questions</ThemedText>
          <ThemedText style={styles.description}>
            Find answers to common questions about using the driver app.
          </ThemedText>
        </ThemedView>

        {faqItems.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={64} color={Colors.light.icon} />
            <ThemedText type="subtitle" style={styles.emptyTitle}>No FAQs Available</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Check back later for frequently asked questions.
            </ThemedText>
          </ThemedView>
        ) : (
          faqItems.map((faq: FAQ) => (
            <ThemedView key={faq.id} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => handleFaqToggle(faq.id)}
              >
                <ThemedText style={styles.faqQuestionText}>{faq.question}</ThemedText>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.light.icon}
                />
              </TouchableOpacity>
              {expandedFaq === faq.id && (
                <View style={styles.faqAnswer}>
                  <ThemedText style={styles.faqAnswerText}>{faq.answer}</ThemedText>
                </View>
              )}
            </ThemedView>
          ))
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  faqCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondary,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
    marginTop: 12,
  },
  bottomSpacing: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
});
