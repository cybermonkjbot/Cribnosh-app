import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

const chefIconSVG = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.5 12.5C8.5 12.5 9.5 11 12 11C14.5 11 15.5 12.5 15.5 12.5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 11V7" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function GroupOrderLobby() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthContext();

    // Queries
    const groupOrder = useQuery(api.queries.groupOrders.getById, {
        group_order_id: id as string
    });

    const statusSummary = useQuery(api.queries.groupOrders.getGroupOrderStatus, {
        group_order_id: id as string
    });

    // Mutations
    const startSelection = useMutation(api.mutations.groupOrders.startSelectionPhase);

    const [isLoadingAction, setIsLoadingAction] = useState(false);

    // Derived state
    const isCreator = user && groupOrder && user.id === groupOrder.created_by;
    const isBudgetingPhase = statusSummary?.selection_phase === 'budgeting';
    const participants = groupOrder?.participants || [];

    const handleShare = async () => {
        if (!groupOrder?.share_link) return;
        try {
            await Share.share({
                message: `Join my group order on CribNosh! ${groupOrder.share_link}`,
                url: groupOrder.share_link,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartSelection = async () => {
        if (!id) return;
        if (statusSummary && statusSummary.budget && statusSummary.budget.total_budget === 0) {
            Alert.alert("No Budget", "Please verify the budget before starting selection.");
            return;
        }

        try {
            setIsLoadingAction(true);
            await startSelection({ group_order_id: id, user_id: user!.id as any });
            // The query update currently triggers UI change, but we could also toast
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsLoadingAction(false);
        }
    };

    const handleChipIn = () => {
        router.push({
            pathname: '/orders/group/budget',
            params: { id }
        });
    };

    if (!groupOrder || !statusSummary) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
                <Text style={styles.loadingText}>Loading Group Order...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="#094327" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Group Order</Text>
                <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Share2 color="#094327" size={24} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.orderInfoCard}>
                    <SvgXml xml={chefIconSVG} width={40} height={40} />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.restaurantName}>{groupOrder.restaurant_name}</Text>
                        <Text style={styles.orderStatus}>
                            Phase: <Text style={{ fontWeight: '700' }}>{statusSummary.selection_phase.toUpperCase()}</Text>
                        </Text>
                    </View>
                </View>

                {/* Budget Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Budget Pool</Text>
                        {isBudgetingPhase && (
                            <TouchableOpacity onPress={handleChipIn} style={styles.chipInButtonSmall}>
                                <Wallet size={16} color="#FFF" style={{ marginRight: 4 }} />
                                <Text style={styles.chipInTextSmall}>Chip In</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.budgetCard}>
                        <Text style={styles.budgetAmount}>£{statusSummary.budget.total_budget.toFixed(2)}</Text>
                        <Text style={styles.budgetLabel}>Total Collected</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '100%' }]} />
                        </View>
                    </View>
                </View>

                {/* Participants Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
                    <FlatList
                        data={participants}
                        keyExtractor={(item) => item.user_id}
                        renderItem={({ item }) => (
                            <View style={styles.participantRow}>
                                <View style={[styles.avatar, { backgroundColor: item.user_color }]}>
                                    <Text style={styles.avatarText}>{item.user_initials}</Text>
                                </View>
                                <View style={styles.participantInfo}>
                                    <Text style={styles.participantName}>
                                        {item.user_name} {item.user_id === user?.id && '(You)'}
                                    </Text>
                                    <Text style={styles.participantStatus}>
                                        {isBudgetingPhase
                                            ? `Contributed £${item.budget_contribution.toFixed(2)}`
                                            : `Selection: ${item.selection_status === 'ready' ? 'Ready' : 'Not Ready'}`
                                        }
                                    </Text>
                                </View>
                                {item.user_id === groupOrder.created_by && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>HOST</Text>
                                    </View>
                                )}
                            </View>
                        )}
                        contentContainerStyle={{ gap: 12 }}
                    />
                </View>
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {isCreator && isBudgetingPhase ? (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleStartSelection}
                        disabled={isLoadingAction}
                    >
                        {isLoadingAction ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Lock Budget & Start Menu</Text>}
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.footerInfo}>
                        {isBudgetingPhase
                            ? "Waiting for host to start selection..."
                            : "Menu selection is active. Select your items."
                        }
                    </Text>
                )}

                {!isBudgetingPhase && (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push(`/orders/group/selection?id=${id}`)}
                    >
                        <Text style={styles.secondaryButtonText}>Go to Menu</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFFFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFFFA',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Inter',
        color: '#094327',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    shareButton: {
        padding: 8,
    },
    headerTitle: {
        fontFamily: 'Archivo',
        fontWeight: '700',
        fontSize: 18,
        color: '#094327',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    orderInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    restaurantName: {
        fontFamily: 'Archivo',
        fontWeight: '600',
        fontSize: 18,
        color: '#1F2937',
    },
    orderStatus: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Archivo',
        fontWeight: '600',
        fontSize: 18,
        color: '#111827',
    },
    chipInButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#094327',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    chipInTextSmall: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
    },
    budgetCard: {
        backgroundColor: '#E6F4EA',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    budgetAmount: {
        fontFamily: 'Archivo',
        fontWeight: '800',
        fontSize: 32,
        color: '#094327',
    },
    budgetLabel: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        width: '100%',
        backgroundColor: '#D1FAE5',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontFamily: 'Inter',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontFamily: 'Inter',
        fontWeight: '600',
        color: '#1F2937',
        fontSize: 16,
    },
    participantStatus: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#6B7280',
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#D97706',
        fontSize: 10,
        fontWeight: '700',
        fontFamily: 'Inter',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    footerInfo: {
        textAlign: 'center',
        marginBottom: 12,
        fontFamily: 'Inter',
        color: '#6B7280',
        fontStyle: 'italic',
    },
    primaryButton: {
        backgroundColor: '#094327',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#094327',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: '#094327',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
    },
});
