import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showError, showSuccess } from "../../lib/GlobalToastManager";
import { Button } from "./Button";
import { Input } from "./Input";
import { CountryCodePicker } from "./CountryCodePicker";

interface ProfileUpdateOTPModalProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'phone' | 'email';
  currentValue?: string;
  newValue: string;
  onOTPVerified: (otp: string) => Promise<void>;
  onSendOTP: (value: string) => Promise<{ success: boolean; testOtp?: string }>;
}

export function ProfileUpdateOTPModal({
  isVisible,
  onClose,
  type,
  currentValue,
  newValue,
  onOTPVerified,
  onSendOTP,
}: ProfileUpdateOTPModalProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const [step, setStep] = useState<"input" | "verification">("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Initialize with new value
  useEffect(() => {
    if (type === 'phone') {
      setPhoneNumber(newValue || '');
    } else {
      setEmail(newValue || '');
    }
  }, [type, newValue]);

  // Countdown timer
  useEffect(() => {
    if (step === 'verification' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (step === 'verification') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOTP = async () => {
    if (isSendingOTP) return;
    setIsSendingOTP(true);

    try {
      let valueToVerify: string;
      
      if (type === 'phone') {
        const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
        const countryCodeClean = countryCode.startsWith("+")
          ? countryCode.slice(1)
          : countryCode;
        valueToVerify = `+${countryCodeClean}${cleanPhoneNumber}`;
        
        if (cleanPhoneNumber.length < 10) {
          showError("Invalid Phone Number", "Please enter a valid phone number");
          setIsSendingOTP(false);
          return;
        }
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          showError("Invalid Email", "Please enter a valid email address");
          setIsSendingOTP(false);
          return;
        }
        valueToVerify = email.trim().toLowerCase();
      }

      const result = await onSendOTP(valueToVerify);
      
      if (result.success) {
        if (result.testOtp) {
          setTestOtp(result.testOtp);
          showSuccess("OTP Sent", `Verification code: ${result.testOtp}`);
        } else {
          showSuccess("OTP Sent", `Verification code sent to your ${type === 'phone' ? 'phone' : 'email'}`);
        }
        setStep("verification");
        setTimeLeft(300); // Reset timer
      }
    } catch (error: any) {
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        `Failed to send verification code. Please try again.`;
      showError("Failed to Send Code", errorMessage);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    
    if (digit) {
      const newCode = [...verificationCode];
      newCode[index] = digit;
      setVerificationCode(newCode);

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-verify when all 6 digits are entered
      if (index === 5 && newCode.every(d => d !== '')) {
        handleVerifyOTP();
      }
    } else {
      // Allow backspace to clear
      const newCode = [...verificationCode];
      newCode[index] = "";
      setVerificationCode(newCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    if (isVerifying) return;
    
    const otpString = verificationCode.join('');
    if (otpString.length !== 6) {
      showError("Invalid Code", "Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      await onOTPVerified(otpString);
      showSuccess("Verification Successful", `Your ${type === 'phone' ? 'phone number' : 'email'} has been updated`);
      handleClose();
    } catch (error: any) {
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Verification failed. Please try again.";
      showError("Verification Failed", errorMessage);
      // Clear the code on error
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setTimeLeft(300);
    setVerificationCode(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  const handleClose = () => {
    setStep("input");
    setVerificationCode(['', '', '', '', '', '']);
    setTimeLeft(300);
    setTestOtp(null);
    if (type === 'phone') {
      setPhoneNumber('');
    } else {
      setEmail('');
    }
    onClose();
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#094327" />
          </TouchableOpacity>
          {step === "verification" && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep("input");
                setVerificationCode(['', '', '', '', '', '']);
                setTimeLeft(300);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#094327" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === "input" ? (
            <View style={styles.contentWrapper}>
              <Text style={styles.title}>
                Update {type === 'phone' ? 'Phone Number' : 'Email'}
              </Text>
              <Text style={styles.subtitle}>
                {type === 'phone' 
                  ? 'Enter your new phone number and we&apos;ll send you a verification code'
                  : 'Enter your new email address and we&apos;ll send you a verification code'}
              </Text>

              {type === 'phone' ? (
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputWrapper}>
                    <TouchableOpacity
                      style={styles.countryCodeButton}
                      onPress={() => setIsCountryPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                      <Ionicons name="chevron-down" size={16} color="#094327" />
                    </TouchableOpacity>
                    <View style={styles.phoneInputDivider} />
                    <Input
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={14}
                      size="lg"
                      style={styles.phoneInput}
                      leftIcon={
                        <Ionicons
                          name="call-outline"
                          size={20}
                          color="#094327"
                        />
                      }
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(text) => setEmail(text.toLowerCase().trim())}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    size="lg"
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#094327"
                      />
                    }
                  />
                </View>
              )}

              <Button
                onPress={handleSendOTP}
                disabled={
                  (type === 'phone' ? phoneNumber.replace(/\D/g, "").length < 10 : !email.trim()) ||
                  isSendingOTP
                }
                loading={isSendingOTP}
                size="lg"
                style={styles.submitButton}
              >
                Send Verification Code
              </Button>
            </View>
          ) : (
            <View style={styles.contentWrapper}>
              <Text style={styles.title}>Verify {type === 'phone' ? 'Phone Number' : 'Email'}</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit code to {type === 'phone' ? phoneNumber : email}. Enter it below to verify.
              </Text>

              {testOtp && (
                <View style={styles.testOtpContainer}>
                  <Text style={styles.testOtpText}>Test OTP: {testOtp}</Text>
                </View>
              )}

              <View style={styles.otpContainer}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleVerificationCodeChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isVerifying}
                  />
                ))}
              </View>

              <Text style={styles.timerText}>
                {timeLeft > 0
                  ? `Code expires in ${formatTime(timeLeft)}`
                  : "Code expired"}
              </Text>

              <Button
                onPress={handleVerifyOTP}
                disabled={verificationCode.some(d => !d) || isVerifying || timeLeft === 0}
                loading={isVerifying}
                size="lg"
                style={styles.submitButton}
              >
                Verify Code
              </Button>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={isSendingOTP}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>
                  Didn't get the code? Tap to resend
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Country Code Picker */}
        {type === 'phone' && (
          <CountryCodePicker
            isVisible={isCountryPickerVisible}
            onClose={() => setIsCountryPickerVisible(false)}
            onSelectCountry={(country) => {
              setCountryCode(country.dialCode);
              setIsCountryPickerVisible(false);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFFFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  contentWrapper: {
    width: "100%",
  },
  title: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 24,
    lineHeight: 32,
    color: "#111827",
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
    color: "#6B7280",
    marginBottom: 32,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  countryCodeText: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  phoneInputDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
  },
  phoneInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  submitButton: {
    width: "100%",
    marginTop: 8,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "monospace",
  },
  timerText: {
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  resendButton: {
    paddingVertical: 12,
    marginTop: 16,
  },
  resendText: {
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 14,
    color: "#094327",
    textAlign: "center",
  },
  testOtpContainer: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  testOtpText: {
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: 14,
    color: "#92400E",
    textAlign: "center",
  },
});

