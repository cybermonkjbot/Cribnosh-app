
import { Mascot } from "@/components/Mascot";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    FlatList,
    Pressable,
    SafeAreaView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PaymentRequestScreen() {
    const { order_id } = useLocalSearchParams<{ order_id: string }>();
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    // Clean order ID string to remove any unexpected quotes
    const cleanOrderId = order_id?.replace(/^"|"$/g, '');

    // Queries
    const order = useQuery(api.queries.orders.getEnrichedOrder, {
        orderId: cleanOrderId as Id<"orders">
    });

    const connections = useQuery(api.queries.userConnections.getAllUserConnections, {
        user_id: order?.customer._id as Id<"users">
    });

    // Mutations
    const sendRequest = useMutation(api.mutations.orders.sendPaymentRequest);

    // State for sent requests
    const [sentTo, setSentTo] = useState<Set<string>>(new Set());

    // Poll for status change
    useEffect(() => {
        if (order?.payment_status === 'paid') {
            router.replace(`/orders/cart/success?order_id=${cleanOrderId}`);
        }
    }, [order?.payment_status, cleanOrderId, router]);

    const handleCopyLink = () => {
        if (order?.payment_link_token) {
            Clipboard.setString(`https://cribnosh.com/pay/${order.payment_link_token}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShareLink = async () => {
        if (order?.payment_link_token) {
            try {
                await Share.share({
                    message: `Hey! Can you pay for my Cribnosh order? Here's the link: https://cribnosh.com/pay/${order.payment_link_token}`,
                });
            } catch (error) {
                console.error("Error sharing:", error);
            }
        }
    };

    const handleSendRequest = async (userId: string, userName: string) => {
        if (!cleanOrderId) return;

        try {
            await sendRequest({
                orderId: cleanOrderId as Id<"orders">,
                targetUserId: userId as Id<"users">,
                sessionToken: "", // Handled by context usually, but here checking auth
            });

            setSentTo(prev => new Set(prev).add(userId));
            Alert.alert("Request Sent", `Asked ${userName} to pay!`);
        } catch (error) {
            Alert.alert("Error", "Failed to send request.");
            console.error(error);
        }
    };

    if (!order) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    const paymentLink = `https://cribnosh.com/pay/${order.payment_link_token}`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color="#1F2937" />
                </Pressable>
                <Text style={styles.title}>Ask Someone to Pay</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                contentContainerStyle={styles.content}
                ListHeaderComponent={() => (
                    <View style={styles.section}>
                        <View style={styles.center}>
                            <Mascot emotion="excited" size={120} />
                            <Text style={styles.waitingText}>Waiting for payment...</Text>
                            <Text style={styles.amountText}>£{(order.total_amount / 100).toFixed(2)}</Text>
                        </View>

                        <View style={styles.linkCard}>
                            <Text style={styles.sectionTitle}>Share Payment Link</Text>
                            <View style={styles.linkRow}>
                                <Text style={styles.linkText} numberOfLines={1}>
                                    {paymentLink}
                                </Text>
                            </View>
                            <View style={styles.actionButtons}>
                                <Pressable
                                    style={[styles.button, styles.outlineButton]}
                                    onPress={handleCopyLink}
                                >
                                    <Feather name={copied ? "check" : "copy"} size={18} color="#10B981" />
                                    <Text style={styles.outlineButtonText}>{copied ? "Copied!" : "Copy Link"}</Text>
                                </Pressable>

                                <Pressable
                                    style={[styles.button, styles.primaryButton]}
                                    onPress={handleShareLink}
                                >
                                    <Feather name="share-2" size={18} color="white" />
                                    <Text style={styles.primaryButtonText}>Share Link</Text>
                                </Pressable>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
                            Ask a Friend on Cribnosh
                        </Text>
                    </View>
                )}
                data={connections || []}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => (
                    <View style={styles.friendRow}>
                        <View style={styles.friendInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.user_name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.friendName}>{item.user_name}</Text>
                                <Text style={styles.friendType}>{item.connection_type}</Text>
                            </View>
                        </View>

                        {sentTo.has(item.user_id) ? (
                            <View style={styles.sentBadge}>
                                <Feather name="check" size={14} color="#10B981" />
                                <Text style={styles.sentText}>Sent</Text>
                            </View>
                        ) : (
                            <Pressable
                                style={styles.requestButton}
                                onPress={() => handleSendRequest(item.user_id, item.user_name)}
                            >
                                <Text style={styles.requestButtonText}>Request</Text>
                            </Pressable>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No connections found.</Text>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        color: "#4B5563",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 0,
    },
    center: {
        alignItems: "center",
        marginBottom: 24,
    },
    waitingText: {
        fontSize: 16,
        color: "#4B5563",
        marginTop: 12,
    },
    amountText: {
        fontSize: 32,
        fontWeight: "700",
        color: "#111827",
        marginTop: 4,
    },
    linkCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    linkRow: {
        backgroundColor: "#F3F4F6",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    linkText: {
        color: "#4B5563",
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    primaryButton: {
        backgroundColor: "#10B981",
    },
    primaryButtonText: {
        color: "white",
        fontWeight: "600",
    },
    outlineButton: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#10B981",
    },
    outlineButtonText: {
        color: "#10B981",
        fontWeight: "600",
    },
    friendRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    friendInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E0E7FF",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: "#4F46E5",
        fontWeight: "600",
        fontSize: 16,
    },
    friendName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#1F2937",
    },
    friendType: {
        fontSize: 12,
        color: "#6B7280",
        textTransform: "capitalize",
    },
    requestButton: {
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    requestButtonText: {
        color: "#3B82F6",
        fontWeight: "500",
        fontSize: 14,
    },
    sentBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
    },
    sentText: {
        color: "#10B981",
        fontWeight: "500",
        fontSize: 14,
    },
    emptyText: {
        textAlign: "center",
        color: "#6B7280",
        marginTop: 24,
    },
});
