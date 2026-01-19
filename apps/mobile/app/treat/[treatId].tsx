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

const giftIconSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 12V22H4V12" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 7H2V12H22V7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 22V7" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.12 6.12 2 7.5 2C9 2 12 7 12 7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.12 17.88 2 16.5 2C15 2 12 7 12 7Z" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const checkCircleSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.0976 8.53967 21.3056C6.52195 20.5136 4.80329 19.0694 3.68656 17.1822C2.56983 15.295 2.11289 13.0642 2.38283 10.9009C2.65277 8.73763 3.63546 6.75618 5.18685 5.24949C6.73824 3.7428 8.77708 2.79124 10.966 2.53589C13.155 2.28054 15.3789 2.73507 17.33 3.82" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 4L12 14.01L9 11.01" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const errorIconSVG = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2"/>
  <line x1="12" y1="8" x2="12" y2="12" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" y1="16" x2="12.01" y2="16" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export default function TreatPage() {
  const { treatId } = useLocalSearchParams<{ treatId: string }>(); // TreatId acts as token here
  const router = useRouter();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [treatData, setTreatData] = useState<any>(null);
  const [errorState, setErrorState] = useState<{ title: string; message: string } | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadTreatData();
  }, [treatId]);

  const loadTreatData = async () => {
    if (!treatId) {
      setErrorState({
        title: 'Invalid Link',
        message: 'This treat link appears to be invalid.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const convex = getConvexClient();
      // Using mutation for 'get' because it might update status to expired
      const treat = await convex.mutation(api.mutations.treats.getTreatByToken, {
        treat_token: treatId,
      });

      if (!treat) {
        setErrorState({
          title: 'Treat Not Found',
          message: "We couldn't find this treat. It may have been deleted or the link is incorrect.",
        });
      } else if (treat.status === 'claimed') {
        setErrorState({
          title: 'Already Claimed',
          message: 'This treat has already been claimed.',
        });
      } else if (treat.status === 'expired') {
        setErrorState({
          title: 'Treat Expired',
          message: 'Unfortunately, this treat has expired.',
        });
      } else if (treat.status === 'cancelled') {
        setErrorState({
          title: 'Treat Cancelled',
          message: 'This treat was cancelled by the sender.',
        });
      } else {
        setTreatData(treat);
      }
    } catch (error) {
      console.error('Error loading treat:', error);
      setErrorState({
        title: 'Error',
        message: 'Failed to load treat. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !treatData) return;

    try {
      setIsClaiming(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        // If not logged in, we should likely redirect to login with a return URL
        // But for now assuming context handles basic auth state, show toast
        showToast({
          type: 'error',
          title: 'Login Required',
          message: 'Please log in to claim this treat.',
          duration: 3000
        });
        return;
      }

      await convex.mutation(api.mutations.treats.claimTreat, {
        treat_token: treatId as string,
        treated_user_id: user.id as any,
      });

      setSuccess(true);
      showToast({
        type: 'success',
        title: 'Treat Claimed!',
        message: `£${treatData.metadata?.amount?.toFixed(2)} has been added to your credits.`,
        duration: 4000,
      });

    } catch (error: any) {
      console.error('Error claiming treat:', error);
      showToast({
        type: 'error',
        title: 'Claim Failed',
        message: error?.message || 'Failed to claim treat. It may have expired.',
        duration: 4000,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#094327" />
          <Text style={styles.loadingText}>Unwrapping your treat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <SvgXml xml={errorIconSVG} width={80} height={80} style={styles.icon} />
          <Text style={styles.errorTitle}>{errorState.title}</Text>
          <Text style={styles.description}>{errorState.message}</Text>
          <TouchableOpacity style={styles.button} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <SvgXml xml={checkCircleSVG} width={80} height={80} style={styles.icon} />
          <Text style={styles.successTitle}>Yay! Treat Claimed</Text>
          <Text style={styles.description}>
            £{treatData?.metadata?.amount?.toFixed(2)} is now available in your account.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Order Something Yummy</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.treatCard}>
          <View style={styles.iconContainer}>
            <SvgXml xml={giftIconSVG} width={60} height={60} />
          </View>

          <Text style={styles.senderLabel}>GIFT FROM</Text>
          <Text style={styles.senderName}>{treatData?.metadata?.creator_name || 'A Friend'}</Text>

          <Text style={styles.amount}>£{treatData?.metadata?.amount?.toFixed(2)}</Text>

          {treatData?.metadata?.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>"{treatData.metadata.message}"</Text>
            </View>
          )}

          <Text style={styles.helperText}>
            Use this credit towards your next order on CribNosh.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.claimButton}
          onPress={handleClaim}
          disabled={isClaiming}
        >
          {isClaiming ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.claimButtonText}>Claim Treat</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleGoHome} disabled={isClaiming}>
          <Text style={styles.cancelButtonText}>Not Now</Text>
        </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
  },
  icon: {
    marginBottom: 24,
  },
  errorTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    color: '#EF4444',
    marginBottom: 12,
  },
  successTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    color: '#094327',
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#094327',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
  treatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: '#E6F4EA',
    borderRadius: 50,
    padding: 16,
  },
  senderLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  senderName: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 24,
  },
  amount: {
    fontFamily: 'Archivo',
    fontWeight: '800',
    fontSize: 48,
    color: '#094327',
    marginBottom: 24,
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  messageText: {
    fontFamily: 'Inter',
    fontStyle: 'italic',
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  helperText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  claimButton: {
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
  claimButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
  },
});
