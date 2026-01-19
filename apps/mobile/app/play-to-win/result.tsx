import { Mascot } from "@/components/Mascot";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ResultScreen() {
    const router = useRouter();
    const { result, opponentName } = useLocalSearchParams();
    const isWin = result === 'win';

    const handleHome = () => {
        router.dismissAll();
        router.replace('/(tabs)/');
    };

    const handleOrderNow = () => {
        if (isWin) {
            router.dismissAll();
            router.push('/(tabs)/orders' as any);
        } else {
            // Just go home if lost, or maybe to wallet
            router.dismissAll();
            router.replace('/(tabs)/');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Mascot emotion={isWin ? "happy" : "sad"} size={140} />

                <Text style={styles.title}>
                    {isWin ? "You Won!" : "Oh no, you lost!"}
                </Text>

                <Text style={styles.subtitle}>
                    {isWin
                        ? `Congrats! ${opponentName} has to pay for your next meal. You can claim this at checkout.`
                        : `Bad luck! You now owe ${opponentName} a meal. They can request payment when they order.`}
                </Text>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Game</Text>
                        <Text style={styles.statValue}>High Card</Text>
                    </View>
                    <View style={styles.statLine} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Prize</Text>
                        <Text style={styles.statValue}>Free Meal</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: isWin ? '#10B981' : '#111827' }]}
                    onPress={handleOrderNow}
                >
                    <Text style={styles.mainButtonText}>
                        {isWin ? "Order Something Tasty" : "Back to Home"}
                    </Text>
                </TouchableOpacity>

                {isWin && (
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleHome}>
                        <Text style={styles.secondaryButtonText}>Save for Later</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
        marginTop: 24,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 24,
        marginBottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statLine: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    mainButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    mainButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        padding: 12,
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
});
