import { useAuthContext } from '@/contexts/AuthContext';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { showError, showSuccess } from '@/lib/GlobalToastManager';
import { LiveComment } from '@/types/customer';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { FlipHorizontal, Mic, MicOff, Pin, Settings, Share, X, Zap, ZapOff } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../../packages/convex/_generated/api';
import LiveComments from '../LiveComments';
import { CribnoshLiveHeader } from './CribnoshLiveHeader';

interface LiveBroadcasterScreenProps {
    sessionId: string;
    onClose: () => void;
}

const LiveBroadcasterScreen: React.FC<LiveBroadcasterScreenProps> = ({ sessionId, onClose }) => {
    const { isAuthenticated } = useAuthContext();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Camera State
    const cameraRef = useRef<any>(null);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
    const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
    const [isMuted, setIsMuted] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Live session state
    const [sessionData, setSessionData] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [liveCommentsData, setLiveCommentsData] = useState<any>(null);
    const [liveViewersData, setLiveViewersData] = useState<any>(null);
    const [isEnding, setIsEnding] = useState(false);

    useEffect(() => {
        (async () => {
            const { Camera } = await import('expo-camera');
            const { status } = await Camera.requestCameraPermissionsAsync();
            const audioStatus = await Camera.requestMicrophonePermissionsAsync();
            setHasPermission(status === 'granted' && audioStatus.status === 'granted');
        })();
    }, []);

    // Fetch initial session
    useEffect(() => {
        const fetchLiveSession = async () => {
            if (!sessionId || !isAuthenticated) return;
            try {
                const convex = getConvexClient();
                const sessionToken = await getSessionToken();
                if (!sessionToken) return;

                const result = await convex.action(api.actions.liveStreaming.customerGetLiveSession, {
                    sessionToken,
                    sessionId,
                });

                if (result.success !== false) {
                    setSessionData({
                        data: {
                            session: result.session,
                            meal: result.session.meal,
                            foodCreator: result.session.foodCreator || result.session.foodCreator,
                        },
                    });
                }
            } catch (error) {
                console.error('Error fetching live session:', error);
            } finally {
                setIsLoadingSession(false);
            }
        };
        fetchLiveSession();
    }, [sessionId, isAuthenticated]);

    // Viewers/Comments Polling
    const appState = useRef(AppState.currentState);
    useEffect(() => {
        if (!sessionId || !isAuthenticated) return;

        let commentsInterval: ReturnType<typeof setInterval>;
        let viewersInterval: ReturnType<typeof setInterval>;

        const fetchComments = async () => {
            try {
                const convex = getConvexClient();
                const sessionToken = await getSessionToken();
                if (!sessionToken) return;
                const result = await convex.action(api.actions.liveStreaming.customerGetLiveComments, {
                    sessionToken, sessionId, limit: 50, offset: 0,
                });
                if (result.success !== false) setLiveCommentsData({ success: true, data: { comments: result.comments || [] } });
            } catch (e) { }
        };

        const fetchViewers = async () => {
            try {
                const convex = getConvexClient();
                const sessionToken = await getSessionToken();
                if (!sessionToken) return;
                const result = await convex.action(api.actions.liveStreaming.customerGetLiveViewers, {
                    sessionToken, sessionId, limit: 100, offset: 0,
                });
                if (result.success !== false) setLiveViewersData({ success: true, data: { summary: { totalViewers: result.total || 0 } } });
            } catch (e) { }
        };

        const startPolling = () => {
            commentsInterval = setInterval(() => { if (appState.current === 'active') fetchComments(); }, 5000);
            viewersInterval = setInterval(() => { if (appState.current === 'active') fetchViewers(); }, 10000);
        };

        fetchComments();
        fetchViewers();
        startPolling();

        const subscription = AppState.addEventListener('change', (next) => {
            if (appState.current.match(/inactive|background/) && next === 'active') startPolling();
            else if (appState.current === 'active' && next.match(/inactive|background/)) {
                clearInterval(commentsInterval);
                clearInterval(viewersInterval);
            }
            appState.current = next;
        });

        return () => {
            clearInterval(commentsInterval);
            clearInterval(viewersInterval);
            subscription.remove();
        };
    }, [sessionId, isAuthenticated]);

    const handleEndLive = async () => {
        setIsEnding(true);
        try {
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();
            if (sessionToken) {
                await convex.action(api.actions.liveSessions.endLiveSession, { sessionToken, sessionId });
            }
            onClose();
        } catch (err: any) {
            showError('Failed to end stream', err.message);
            setIsEnding(false);
        }
    };

    const handleSwapCamera = () => {
        setCameraType((prev) => (prev === 'front' ? 'back' : 'front'));
    };

    const handleToggleFlash = () => {
        setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
    };

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleShare = () => {
        // Placeholder for native share
        showSuccess('Link Copied!', 'Ready to share your stream link.');
    };

    const handlePinMeal = () => {
        // Placeholder for pinning the meal to the top of the chat
        showSuccess('Meal Pinned!', 'Viewers can now order this meal directly from the stream.');
    };

    const viewerCount = liveViewersData?.data?.summary?.totalViewers || 0;

    const liveComments = useMemo(() => {
        if (liveCommentsData?.data?.comments) {
            return liveCommentsData.data.comments.map((comment: LiveComment) => ({
                name: comment.userDisplayName || 'Anonymous',
                comment: comment.content,
            }));
        }
        return [];
    }, [liveCommentsData]);

    if (hasPermission === null || isLoadingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E6FFE8" />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Camera & Mic access required to stream.</Text>
                <TouchableOpacity style={styles.endButton} onPress={onClose}>
                    <Text style={styles.endButtonText}>Close</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {/* Full Screen Camera View */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={cameraType}
                flash={flashMode}
                mute={isMuted}
            />

            {/* Live Overlays (Dark Gradient Cover) */}
            <View style={styles.overlayContainer}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <CribnoshLiveHeader
                        foodCreatorTitle={sessionData?.data?.foodCreator?.name || 'You'}
                        viewers={viewerCount}
                    />

                    {/* Broadcaster Overrides */}
                    <TouchableOpacity onPress={handleEndLive} style={styles.closeControl}>
                        <X color="#FFF" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Broadcaster Controls (Right Side) */}
                <View style={styles.rightControls}>
                    <TouchableOpacity style={styles.controlIcon} onPress={handleSwapCamera}>
                        <FlipHorizontal color="#FFF" size={24} />
                        <Text style={styles.controlText}>Flip</Text>
                    </TouchableOpacity>

                    {cameraType === 'back' && (
                        <TouchableOpacity style={styles.controlIcon} onPress={handleToggleFlash}>
                            {flashMode === 'on' ? <Zap color="#FFF" size={24} /> : <ZapOff color="#FFF" size={24} />}
                            <Text style={styles.controlText}>Flash</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.controlIcon} onPress={handleToggleMute}>
                        {isMuted ? <MicOff color="#FFF" size={24} /> : <Mic color="#FFF" size={24} />}
                        <Text style={styles.controlText}>{isMuted ? 'Muted' : 'Mic'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlIcon} onPress={handleShare}>
                        <Share color="#FFF" size={24} />
                        <Text style={styles.controlText}>Share</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlIcon}>
                        <Settings color="#FFF" size={24} />
                        <Text style={styles.controlText}>Settings</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Area (Chat & Controls) */}
                <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.chatArea}>
                        <LiveComments comments={liveComments} />
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.pinMealButton}
                            onPress={handlePinMeal}
                        >
                            <Pin color="#000" size={18} />
                            <Text style={styles.pinMealText}>Pin Meal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.endStreamButton}
                            onPress={handleEndLive}
                            disabled={isEnding}
                        >
                            <Text style={styles.endStreamText}>{isEnding ? 'Ending...' : 'End Live'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#FFF', fontSize: 18, textAlign: 'center', marginTop: 100, paddingHorizontal: 40 },
    overlayContainer: { flex: 1, justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
    closeControl: { position: 'absolute', right: 20, top: 40, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    rightControls: { position: 'absolute', right: 20, top: 120, gap: 24, zIndex: 10, alignItems: 'center' },
    controlIcon: { alignItems: 'center', gap: 6 },
    controlText: { color: '#FFF', fontSize: 12, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    bottomArea: { paddingHorizontal: 16, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
    chatArea: { height: 250, marginBottom: 16 },
    actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, alignItems: 'center', marginTop: 10 },
    pinMealButton: { backgroundColor: '#E6FFE8', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30 },
    pinMealText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    endStreamButton: { backgroundColor: '#FF3B30', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
    endStreamText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    endButton: { backgroundColor: '#333', padding: 16, borderRadius: 8, marginHorizontal: 40, marginTop: 40, alignItems: 'center' },
    endButtonText: { color: '#FFF', fontWeight: 'bold' }
});

export default LiveBroadcasterScreen;
