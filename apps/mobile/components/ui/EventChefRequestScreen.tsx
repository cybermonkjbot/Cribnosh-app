import DateTimePicker from '@react-native-community/datetimepicker';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Briefcase,
  Cake,
  Calendar,
  ChefHat,
  ChevronRight,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Users
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../../lib/ToastContext';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface EventChefRequestScreenProps {
  onClose: () => void;
}

const EVENT_TYPES = [
  { label: 'Wedding', Icon: Heart },
  { label: 'Birthday Party', Icon: Cake },
  { label: 'Corporate Event', Icon: Briefcase },
  { label: 'Anniversary', Icon: Heart },
  { label: 'Graduation', Icon: GraduationCap },
  { label: 'Holiday Celebration', Icon: Gift },
  { label: 'Other', Icon: Sparkles },
];

const STEPS = [
  { id: 'eventType', question: "What's the occasion?", Icon: Sparkles },
  { id: 'eventDate', question: 'When is your event?', Icon: Calendar },
  { id: 'guests', question: 'How many guests?', Icon: Users },
  { id: 'location', question: 'Where will it be?', Icon: MapPin },
  { id: 'contact', question: 'How can we reach you?', Icon: Phone },
  { id: 'details', question: 'Any special requirements?', Icon: FileText },
];

export function EventChefRequestScreen({ onClose }: EventChefRequestScreenProps) {
  const { showToast } = useToast();
  const { isAuthenticated } = useAuthContext();
  const [isCreating, setIsCreating] = useState(false);

  // Create event chef request function
  const createEventChefRequest = async (data: {
    event_date: string;
    number_of_guests: number;
    event_type: string;
    event_location: string;
    phone_number: string;
    email: string;
    dietary_requirements?: string;
    additional_notes?: string;
  }) => {
    const convex = getConvexClient();
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
      throw new Error('Not authenticated');
    }

    const result = await convex.action(api.actions.users.customerCreateEventChefRequest, {
      sessionToken,
      event_date: data.event_date,
      number_of_guests: data.number_of_guests,
      event_type: data.event_type,
      event_location: data.event_location,
      phone_number: data.phone_number,
      email: data.email,
      dietary_requirements: data.dietary_requirements,
      additional_notes: data.additional_notes,
    });

    if (result.success === false) {
      throw new Error(result.error || 'Failed to create event chef request');
    }

    // Transform to match expected format
    return {
      success: true,
      data: result,
    };
  };

  // Form state
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numberOfGuests, setNumberOfGuests] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-show date picker on iOS when on eventDate step
  useEffect(() => {
    if (Platform.OS === 'ios' && STEPS[currentStep]?.id === 'eventDate') {
      setShowDatePicker(true);
    } else if (Platform.OS === 'ios' && STEPS[currentStep]?.id !== 'eventDate') {
      setShowDatePicker(false);
    }
  }, [currentStep]);

  const canProceed = useMemo(() => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case 'eventType':
        return !!eventType;
      case 'eventDate':
        return eventDate !== null;
      case 'guests':
        const guestsNumber = parseInt(numberOfGuests);
        return !!numberOfGuests && !isNaN(guestsNumber) && guestsNumber > 0;
      case 'location':
        return !!eventLocation;
      case 'contact':
        return !!phoneNumber && !!email;
      case 'details':
        return true; // Optional step
      default:
        return false;
    }
  }, [currentStep, eventType, eventDate, numberOfGuests, eventLocation, phoneNumber, email]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatDateForSubmission = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setEventDate(selectedDate);
      }
    } else {
      // iOS - keep picker open, update date as user scrolls
      if (selectedDate) {
        setEventDate(selectedDate);
      }
    }
  };

  const handleSubmit = async () => {
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

    if (!eventDate) {
      showToast({
        type: 'error',
        title: 'Missing Date',
        message: 'Please select an event date.',
        duration: 3000,
      });
      return;
    }

    try {
      setIsCreating(true);
      await createEventChefRequest({
        event_date: formatDateForSubmission(eventDate),
        number_of_guests: guestsNumber,
        event_type: eventType,
        event_location: eventLocation,
        phone_number: phoneNumber,
        email: email,
        dietary_requirements: dietaryRequirements || undefined,
        additional_notes: additionalNotes || undefined,
      });

      setIsSubmitted(true);
      showToast({
        type: 'success',
        title: 'Request Submitted',
        message: 'We will call you shortly to confirm your event coverage.',
        duration: 3000,
      });
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        'Failed to submit your request. Please try again.';
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'eventType':
        return (
          <View style={styles.stepContent}>
            <View style={styles.eventTypesGrid}>
              {EVENT_TYPES.map((type) => {
                const IconComponent = type.Icon;
                return (
                  <TouchableOpacity
                    key={type.label}
                    style={[
                      styles.eventTypeCard,
                      eventType === type.label && styles.eventTypeCardSelected,
                    ]}
                    onPress={() => setEventType(type.label)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventTypeIconContainer}>
                      <IconComponent 
                        size={32} 
                        color={eventType === type.label ? '#F23E2E' : '#6B7280'} 
                      />
                    </View>
                    <Text
                      style={[
                        styles.eventTypeLabel,
                        eventType === type.label && styles.eventTypeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 'eventDate':
        return (
          <View style={styles.stepContent}>
            {Platform.OS === 'ios' ? (
              // iOS: Show picker directly, no input field, no done button
              showDatePicker && (
                <DateTimePicker
                  value={eventDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#111827"
                />
              )
            ) : (
              // Android: Show input field, picker appears as modal
              <>
                <TouchableOpacity
                  style={styles.inputCard}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Calendar size={24} color="#F23E2E" style={styles.inputCardIcon} />
                  <Text
                    style={[
                      styles.inputCardText,
                      !eventDate && styles.inputCardTextPlaceholder,
                    ]}
                  >
                    {eventDate ? formatDateForDisplay(eventDate) : 'Select event date'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>Tap to select the date of your event</Text>
                {showDatePicker && (
                  <DateTimePicker
                    value={eventDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    textColor="#111827"
                  />
                )}
              </>
            )}
          </View>
        );

      case 'guests':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <Users size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={styles.inputCardText}
                placeholder="e.g., 50"
                value={numberOfGuests}
                onChangeText={setNumberOfGuests}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <Text style={styles.hintText}>How many people will be attending?</Text>
          </View>
        );

      case 'location':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.inputCard, styles.inputCardMultiline]}>
              <MapPin size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Enter the event address"
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
            <Text style={styles.hintText}>Where will your event take place?</Text>
          </View>
        );

      case 'contact':
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputCard}>
              <Phone size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={styles.inputCardText}
                placeholder="e.g., +44 20 1234 5678"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputCard, styles.inputCardMarginTop]}>
              <Mail size={24} color="#F23E2E" style={styles.inputCardIcon} />
              <TextInput
                style={styles.inputCardText}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <Text style={styles.hintText}>We&apos;ll use this to confirm your event details</Text>
          </View>
        );

      case 'details':
        return (
          <View style={styles.stepContent}>
            <View style={[styles.inputCard, styles.inputCardMultiline]}>
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Dietary requirements (e.g., Vegetarian, Gluten-free, Halal)"
                value={dietaryRequirements}
                onChangeText={setDietaryRequirements}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={[styles.inputCard, styles.inputCardMultiline, styles.inputCardMarginTop]}>
              <TextInput
                style={[styles.inputCardText, styles.inputCardTextMultiline]}
                placeholder="Any other information about your event..."
                value={additionalNotes}
                onChangeText={setAdditionalNotes}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>
            <Text style={styles.hintText}>Optional: Share any special requirements or notes</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const currentStepData = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const StepIcon = currentStepData.Icon;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ChefHat size={24} color="#F23E2E" />
            <Text style={styles.title}>Let&apos;s plan your event</Text>
          </View>
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
              <Sparkles size={48} color="#0B9E58" />
            </View>
            <Text style={styles.successTitle}>You&apos;re all set!</Text>
            <Text style={styles.successMessage}>
              We&apos;ve received your request and our team will call you within 24 hours to confirm your event coverage and discuss your food requirements.
            </Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Step-by-step Wizard */
          <View style={styles.wizardContainer}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {STEPS.length}
              </Text>
            </View>

            {/* Step Question */}
            <View style={styles.questionContainer}>
              <View style={styles.questionIconContainer}>
                <StepIcon size={40} color="#F23E2E" />
              </View>
              <Text style={styles.questionText}>{currentStepData.question}</Text>
            </View>

            {/* Step Content */}
            <ScrollView
              style={styles.stepScrollView}
              contentContainerStyle={styles.stepScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navigationContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !canProceed && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canProceed || isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {currentStep === STEPS.length - 1 ? 'Submit' : 'Next'}
                    </Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  closeButton: {
    padding: 4,
  },
  wizardContainer: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F23E2E',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  questionIconContainer: {
    marginBottom: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: 20,
  },
  stepContent: {
    flex: 1,
  },
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  eventTypeCard: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  eventTypeCardSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F23E2E',
    borderWidth: 2,
  },
  eventTypeIconContainer: {
    marginBottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  eventTypeLabelSelected: {
    color: '#F23E2E',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 64,
  },
  inputCardMultiline: {
    alignItems: 'flex-start',
    paddingTop: 18,
  },
  inputCardMarginTop: {
    marginTop: 16,
  },
  inputCardIcon: {
    marginRight: 16,
  },
  inputCardText: {
    flex: 1,
    fontSize: 18,
    color: '#111827',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  inputCardTextPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  inputCardTextMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iosPickerActions: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  iosPickerButton: {
    backgroundColor: '#F23E2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  iosPickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#F23E2E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 28,
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
    borderRadius: 16,
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

