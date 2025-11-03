import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SharedOrderingHeaderProps {
  onBack: () => void;
  onAction?: () => void;
  actionText?: string;
  actionLoading?: boolean;
  actionDisabled?: boolean;
  backIcon?: "left" | "down";
  showBackText?: boolean;
  position?: "relative" | "absolute";
  style?: any;
}

export function SharedOrderingHeader({
  onBack,
  onAction,
  actionText,
  actionLoading = false,
  actionDisabled = false,
  backIcon = "left",
  showBackText = false,
  position = "relative",
  style,
}: SharedOrderingHeaderProps) {
  const BackIcon = backIcon === "down" ? ChevronDown : ChevronLeft;

  return (
    <View
      style={[
        styles.header,
        position === "absolute" && styles.headerAbsolute,
        style,
      ]}
    >
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <BackIcon
          size={showBackText ? 24 : 20}
          color="#fff"
        />
        {showBackText && <Text style={styles.backText}>Back</Text>}
      </TouchableOpacity>
      {onAction && actionText && (
        <TouchableOpacity
          onPress={onAction}
          style={[
            styles.actionButton,
            (actionLoading || actionDisabled) && styles.actionButtonDisabled,
          ]}
          disabled={actionLoading || actionDisabled}
        >
          <Text
            style={[
              styles.actionText,
              (actionLoading || actionDisabled) && styles.actionTextDisabled,
            ]}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    zIndex: 10,
  },
  headerAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionTextDisabled: {
    color: "#ccc",
  },
});

