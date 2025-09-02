import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Back arrow icon SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Checkbox SVG (unchecked)
const checkboxUncheckedSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="16" height="16" rx="2" stroke="#CCCCCC" stroke-width="2"/>
</svg>`;

// Checkbox SVG (checked)
const checkboxCheckedSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="16" height="16" rx="2" fill="#FF3B30" stroke="#FF3B30" stroke-width="2"/>
  <path d="M7 10L9 12L13 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const feedbackOptions = [
  "I'm not using the app.",
  "I found a better alternative.",
  "The app contains too many ads.",
  "The app didn't have the features or functionality I were looking for.",
  "I'm not satisfied with the quality of content.",
  "The app was difficult to navigate.",
  "Other."
];

export default function DeleteAccountSurveyScreen() {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set([0, 3])); // Pre-select first and fourth options

  const handleBackPress = () => {
    router.back();
  };

  const handleOptionToggle = (index: number) => {
    const newSelectedOptions = new Set(selectedOptions);
    if (newSelectedOptions.has(index)) {
      newSelectedOptions.delete(index);
    } else {
      newSelectedOptions.add(index);
    }
    setSelectedOptions(newSelectedOptions);
  };

  const handleDone = () => {
    // TODO: Submit feedback and complete account deletion
    console.log('Feedback submitted:', Array.from(selectedOptions));
    // Navigate to the success screen
    router.push('/delete-account-success');
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Request received'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request received</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Confirmation Message */}
          <View style={styles.confirmationContainer}>
            <Text style={styles.confirmationText}>
              We're sending an email to ***email@hotmail.com confirming when your account is deleted.
            </Text>
          </View>

          {/* Feedback Section */}
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>
              Why did you decide to leave this app?
            </Text>
            <Text style={styles.feedbackSubtitle}>
              Give an optional feedback to help us improve!
            </Text>

            {/* Feedback Options */}
            <View style={styles.optionsContainer}>
              {feedbackOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => handleOptionToggle(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxContainer}>
                    <SvgXml 
                      xml={selectedOptions.has(index) ? checkboxCheckedSVG : checkboxUncheckedSVG} 
                      width={20} 
                      height={20} 
                    />
                  </View>
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Done Button - Floating */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to account for floating button
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FAFFFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  confirmationContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  confirmationText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    textAlign: 'left',
  },
  feedbackContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  feedbackTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#333333',
    marginBottom: 8,
    textAlign: 'left',
  },
  feedbackSubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'left',
  },
  optionsContainer: {
    gap: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  optionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    flex: 1,
    textAlign: 'left',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 24,
    backgroundColor: '#FAFFFA',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  doneButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doneButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});
