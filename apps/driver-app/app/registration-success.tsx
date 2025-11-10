import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ThemedText';

export default function RegistrationSuccessScreen() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push('/login');
  };

  // Text constants to avoid linter warnings for apostrophes in JSX
  const whatsNextText = "What's Next?";
  const notificationText = "You'll receive a notification when verified";

  const documents = [
    {
      name: "Driver's License",
      status: 'PENDING',
      icon: 'id-card-outline',
    },
    {
      name: 'Vehicle Registration',
      status: 'PENDING',
      icon: 'document-text-outline',
    },
    {
      name: 'Insurance',
      status: 'PENDING',
      icon: 'shield-checkmark-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={80} color={Colors.light.accent} />
          </View>
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <ThemedText type="title" style={styles.title}>
            Registration Successful
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Pending Verification
          </ThemedText>
        </View>

        {/* Information Message */}
        <View style={styles.infoContainer}>
          <ThemedText style={styles.infoText}>
            We have received your registration and documents. Our team will review your submission and notify you within 24 hours.
          </ThemedText>
        </View>

        {/* Documents List */}
        <View style={styles.documentsContainer}>
          <ThemedText type="subtitle" style={styles.documentsTitle}>
            Submitted Documents
          </ThemedText>
          {documents.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <Ionicons name={doc.icon as any} size={24} color={Colors.light.icon} />
              </View>
              <View style={styles.documentInfo}>
                <ThemedText style={styles.documentName}>{doc.name}</ThemedText>
                <View style={[styles.statusBadge, styles.statusPending]}>
                  <ThemedText style={styles.statusText}>{doc.status}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsContainer}>
          <ThemedText type="subtitle" style={styles.nextStepsTitle}>
            {whatsNextText}
          </ThemedText>
          <View style={styles.stepItem}>
            <Ionicons name="time-outline" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.stepText}>
              Wait for verification (within 24 hours)
            </ThemedText>
          </View>
          <View style={styles.stepItem}>
            <Ionicons name="notifications-outline" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.stepText}>
              {notificationText}
            </ThemedText>
          </View>
          <View style={styles.stepItem}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.icon} />
            <ThemedText style={styles.stepText}>
              Order-taking will be disabled until verification is complete
            </ThemedText>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleGoToLogin}
        >
          <ThemedText style={styles.loginButtonText}>
            Go to Login
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.primary,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    textAlign: 'center',
  },
  documentsContainer: {
    marginBottom: 24,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusPending: {
    backgroundColor: Colors.light.warning + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.warning,
  },
  nextStepsContainer: {
    marginBottom: 32,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

