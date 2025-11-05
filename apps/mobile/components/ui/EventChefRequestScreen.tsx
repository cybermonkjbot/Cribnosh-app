import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../../lib/ToastContext';
import { Calendar, Users, MapPin, Phone, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCreateEventChefRequestMutation } from '@/store/customerApi';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface EventChefRequestScreenProps {
  onClose: () => void;
}

const EVENT_TYPES = [
  'Wedding',
  'Birthday Party',
  'Corporate Event',
  'Anniversary',
  'Graduation',
  'Holiday Celebration',
  'Other',
];

export function EventChefRequestScreen({ onClose }: EventChefRequestScreenProps) {
  const { showToast } = useToast();
  const [createEventChefRequest, { isLoading: isCreating }] = useCreateEventChefRequestMutation();

  // Form state
  const [eventDate, setEventDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!eventDate || !numberOfGuests || !eventType || !eventLocation || !phoneNumber || !email) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all required fields.',
        duration: 3000,
      });
      return;
    }

    // Validate number of guests
    const guestsNumber = parseInt(numberOfGuests);
    if (isNaN(guestsNumber) || guestsNumber <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Number of Guests',
        message: 'Please enter a valid number of guests.',
        duration: 3000,
      });
      return;
    }

    try {
      await createEventChefRequest({
        event_date: eventDate,
        number_of_guests: guestsNumber,
        event_type: eventType,
        event_location: eventLocation,
        phone_number: phoneNumber,
        email: email,
        dietary_requirements: dietaryRequirements || undefined,
        additional_notes: additionalNotes || undefined,
      }).unwrap();

      setIsSubmitted(true);
      showToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'We will call you shortly to confirm your event coverage.',
        duration: 3000,
      });
    } catch (error: any) {
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to submit your request. Please try again.';
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage,
        duration: 4000,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Get Chef for an Event</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {isSubmitted ? (
          /* Success State */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.successContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successIconContainer}>
              <Phone size={48} color="#0B9E58" />
            </View>
            <Text style={styles.successTitle}>Request Submitted!</Text>
            <Text style={styles.successMessage}>
              Thank you for your interest. Our team will call you within 24 hours to confirm your event coverage and discuss your food requirements.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Form */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>
              Fill out the form below and our team will call you to confirm your event coverage.
            </Text>

            {/* Event Date */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Event Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 15 March 2024"
                  value={eventDate}
                  onChangeText={setEventDate}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Number of Guests */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Number of Guests <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Users size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 50"
                  value={numberOfGuests}
                  onChangeText={setNumberOfGuests}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Event Type */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Event Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.optionsContainer}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      eventType === type && styles.optionButtonSelected,
                    ]}
                    onPress={() => setEventType(type)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        eventType === type && styles.optionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Event Location */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Event Location <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter event address"
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Phone Number <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., +44 20 1234 5678"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Email Address <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Dietary Requirements */}
            <View style={styles.section}>
              <Text style={styles.label}>Dietary Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Vegetarian options, Gluten-free, Halal"
                value={dietaryRequirements}
                onChangeText={setDietaryRequirements}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Additional Notes */}
            <View style={styles.section}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any other information about your event..."
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter',
    paddingVertical: 12,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#F23E2E',
    borderColor: '#F23E2E',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#F23E2E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  doneButton: {
    backgroundColor: '#F23E2E',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

