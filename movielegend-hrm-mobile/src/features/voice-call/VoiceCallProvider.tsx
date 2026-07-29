import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSocketStatus } from '../../providers/SocketProvider';
import { IncomingCallScreen } from './IncomingCallScreen';
import { CallingScreen } from './CallingScreen';
import { ActiveCallScreen } from './ActiveCallScreen';
import { showIncomingCallNotification, dismissCallNotification } from '../../services/call-notification';

let useLastNotificationResponse = (): any => null;
if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  const Notifications = require('expo-notifications');
  useLastNotificationResponse = Notifications.useLastNotificationResponse;
}

// ── Conditional LiveKit imports (unavailable in Expo Go) ──
let LiveKitRoom: any = ({ children }: any) => <>{children}</>;
let useRoomContext: any = () => ({ state: 'connected' });
let useLocalParticipant: any = () => ({ localParticipant: null });
let AudioSession: any = null;

try {
  const livekit = require('@livekit/react-native');
  if (livekit?.LiveKitRoom) LiveKitRoom = livekit.LiveKitRoom;
  if (livekit?.useRoomContext) useRoomContext = livekit.useRoomContext;
  if (livekit?.useLocalParticipant) useLocalParticipant = livekit.useLocalParticipant;
  if (livekit?.AudioSession) AudioSession = livekit.AudioSession;
} catch (e) {
  console.warn('LiveKit native module fallback active:', e);
}

// ── Types ──
interface VoiceCallContextType {
  initiateCall: (targetUserId: string, targetName: string, targetAvatar?: string | null) => void;
  handleIncomingCallFromNotification: (data: {
    callerId: string;
    callerName: string;
    callerAvatar?: string | null;
  }) => void;
}

const VoiceCallContext = createContext<VoiceCallContextType>({
  initiateCall: () => {},
  handleIncomingCallFromNotification: () => {},
});

export const useVoiceCall = () => useContext(VoiceCallContext);

// ── Call timeout (40s) ──
const CALL_TIMEOUT_MS = 40_000;

// ── Provider ──
export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const { getSocket } = useSocketStatus();
  const socket = getSocket();

  // Call state
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'INCOMING' | 'ACTIVE'>('IDLE');
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const [callerId, setCallerId] = useState<string | null>(null);
  const callerIdRef = useRef(callerId);
  useEffect(() => { callerIdRef.current = callerId; }, [callerId]);
  const [callerName, setCallerName] = useState<string>('Người dùng');
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('Người dùng');
  const [targetAvatar, setTargetAvatar] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);


  // Audio controls
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Refs
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomRef = useRef<any>(null);

  const liveKitUrl = 'wss://mvl-2pvg5pqv.livekit.cloud';

  // ── Cleanup timeout ──
  const clearCallTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // ── Reset call ──
  const resetCall = useCallback(() => {
    setCallState('IDLE');
    setCallerId(null);
    setCallerName('Người dùng');
    setCallerAvatar(null);
    setTargetId(null);
    setTargetName('Người dùng');
    setTargetAvatar(null);
    setToken(null);
    setRoomName(null);
    setIsMuted(false);
    setIsSpeaker(false);
    clearCallTimeout();
    dismissCallNotification();
  }, [clearCallTimeout]);

  // ── Socket event listeners ──
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data: { callerId: string; callerName?: string; callerAvatar?: string | null }) => {
      if (callStateRef.current !== 'IDLE') {
        // Automatically reject if busy
        socket.emit('voice_call:reject', { callerId: data.callerId, reason: 'BUSY' });
        return;
      }
      
      setCallerId(data.callerId);
      setCallerName(data.callerName || 'Người dùng');
      setCallerAvatar(data.callerAvatar || null);
      setCallState('INCOMING');

      // Also show local notification (useful if app is in background but socket still connected)
      showIncomingCallNotification(
        data.callerName || 'Người dùng',
        data.callerId,
        data.callerAvatar,
      );
    };

    const onAccepted = (data: { token: string; roomName: string; receiverId: string }) => {
      clearCallTimeout();
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
    };

    const onToken = (data: { token: string; roomName: string }) => {
      clearCallTimeout();
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
      dismissCallNotification();
    };

    const onRejected = () => {
      resetCall();
    };

    const onEnded = () => {
      resetCall();
    };

    const onHandledElsewhere = (data: { callerId: string }) => {
      if (callStateRef.current === 'INCOMING' && callerIdRef.current === data.callerId) {
        resetCall();
      }
    };

    socket.on('voice_call:incoming', onIncoming);
    socket.on('voice_call:accepted', onAccepted);
    socket.on('voice_call:token', onToken);
    socket.on('voice_call:rejected', onRejected);
    socket.on('voice_call:ended', onEnded);
    socket.on('voice_call:handled_elsewhere', onHandledElsewhere);

    return () => {
      socket.off('voice_call:incoming', onIncoming);
      socket.off('voice_call:accepted', onAccepted);
      socket.off('voice_call:token', onToken);
      socket.off('voice_call:rejected', onRejected);
      socket.off('voice_call:ended', onEnded);
      socket.off('voice_call:handled_elsewhere', onHandledElsewhere);
    };
  }, [socket, resetCall, clearCallTimeout]);

  // ── Permissions ──
  const ensurePermissions = async (): Promise<boolean> => {
    try {
      const { Camera } = require('expo-camera');
      if (Camera) {
        const { status } = await Camera.requestMicrophonePermissionsAsync();
        return status === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('Failed to request microphone permission', e);
      return true;
    }
  };

  // ── Initiate a call ──
  const initiateCall = async (userId: string, name: string, avatar?: string | null) => {
    if (!socket) return;
    const hasPermission = await ensurePermissions();
    if (!hasPermission) return;

    setTargetId(userId);
    setTargetName(name);
    setTargetAvatar(avatar || null);
    setCallState('CALLING');
    socket.emit('voice_call:request', { targetUserId: userId });

    // Auto-cancel after timeout
    timeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('voice_call:end', { targetUserId: userId });
      }
      resetCall();
    }, CALL_TIMEOUT_MS);
  };

  // ── Accept call ──
  const acceptCall = async (overrideCallerId?: string | any) => {
    const cid = typeof overrideCallerId === 'string' ? overrideCallerId : callerId;
    if (!socket || !cid) return;
    const hasPermission = await ensurePermissions();
    if (!hasPermission) return;

    dismissCallNotification();
    socket.emit('voice_call:accept', { callerId: cid });
  };

  // ── Reject call ──
  const rejectCall = (overrideCallerId?: string | any) => {
    const cid = typeof overrideCallerId === 'string' ? overrideCallerId : callerId;
    if (!socket || !cid) return;
    socket.emit('voice_call:reject', { callerId: cid });
    resetCall();
  };

  const [pendingAction, setPendingAction] = useState<{ type: 'accept' | 'reject', callerId: string } | null>(null);

  // ── Handle call from push notification tap ──
  const handleIncomingCallFromNotification = useCallback((data: {
    callerId: string;
    callerName: string;
    callerAvatar?: string | null;
  }) => {
    setCallerId(data.callerId);
    setCallerName(data.callerName);
    setCallerAvatar(data.callerAvatar || null);
    setCallState('INCOMING');
  }, []);

  // ── Listen for Push Notification Actions ──
  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    
    const subAccept = DeviceEventEmitter.addListener('voice_call:action_accept', (cid: string) => {
      if (!socket) {
        setPendingAction({ type: 'accept', callerId: cid });
      } else {
        acceptCall(cid);
      }
    });
    
    const subReject = DeviceEventEmitter.addListener('voice_call:action_reject', (cid: string) => {
      if (!socket) {
        setPendingAction({ type: 'reject', callerId: cid });
      } else {
        rejectCall(cid);
      }
    });
    
    const subOpen = DeviceEventEmitter.addListener('voice_call:action_open', (data: any) => {
      handleIncomingCallFromNotification(data);
    });

    return () => {
      subAccept.remove();
      subReject.remove();
      subOpen.remove();
    };
  }, [socket, callerId]);

  // Execute pending action when socket connects
  useEffect(() => {
    if (socket && pendingAction) {
      if (pendingAction.type === 'accept') {
        acceptCall(pendingAction.callerId);
      } else if (pendingAction.type === 'reject') {
        rejectCall(pendingAction.callerId);
      }
      setPendingAction(null);
    }
  }, [socket, pendingAction]);

  // ── Handle cold start tap from push notification ──
  const lastNotificationResponse = useLastNotificationResponse();
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data &&
      lastNotificationResponse.notification.request.content.data.type === 'VOICE_CALL_INCOMING'
    ) {
      const actionId = lastNotificationResponse.actionIdentifier;
      const data = lastNotificationResponse.notification.request.content.data as any;
      
      if (actionId === 'ACCEPT') {
        if (socket) acceptCall(data.callerId);
        else setPendingAction({ type: 'accept', callerId: data.callerId });
      } else if (actionId === 'REJECT') {
        if (socket) rejectCall(data.callerId);
        else setPendingAction({ type: 'reject', callerId: data.callerId });
      } else {
        handleIncomingCallFromNotification(data);
      }
    }
  }, [lastNotificationResponse, socket, handleIncomingCallFromNotification]);

  // ── End call ──
  const endCall = (duration?: number | any) => {
    if (!socket) return;
    const peerId = targetId || callerId;
    
    const validDuration = typeof duration === 'number' ? duration : undefined;
    
    if (peerId) {
      socket.emit('voice_call:end', { targetUserId: peerId, duration: validDuration });
    }
    resetCall();
  };

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // ── Toggle speaker ──
  const toggleSpeaker = useCallback(async () => {
    setIsSpeaker(prev => {
      const newVal = !prev;
      try {
        if (Platform.OS === 'android') {
          const { Audio } = require('expo-av');
          Audio.setAudioModeAsync({
            playThroughEarpieceAndroid: !newVal
          }).catch(console.warn);
        } else if (AudioSession) {
          // AudioSession API for switching output on iOS
          AudioSession.showAudioRoutePicker?.();
        }
      } catch (e) {
        console.warn('Failed to toggle speaker:', e);
      }
      return newVal;
    });
  }, []);


  return (
    <VoiceCallContext.Provider value={{ initiateCall, handleIncomingCallFromNotification }}>
      {children}
      <Modal visible={callState !== 'IDLE'} animationType="slide" statusBarTranslucent>
        {callState === 'INCOMING' && (
          <IncomingCallScreen
            callerName={callerName}
            callerAvatar={callerAvatar}
            onAccept={acceptCall}
            onReject={rejectCall}
          />
        )}

        {callState === 'CALLING' && (
          <CallingScreen
            targetName={targetName}
            targetAvatar={targetAvatar}
            onEndCall={endCall}
          />
        )}

        {callState === 'ACTIVE' && token && (
          <LiveKitRoom
            serverUrl={liveKitUrl}
            token={token}
            connect={true}
            audio={true}
            video={false}
            onConnected={(room: any) => { roomRef.current = room; }}
          >
            <ActiveCallInner
              peerName={callerId ? callerName : targetName}
              peerAvatar={callerId ? callerAvatar : targetAvatar}
              isMuted={isMuted}
              isSpeaker={isSpeaker}
              onToggleMute={toggleMute}
              onToggleSpeaker={toggleSpeaker}
              onEndCall={endCall}
              roomRef={roomRef}
            />
          </LiveKitRoom>
        )}
      </Modal>
    </VoiceCallContext.Provider>
  );
}

// ── Active call wrapper to access room context ──
function ActiveCallInner({
  peerName,
  peerAvatar,
  isMuted,
  isSpeaker,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  roomRef,
}: {
  peerName: string;
  peerAvatar?: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: (duration?: number) => void;
  roomRef: React.MutableRefObject<any>;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (room) {
      roomRef.current = room;
    }
  }, [room, roomRef]);

  // Sync mute state with LiveKit local participant
  useEffect(() => {
    try {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(!isMuted);
      }
    } catch (e) {
      console.warn('Failed to sync mute state:', e);
    }
  }, [localParticipant, isMuted]);

  return (
    <ActiveCallScreen
      peerName={peerName}
      peerAvatar={peerAvatar}
      isMuted={isMuted}
      isSpeaker={isSpeaker}
      onToggleMute={onToggleMute}
      onToggleSpeaker={onToggleSpeaker}
      onEndCall={onEndCall}
      connectionState={room?.state}
    />
  );
}
