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
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { handleEmailSignInOrSignUp } = useAuth();
  const { login } = useAuthContext();

  // Reset to email step when modal closes
  useEffect(() => {
    if (!isVisible) {
      setStep("email");
      setEmail("");
      setPassword("");
      setErrorMessage(null);
    }
  }, [isVisible]);

  const handleEmailSubmit = async () => {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Invalid Email", "Please enter a valid email address");
        return;
      }

      onEmailSubmit?.(email);
      setStep("password");
    } catch {
      showError("Error", "Please try again");
    }
  };

  const handlePasswordSubmit = async () => {
    if (isCompletingSignIn) return;
    
    // Clear any previous error messages
    setErrorMessage(null);
    
    // Haptic feedback on button press
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silently fail if haptics not available
    }
    
    setIsCompletingSignIn(true);
    try {
      if (password.length < 6) {
        const msg = "Password must be at least 6 characters";
        setErrorMessage(msg);
        showError("Invalid Password", msg);
        setIsCompletingSignIn(false);
        return;
      }

      // Use the unified sign-in or sign-up function
      const res = await handleEmailSignInOrSignUp(email, password);
      
      // Check if 2FA is required
      if (res.data?.requires2FA && res.data?.verificationToken) {
        // Navigate to 2FA verification screen
        onClose();
        setEmail("");
        setPassword("");
        setStep("email");
        router.push({
          pathname: '/verify-2fa',
          params: { verificationToken: res.data.verificationToken },
        });
        return;
      }
      
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
            setPassword("");
            setStep("email");
            onClose();
            onSignInSuccess?.();
          }, 800); // Brief delay to show success feedback
        } else {
          throw new Error("Invalid user data received");
        }
      } else {
        // If response doesn't have token/user, it's an error
        throw new Error("Sign in failed. Please check your credentials and try again.");
      }
    } catch (error: any) {
      // Error completing sign in
      console.log("Sign-in error:", JSON.stringify(error, null, 2));

      // Extract precise error message from API response
      let errorTitle = "Sign In Failed";
      let errorMessage = "Please check your email and password and try again";

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
          lowerError.includes("invalid credentials") ||
          lowerError.includes("invalid email") ||
          lowerError.includes("invalid password") ||
          lowerError.includes("incorrect password") ||
          lowerError.includes("wrong password") ||
          lowerError.includes("authentication failed") ||
          error?.status === 401 ||
          error?.data?.status === 401
        ) {
          errorTitle = "Invalid Credentials";
          errorMessage = "The email or password you entered is incorrect. Please try again.";
        } else if (lowerError.includes("email and password are required") || lowerError.includes("missing")) {
          errorTitle = "Missing Information";
          errorMessage = "Please enter both email and password";
        } else if (lowerError.includes("account not found") || lowerError.includes("user not found")) {
          errorTitle = "Account Not Found";
          errorMessage = "No account found with this email address";
        } else if (lowerError.includes("network") || lowerError.includes("connection")) {
          errorTitle = "Connection Error";
          errorMessage = "Unable to connect. Please check your internet connection and try again.";
        } else {
          // Use the actual error message
          errorTitle = "Sign In Failed";
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
      setIsCompletingSignIn(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
  };

  const isEmailValid = email.length > 0;
  const isPasswordValid = password.length >= 6;

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
                disabled={!isEmailValid}
                style={styles.submitButton}
              />
            </View>
          ) : (
            <View style={styles.contentWrapper}>
              <TouchableOpacity
                style={styles.backButtonContainer}
                onPress={() => {
                  setStep("email");
                  setErrorMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <Text style={styles.title}>Enter your password</Text>
              <Text style={styles.subtitle}>
                Enter your password to sign in to {email}
              </Text>

              <View style={styles.inputContainer}>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={(text) => {
                    handlePasswordChange(text);
                    // Clear error when user starts typing
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  size="lg"
                  style={styles.input}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
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

              <EmailSignInButton
                title="Sign In"
                onPress={handlePasswordSubmit}
                disabled={!isPasswordValid || isCompletingSignIn}
                loading={isCompletingSignIn}
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
  packagingDecoration: {
    position: "absolute",
    bottom: -60,
    right: -80,
    zIndex: 1,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
});

