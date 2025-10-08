import { SignInScreen } from '@/components/SignInScreen';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SignInModal() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  return <SignInScreen onClose={() => router.replace('/(tabs)')} />;
}
