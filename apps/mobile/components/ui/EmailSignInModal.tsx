import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showError, showSuccess } from "../../lib/GlobalToastManager";
import BigPackaging from "./BigPackaging";
import { CribNoshLogo } from "./CribNoshLogo";
import { EmailSignInButton } from "./EmailSignInButton";
import { Input } from "./Input";

interface EmailSignInModalProps {
  isVisible: boolean;
  onClose: () => void;
  onEmailSubmit?: (email: string) => void;
  onSignInSuccess?: () => void;
}

export function EmailSignInModal({
  isVisible,
  onClose,
  onEmailSubmit,
  onSignInSuccess,
}: EmailSignInModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testOtp, setTestOtp] = useState<string | undefined>(undefined);
  const { handleSendEmailOTP, handleVerifyEmailOTP } = useAuth();
  const { login } = useAuthContext();

  // Reset to email step when modal closes
  useEffect(() => {
    if (!isVisible) {
      setStep("email");
      setEmail("");
      setOtp("");
      setErrorMessage(null);
      setTestOtp(undefined);
    }
  }, [isVisible]);

  const handleEmailSubmit = async () => {
    if (isSendingOTP) return;
    
    // Clear any previous error messages
    setErrorMessage(null);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsSendingOTP(true);
    try {
      // Haptic feedback on button press
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Silently fail if haptics not available
      }

      const res = await handleSendEmailOTP(email);
      
      if (res.data?.success) {
        // Store test OTP if provided (development only)
        if (res.data.testOtp) {
          setTestOtp(res.data.testOtp);
        }
        
        // Haptic feedback for success
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Silently fail if haptics not available
        }

        showSuccess("Code Sent", "Verification code sent to your email");
        onEmailSubmit?.(email);
        setStep("otp");
      } else {
        throw new Error(res.data?.message || "Failed to send verification code");
      }
    } catch (error: any) {
      // Haptic feedback for error
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Silently fail if haptics not available
      }

      const errorText = 
        error?.data?.error?.message ||
        error?.data?.error ||
        error?.message ||
        "Failed to send verification code. Please try again.";
      
      setErrorMessage(errorText);
      showError("Error", errorText);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (isVerifyingOTP) return;
    
    // Clear any previous error messages
    setErrorMessage(null);
    
    // Haptic feedback on button press
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silently fail if haptics not available
    }
    
    setIsVerifyingOTP(true);
    try {
      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        const msg = "Please enter a valid 6-digit code";
        setErrorMessage(msg);
        showError("Invalid Code", msg);
        setIsVerifyingOTP(false);
        return;
      }

      // Verify OTP
      const res = await handleVerifyEmailOTP(email, otp);
      
      if (res.data?.token && res.data?.user) {
        // Ensure user data has all required fields
        const userData = res.data.user;
        const wasNewUser = userData.isNewUser || false;

        if (userData.user_id && userData.name) {
          // Use the auth state hook to store data
          await login(res.data.token, {
            user_id: userData.user_id,
            email: userData.email || email,
            name: userData.name,
            roles: userData.roles || [],
            picture: userData.picture || "",
            isNewUser: wasNewUser,
            provider: userData.provider || "email",
          });

          // Haptic feedback for success
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            // Silently fail if haptics not available
          }

          // Show success toast - different message for new users vs existing users
          const successMessage = wasNewUser 
            ? "Account created and signed in successfully!" 
            : "Sign In Successful";
          const successTitle = wasNewUser 
            ? "Welcome to CribNosh!" 
            : "Welcome back!";
          showSuccess(successTitle, successMessage);

          // Close modal and notify parent after a brief delay to show feedback
          setTimeout(() => {
            setEmail("");
            setOtp("");
            setStep("email");
            setTestOtp(undefined);
            onClose();
            onSignInSuccess?.();
          }, 800); // Brief delay to show success feedback
        } else {
          throw new Error("Invalid user data received");
        }
      } else {
        // If response doesn't have token/user, it's an error
        throw new Error("Verification failed. Please check your code and try again.");
      }
    } catch (error: any) {
      // Error verifying OTP
      console.log("OTP verification error:", JSON.stringify(error, null, 2));

      // Extract precise error message from API response
      let errorTitle = "Verification Failed";
      let errorMessage = "Please check your verification code and try again";

      // Try multiple error paths to extract the message
      const apiError = 
        error?.data?.error?.message ||
        error?.data?.error ||
        (typeof error?.data?.error === "string" ? error.data.error : null) ||
        error?.data?.message ||
        error?.message ||
        error?.error ||
        "";

      // Normalize error message to string
      const errorText = typeof apiError === "string" ? apiError : String(apiError || "");

      if (errorText) {
        const lowerError = errorText.toLowerCase();
        
        if (
          lowerError.includes("invalid") ||
          lowerError.includes("incorrect") ||
          lowerError.includes("wrong") ||
          lowerError.includes("expired") ||
          error?.status === 400 ||
          error?.status === 401
        ) {
          errorTitle = "Invalid Code";
          errorMessage = errorText || "The verification code is incorrect or has expired. Please try again.";
        } else if (lowerError.includes("network") || lowerError.includes("connection")) {
          errorTitle = "Connection Error";
          errorMessage = "Unable to connect. Please check your internet connection and try again.";
        } else {
          // Use the actual error message
          errorTitle = "Verification Failed";
          errorMessage = errorText;
        }
      }

      // Haptic feedback for error
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Silently fail if haptics not available
      }

      // Set error message for display in UI
      setErrorMessage(errorMessage);
      
      // Show error toast with clear message
      showError(errorTitle, errorMessage);
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
  };

  const handleOTPChange = (text: string) => {
    // Only allow digits and limit to 6 characters
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(digitsOnly);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const isEmailValid = email.length > 0;
  const isOTPValid = /^\d{6}$/.test(otp);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Logo - positioned at top like main sign-in screen */}
        <View style={styles.logoContainer}>
          <CribNoshLogo size={120} variant="default" />
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {step === "email" ? (
            <View style={styles.contentWrapper}>
              <Text style={styles.title}>Get started with CribNosh</Text>
              <Text style={styles.subtitle}>
                Enter your email address to continue
              </Text>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="Email address"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  size="lg"
                  style={styles.input}
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#E6FFE8"
                    />
                  }
                />
              </View>

              <EmailSignInButton
                title="Continue"
                onPress={handleEmailSubmit}
                disabled={!isEmailValid || isSendingOTP}
                loading={isSendingOTP}
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View style={styles.contentWrapper}>
              <TouchableOpacity
                style={styles.backButtonContainer}
                onPress={() => {
                  setStep("email");
                  setOtp("");
                  setErrorMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                We sent a 6-digit code to {email}
              </Text>

              {testOtp && __DEV__ && (
                <View style={styles.testOtpContainer}>
                  <Text style={styles.testOtpText}>
                    Test OTP: {testOtp}
                  </Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Input
                  placeholder="000000"
                  value={otp}
                  onChangeText={handleOTPChange}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  size="lg"
                  style={styles.input}
                  maxLength={6}
                  leftIcon={
                    <Ionicons
                      name="keypad-outline"
                      size={20}
                      color="#E6FFE8"
                    />
                  }
                />
                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleEmailSubmit}
                disabled={isSendingOTP}
              >
                <Text style={styles.resendText}>
                  Didn't receive the code?{' '}
                  <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </TouchableOpacity>

              <EmailSignInButton
                title="Verify"
                onPress={handleOTPSubmit}
                disabled={!isOTPValid || isVerifyingOTP}
                loading={isVerifyingOTP}
                showArrow={false}
                style={styles.submitButton}
              />
            </View>
          )}
        </ScrollView>

        {/* BigPackaging decoration - bottom right */}
        <View style={styles.packagingDecoration}>
          <BigPackaging />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02120A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    fontFamily: "SF Pro",
    fontSize: 17,
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "400",
  },
  logoContainer: {
    position: "absolute",
    left: 23,
    top: 80,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 200,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  contentWrapper: {
    alignItems: "flex-start",
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontFamily: "Poppins",
    fontStyle: "normal",
    fontWeight: "700",
    fontSize: 32,
    lineHeight: 40,
    color: "#FFFFFF",
    textAlign: "left",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "SF Pro",
    fontStyle: "normal",
    fontWeight: "400",
    fontSize: 17,
    lineHeight: 24,
    color: "#E5E7EB",
    textAlign: "left",
    marginBottom: 48,
    opacity: 0.9,
    maxWidth: 280,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
    maxWidth: 400,
  },
  input: {
    width: "100%",
  },
  submitButton: {
    width: "100%",
    marginTop: 8,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 64,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: "SF Pro",
    fontSize: 14,
    color: "#FF3B30",
    marginLeft: 6,
    flex: 1,
  },
  testOtpContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.3)",
    marginBottom: 24,
  },
  testOtpText: {
    fontFamily: "SF Pro",
    fontSize: 14,
    color: "#FFC107",
    textAlign: "center",
    fontWeight: "600",
  },
  resendContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 24,
  },
  resendText: {
    fontFamily: "SF Pro",
    fontSize: 15,
    color: "#E5E7EB",
    textAlign: "center",
  },
  resendLink: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  packagingDecoration: {
    position: "absolute",
    bottom: -60,
    right: -80,
    zIndex: 1,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
});

