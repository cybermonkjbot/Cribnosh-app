import { Ionicons } from '@expo/vector-icons';
// TODO: Use API endpoint for privacy policy when available
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ThemedText';
import { Colors } from '../constants/Colors';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  // TODO: Use API endpoint for privacy policy when available
  const privacyPolicy = null as any;

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
        <ThemedText style={styles.headerTitle}>Privacy Policy</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!privacyPolicy ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading...</ThemedText>
          </View>
        ) : (
          <>
            {/* Last Updated */}
            <View style={styles.lastUpdatedContainer}>
              <ThemedText style={styles.lastUpdatedText}>
                Last Updated: {privacyPolicy.lastUpdated}
              </ThemedText>
            </View>

            {/* Content */}
            {privacyPolicy.content.map((section: { section: string; title: string; body: string }, index: number) => (
              <View key={section.section} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNumber}>
                    <ThemedText style={styles.sectionNumberText}>{index + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                </View>
                <ThemedText style={styles.sectionBody}>{section.body}</ThemedText>
              </View>
            ))}

            {/* FAQs */}
            {privacyPolicy.faqs && privacyPolicy.faqs.length > 0 && (
              <FAQAccordion faqs={privacyPolicy.faqs} />
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FAQAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
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

