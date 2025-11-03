import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface SharedLinkHandlerProps {
  groupId?: string;
  onLinkGenerated?: (link: string) => void;
}

export default function SharedLinkHandler({ groupId, onLinkGenerated }: SharedLinkHandlerProps) {
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateLink();
  }, [groupId]);

  const generateLink = async () => {
    setIsGenerating(true);
    
    try {
      // Generate a unique link for the group order
      const baseUrl = 'https://cribnosh.app/shared-link';
      const uniqueId = groupId || Date.now().toString();
      const link = `${baseUrl}?group=${uniqueId}`;
      
      setGeneratedLink(link);
      onLinkGenerated?.(link);
    } catch (error) {
      console.error('Error generating link:', error);
      Alert.alert('Error', 'Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareLink = async () => {
    if (!generatedLink) return;

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(generatedLink, {
          mimeType: 'text/plain',
          dialogTitle: 'Share group order link',
        });
      } else {
        // Fallback to clipboard if sharing is not available
        await Clipboard.setStringAsync(generatedLink);
        Alert.alert('Link Copied', 'The group order link has been copied to your clipboard');
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link');
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;

    try {
      await Clipboard.setStringAsync(generatedLink);
      Alert.alert('Copied!', 'Link copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  return {
    generatedLink,
    isGenerating,
    shareLink,
    copyToClipboard,
    regenerateLink: generateLink,
  };
}

// Hook for using the shared link functionality
export function useSharedLink(groupId?: string) {
  const [linkData, setLinkData] = useState<{
    link: string;
    isGenerating: boolean;
  }>({
    link: '',
    isGenerating: false,
  });

  const handler = SharedLinkHandler({ 
    groupId, 
    onLinkGenerated: (link) => setLinkData(prev => ({ ...prev, link }))
  });

  return {
    ...handler,
    link: linkData.link,
    isGenerating: linkData.isGenerating,
  };
}
