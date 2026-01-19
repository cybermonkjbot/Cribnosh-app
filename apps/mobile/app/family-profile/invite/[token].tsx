import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { useToast } from '@/lib/ToastContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

const familyIconSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H6C4.93913 15 3.92172 15.4214 3.17157 16.1716C2.42143 16.9217 2 17.9391 2 19V21" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 21V19C21.9993 18.1137 21.7044 17.2528 21.1614 16.5523C20.6184 15.8519 19.8581 15.3516 19 15.13" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const successIconSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.0976 8.53967 21.3056C6.52195 20.5136 4.80329 19.0694 3.68656 17.1822C2.56983 15.295 2.11289 13.0642 2.38283 10.9009C2.65277 8.73763 3.63546 6.75618 5.18685 5.24949C6.73824 3.7428 8.77708 2.79124 10.966 2.53589C13.155 2.28054 15.3789 2.73507 17.33 3.82" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 4L12 14.01L9 11.01" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const errorIconSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2"/>
  <line x1="12" y1="8" x2="12" y2="12" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="16" x2="12.01" y2="16" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export default function InviteAcceptancePage() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();
    const { user } = useAuthContext();
    const { showToast } = useToast();

    const [status, setStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // If we have a token and user is logged in, we could auto-accept.
        // However, it's often better to show a "Join Family" button for explicit consent and to avoid accidental clicks.
    }, [token, user]);

    const handleAccept = async () => {
        if (!token) {
            setErrorMessage('Invalid invitation link.');
            setStatus('error');
            return;
        }

        if (!user) {
            showToast({
                type: 'error',
                title: 'Valid Account Required',
                message: 'Please log in to join a family profile.',
                duration: 4000,
            });
            // In a real app, we might redirect to login with a ?redirect= param
            return;
        }

        try {
            setStatus('accepting');
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();

            if (!sessionToken) {
                throw new Error('Not authenticated');
            }

            await convex.mutation(api.mutations.familyProfiles.acceptInvitation, {
                invitation_token: token,
                user_id: user.id as any,
            });

            setStatus('success');
            showToast({
                type: 'success',
                title: 'Welcome to the Family!',
                message: 'You have successfully joined the family profile.',
                duration: 4000,
            });

        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            let msg = 'Failed to accept invitation. It may have expired.';
            if (error.message.includes('already exists')) msg = 'You are already in a family profile.';
            if (error.message.includes('not found')) msg = 'Invitation not found or expired.';

            setErrorMessage(msg);
            setStatus('error');
        }
    };

    const handleGoToProfile = () => {
        router.replace('/family-profile/manage');
    };

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    if (!token) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>Invalid Link</Text>
                    <Text style={styles.description}>This invitation link appears to be missing a token.</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                        <Text style={styles.secondaryButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {status === 'idle' && (
                    <>
                        <View style={styles.iconContainer}>
                            <SvgXml xml={familyIconSVG} width={70} height={70} />
                        </View>
                        <Text style={styles.title}>You've been invited!</Text>
                        <Text style={styles.description}>
                            You have been invited to join a CribNosh Family Profile.
                            This will allow you to share payment methods and budget tracking.
                        </Text>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleAccept}>
                            <Text style={styles.primaryButtonText}>Join Family</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                            <Text style={styles.secondaryButtonText}>Not Now</Text>
                        </TouchableOpacity>
                    </>
                )}

                {status === 'accepting' && (
                    <>
                        <ActivityIndicator size="large" color="#094327" style={styles.loader} />
                        <Text style={styles.title}>Joining Family...</Text>
                        <Text style={styles.description}>Please wait while we set up your profile.</Text>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <View style={[styles.iconContainer, { backgroundColor: '#E6F4EA' }]}>
                            <SvgXml xml={successIconSVG} width={70} height={70} />
                        </View>
                        <Text style={styles.title}>Welcome Home!</Text>
                        <Text style={styles.description}>
                            You are now a member of the family profile.
                            You can view shared budgets and payment methods in your profile settings.
                        </Text>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleGoToProfile}>
                            <Text style={styles.primaryButtonText}>View Family Profile</Text>
                        </TouchableOpacity>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <SvgXml xml={errorIconSVG} width={70} height={70} />
                        </View>
                        <Text style={[styles.title, { color: '#EF4444' }]}>Something went wrong</Text>
                        <Text style={styles.description}>
                            {errorMessage}
                        </Text>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleGoHome}>
                            <Text style={styles.primaryButtonText}>Go Home</Text>
                        </TouchableOpacity>
                    </>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontFamily: 'Archivo',
        fontWeight: '700',
        fontSize: 28,
        color: '#094327',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    primaryButton: {
        backgroundColor: '#094327',
        paddingVertical: 18,
        width: '100%',
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#094327',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
    },
    secondaryButton: {
        padding: 16,
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
    },
    loader: {
        marginBottom: 32,
    },
});
