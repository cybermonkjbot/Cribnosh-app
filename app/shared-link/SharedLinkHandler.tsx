import { useRouter } from 'expo-router';
import { useEffect } from 'react';

interface SharedLinkHandlerProps {
  treatId?: string;
  treatName?: string;
}

export function SharedLinkHandler({ treatId, treatName }: SharedLinkHandlerProps) {
  const router = useRouter();

  useEffect(() => {
    // Handle treat parameters without deep linking
    if (treatId) {
      console.log('Treat handler - treatId:', treatId);
      console.log('Treat handler - treatName:', treatName);
      
      // Navigate to shared-link page with the treat parameters
      router.navigate({
        pathname: "/shared-link",
        params: { treatId, treatName },
      });
    } else {
      console.log('No treat ID provided, redirecting to shared-link');
      // Fallback to shared-link page
      router.navigate("/shared-link");
    }
  }, [treatId, treatName, router]);

  return null; // This component doesn't render anything
}

// Add default export for route compatibility
export default function SharedLinkHandlerDefault() {
  return <SharedLinkHandler />;
}
