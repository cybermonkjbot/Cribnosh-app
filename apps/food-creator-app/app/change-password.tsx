import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useAccount } from '@/hooks/useAccount';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const lockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16.6402 10.845C16.6402 10.3866 16.2686 10.015 15.8102 10.015L4.1902 10.015C3.7318 10.015 3.3602 10.3866 3.3602 10.845L3.3602 16.655C3.3602 17.1134 3.7318 17.485 4.1902 17.485L15.8102 17.485C16.2686 17.485 16.6402 17.1134 16.6402 16.655V10.845ZM18.3002 16.655C18.3002 18.0302 17.1854 19.145 15.8102 19.145L4.1902 19.145C2.81501 19.145 1.7002 18.0302 1.7002 16.655L1.7002 10.845C1.7002 9.46975 2.81501 8.35498 4.1902 8.35498L15.8102 8.35498C17.1854 8.35498 18.3002 9.46975 18.3002 10.845L18.3002 16.655Z" fill="#6B7280"/>
  <path d="M13.32 9.15498V5.83498C13.32 4.95446 12.97 4.11026 12.3473 3.48764C11.7248 2.86502 10.8806 2.51498 10 2.51498C9.11947 2.51498 8.2753 2.86502 7.65268 3.48764C7.03006 4.11026 6.68002 4.95446 6.68002 5.83498L6.68002 9.15498C6.68002 9.61339 6.30841 9.98498 5.85002 9.98498C5.39163 9.98498 5.02002 9.61339 5.02002 9.15498L5.02002 5.83498C5.02002 4.5142 5.54507 3.2479 6.479 2.31396C7.41293 1.38003 8.67924 0.85498 10 0.85498C11.3208 0.85498 12.5871 1.38003 13.521 2.31396C14.455 3.2479 14.98 4.5142 14.98 5.83498V9.15498C14.98 9.61339 14.6084 9.98498 14.15 9.98498C13.6916 9.98498 13.32 9.61339 13.32 9.15498Z" fill="#6B7280"/>
</svg>`;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Use account hook for Convex actions
  const { changePassword, isLoading: accountLoading } = useAccount();

  const handleBack = () => {
    router.back();
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'All password fields are required.',
        duration: 3000,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'New passwords do not match.',
        duration: 3000,
      });
      return;
    }

    if (newPassword.length < 8) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 8 characters long.',
        duration: 3000,
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.',
        duration: 3000,
      });

      // Navigate back after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Error changing password:', error);
      // Error handling is done in the hook
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Change Password',
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Change Password</Text>

          {/* Password Form Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <SvgXml xml={lockIconSVG} width={20} height={20} />
              </View>
              <Text style={styles.sectionTitle}>Password</Text>
            </View>

            <View style={styles.passwordForm}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showNewPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeButtonText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordFormActions}>
                <TouchableOpacity
                  style={[styles.cancelButton, isChangingPassword && styles.buttonDisabled]}
                  onPress={handleBack}
                  disabled={isChangingPassword}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    isChangingPassword && styles.buttonDisabled,
                  ]}
                  onPress={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
  },
  passwordForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFFFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  passwordFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

