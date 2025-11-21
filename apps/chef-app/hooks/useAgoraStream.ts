import { useEffect, useRef, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Platform } from 'react-native';

// Agora types
interface AgoraConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
}

interface UseAgoraStreamOptions {
  channelName: string;
  enabled: boolean;
  onStreamStarted?: () => void;
  onStreamError?: (error: Error) => void;
}

export function useAgoraStream({
  channelName,
  enabled,
  onStreamStarted,
  onStreamError,
}: UseAgoraStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const agoraEngineRef = useRef<any>(null);
  const localVideoTrackRef = useRef<any>(null);
  const cameraStreamRef = useRef<any>(null);

  const generateBroadcasterToken = useAction(api.actions.liveSessions.generateBroadcasterToken);

  useEffect(() => {
    if (!enabled || !channelName) {
      return;
    }

    let isMounted = true;

    const initializeAgora = async () => {
      try {
        // Dynamically import Agora SDK
        let RtcEngine: any;
        if (Platform.OS === 'web') {
          // For web, we'd use Agora Web SDK
          console.warn('Agora Web SDK integration needed for web platform');
          if (isMounted) {
            setError(new Error('Agora streaming not yet supported on web platform'));
          }
          return;
        } else {
          // For React Native, use react-native-agora
          // Note: This requires a dev client build, not Expo Go
          try {
            const Agora = require('react-native-agora');
            RtcEngine = Agora.default || Agora;
            if (!RtcEngine) {
              throw new Error('Agora SDK not properly loaded');
            }
          } catch (e) {
            const errorMsg = 'react-native-agora not installed. This requires:\n1. Install: bun add react-native-agora\n2. Rebuild with: npx expo prebuild && npx expo run:ios (or run:android)';
            console.error(errorMsg);
            if (isMounted) {
              setError(new Error('Agora SDK not available. Please install react-native-agora and rebuild the app.'));
            }
            return;
          }
        }

        // Generate broadcaster token
        const uid = Math.floor(Math.random() * 100000);
        const tokenData = await generateBroadcasterToken({
          channelName,
          uid,
        });

        if (!isMounted) return;

        // Initialize Agora engine
        const engine = RtcEngine.create({
          appId: tokenData.appId,
        });

        if (!engine) {
          throw new Error('Failed to create Agora engine');
        }

        agoraEngineRef.current = engine;

        // Set up event handlers
        engine.addListener('JoinChannelSuccess', (channel: string, uid: number, elapsed: number) => {
          console.log('Joined channel successfully:', channel, uid);
          if (isMounted) {
            setIsConnected(true);
            onStreamStarted?.();
          }
        });

        engine.addListener('Error', (err: number, msg: string) => {
          console.error('Agora error:', err, msg);
          const error = new Error(`Agora error ${err}: ${msg}`);
          if (isMounted) {
            setError(error);
            setIsConnected(false);
            setIsPublishing(false);
            onStreamError?.(error);
          }
        });

        engine.addListener('UserOffline', (uid: number, reason: number) => {
          console.log('User offline:', uid, reason);
        });

        // Enable video
        await engine.enableVideo();
        
        // Start local video preview (this will use the camera)
        await engine.startPreview();

        // Join channel
        await engine.joinChannel(tokenData.token, channelName, uid, {
          clientRoleType: 1, // 1 = BROADCASTER, 2 = AUDIENCE
        });

        if (isMounted) {
          setIsPublishing(true);
        }
      } catch (err: any) {
        console.error('Error initializing Agora:', err);
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsConnected(false);
          setIsPublishing(false);
          onStreamError?.(error);
        }
      }
    };

    initializeAgora();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [enabled, channelName, generateBroadcasterToken, onStreamStarted, onStreamError]);

  const cleanup = async () => {
    try {
      if (agoraEngineRef.current) {
        // Stop preview
        await agoraEngineRef.current.stopPreview();
        
        // Leave channel
        await agoraEngineRef.current.leaveChannel();
        
        // Release engine
        await agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      setIsConnected(false);
      setIsPublishing(false);
    } catch (err) {
      console.error('Error cleaning up Agora:', err);
    }
  };

  const switchCamera = async () => {
    if (agoraEngineRef.current && isPublishing) {
      try {
        await agoraEngineRef.current.switchCamera();
      } catch (err) {
        console.error('Error switching camera:', err);
      }
    }
  };

  return {
    isConnected,
    isPublishing,
    error,
    switchCamera,
    cleanup,
  };
}

