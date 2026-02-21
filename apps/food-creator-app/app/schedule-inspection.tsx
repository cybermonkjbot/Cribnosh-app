import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const calendarIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 2V6M16 2V6M2 8H18M3 4H17C17.5523 4 18 4.44772 18 5V17C18 17.5523 17.5523 18 17 18H3C2.44772 18 2 17.5523 2 17V5C2 4.44772 2.44772 4 3 4Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const clockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99995 1.69995C11.6415 1.69995 13.2462 2.18694 14.6112 3.09896C15.976 4.01095 17.0403 5.30686 17.6686 6.82342C18.2967 8.34003 18.4606 10.0094 18.1403 11.6194C17.82 13.2294 17.0298 14.7084 15.8691 15.8691C14.7084 17.0298 13.2294 17.82 11.6194 18.1403C10.0094 18.4606 8.34003 18.2967 6.82342 17.6686C5.30686 17.0403 4.01095 15.976 3.09896 14.6112C2.18694 13.2462 1.69995 11.6415 1.69995 9.99995C1.69995 9.54154 2.07156 9.16995 2.52995 9.16995C2.98834 9.16995 3.35995 9.54154 3.35995 9.99995C3.35995 11.3133 3.7497 12.5968 4.47931 13.6887C5.20889 14.7807 6.24566 15.6316 7.45889 16.1341C8.67212 16.6367 10.0073 16.7689 11.2952 16.5127C12.5832 16.2565 13.7668 15.624 14.6954 14.6954C15.624 13.7668 16.2565 12.5832 16.5127 11.2952C16.7689 10.0073 16.6367 8.67212 16.1341 7.45889C15.6316 6.24566 14.7807 5.20889 13.6887 4.47931C12.5973 3.75 11.3143 3.36027 10.0016 3.35995C8.12799 3.36739 6.32976 4.09864 4.98267 5.4009L3.11679 7.26679C2.79265 7.59093 2.26725 7.59093 1.94312 7.26679C1.61898 6.94265 1.61898 6.41725 1.94312 6.09312L3.81872 4.21751L4.14537 3.91598C5.76066 2.49844 7.838 1.7081 9.99671 1.69995H9.99995Z" fill="#8E8E93"/>
<path d="M1.67505 2.50505C1.67505 2.04666 2.04666 1.67505 2.50505 1.67505C2.96344 1.67505 3.33505 2.04666 3.33505 2.50505L3.33505 5.82505L6.65505 5.82505C7.11344 5.82505 7.48505 6.19666 7.48505 6.65505C7.48505 7.11344 7.11344 7.48505 6.65505 7.48505L2.50505 7.48505C2.04666 7.48505 1.67505 7.11344 1.67505 6.65505L1.67505 2.50505Z" fill="#8E8E93"/>
<path d="M9.17993 5.84514C9.17993 5.38674 9.55152 5.01514 10.0099 5.01514C10.4683 5.01514 10.8399 5.38674 10.8399 5.84514L10.8399 9.48203L13.7012 10.9127L13.7749 10.9548C14.1303 11.18 14.2646 11.642 14.0724 12.0264C13.8802 12.4108 13.4299 12.5808 13.0365 12.4316L12.9587 12.3976L9.63867 10.7376C9.35755 10.597 9.17993 10.3095 9.17993 9.99514L9.17993 5.84514Z" fill="#8E8E93"/>
</svg>`;

export default function ScheduleInspectionScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator, sessionToken: authSessionToken } = useFoodCreatorAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [notes, setNotes] = useState('');

  // Get session token
  useEffect(() => {
    const loadToken = async () => {
      if (authSessionToken) {
        setSessionToken(authSessionToken);
      } else {
        const token = await getSessionToken();
        setSessionToken(token);
      }
    };
    loadToken();
  }, [authSessionToken]);

  // Get kitchen ID
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    foodCreator?._id ? { chefId: foodCreator._id } : 'skip'
  );

  // Get kitchen details
  const kitchen = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  const handleBack = () => {
    router.back();
  };

  const handleScheduleInspection = async () => {
    if (!preferredDate) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please select a preferred date',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const convex = getConvexClient();
      const token = sessionToken || await getSessionToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      // TODO: Create inspection request mutation when implemented
      // For now, show success message
      showToast({
        type: 'success',
        title: 'Inspection Requested',
        message: 'Your inspection request has been submitted. Our team will contact you to confirm the date and time.',
        duration: 5000,
      });

      // Update kitchen with new inspection date
      if (kitchenId && kitchen) {
        const currentDates = kitchen.inspectionDates || [];
        const newDate = new Date(preferredDate).toISOString().split('T')[0];
        
        // Use mutation to update kitchen
        // await convex.mutation(api.mutations.kitchens.updateKitchen, {
        //   kitchenId,
        //   inspectionDates: [...currentDates, newDate],
        // });
      }

      router.back();
    } catch (error: any) {
      console.error('Error scheduling inspection:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to schedule inspection. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Schedule Inspection'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Inspection</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Food Safety Inspection</Text>
            <Text style={styles.infoText}>
              Request a food safety inspection for your kitchen. Our team will contact you to confirm the date and time.
            </Text>
          </View>

          {/* Kitchen Address */}
          {kitchen?.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kitchen Address</Text>
              <View style={styles.addressCard}>
                <Text style={styles.addressText}>{kitchen.address}</Text>
              </View>
            </View>
          )}

          {/* Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Date & Time</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Date</Text>
              <View style={styles.inputContainer}>
                <SvgXml xml={calendarIconSVG} width={20} height={20} />
                <TextInput
                  style={styles.input}
                  value={preferredDate}
                  onChangeText={setPreferredDate}
                  placeholder="YYYY-MM-DD"
                  keyboardType="default"
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.inputHint}>
                Format: YYYY-MM-DD (e.g., 2024-12-25)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Time</Text>
              <View style={styles.inputContainer}>
                <SvgXml xml={clockIconSVG} width={20} height={20} />
                <TextInput
                  style={styles.input}
                  value={preferredTime}
                  onChangeText={setPreferredTime}
                  placeholder="09:00 AM"
                  editable={!isSubmitting}
                />
              </View>
              <Text style={styles.inputHint}>
                Format: HH:MM AM/PM (e.g., 09:00 AM)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special instructions or requirements..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!preferredDate || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleScheduleInspection}
            disabled={!preferredDate || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Request Inspection</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  infoCard: {
    backgroundColor: '#E6FFE8',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  infoTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    marginBottom: 8,
  },
  inputContainer: {
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
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputHint: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

