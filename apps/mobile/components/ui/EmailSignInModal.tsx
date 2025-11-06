import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { Button } from "./Button";
import { CribNoshLogo } from "./CribNoshLogo";
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
  const [isCompletingSignIn, setIsCompletingSignIn] = useState(false);
  const { handleEmailLogin } = useAuth();
  const { login } = useAuthContext();

  const handleEmailSignIn = async () => {
    if (isCompletingSignIn) return;
    setIsCompletingSignIn(true);
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Invalid Email", "Please enter a valid email address");
        setIsCompletingSignIn(false);
        return;
      }

      if (password.length < 6) {
        showError("Invalid Password", "Password must be at least 6 characters");
        setIsCompletingSignIn(false);
        return;
      }

      onEmailSubmit?.(email);
      const res = await handleEmailLogin(email, password);
      
      // Check if 2FA is required
      if (res.data?.requires2FA && res.data?.verificationToken) {
        // Navigate to 2FA verification screen
        onClose();
        setEmail("");
        setPassword("");
        router.push({
          pathname: '/verify-2fa',
          params: { verificationToken: res.data.verificationToken },
        });
        return;
      }
      
      if (res.data?.token && res.data?.user) {
        // Ensure user data has all required fields
        const userData = res.data.user;

        if (userData.user_id && userData.name) {
          // Use the auth state hook to store data
          await login(res.data.token, {
            user_id: userData.user_id,
            email: userData.email || email,
            name: userData.name,
            roles: userData.roles || [],
            picture: userData.picture || "",
            isNewUser: userData.isNewUser || false,
            provider: userData.provider || "email",
          });

          // Show success toast
          showSuccess("Sign In Successful", "Welcome to CribNosh!");

          // Close modal and notify parent after a short delay
          setTimeout(() => {
            onClose();
            setEmail("");
            setPassword("");
            onSignInSuccess?.();
          }, 1500); // Give time for toast to show
        } else {
          throw new Error("Invalid user data received");
        }
      }
    } catch (error: any) {
      // Error completing sign in

      // Extract precise error message from API response
      let errorTitle = "Sign In Failed";
      let errorMessage = "Please check your email and password and try again";

      // Try to get error message from normalized format first
      const apiError = 
        error?.data?.error?.message ||
        (typeof error?.data?.error === "string" ? error.data.error : null) ||
        error?.data?.message ||
        error?.message ||
        "";

      if (apiError) {
        if (
          apiError.includes("Invalid credentials") ||
          apiError.includes("Invalid email") ||
          apiError.includes("Invalid password")
        ) {
          errorTitle = "Invalid Credentials";
          errorMessage = "The email or password you entered is incorrect";
        } else if (apiError.includes("Email and password are required")) {
          errorTitle = "Missing Information";
          errorMessage = "Please enter both email and password";
        } else if (apiError.includes("Account not found")) {
          errorTitle = "Account Not Found";
          errorMessage = "No account found with this email address";
        } else {
          errorMessage = apiError;
        }
      }

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

  const isValid = email.length > 0 && password.length >= 6;

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
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Get started with CribNosh</Text>
            <Text style={styles.subtitle}>
              Enter your email and password to sign in to your account
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

            <View style={styles.inputContainer}>
              <Input
                placeholder="Password"
                value={password}
                onChangeText={handlePasswordChange}
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
            </View>

            <Button
              onPress={handleEmailSignIn}
              disabled={!isValid || isCompletingSignIn}
              loading={isCompletingSignIn}
              size="lg"
              style={styles.submitButton}
              elevated
            >
              Sign In
            </Button>
          </View>
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
    maxWidth: 320,
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
  packagingDecoration: {
    position: "absolute",
    bottom: -60,
    right: -80,
    zIndex: 1,
    opacity: 0.3,
    transform: [{ scale: 1.5 }],
  },
});

