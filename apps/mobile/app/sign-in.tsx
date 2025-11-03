import { SignInScreen } from '@/components/SignInScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { markSignInAsVisible, markSignInAsHidden } from '@/utils/signInNavigationGuard';

export default function SignInModal() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthContext();
  const { handleAppleSignIn: appleSignInApi } = useAuth();
  const params = useLocalSearchParams<{ returnPath?: string; returnParams?: string }>();

  // Mark sign-in as visible when component mounts
  useEffect(() => {
    markSignInAsVisible();
    
    // Mark as hidden when component unmounts
    return () => {
      markSignInAsHidden();
    };
  }, []);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Mark as hidden before navigating away
      markSignInAsHidden();
      
      // If there's a return path, navigate there with params
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
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, router, params.returnPath, params.returnParams]);

  const handleClose = () => {
    // Mark as hidden before closing
    markSignInAsHidden();
    
    // When user cancels from sign-in:
    // - If we have a returnPath (came from 401 redirect from a modal),
    //   we need to dismiss both modals (sign-in and the previous one like shared-ordering)
    //   by going back twice
    // - Otherwise, just go back normally
    // This prevents duplicate modals when canceling from a 401 redirect
    if (params.returnPath) {
      // Came from a 401 redirect - need to dismiss both modals
      // Go back to dismiss sign-in modal, then go back again to dismiss the previous modal
      if (router.canGoBack()) {
        router.back();
        // Use setTimeout to allow the first back to complete before going back again
        setTimeout(() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            // If we can't go back further, navigate to tabs
            router.replace('/(tabs)');
          }
        }, 100);
      } else {
        router.replace('/(tabs)');
      }
    } else if (router.canGoBack()) {
      // Normal case - just go back
      router.back();
    } else {
      // Fallback if we can't go back (shouldn't happen in normal flow)
      router.replace('/(tabs)');
    }
  };

  const handleAppleSignIn = async (identityToken: string) => {
    try {
      const result = await appleSignInApi(identityToken);
      if (result.token && result.user) {
        await login(result.token, result.user);
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SignInScreen onClose={handleClose} onAppleSignIn={handleAppleSignIn} />
    </>
  );
}
