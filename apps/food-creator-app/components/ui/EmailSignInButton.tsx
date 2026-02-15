import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

interface EmailSignInButtonProps extends Omit<TouchableOpacityProps, "children"> {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  showArrow?: boolean;
}

export function EmailSignInButton({
  title,
  loading = false,
  disabled = false,
  onPress,
  style,
  variant = "primary",
  showArrow = true,
  ...props
}: EmailSignInButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = (event: any) => {
    if (isDisabled) return;

    // Haptic feedback
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silently fail if haptics not available
    }

    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    props.onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (isDisabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    props.onPressOut?.(event);
  };

  const handlePress = (event: any) => {
    if (isDisabled) return;
    onPress?.(event);
  };

  const backgroundColor = variant === "primary" ? "#FF3B30" : "#4A4A4A";
  const textColor = "#FFFFFF";

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={isDisabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, style]}
      {...props}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor,
            transform: [{ scale: scaleAnim }],
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <View style={styles.content}>
            <Text style={[styles.text, { color: textColor }]}>{title}</Text>
            {showArrow && (
              <Ionicons
                name="arrow-forward"
                size={20}
                color={textColor}
                style={styles.icon}
              />
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 400,
  },
  button: {
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  icon: {
    marginLeft: 8,
  },
});

