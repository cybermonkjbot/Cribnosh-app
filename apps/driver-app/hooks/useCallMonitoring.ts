import { useEffect, useRef } from 'react';
import { useSessionAwareQuery } from './useSessionAwareConvex';
import { api } from '../lib/convexApi';
import type { Id } from '../../packages/convex/_generated/dataModel';
import { callingService } from '../services/callingService';

interface UseCallMonitoringProps {
  orderId: Id<"orders"> | null;
  userId: Id<"users"> | null;
  onIncomingCall?: (callId: Id<"callSessions">) => void;
}

/**
 * Hook to monitor for incoming calls using Convex real-time subscriptions
 */
export function useCallMonitoring({ orderId, userId, onIncomingCall }: UseCallMonitoringProps) {
  const previousCallIdRef = useRef<Id<"callSessions"> | null>(null);

  // TODO: Replace with Cribnosh call system if available
  // For now, return null as call system may not be implemented
  const activeCall = null;

  useEffect(() => {
    if (!activeCall || !orderId || !userId) return;

    const currentCallId = activeCall._id;

    if (
      activeCall.status === 'ringing' &&
      activeCall.receiverId === userId &&
      previousCallIdRef.current !== currentCallId
    ) {
      previousCallIdRef.current = currentCallId;
      
      if (onIncomingCall) {
        onIncomingCall(currentCallId);
      }
    }

    const currentState = callingService.getCallState();
    if (!currentState || currentState.callId !== currentCallId) {
      if (activeCall.status !== 'ended' && activeCall.status !== 'declined' && activeCall.status !== 'missed') {
        callingService.updateCallStateFromConvex({
          callId: currentCallId,
          status: activeCall.status as any,
          isCaller: activeCall.callerId === userId,
          remoteUserId: activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId,
          remoteUserName: null,
        });
      }
    }
  }, [activeCall, orderId, userId, onIncomingCall]);

  return {
    activeCall,
    hasActiveCall: activeCall !== null && activeCall !== undefined,
  };
}

