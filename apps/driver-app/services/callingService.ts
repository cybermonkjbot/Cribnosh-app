import type { Id } from '../../packages/convex/_generated/dataModel';
import { api } from '../lib/convexApi';
import { logger } from '../utils/Logger';
import { 
  getRTCPeerConnection,
  getRTCSessionDescription, 
  getRTCIceCandidate,
  getUserMedia as getWebRTCUserMedia,
  isWebRTCAvailable,
  getWebRTCStatus,
} from '../utils/webrtc';
import { openPhoneDialer } from '../utils/phoneDialer';

export interface CallState {
  callId: Id<"callSessions"> | null;
  status: 'idle' | 'initiating' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed';
  isCaller: boolean;
  remoteUserId: Id<"users"> | null;
  remoteUserName: string | null;
}

// Note: Call system may not be implemented in Cribnosh yet
// This service is kept for compatibility but may need to be adapted

export type CallEventHandler = (state: CallState) => void;
export type IceCandidateHandler = (candidate: RTCIceCandidate) => void;

// STUN servers for WebRTC
const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class CallingService {
  private static instance: CallingService;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCall: CallState | null = null;
  private eventHandlers: Set<CallEventHandler> = new Set();
  private iceCandidateHandlers: Set<IceCandidateHandler> = new Set();
  private checkCallInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

  static getInstance(): CallingService {
    if (!CallingService.instance) {
      CallingService.instance = new CallingService();
    }
    return CallingService.instance;
  }

  onCallStateChange(handler: CallEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onIceCandidate(handler: IceCandidateHandler): () => void {
    this.iceCandidateHandlers.add(handler);
    return () => this.iceCandidateHandlers.delete(handler);
  }

  getCallState(): CallState | null {
    return this.currentCall;
  }

  updateCallStateFromConvex(state: CallState): void {
    this.currentCall = state;
    this.notifyHandlers();
  }

  async processReceiverAnswer(callId: Id<"callSessions">, answer: string): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const answerSdp = JSON.parse(answer);
      const RTCSessionDescriptionImpl = getRTCSessionDescription();
      await this.peerConnection.setRemoteDescription(new RTCSessionDescriptionImpl(answerSdp));
    } catch (error) {
      logger.error('Error processing receiver answer:', error);
    }
  }

  async processCallerOffer(callId: Id<"callSessions">, offer: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.peerConnection) {
        return { success: false, error: 'Peer connection not initialized' };
      }

      const offerSdp = JSON.parse(offer);
      const RTCSessionDescriptionImpl = getRTCSessionDescription();
      await this.peerConnection.setRemoteDescription(new RTCSessionDescriptionImpl(offerSdp));

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // TODO: Replace with Cribnosh call system if available
      // await api.calls.setReceiverAnswer({
      //   callId,
      //   answer: JSON.stringify(answer),
      // });
      logger.warn('Call system not yet implemented in Cribnosh');

      return { success: true };
    } catch (error) {
      logger.error('Error processing caller offer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process offer',
      };
    }
  }

  async processIceCandidate(callId: Id<"callSessions">, candidate: string, isCaller: boolean): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const iceCandidateData = JSON.parse(candidate);
      const RTCIceCandidateImpl = getRTCIceCandidate();
      await this.peerConnection.addIceCandidate(new RTCIceCandidateImpl(iceCandidateData));
    } catch (error) {
      logger.error('Error processing ICE candidate:', error);
    }
  }

  async initiateCall(
    orderId: Id<"orders">,
    callerId: Id<"users">,
    receiverId: Id<"users">,
    receiverName: string,
    receiverPhone?: string
  ): Promise<{ success: boolean; error?: string; usedFallback?: boolean }> {
    try {
      // Check if WebRTC is available
      if (!isWebRTCAvailable()) {
        // Fallback to native phone dialer (Expo Go scenario)
        if (receiverPhone) {
          logger.info('WebRTC not available, using phone dialer fallback', { receiverPhone, receiverName });
          const dialerResult = await openPhoneDialer(receiverPhone, receiverName);
          
          if (dialerResult.success) {
            return { 
              success: true, 
              usedFallback: true,
              error: 'Opening native phone dialer (WebRTC not available in Expo Go)' 
            };
          }
          
          return { 
            success: false, 
            error: dialerResult.error || 'Failed to open phone dialer',
            usedFallback: true 
          };
        }
        
        // No phone number available, can't use fallback
        const status = getWebRTCStatus();
        return { 
          success: false, 
          error: `${status.message}. For in-app calling, please use a development build with react-native-webrtc installed.` 
        };
      }

      this.currentCall = {
        callId: null,
        status: 'initiating',
        isCaller: true,
        remoteUserId: receiverId,
        remoteUserName: receiverName,
      };
      this.notifyHandlers();

      const stream = await this.getUserMedia();
      if (!stream) {
        // Try fallback if phone number available
        if (receiverPhone) {
          logger.info('WebRTC permission denied, using phone dialer fallback', { receiverPhone });
          const dialerResult = await openPhoneDialer(receiverPhone, receiverName);
          
          if (dialerResult.success) {
            return { success: true, usedFallback: true };
          }
        }
        
        this.currentCall = null;
        this.notifyHandlers();
        return { success: false, error: 'Microphone permission denied' };
      }

      this.localStream = stream;
      const RTCPeerConnectionImpl = getRTCPeerConnection();
      this.peerConnection = new RTCPeerConnectionImpl(STUN_SERVERS);
      this.setupPeerConnection();

      stream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, stream);
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // TODO: Replace with Cribnosh call system if available
      // For now, use fallback to phone dialer
      logger.warn('Call system not yet implemented in Cribnosh, using phone dialer fallback');
      if (receiverPhone) {
        const dialerResult = await openPhoneDialer(receiverPhone, receiverName);
        await this.cleanup();
        return { 
          success: dialerResult.success, 
          usedFallback: true,
          error: dialerResult.error 
        };
      }
      
      await this.cleanup();
      return { success: false, error: 'Call system not available. Phone number required for fallback.' };
      
      // Original call API code (commented out until call system is implemented):
      // const result = await api.calls.initiateCall({
      //   orderId,
      //   callerId,
      //   receiverId,
      //   callerType: 'driver',
      // });
      // if (!result.success) {
      //   await this.cleanup();
      //   return result;
      // }
      // this.currentCall.callId = result.callId;
      // this.notifyHandlers();
      // await api.calls.setCallerOffer({
      //   callId: result.callId,
      //   offer: JSON.stringify(offer),
      // });
      // this.startCheckingForAnswer(result.callId);
      // return { success: true };
    } catch (error) {
      logger.error('Error initiating call:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate call',
      };
    }
  }

  async answerCall(callId: Id<"callSessions">): Promise<{ success: boolean; error?: string }> {
    try {
      const stream = await this.getUserMedia();
      if (!stream) {
        return { success: false, error: 'Microphone permission denied' };
      }

      this.localStream = stream;
      const RTCPeerConnectionImpl = getRTCPeerConnection();
      this.peerConnection = new RTCPeerConnectionImpl(STUN_SERVERS);
      this.setupPeerConnection();

      stream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, stream);
      });

      if (this.currentCall) {
        this.currentCall.callId = callId;
        this.currentCall.status = 'ringing';
        this.currentCall.isCaller = false;
        this.notifyHandlers();
      } else {
        this.currentCall = {
          callId,
          status: 'ringing',
          isCaller: false,
          remoteUserId: null,
          remoteUserName: null,
        };
        this.notifyHandlers();
      }

      return { success: true };
    } catch (error) {
      logger.error('Error answering call:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to answer call',
      };
    }
  }

  async endCall(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentCall?.callId) {
        return { success: false, error: 'No active call' };
      }

      // TODO: Replace with Cribnosh call system if available
      // await api.calls.endCall({
      //   callId: this.currentCall.callId,
      //   userId: this.currentCall.remoteUserId!,
      // });
      logger.warn('Call system not yet implemented in Cribnosh');

      await this.cleanup();
      return { success: true };
    } catch (error) {
      logger.error('Error ending call:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to end call',
      };
    }
  }

  async declineCall(callId: Id<"callSessions">, userId: Id<"users">): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Replace with Cribnosh call system if available
      // await api.calls.declineCall({ callId, userId });
      logger.warn('Call system not yet implemented in Cribnosh');
      await this.cleanup();
      return { success: true };
    } catch (error) {
      logger.error('Error declining call:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to decline call',
      };
    }
  }

  private async getUserMedia(): Promise<MediaStream | null> {
    try {
      if (!isWebRTCAvailable()) {
        const status = getWebRTCStatus();
        logger.warn(status.message);
        return null;
      }

      return await getWebRTCUserMedia({ audio: true, video: false });
    } catch (error) {
      logger.error('Error getting user media:', error);
      return null;
    }
  }

  private setupPeerConnection(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCall?.callId) {
        const candidateString = JSON.stringify(event.candidate);
        // TODO: Replace with Cribnosh call system if available
        // if (this.currentCall.isCaller) {
        //   api.calls.addCallerIceCandidate({
        //     callId: this.currentCall.callId,
        //     candidate: candidateString,
        //   });
        // } else {
        //   api.calls.addReceiverIceCandidate({
        //     callId: this.currentCall.callId,
        //     candidate: candidateString,
        //   });
        // }
        logger.warn('Call system not yet implemented in Cribnosh');
        this.iceCandidateHandlers.forEach(handler => handler(event.candidate!));
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'connected' && this.currentCall) {
        this.currentCall.status = 'connected';
        this.notifyHandlers();
      } else if (this.peerConnection?.connectionState === 'disconnected' || 
                 this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };
  }

  private startCheckingForAnswer(callId: Id<"callSessions">): void {
    // Real-time updates handled via useCallMonitoring hook
    this.checkCallInterval = setInterval(async () => {
      // Backup polling - should not be needed with Convex subscriptions
    }, 5000);
  }

  private async cleanup(): Promise<void> {
    if (this.checkCallInterval) {
      clearInterval(this.checkCallInterval);
      this.checkCallInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.currentCall) {
      this.currentCall.status = 'ended';
      this.notifyHandlers();
      this.currentCall = null;
    }

    this.remoteStream = null;
  }

  private notifyHandlers(): void {
    if (this.currentCall) {
      this.eventHandlers.forEach(handler => handler(this.currentCall!));
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}

export const callingService = CallingService.getInstance();

