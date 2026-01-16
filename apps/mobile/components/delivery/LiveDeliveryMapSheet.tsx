import { BottomSheetBase } from '@/components/BottomSheetBase';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { ExternalLink, MapPin, Navigation, Package, User } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LiveDeliveryMapSheetProps {
    isVisible: boolean;
    onClose: () => void;
    orderId: Id<"orders">;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 300;

export function LiveDeliveryMapSheet({
    isVisible,
    onClose,
    orderId,
}: LiveDeliveryMapSheetProps) {
    // Fetch delivery assignment
    const assignment = useQuery(
        api.queries.stuart.getAssignmentByOrderId,
        { orderId }
    );

    // Fetch live courier location
    const courierLocation = useQuery(
        api.queries.stuart.getCourierLocation,
        { orderId }
    );

    // Snap points for bottom sheet
    const snapPoints = useMemo(() => {
        const collapsedPercentage = Math.round((COLLAPSED_HEIGHT / SCREEN_HEIGHT) * 100);
        return [`${collapsedPercentage}%`];
    }, []);

    // Handle sheet changes
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    const handleOpenStuartTracking = async () => {
        if (!assignment?.external_tracking_url) {
            Alert.alert('Tracking Unavailable', 'Tracking link is not available yet.');
            return;
        }

        try {
            const canOpen = await Linking.canOpenURL(assignment.external_tracking_url);
            if (canOpen) {
                await Linking.openURL(assignment.external_tracking_url);
            } else {
                Alert.alert('Error', 'Unable to open tracking link.');
            }
        } catch (error) {
            console.error('Error opening Stuart tracking:', error);
            Alert.alert('Error', 'Failed to open tracking link.');
        }
    };

    if (!isVisible || !assignment) return null;

    const isStuartDelivery = assignment.provider === 'stuart';

    return (
        <BottomSheetBase
            snapPoints={snapPoints}
            index={0}
            onChange={handleSheetChanges}
            enablePanDownToClose={true}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Package size={24} color="#094327" />
                        <Text style={styles.headerTitle}>Delivery Tracking</Text>
                    </View>
                    {courierLocation && (
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>Live</Text>
                        </View>
                    )}
                </View>

                {/* Courier Info */}
                {isStuartDelivery && assignment.external_driver_name && (
                    <View style={styles.courierCard}>
                        <View style={styles.courierHeader}>
                            {assignment.external_driver_photo ? (
                                <Image
                                    source={{ uri: assignment.external_driver_photo }}
                                    style={styles.courierPhoto}
                                />
                            ) : (
                                <View style={styles.courierPhotoPlaceholder}>
                                    <User size={24} color="white" />
                                </View>
                            )}
                            <View style={styles.courierInfo}>
                                <Text style={styles.courierName}>
                                    {assignment.external_driver_name}
                                </Text>
                                <Text style={styles.courierLabel}>Stuart Courier</Text>
                            </View>
                        </View>

                        {courierLocation && (
                            <View style={styles.locationInfo}>
                                <MapPin size={16} color="#6B7280" />
                                <Text style={styles.locationText}>
                                    Last updated: {new Date(courierLocation.timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Stuart Tracking Button */}
                {isStuartDelivery && assignment.external_tracking_url && (
                    <TouchableOpacity
                        style={styles.trackingButton}
                        onPress={handleOpenStuartTracking}
                    >
                        <Navigation size={20} color="white" />
                        <Text style={styles.trackingButtonText}>
                            Open Live Map Tracking
                        </Text>
                        <ExternalLink size={18} color="white" />
                    </TouchableOpacity>
                )}

                {/* Info Text */}
                <Text style={styles.infoText}>
                    Track your delivery in real-time with Stuart's live map showing courier location and estimated arrival time.
                </Text>
            </View>
        </BottomSheetBase>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'white',
    },
    liveText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    courierCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    courierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    courierPhoto: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: '#094327',
    },
    courierPhotoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#094327',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courierInfo: {
        flex: 1,
    },
    courierName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    courierLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationText: {
        fontSize: 13,
        color: '#6B7280',
    },
    trackingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#094327',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    trackingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});
