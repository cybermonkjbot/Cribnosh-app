import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

// Icons
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const copyIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24264C20 6.71221 19.7893 6.20357 19.4142 5.82843L16.1716 2.58579C15.7964 2.21071 15.2878 2 14.7574 2H10C8.89543 2 8 2.89543 8 4Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 18V20C16 21.1046 15.1046 22 14 22H6C4.89543 22 4 21.1046 4 20V8C4 6.89543 4.89543 6 6 6H8" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const shareIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 6L12 2L8 6" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 2V15" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const giftIconSVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 12V22H4V12" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 7H2V12H22V7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 22V7" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.12 6.12 2 7.5 2C9 2 12 7 12 7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.12 17.88 2 16.5 2C15 2 12 7 12 7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface CreateTreatSheetProps {
    isVisible: boolean;
    onClose: () => void;
}

export function CreateTreatSheet({ isVisible, onClose }: CreateTreatSheetProps) {
    const snapPoints = useMemo(() => ['85%'], []);
    const { showToast } = useToast();
    const { user } = useAuthContext();

    const [step, setStep] = useState<'create' | 'share'>('create');
    const [amount, setAmount] = useState('15.00');
    const [message, setMessage] = useState("Here's a treat on me! 🍔");
    const [isCreating, setIsCreating] = useState(false);
    const [createdTreat, setCreatedTreat] = useState<{ token: string; url: string } | null>(null);

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) {
                onClose();
                // Reset state after a delay to ensure smooth closing
                setTimeout(() => {
                    setStep('create');
                    setAmount('15.00');
                    setMessage("Here's a treat on me! 🍔");
                    setCreatedTreat(null);
                }, 300);
            }
        },
        [onClose]
    );

    const handleCreateTreat = async () => {
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            showToast({
                type: 'error',
                title: 'Invalid Amount',
                message: 'Please enter a valid amount for the treat.',
                duration: 3000,
            });
            return;
        }

        try {
            setIsCreating(true);
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();

            if (!sessionToken || !user) {
                throw new Error('Not authenticated');
            }

            // Call the backend mutation
            // We pass the amount and message in metadata since createTreat doesn't have explicit fields for them
            const result = await convex.mutation(api.mutations.treats.createTreat, {
                treater_id: user.id as any, // ID types are tricky in client-side, casting to any or string often needed
                expires_in_hours: 48, // 2 days expiration
                metadata: {
                    amount: parseFloat(amount),
                    message: message,
                    currency: 'GBP',
                    creator_name: user?.name || 'A friend',
                },
            });

            const treatUrl = `cribnosh://treat/${result.treat_token}`;
            setCreatedTreat({
                token: result.treat_token,
                url: treatUrl,
            });
            setStep('share');

        } catch (error: any) {
            console.error('Error creating treat:', error);
            showToast({
                type: 'error',
                title: 'Failed to Create Treat',
                message: error?.message || 'Something went wrong. Please try again.',
                duration: 4000,
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleShare = async () => {
        if (!createdTreat) return;

        try {
            await Share.share({
                message: `${message}\n\nClaim your £${amount} treat here: ${createdTreat.url}`,
                title: 'You got a treat!',
                url: createdTreat.url, // iOS only
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleCopy = async () => {
        if (!createdTreat) return;

        await Clipboard.setStringAsync(createdTreat.url);
        showToast({
            type: 'success',
            title: 'Link Copied',
            message: 'Treat link copied to clipboard!',
            duration: 2000,
        });
    };

    if (!isVisible) return null;

    return (
        <BottomSheetBase
            snapPoints={snapPoints}
            index={0}
            onChange={handleSheetChanges}
            enablePanDownToClose={!isCreating}
            backgroundStyle={styles.bottomSheetBackground}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Send a Treat</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isCreating}>
                        <SvgXml xml={closeIconSVG} width={24} height={24} />
                    </TouchableOpacity>
                </View>

                {step === 'create' ? (
                    <View style={styles.content}>
                        <View style={styles.heroIcon}>
                            <SvgXml xml={giftIconSVG} width={48} height={48} />
                        </View>

                        <Text style={styles.description}>
                            Create a prepaid link that your friends or family can use to order their favorite meal.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount (£)</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0.00"
                                editable={!isCreating}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Message</Text>
                            <TextInput
                                style={styles.messageInput}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={3}
                                placeholder="Add a personal note..."
                                editable={!isCreating}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.createButton, isCreating && styles.disabledButton]}
                            onPress={handleCreateTreat}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Treat Link</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.successIcon}>
                            <SvgXml xml={giftIconSVG} width={64} height={64} />
                        </View>
                        <Text style={styles.successTitle}>Treat Created!</Text>
                        <Text style={styles.successDescription}>
                            Share this link with your friend. They can use it to pay for their order up to £{amount}.
                        </Text>

                        <View style={styles.linkContainer}>
                            <Text style={styles.linkText} numberOfLines={1}>
                                {createdTreat?.url}
                            </Text>
                            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                                <SvgXml xml={copyIconSVG} width={20} height={20} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <SvgXml xml={shareIconSVG} width={24} height={24} style={styles.shareIcon} />
                            <Text style={styles.shareButtonText}>Share Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                            <Text style={styles.secondaryButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </BottomSheetBase>
    );
}

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Archivo',
        fontWeight: '700',
        fontSize: 24,
        color: '#094327',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        alignItems: 'center',
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E6F4EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    description: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    amountInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        fontWeight: '700',
        color: '#094327',
        textAlign: 'center',
    },
    messageInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        height: 100,
        textAlignVertical: 'top',
    },
    createButton: {
        width: '100%',
        backgroundColor: '#094327',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
        shadowColor: '#094327',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    successIcon: {
        marginBottom: 20,
    },
    successTitle: {
        fontFamily: 'Archivo',
        fontWeight: '700',
        fontSize: 28,
        color: '#094327',
        marginBottom: 10,
    },
    successDescription: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    linkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        marginBottom: 20,
    },
    linkText: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#6B7280',
        marginRight: 10,
    },
    copyButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    shareButton: {
        flexDirection: 'row',
        width: '100%',
        backgroundColor: '#094327',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#094327',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    shareIcon: {
        marginRight: 10,
        // Note: SvgXml style prop support depends on library version, simpler to wrap if needed
    },
    shareButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    secondaryButton: {
        padding: 16,
    },
    secondaryButtonText: {
        color: '#094327',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});
