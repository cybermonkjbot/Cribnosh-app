import React from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CribNoshLogo } from './ui/CribNoshLogo';

interface ChefOnboardingGDPRScreenProps {
    onNext?: () => void;
    onSkip?: () => void;
    backgroundImage?: any;
}

export const ChefOnboardingGDPRScreen: React.FC<ChefOnboardingGDPRScreenProps> = ({
    onNext,
    onSkip,
    backgroundImage,
}) => {
    const insets = useSafeAreaInsets();

    const handleNext = () => {
        onNext?.();
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={backgroundImage || require('../assets/images/signin-background.jpg')}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* CribNosh Logo - positioned in upper left */}
                <View style={styles.logoContainer}>
                    <CribNoshLogo size={172} variant="default" />
                </View>

                {/* Onboarding Content Card */}
                <View style={[styles.cardContainer, { bottom: 0 }]}>
                    <ScrollView
                        style={styles.contentCard}
                        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Data Privacy Notice</Text>
                        </View>

                        {/* Description */}
                        <Text style={styles.description}>
                            We value your privacy and are committed to protecting your personal data as a chef on our platform.
                        </Text>

                        {/* GDPR Notice Content */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How we use your data</Text>
                            <Text style={styles.text}>
                                We use your personal data to manage your chef profile, process orders, and facilitate payments. Your information is securely stored and shared only as necessary to provide our services.
                            </Text>
                            <Text style={[styles.text, { marginTop: 12 }]}>
                                By continuing, you acknowledge that you have read and understood our Privacy Policy and Terms of Service, and agree to the processing of your personal data as described therein.
                            </Text>
                        </View>

                    </ScrollView>

                    {/* Floating Continue Button */}
                    <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
                        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
                            <Text style={styles.continueButtonText}>I Agree & Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        position: 'absolute',
        left: 24,
        top: 90,
        zIndex: 1,
    },
    cardContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '75%', // Matches ChefOnboardingProfileScreen
        zIndex: 2,
    },
    contentCard: {
        flex: 1,
        width: '100%',
        backgroundColor: '#FAFFFA', // Matches ChefOnboardingProfileScreen
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 40,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FAFFFA', // Matches ChefOnboardingProfileScreen
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    title: {
        fontFamily: 'Poppins',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 28,
        lineHeight: 36,
        color: '#111827',
        flex: 1,
        marginRight: 16,
    },
    description: {
        fontFamily: 'SF Pro',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 24,
        color: '#6B7280',
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Poppins',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 18,
        lineHeight: 24,
        color: '#111827',
        marginBottom: 16,
    },
    text: {
        fontFamily: 'SF Pro',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 24,
        color: '#111827',
    },
    continueButton: {
        backgroundColor: '#094327',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    continueButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 20,
        color: '#FFFFFF',
    },
});

export default ChefOnboardingGDPRScreen;
