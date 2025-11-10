import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ThemedText';
import { Colors } from '../constants/Colors';
import { useGetTermsOfServiceQuery } from '../store/driverApi';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  // Fetch terms of service using RTK Query
  const { data: termsOfServiceResponse, isLoading } = useGetTermsOfServiceQuery();
  const termsOfService = termsOfServiceResponse?.data || null;

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Terms of Service</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <ThemedText style={{ marginTop: 12 }}>Loading...</ThemedText>
          </View>
        ) : termsOfService ? (
          <>
            {/* Last Updated */}
            <View style={styles.lastUpdatedContainer}>
              <ThemedText style={styles.lastUpdatedText}>
                Last Updated: {new Date(termsOfService.lastUpdated).toLocaleDateString()}
              </ThemedText>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <ThemedText style={styles.contentTitle}>{termsOfService.title}</ThemedText>
              <ThemedText style={styles.contentBody}>{termsOfService.content}</ThemedText>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ThemedText>No content available</ThemedText>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FAQAccordion({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFAQ = (index: number) => {
    const id = `faq-${index}`;
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.faqContainer}>
      <View style={styles.faqHeader}>
        <Ionicons name="help-circle-outline" size={24} color={Colors.light.primary} />
        <ThemedText style={styles.faqTitle}>Frequently Asked Questions</ThemedText>
      </View>

      {faqs.map((faq, index) => {
        const id = `faq-${index}`;
        const isExpanded = expandedId === id;

        return (
          <View key={id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqQuestionContent}>
                <ThemedText style={styles.faqQuestionText}>{faq.question}</ThemedText>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Colors.light.icon}
                />
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.faqAnswer}>
                <ThemedText style={styles.faqAnswerText}>{faq.answer}</ThemedText>
              </View>
            )}
          </View>
        );
      })}
    </View>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  lastUpdatedContainer: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  sectionContainer: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 20,
  },
  contentContainer: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  contentBody: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  faqContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  faqItem: {
    backgroundColor: Colors.light.background,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  faqQuestion: {
    padding: 16,
  },
  faqQuestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
});

