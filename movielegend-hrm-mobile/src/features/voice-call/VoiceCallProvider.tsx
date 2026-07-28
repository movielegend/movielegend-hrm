import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Platform } from 'react-native';
import { useSocketStatus } from '../../providers/SocketProvider';
import { IncomingCallScreen } from './IncomingCallScreen';
import { CallingScreen } from './CallingScreen';
import { ActiveCallScreen } from './ActiveCallScreen';
import { showIncomingCallNotification, dismissCallNotification } from '../../services/call-notification';

// ── Conditional LiveKit imports (unavailable in Expo Go) ──
let LiveKitRoom: any = ({ children }: any) => <>{children}</>;
let useRoomContext: any = () => ({ state: 'connected' });
let AudioSession: any = null;

try {
  const livekit = require('@livekit/react-native');
  if (livekit?.LiveKitRoom) LiveKitRoom = livekit.LiveKitRoom;
  if (livekit?.useRoomContext) useRoomContext = livekit.useRoomContext;
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
  const [callerId, setCallerId] = useState<string | null>(null);
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

    socket.on('voice_call:incoming', onIncoming);
    socket.on('voice_call:accepted', onAccepted);
    socket.on('voice_call:token', onToken);
    socket.on('voice_call:rejected', onRejected);
    socket.on('voice_call:ended', onEnded);

    return () => {
      socket.off('voice_call:incoming', onIncoming);
      socket.off('voice_call:accepted', onAccepted);
      socket.off('voice_call:token', onToken);
      socket.off('voice_call:rejected', onRejected);
      socket.off('voice_call:ended', onEnded);
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
  const acceptCall = async () => {
    if (!socket || !callerId) return;
    const hasPermission = await ensurePermissions();
    if (!hasPermission) return;

    dismissCallNotification();
    socket.emit('voice_call:accept', { callerId });
  };

  // ── Reject call ──
  const rejectCall = () => {
    if (!socket || !callerId) return;
    socket.emit('voice_call:reject', { callerId });
    resetCall();
  };

  // ── End call ──
  const endCall = () => {
    if (!socket) return;
    const peerId = targetId || callerId;
    if (peerId) {
      socket.emit('voice_call:end', { targetUserId: peerId });
    }
    resetCall();
  };

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      try {
        if (roomRef.current?.localParticipant) {
          roomRef.current.localParticipant.setMicrophoneEnabled(!newVal);
        }
      } catch (e) {
        console.warn('Failed to toggle mute:', e);
      }
      return newVal;
    });
  }, []);

  // ── Toggle speaker ──
  const toggleSpeaker = useCallback(async () => {
    setIsSpeaker(prev => {
      const newVal = !prev;
      try {
        if (AudioSession) {
          // AudioSession API for switching output
          AudioSession.showAudioRoutePicker?.();
        }
      } catch (e) {
        console.warn('Failed to toggle speaker:', e);
      }
      return newVal;
    });
  }, []);

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
  onEndCall: () => void;
  roomRef: React.MutableRefObject<any>;
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (room) {
      roomRef.current = room;
    }
  }, [room, roomRef]);

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
