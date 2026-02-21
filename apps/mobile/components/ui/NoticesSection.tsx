
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NoticeCard } from './NoticeCard';

export const NoticesSection: React.FC = () => {
    const router = useRouter();
    // State to simulate dismissing notices
    const [visibleNotices, setVisibleNotices] = useState({
        critical: true,
        progress: true,
        action: true,
        info: true,
    });

    const hasVisibleNotices = Object.values(visibleNotices).some(v => v);

    if (!hasVisibleNotices) return null;

    return (
        <View style={styles.container}>
            {/* Example: Critical Notice */}
            {visibleNotices.critical && (
                <NoticeCard
                    variant="critical"
                    title="Payment Method Expiring"
                    message="Your connected card ending in 4242 expires soon. Please update it to avoid service interruptions."
                    actionLabel="Update Now"
                    onAction={() => router.push('/(tabs)/orders/cart/payment-method' as any)}
                    onClose={() => setVisibleNotices(prev => ({ ...prev, critical: false }))}
                />
            )}

            {/* Example: Progress Notice - "Broken progress lines" */}
            {visibleNotices.progress && (
                <NoticeCard
                    variant="progress"
                    title="Order #8592 - Preparing"
                    message="Food Creator Marco is currently preparing your Lasagna. It smells delicious!"
                    progress={{
                        current: 3,
                        total: 5,
                        label: 'Step 3 of 5: Cooking'
                    }}
                    onClose={() => setVisibleNotices(prev => ({ ...prev, progress: false }))}
                />
            )}

            {/* Example: Action Notice */}
            {visibleNotices.action && (
                <NoticeCard
                    variant="action"
                    title="Rate Your Last Meal"
                    message="How was the Chicken Tikka Masala from FoodCreator Royale? Your feedback helps us improve."
                    actionLabel="Rate 5 Stars"
                    onAction={() => console.log('Rated')}
                    onClose={() => setVisibleNotices(prev => ({ ...prev, action: false }))}
                />
            )}

            {/* Example: Info Notice */}
            {visibleNotices.info && (
                <NoticeCard
                    variant="info"
                    title="Did you know?"
                    message="You can now share your favorite orders with friends using the new Pay-for-Me feature!"
                    onClose={() => setVisibleNotices(prev => ({ ...prev, info: false }))}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    }
});
