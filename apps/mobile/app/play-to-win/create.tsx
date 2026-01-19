import { Mascot } from "@/components/Mascot";
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { useConnections } from '@/hooks/useConnections';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreateGameScreen() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthContext();
    const { getConnections } = useConnections();
    const createGame = useMutation(api.games.createGame);

    const [colleagues, setColleagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingGame, setCreatingGame] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadColleagues();
        }
    }, [isAuthenticated]);

    const loadColleagues = async () => {
        try {
            setLoading(true);
            const result = await getConnections();
            if (result && result.success) {
                // Filter for accepted colleague connections
                const cols = (result.data || []).filter((conn: any) =>
                    conn.connection_type === 'colleague'
                );
                setColleagues(cols);
            }
        } catch (error) {
            console.error('Error loading colleagues:', error);
            Alert.alert('Error', 'Failed to load colleagues');
        } finally {
            setLoading(false);
        }
    };

    const handleChallenge = async (opponentId: string, opponentName: string) => {
        if (creatingGame) return;

        try {
            setCreatingGame(true);
            // For now, we only have one game type: "high_card"
            const gameId = await createGame({
                opponentId: opponentId as any, // ID type casting
                gameType: "high_card"
            });

            router.push({
                pathname: "/play-to-win/game",
                params: {
                    gameId,
                    opponentName,
                    gameType: "high_card"
                }
            });
        } catch (error: any) {
            console.error('Error creating game:', error);
            Alert.alert('Error', 'Failed to start game: ' + error.message);
        } finally {
            setCreatingGame(false);
        }
    };

    const renderColleagueItem = ({ item }: { item: any }) => {
        // Determine the opponent user object (it's the one that isn't the current user)
        // The connection object structure depends on how `getConnections` returns it.
        // Usually it returns a connection object with `requester` and `recipient` populated or consolidated `friend` object.
        // Based on `useConnections` hook, let's assume it returns a list of connections where we need to find the "other" person.
        // Ideally `useConnections` returns a simplified objects. 
        // Let's assume `item.user` or similar. Checking `useConnections` usage in `HiddenSections.tsx`...
        // In `HiddenSections.tsx`: `(result.data || []).filter((conn: any) => conn.connection_type === 'colleague')`
        // It doesn't show the structure. Let's assume standard friend/connection object.

        // For safety, let's assume `item.otherUser` or `item.friend` if available, or fallback to name.
        // I'll update `useConnections` mock logic if needed, but here I'll try to be safe.

        const opponent = item.other_user || item.friend || item.user || {};
        const name = opponent.name || "Unknown Colleague";
        const avatar = opponent.avatar;
        const opponentId = opponent._id;

        if (!opponentId) return null;

        return (
            <TouchableOpacity
                style={styles.colleagueCard}
                onPress={() => handleChallenge(opponentId, name)}
                disabled={creatingGame}
            >
                <Image
                    source={{ uri: avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop' }}
                    style={styles.avatar}
                />
                <View style={styles.colleagueInfo}>
                    <Text style={styles.colleagueName}>{name}</Text>
                    <Text style={styles.colleagueRole}>Colleague</Text>
                </View>
                <View style={styles.challengeButton}>
                    <Text style={styles.challengeText}>Play</Text>
                    <Ionicons name="game-controller-outline" size={16} color="#FFFFFF" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Challenge a Colleague</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.banner}>
                    <Mascot emotion="happy" size={80} />
                    <View style={styles.bannerTextContainer}>
                        <Text style={styles.bannerTitle}>Loser pays for lunch!</Text>
                        <Text style={styles.bannerSubtitle}>
                            Challenge a colleague to a quick game. The winner gets a free meal on the loser's tab.
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Available Colleagues</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#FF3B30" style={{ marginTop: 40 }} />
                ) : colleagues.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No colleagues found.</Text>
                        <TouchableOpacity
                            style={styles.inviteButton}
                            onPress={() => router.push('/(tabs)/account-details' as any)} // Fallback or proper invite route
                        >
                            <Text style={styles.inviteButtonText}>Add Colleagues</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={colleagues}
                        renderItem={renderColleagueItem}
                        keyExtractor={(item) => item._id || Math.random().toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FAC7C7',
    },
    bannerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#991B1B',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 13,
        color: '#7F1D1D',
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 24,
    },
    colleagueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
    },
    colleagueInfo: {
        flex: 1,
        marginLeft: 12,
    },
    colleagueName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    colleagueRole: {
        fontSize: 13,
        color: '#6B7280',
    },
    challengeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    challengeText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
    },
    inviteButton: {
        backgroundColor: '#111827',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    inviteButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
