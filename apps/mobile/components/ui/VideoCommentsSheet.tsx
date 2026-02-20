// @ts-nocheck
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { MessageCircle, Send, ThumbsUp, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommentUser {
    _id: string;
    name: string;
    avatar?: string;
}

interface Comment {
    _id: string;
    content: string;
    likesCount: number;
    createdAt: number;
    user: CommentUser;
    replies: Comment[];
}

interface VideoCommentsSheetProps {
    videoId: string | null;
    onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function CommentRow({
    comment,
    onLike,
    depth = 0,
}: {
    comment: Comment;
    onLike: (commentId: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={[styles.commentRow, depth > 0 && styles.replyRow]}>
            {/* Avatar */}
            <View style={styles.avatar}>
                {comment.user.avatar ? (
                    <Image source={{ uri: comment.user.avatar }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>{comment.user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
            </View>

            <View style={styles.commentBody}>
                {/* Name + time */}
                <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{comment.user.name}</Text>
                    <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
                </View>

                {/* Content */}
                <Text style={styles.commentContent}>{comment.content}</Text>

                {/* Actions */}
                <View style={styles.commentActions}>
                    <TouchableOpacity style={styles.likeAction} onPress={() => onLike(comment._id)}>
                        <ThumbsUp size={13} color="#888" />
                        {comment.likesCount > 0 && (
                            <Text style={styles.likeCount}>{comment.likesCount}</Text>
                        )}
                    </TouchableOpacity>
                    {depth === 0 && comment.replies.length > 0 && (
                        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                            <Text style={styles.repliesToggle}>
                                {expanded ? 'Hide replies' : `${comment.replies.length} replies`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Replies */}
                {expanded && comment.replies.map((reply) => (
                    <CommentRow key={reply._id} comment={reply} onLike={onLike} depth={1} />
                ))}
            </View>
        </View>
    );
}

export function VideoCommentsSheet({ videoId, onClose }: VideoCommentsSheetProps) {
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(600)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [inputText, setInputText] = useState('');
    const inputRef = useRef<TextInput>(null);

    // Slide in / out
    useEffect(() => {
        if (videoId) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8 }),
                Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [videoId]);

    const handleClose = useCallback(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }),
            Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onClose());
    }, [onClose, slideAnim, backdropAnim]);

    // Fetch comments
    useEffect(() => {
        if (!videoId) return;
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            try {
                const convex = getConvexClient();
                const result = await convex.query(api.queries.videoComments.getVideoComments, {
                    videoId: videoId as any,
                    limit: 30,
                });
                if (!cancelled) setComments(result.comments as Comment[]);
            } catch (e) {
                console.warn('Failed to load comments', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [videoId]);

    const handleLike = useCallback(async (commentId: string) => {
        try {
            const convex = getConvexClient();
            await convex.mutation(api.mutations.videoComments.likeComment, {
                commentId: commentId as any,
            });
            // Optimistic update
            setComments((prev) =>
                prev.map((c) =>
                    c._id === commentId ? { ...c, likesCount: c.likesCount + 1 } : c
                )
            );
        } catch (e) {
            console.warn('Failed to like comment', e);
        }
    }, []);

    const handleSend = useCallback(async () => {
        if (!inputText.trim() || !videoId || submitting) return;
        const text = inputText.trim();
        setInputText('');
        setSubmitting(true);
        try {
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();
            if (!sessionToken) return;

            const commentId = await convex.action(api.actions.search.customerAddVideoComment, {
                sessionToken,
                videoId: videoId as any,
                content: text,
            });

            // Optimistic: add a placeholder comment at the top
            const placeholder: Comment = {
                _id: typeof commentId === 'string' ? commentId : String(commentId),
                content: text,
                likesCount: 0,
                createdAt: Date.now(),
                user: { _id: 'me', name: 'You' },
                replies: [],
            };
            setComments((prev) => [placeholder, ...prev]);
        } catch (e) {
            console.warn('Failed to send comment', e);
        } finally {
            setSubmitting(false);
        }
    }, [inputText, videoId, submitting]);

    if (!videoId) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, { opacity: backdropAnim }]}
                pointerEvents="auto"
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    { paddingBottom: insets.bottom + 8 },
                    { transform: [{ translateY: slideAnim }] },
                ]}
                pointerEvents="auto"
            >
                {/* Handle + Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <View style={styles.headerRow}>
                        <MessageCircle size={18} color="#222" />
                        <Text style={styles.headerTitle}>Comments</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <X size={20} color="#555" />
                    </TouchableOpacity>
                </View>

                {/* Comments list */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color="#094327" />
                    </View>
                ) : comments.length === 0 ? (
                    <View style={styles.center}>
                        <MessageCircle size={36} color="#ccc" />
                        <Text style={styles.emptyText}>No comments yet. Be first!</Text>
                    </View>
                ) : (
                    <FlatList
                        data={comments}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <CommentRow comment={item} onLike={handleLike} />
                        )}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Input */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Add a comment…"
                            placeholderTextColor="#aaa"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!inputText.trim() || submitting) && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Send size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ddd',
        alignSelf: 'center',
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        top: 18,
        padding: 4,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 14,
    },
    commentRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    replyRow: {
        marginLeft: 32,
        marginTop: 10,
    },
    avatar: {
        width: 36,
        height: 36,
    },
    avatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#094327',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    commentBody: {
        flex: 1,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    commentTime: {
        fontSize: 11,
        color: '#aaa',
    },
    commentContent: {
        fontSize: 14,
        color: '#333',
        lineHeight: 19,
    },
    commentActions: {
        flexDirection: 'row',
        gap: 14,
        marginTop: 5,
        alignItems: 'center',
    },
    likeAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    likeCount: {
        fontSize: 12,
        color: '#888',
    },
    repliesToggle: {
        fontSize: 12,
        color: '#094327',
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111',
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#094327',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: '#ccc',
    },
});
