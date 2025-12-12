import { SignInScreen } from '@/components/SignInScreen';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useAuth } from '@/hooks/useAuth';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

export default function SignInModal() {
  const router = useRouter();
  const { isAuthenticated, login, user } = useChefAuth();
  const { handleAppleSignIn: appleSignInApi, handleGoogleSignIn: googleSignInApi } = useAuth();
  const params = useLocalSearchParams<{
    returnPath?: string;
    returnParams?: string;
    notDismissable?: string; // Passed as string in URL params
  }>();
  const hasNavigatedRef = useRef(false);

  // Parse notDismissable from params (comes as string from URL)
  const notDismissable = params.notDismissable === 'true';

  // Dynamic screen options based on notDismissable
  // Keep presentation as 'modal' (page sheet) in both cases to maintain consistent appearance
  // Only control gesture dismissal based on notDismissable
  const screenOptions = useMemo(() => ({
    headerShown: false,
    presentation: 'modal' as const,
    animation: 'slide_from_bottom' as const,
    gestureEnabled: !notDismissable, // Disable gesture dismissal when notDismissable is true
    animationTypeForReplace: 'push' as const,
  }), [notDismissable]);

  // Navigate after successful authentication
  const navigateAfterAuth = useCallback((userData?: any) => {
    if (hasNavigatedRef.current) return;

    // Check if user needs onboarding
    const needsOnboarding = userData?.isNewUser === true || user?.isNewUser === true;

    hasNavigatedRef.current = true;

    // If there's a return path, navigate there with params (skip onboarding)
    if (params.returnPath) {
      try {
        const returnParams = params.returnParams
          ? JSON.parse(decodeURIComponent(params.returnParams))
          : {};

        router.replace({
          pathname: params.returnPath as any,
          params: returnParams,
        });
      } catch (error) {
        console.error('Error parsing return params:', error);
        // Fallback to just the return path
        router.replace(params.returnPath as any);
      }
    } else if (needsOnboarding) {
      // Navigate to onboarding for new users
      router.replace('/(tabs)/chef/onboarding');
    } else {
      router.replace('/(tabs)/chef' as any);
    }
  }, [user, router, params.returnPath, params.returnParams]);

  // Close modal if user becomes authenticated (fallback for when query resolves)
  useEffect(() => {
    if (isAuthenticated && !hasNavigatedRef.current) {
      navigateAfterAuth();
    }
  }, [isAuthenticated, user, navigateAfterAuth]);

  const handleClose = () => {
    // If notDismissable is true, don't allow closing
    if (notDismissable) {
      return;
    }

    // When user cancels from sign-in, navigate to chef dashboard
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chef' as any);
    }
  };

  const handleGoogleSignIn = async (accessToken: string) => {
    try {
      const result = await googleSignInApi(accessToken);

      // Check if 2FA is required
      if (result.requires2FA && result.verificationToken) {
        // Navigate to 2FA verification screen
        router.push({
          pathname: '/verify-2fa' as any,
          params: { verificationToken: result.verificationToken },
        });
        return;
      }

      if (result.token && result.user) {
        await login(result.token, result.user);
        // Navigate immediately after login
        navigateAfterAuth(result.user);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleAppleSignIn = async (identityToken: string) => {
    try {
      const result = await appleSignInApi(identityToken);

      // Check if 2FA is required
      if (result.requires2FA && result.verificationToken) {
        // Navigate to 2FA verification screen
        router.push({
          pathname: '/verify-2fa' as any,
          params: { verificationToken: result.verificationToken },
        });
        return;
      }

      if (result.token && result.user) {
        await login(result.token, result.user);
        // Navigate immediately after login
        navigateAfterAuth(result.user);
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  };

  const handleSignInSuccess = useCallback(() => {
    // This is called by EmailSignInModal after successful login
    // The login has already been called, so we just need to navigate
    // Use a small delay to ensure login state is updated
    setTimeout(() => {
      navigateAfterAuth();
    }, 100);
  }, [navigateAfterAuth]);

  return (
    <>
      <Stack.Screen options={screenOptions} />
      <SignInScreen
        onClose={handleClose}
        onAppleSignIn={handleAppleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        notDismissable={notDismissable}
        onSignInSuccess={handleSignInSuccess}
      />
    </>
  );
}
