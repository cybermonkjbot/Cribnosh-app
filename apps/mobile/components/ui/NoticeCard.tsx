
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export type NoticeVariant = 'critical' | 'progress' | 'action' | 'info';

interface NoticeCardProps {
    variant: NoticeVariant;
    title: string;
    message: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    onClose?: () => void;
    progress?: {
        current: number;
        total: number;
        label?: string;
    };
    style?: ViewStyle;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
    variant,
    title,
    message,
    icon,
    actionLabel,
    onAction,
    onClose,
    progress,
    style,
}) => {
    // Determine colors based on variant
    const getVariantStyles = () => {
        switch (variant) {
            case 'critical':
                return {
                    borderColor: '#FECACA', // red-200
                    iconColor: '#DC2626', // red-600
                    accentColor: '#DC2626',
                };
            case 'progress':
                return {
                    borderColor: '#E5E7EB', // gray-200
                    iconColor: '#059669', // emerald-600
                    accentColor: '#059669',
                };
            case 'action':
                return {
                    borderColor: '#BFDBFE', // blue-200
                    iconColor: '#2563EB', // blue-600
                    accentColor: '#2563EB',
                };
            case 'info':
            default:
                return {
                    borderColor: '#E5E7EB',
                    iconColor: '#4B5563', // gray-600
                    accentColor: '#4B5563',
                };
        }
    };

    const { borderColor, iconColor, accentColor } = getVariantStyles();

    // render default icon if none provided
    const renderIcon = () => {
        if (icon) return icon;

        const iconSize = 24;
        switch (variant) {
            case 'critical':
                return <Ionicons name="alert-circle" size={iconSize} color={iconColor} />;
            case 'progress':
                return <Ionicons name="time" size={iconSize} color={iconColor} />;
            case 'action':
                return <Ionicons name="hand-right" size={iconSize} color={iconColor} />;
            case 'info':
            default:
                return <Ionicons name="information-circle" size={iconSize} color={iconColor} />;
        }
    };

    // Render broken progress line
    const renderProgress = () => {
        if (!progress) return null;

        return (
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    {Array.from({ length: progress.total }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressSegment,
                                {
                                    backgroundColor: index < progress.current ? accentColor : '#E5E7EB',
                                    flex: 1,
                                    marginRight: index < progress.total - 1 ? 4 : 0,
                                },
                            ]}
                        />
                    ))}
                </View>
                {progress.label && (
                    <Text style={styles.progressLabel}>{progress.label}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { borderColor }, style]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>{renderIcon()}</View>
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                </View>
                {onClose && (
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Progress Section */}
            {variant === 'progress' && progress && renderProgress()}

            {/* Action Button */}
            {(variant === 'action' || onAction) && actionLabel && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: accentColor }]}
                    onPress={onAction}
                >
                    <Text style={styles.actionButtonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    contentContainer: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    progressContainer: {
        marginTop: 16,
    },
    progressTrack: {
        flexDirection: 'row',
        height: 4,
        marginBottom: 8,
    },
    progressSegment: {
        borderRadius: 2,
    },
    progressLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'right',
    },
    actionButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
