import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import * as Linking from 'expo-linking';
import { MapPin, Navigation, Package, Truck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface LiveDeliveryMapProps {
    orderId: Id<"orders">;
    pickupLocation?: {
        latitude: number;
        longitude: number;
        address: string;
    };
    deliveryLocation?: {
        latitude: number;
        longitude: number;
        address: string;
    };
}

export function LiveDeliveryMap({
    orderId,
    pickupLocation,
    deliveryLocation,
}: LiveDeliveryMapProps) {
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch delivery assignment to check if it's Stuart
    const assignment = useQuery(
        api.queries.stuart.getAssignmentByOrderId,
        { orderId }
    );

    // Fetch live courier location (updates automatically via Convex reactivity)
    const courierLocation = useQuery(
        api.queries.stuart.getCourierLocation,
        { orderId }
    );

    // Auto-refresh courier location every 30 seconds for Stuart deliveries
    useEffect(() => {
        if (assignment?.provider === 'stuart') {
            const interval = setInterval(() => {
                setRefreshKey((prev) => prev + 1);
            }, 30000); // 30 seconds

            return () => clearInterval(interval);
        }
    }, [assignment?.provider]);

    if (!assignment) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
                <Text style={styles.loadingText}>Loading delivery info...</Text>
            </View>
        );
    }

    const isStuartDelivery = assignment.provider === 'stuart';

    // Determine map region based on available locations
    const getMapRegion = () => {
        const locations = [
            courierLocation,
            pickupLocation,
            deliveryLocation,
        ].filter(Boolean);

        if (locations.length === 0) {
            // Default to London if no locations
            return {
                latitude: 51.5074,
                longitude: -0.1278,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
        }

        // Calculate center and span
        const lats = locations.map((loc) => loc!.latitude);
        const lngs = locations.map((loc) => loc!.longitude);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = (maxLat - minLat) * 1.5 || 0.02;
        const lngDelta = (maxLng - minLng) * 1.5 || 0.02;

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, 0.02),
            longitudeDelta: Math.max(lngDelta, 0.02),
        };
    };

    const handleOpenStuartTracking = async () => {
        if (!assignment.external_tracking_url) {
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

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={getMapRegion()}
                showsUserLocation
                showsMyLocationButton
            >
                {/* Pickup Location Marker */}
                {pickupLocation && (
                    <Marker
                        coordinate={{
                            latitude: pickupLocation.latitude,
                            longitude: pickupLocation.longitude,
                        }}
                        title="Pickup Location"
                        description={pickupLocation.address}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[styles.marker, styles.pickupMarker]}>
                                <Package size={20} color="white" />
                            </View>
                        </View>
                    </Marker>
                )}

                {/* Delivery Location Marker */}
                {deliveryLocation && (
                    <Marker
                        coordinate={{
                            latitude: deliveryLocation.latitude,
                            longitude: deliveryLocation.longitude,
                        }}
                        title="Delivery Location"
                        description={deliveryLocation.address}
                    >
                        <View style={styles.markerContainer}>
                            <View style={[styles.marker, styles.deliveryMarker]}>
                                <MapPin size={20} color="white" />
                            </View>
                        </View>
                    </Marker>
                )}

                {/* Courier Location Marker (for Stuart deliveries) */}
                {courierLocation && (
                    <Marker
                        coordinate={{
                            latitude: courierLocation.latitude,
                            longitude: courierLocation.longitude,
                        }}
                        title="Courier"
                        description="Live location"
                    >
                        <View style={styles.markerContainer}>
                            {assignment.external_driver_photo ? (
                                <Image
                                    source={{ uri: assignment.external_driver_photo }}
                                    style={styles.courierPhoto}
                                />
                            ) : (
                                <View style={[styles.marker, styles.courierMarker]}>
                                    <Truck size={20} color="white" />
                                </View>
                            )}
                        </View>
                    </Marker>
                )}

                {/* Route line */}
                {courierLocation && deliveryLocation && (
                    <Polyline
                        coordinates={[
                            {
                                latitude: courierLocation.latitude,
                                longitude: courierLocation.longitude,
                            },
                            {
                                latitude: deliveryLocation.latitude,
                                longitude: deliveryLocation.longitude,
                            },
                        ]}
                        strokeColor="#094327"
                        strokeWidth={3}
                        lineDashPattern={[10, 5]}
                    />
                )}
            </MapView>

            {/* Stuart Tracking Button */}
            {isStuartDelivery && assignment.external_tracking_url && (
                <View style={styles.trackingButtonContainer}>
                    <TouchableOpacity
                        style={styles.trackingButton}
                        onPress={handleOpenStuartTracking}
                    >
                        <Navigation size={20} color="white" />
                        <Text style={styles.trackingButtonText}>
                            Open Live Stuart Tracking
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Courier Info Card */}
            {isStuartDelivery && assignment.external_driver_name && (
                <View style={styles.courierInfoCard}>
                    <View style={styles.courierInfoHeader}>
                        <View style={styles.courierInfoLeft}>
                            {assignment.external_driver_photo && (
                                <Image
                                    source={{ uri: assignment.external_driver_photo }}
                                    style={styles.courierInfoPhoto}
                                />
                            )}
                            <View>
                                <Text style={styles.courierName}>
                                    {assignment.external_driver_name}
                                </Text>
                                <Text style={styles.courierLabel}>Stuart Courier</Text>
                            </View>
                        </View>
                        {courierLocation && (
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>Live</Text>
                            </View>
                        )}
                    </View>
                    {courierLocation && (
                        <Text style={styles.lastUpdate}>
                            Last updated: {new Date(courierLocation.timestamp).toLocaleTimeString()}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: height * 0.5,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    pickupMarker: {
        backgroundColor: '#F59E0B',
    },
    deliveryMarker: {
        backgroundColor: '#094327',
    },
    courierMarker: {
        backgroundColor: '#3B82F6',
    },
    courierPhoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    trackingButtonContainer: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
    },
    trackingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#094327',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    trackingButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    courierInfoCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    courierInfoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    courierInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    courierInfoPhoto: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    courierName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    courierLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
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
    lastUpdate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
});
