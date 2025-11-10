import { Platform } from 'react-native';
import { logger } from './Logger';

/**
 * WebRTC utilities with platform-specific implementations
 * Supports both web (browser APIs) and React Native (react-native-webrtc)
 */

export interface RTCPeerConnectionType {
  new (configuration?: RTCConfiguration): RTCPeerConnection;
  prototype: RTCPeerConnection;
}

export interface MediaStreamType {
  prototype: MediaStream;
  new (): MediaStream;
}

export interface RTCSessionDescriptionType {
  new (descriptionInitDict?: RTCSessionDescriptionInit): RTCSessionDescription;
  prototype: RTCSessionDescription;
}

export interface RTCIceCandidateType {
  new (candidateInitDict?: RTCIceCandidateInit): RTCIceCandidate;
  prototype: RTCIceCandidate;
}

let RTCPeerConnectionNative: RTCPeerConnectionType | null = null;
let MediaStreamNative: MediaStreamType | null = null;
let RTCSessionDescriptionNative: RTCSessionDescriptionType | null = null;
let RTCIceCandidateNative: RTCIceCandidateType | null = null;

try {
  if (Platform.OS !== 'web') {
    const WebRTC = require('react-native-webrtc');
    RTCPeerConnectionNative = WebRTC.RTCPeerConnection;
    MediaStreamNative = WebRTC.MediaStream;
    RTCSessionDescriptionNative = WebRTC.RTCSessionDescription;
    RTCIceCandidateNative = WebRTC.RTCIceCandidate;
  }
} catch (error) {
  logger.info('react-native-webrtc not available, using browser APIs for web platform');
}

export function getRTCPeerConnection(): RTCPeerConnectionType {
  if (Platform.OS === 'web') {
    return (globalThis as any).RTCPeerConnection;
  }
  
  if (RTCPeerConnectionNative) {
    return RTCPeerConnectionNative;
  }
  
  throw new Error(
    'WebRTC not available. Please install react-native-webrtc for React Native platforms.\n' +
    'Install: npm install react-native-webrtc\n' +
    'Note: Requires Expo dev client or bare React Native workflow.'
  );
}

export function getMediaStream(): MediaStreamType {
  if (Platform.OS === 'web') {
    return (globalThis as any).MediaStream;
  }
  
  if (MediaStreamNative) {
    return MediaStreamNative;
  }
  
  throw new Error('MediaStream not available. Please install react-native-webrtc.');
}

export function getRTCSessionDescription(): RTCSessionDescriptionType {
  if (Platform.OS === 'web') {
    return (globalThis as any).RTCSessionDescription;
  }
  
  if (RTCSessionDescriptionNative) {
    return RTCSessionDescriptionNative;
  }
  
  throw new Error('RTCSessionDescription not available. Please install react-native-webrtc.');
}

export function getRTCIceCandidate(): RTCIceCandidateType {
  if (Platform.OS === 'web') {
    return (globalThis as any).RTCIceCandidate;
  }
  
  if (RTCIceCandidateNative) {
    return RTCIceCandidateNative;
  }
  
  throw new Error('RTCIceCandidate not available. Please install react-native-webrtc.');
}

export async function getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        return await navigator.mediaDevices.getUserMedia(constraints);
      }
      throw new Error('MediaDevices API not available in browser');
    }
    
    if (RTCPeerConnectionNative && MediaStreamNative) {
      const { mediaDevices } = require('react-native-webrtc');
      return await mediaDevices.getUserMedia(constraints);
    }
    
    logger.warn('WebRTC not available. Voice calling will not work.');
    logger.info('To enable calling, install react-native-webrtc: npm install react-native-webrtc');
    logger.info('Note: Requires Expo dev client or bare React Native workflow.');
    
    return null;
  } catch (error) {
    logger.error('Error getting user media:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Microphone permission denied. Please enable microphone access in device settings.');
      }
      if (error.message.includes('not available')) {
        throw new Error('Microphone not available on this device.');
      }
    }
    
    throw error;
  }
}

export function isWebRTCAvailable(): boolean {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && 
           typeof navigator.mediaDevices !== 'undefined' &&
           typeof RTCPeerConnection !== 'undefined';
  }
  
  return RTCPeerConnectionNative !== null && MediaStreamNative !== null;
}

export function getWebRTCStatus(): { available: boolean; message: string } {
  if (Platform.OS === 'web') {
    const available = isWebRTCAvailable();
    return {
      available,
      message: available 
        ? 'WebRTC available (browser APIs)'
        : 'WebRTC not available in browser',
    };
  }
  
  const available = isWebRTCAvailable();
  return {
    available,
    message: available
      ? 'WebRTC available (react-native-webrtc)'
      : 'WebRTC not available. Install react-native-webrtc for React Native calling support.',
  };
}

