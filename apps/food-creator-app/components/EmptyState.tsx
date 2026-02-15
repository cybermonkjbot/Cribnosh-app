import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ActionButton {
  label: string;
  onPress: () => void;
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  style?: ViewStyle;
  titleColor?: string;
  subtitleColor?: string;
  iconColor?: string;
  actionButton?: ActionButton;
  secondaryActionButton?: ActionButton;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  icon = 'receipt-outline',
  style,
  titleColor = '#11181C',
  subtitleColor = '#687076',
  iconColor = '#9CA3AF',
  actionButton,
  secondaryActionButton,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={48} color={iconColor} />
      </View>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      )}
      
      {/* Action Buttons */}
      {(actionButton || secondaryActionButton) && (
        <View style={styles.buttonContainer}>
          {actionButton && (
            <Pressable
              onPress={actionButton.onPress}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>{actionButton.label}</Text>
            </Pressable>
          )}
          {secondaryActionButton && (
            <Pressable
              onPress={secondaryActionButton.onPress}
              style={styles.secondaryButton}
            >
              <Text style={[styles.secondaryButtonText, { color: titleColor }]}>{secondaryActionButton.label}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  buttonContainer: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 