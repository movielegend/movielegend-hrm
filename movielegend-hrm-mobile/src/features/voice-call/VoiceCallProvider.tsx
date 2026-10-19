import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSocketStatus } from '../../providers/SocketProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { IncomingCallScreen } from './IncomingCallScreen';
import { CallingScreen } from './CallingScreen';
import { ActiveCallScreen } from './ActiveCallScreen';
import { showIncomingCallNotification, dismissCallNotification } from '../../services/call-notification';

let Notifications: any = null;
if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    // Ignore if not supported
  }
}

let LiveKitModule: any = null;
if (Platform.OS !== 'web') {
  try {
    LiveKitModule = require('@livekit/react-native');
  } catch (e) {
    // Ignore if not supported
  }
}
const LiveKitRoom = LiveKitModule?.LiveKitRoom;
const useRoomContext = LiveKitModule?.useRoomContext;
const useLocalParticipant = LiveKitModule?.useLocalParticipant;
const AudioSession = LiveKitModule?.AudioSession;

// ── Types ──
interface VoiceCallContextType {
  initiateCall: (targetUserId: string, targetName: string, targetAvatar?: string | null) => void;
  handleIncomingCallFromNotification: (data: {
    callId?: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string | null;
    createdAt?: number;
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
  const { showAlert } = useAppAlert();

  // Call state
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'INCOMING' | 'ACTIVE'>('IDLE');
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const [callId, setCallId] = useState<string | null>(null);
  const callIdRef = useRef(callId);
  useEffect(() => { callIdRef.current = callId; }, [callId]);

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
    if (roomRef.current) {
      try {
        roomRef.current.disconnect?.();
      } catch (e) {
        // ignore
      }
      roomRef.current = null;
    }
    try {
      if (AudioSession?.stopAudioSession) {
        void AudioSession.stopAudioSession();
      }
    } catch (e) {
      // ignore
    }
    setCallState('IDLE');
    setCallId(null);
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

    const onIncoming = (data: { callId?: string; callerId: string; callerName?: string; callerAvatar?: string | null; createdAt?: number }) => {
      // If call notification is older than 45s, ignore
      if (data.createdAt && Date.now() - Number(data.createdAt) > 45000) {
        return;
      }

      if (callStateRef.current !== 'IDLE') {
        // Automatically reject with BUSY if already in another call
        socket.emit('voice_call:reject', { callerId: data.callerId, callId: data.callId, reason: 'BUSY' });
        return;
      }
      
      setCallId(data.callId || null);
      setCallerId(data.callerId);
      setCallerName(data.callerName || 'Người dùng');
      setCallerAvatar(data.callerAvatar || null);
      setCallState('INCOMING');

      // Also show local notification (useful if app is in background but socket still connected)
      showIncomingCallNotification(
        data.callerName || 'Người dùng',
        data.callerId,
        data.callerAvatar,
        data.callId,
        data.createdAt,
      );
    };

    const onAccepted = (data: { token: string; roomName: string; receiverId: string; callId?: string }) => {
      clearCallTimeout();
      if (data.callId) setCallId(data.callId);
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
    };

    const onToken = (data: { token: string; roomName: string; callId?: string }) => {
      clearCallTimeout();
      if (data.callId) setCallId(data.callId);
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
      dismissCallNotification();
    };

    const onRejected = (data?: { receiverId?: string; reason?: string }) => {
      resetCall();
      if (data?.reason === 'BUSY') {
        showAlert('Người nhận bận', 'Người nhận hiện đang trong cuộc gọi khác hoặc đang bận.');
      }
    };

    const onEnded = (data?: { userId?: string; reason?: string; message?: string }) => {
      resetCall();
      if (data?.reason === 'TIMEOUT') {
        showAlert('Thông báo', 'Cuộc gọi kết thúc do không có phản hồi.');
      }
    };

    const onHandledElsewhere = (data: { callerId: string; callId?: string }) => {
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
  }, [socket, resetCall, clearCallTimeout, showAlert]);

  function ensureLiveKitGlobals() {
    try {
      const livekit = require('@livekit/react-native');
      if (typeof livekit?.registerGlobals === 'function') {
        livekit.registerGlobals();
      }
    } catch (e) {
      console.warn('[LiveKit] registerGlobals failed or not available:', e);
    }
  }

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
    if (callStateRef.current !== 'IDLE') {
      showAlert('Thông báo', 'Bạn đang trong một cuộc gọi khác.');
      return;
    }

    const hasPermission = await ensurePermissions();
    if (!hasPermission) return;

    ensureLiveKitGlobals();
    setTargetId(userId);
    setTargetName(name);
    setTargetAvatar(avatar || null);
    setCallState('CALLING');
    
    socket.emit('voice_call:request', { targetUserId: userId }, (res: any) => {
      if (res && res.ok === false) {
        resetCall();
        if (res.code === 'TARGET_BUSY' || res.code === 'USER_BUSY') {
          showAlert('Người nhận bận', 'Người nhận hiện đang trong cuộc gọi khác hoặc đang bận.');
        } else if (res.code === 'ALREADY_IN_CALL') {
          showAlert('Thông báo', 'Bạn đang trong một cuộc gọi khác.');
        } else if (res.code === 'CANNOT_CALL_SELF') {
          showAlert('Thông báo', 'Không thể tự gọi cho chính mình.');
        } else {
          showAlert('Thông báo', res.message || 'Không thể thực hiện cuộc gọi.');
        }
      } else if (res?.callId) {
        setCallId(res.callId);
      }
    });

    // Auto-cancel after timeout
    timeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('voice_call:end', { targetUserId: userId, callId: callIdRef.current });
      }
      resetCall();
    }, CALL_TIMEOUT_MS);
  };

  // ── Accept call ──
  const acceptCall = async (overrideData?: { callerId: string; callId?: string } | string | any) => {
    let cid = callerId;
    let targetCallId = callId;

    if (typeof overrideData === 'string') {
      cid = overrideData;
    } else if (overrideData && typeof overrideData === 'object') {
      cid = overrideData.callerId || cid;
      targetCallId = overrideData.callId || targetCallId;
    }

    if (!socket || !cid) return;
    const hasPermission = await ensurePermissions();
    if (!hasPermission) return;

    ensureLiveKitGlobals();
    dismissCallNotification();

    socket.emit('voice_call:accept', { callerId: cid, callId: targetCallId || undefined }, (res: any) => {
      if (res && res.ok === false) {
        resetCall();
        showAlert('Thông báo', res.message || 'Cuộc gọi đã kết thúc hoặc không tồn tại.');
      }
    });
  };

  // ── Reject call ──
  const rejectCall = (overrideData?: { callerId: string; callId?: string } | string | any) => {
    let cid = callerId;
    let targetCallId = callId;

    if (typeof overrideData === 'string') {
      cid = overrideData;
    } else if (overrideData && typeof overrideData === 'object') {
      cid = overrideData.callerId || cid;
      targetCallId = overrideData.callId || targetCallId;
    }

    if (!socket || !cid) return;
    socket.emit('voice_call:reject', { callerId: cid, callId: targetCallId || undefined });
    resetCall();
  };

  const [pendingAction, setPendingAction] = useState<{ type: 'accept' | 'reject'; payload: any } | null>(null);

  // ── Handle call from push notification tap ──
  const handleIncomingCallFromNotification = useCallback((data: {
    callId?: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string | null;
    createdAt?: number;
  }) => {
    const createdAt = Number(data.createdAt || 0);
    if (createdAt > 0 && Date.now() - createdAt > 45000) {
      dismissCallNotification();
      showAlert('Thông báo', 'Cuộc gọi đã kết thúc');
      return;
    }

    if (callStateRef.current !== 'IDLE') {
      return;
    }

    setCallId(data.callId || null);
    setCallerId(data.callerId);
    setCallerName(data.callerName || 'Người dùng');
    setCallerAvatar(data.callerAvatar || null);
    setCallState('INCOMING');
  }, [showAlert]);

  // ── Listen for Push Notification Actions ──
  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    
    const subAccept = DeviceEventEmitter.addListener('voice_call:action_accept', (payload: any) => {
      if (!socket) {
        setPendingAction({ type: 'accept', payload });
      } else {
        acceptCall(payload);
      }
    });
    
    const subReject = DeviceEventEmitter.addListener('voice_call:action_reject', (payload: any) => {
      if (!socket) {
        setPendingAction({ type: 'reject', payload });
      } else {
        rejectCall(payload);
      }
    });
    
    const subOpen = DeviceEventEmitter.addListener('voice_call:action_open', (data: any) => {
      handleIncomingCallFromNotification(data);
    });

    const subExpired = DeviceEventEmitter.addListener('voice_call:expired', () => {
      dismissCallNotification();
      showAlert('Thông báo', 'Cuộc gọi đã kết thúc');
    });

    return () => {
      subAccept.remove();
      subReject.remove();
      subOpen.remove();
      subExpired.remove();
    };
  }, [socket, callerId, callId, handleIncomingCallFromNotification, showAlert]);

  // Execute pending action when socket connects
  useEffect(() => {
    if (socket && pendingAction) {
      if (pendingAction.type === 'accept') {
        acceptCall(pendingAction.payload);
      } else if (pendingAction.type === 'reject') {
        rejectCall(pendingAction.payload);
      }
      setPendingAction(null);
    }
  }, [socket, pendingAction]);

  // ── Handle cold start tap from push notification ──
  useEffect(() => {
    async function checkLastNotification() {
      try {
        if (!Notifications || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
        if (typeof Notifications.getLastNotificationResponseAsync !== 'function') return;
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
        if (
          lastNotificationResponse?.notification?.request?.content?.data &&
          lastNotificationResponse.notification.request.content.data.type === 'VOICE_CALL_INCOMING'
        ) {
          const actionId = lastNotificationResponse.actionIdentifier;
          const data = lastNotificationResponse.notification.request.content.data as any;
          const createdAt = Number(data.createdAt || data.timestamp || 0);

          if (createdAt > 0 && Date.now() - createdAt > 45000) {
            dismissCallNotification();
            showAlert('Thông báo', 'Cuộc gọi đã kết thúc');
            return;
          }
          
          if (actionId === 'ACCEPT') {
            if (socket) acceptCall({ callerId: data.callerId, callId: data.callId });
            else setPendingAction({ type: 'accept', payload: { callerId: data.callerId, callId: data.callId } });
          } else if (actionId === 'REJECT') {
            if (socket) rejectCall({ callerId: data.callerId, callId: data.callId });
            else setPendingAction({ type: 'reject', payload: { callerId: data.callerId, callId: data.callId } });
          } else {
            handleIncomingCallFromNotification(data);
          }
        }
      } catch (e) {
        console.warn('Error checking last notification response:', e);
      }
    }
    void checkLastNotification();
  }, [socket, handleIncomingCallFromNotification, showAlert]);

  // ── End call ──
  const endCall = (duration?: number | any) => {
    if (!socket) return;
    const peerId = targetId || callerId;
    
    const validDuration = typeof duration === 'number' ? duration : undefined;
    
    if (peerId) {
      socket.emit('voice_call:end', { targetUserId: peerId, callId: callIdRef.current, duration: validDuration });
    }
    resetCall();
  };

  // ── Toggle mute ──
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // ── Toggle speaker ──
  const toggleSpeaker = useCallback(async () => {
    setIsSpeaker(prev => !prev);
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
          <ActiveCallLiveKitWrapper
            serverUrl={liveKitUrl}
            token={token}
            peerName={callerId ? callerName : targetName}
            peerAvatar={callerId ? callerAvatar : targetAvatar}
            isMuted={isMuted}
            isSpeaker={isSpeaker}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={endCall}
            roomRef={roomRef}
          />
        )}
      </Modal>
    </VoiceCallContext.Provider>
  );
}

// ── Props for Active Call Content ──
interface ActiveCallContentProps {
  peerName: string;
  peerAvatar?: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: (duration?: number) => void;
  roomRef: React.MutableRefObject<any>;
}

// ── Standalone Active Call Content (Never unmounted during re-render) ──
function ActiveCallContent(props: ActiveCallContentProps) {
  const room = useRoomContext?.() || { state: 'connected' };
  const { localParticipant } = useLocalParticipant?.() || { localParticipant: null };

  useEffect(() => {
    if (room) {
      props.roomRef.current = room;
    }
  }, [room]);

  // ── 1. Khởi tạo AudioSession Native khi cuộc gọi ACTIVE ──
  useEffect(() => {
    let isMounted = true;
    const initAudio = async () => {
      try {
        if (AudioSession?.startAudioSession) {
          await AudioSession.startAudioSession();
        }
        if (AudioSession?.selectAudioOutput && isMounted) {
          if (Platform.OS === 'ios') {
            await AudioSession.selectAudioOutput(props.isSpeaker ? 'force_speaker' : 'default');
          } else {
            await AudioSession.selectAudioOutput(props.isSpeaker ? 'speaker' : 'earpiece');
          }
        }
      } catch (e) {
        console.warn('[LiveKit] AudioSession init error:', e);
      }
    };

    void initAudio();

    return () => {
      isMounted = false;
      try {
        if (AudioSession?.stopAudioSession) {
          void AudioSession.stopAudioSession();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // ── 2. Đồng bộ Mic (Tắt / Bật Mic cả ở tầng LiveKit SDK và WebRTC Hardware Track) ──
  useEffect(() => {
    const syncMute = async () => {
      try {
        if (localParticipant) {
          await localParticipant.setMicrophoneEnabled(!props.isMuted);
        }
        // Ép phần cứng mediaStreamTrack tắt/bật trực tiếp để ngắt âm thanh triệt để
        if (room?.localParticipant?.audioTrackPublications) {
          room.localParticipant.audioTrackPublications.forEach((pub: any) => {
            if (pub.track?.mediaStreamTrack) {
              pub.track.mediaStreamTrack.enabled = !props.isMuted;
            }
            if (props.isMuted && typeof pub.mute === 'function') {
              void pub.mute();
            } else if (!props.isMuted && typeof pub.unmute === 'function') {
              void pub.unmute();
            }
          });
        }
      } catch (e) {
        console.warn('[LiveKit] Failed to sync mute state:', e);
      }
    };

    void syncMute();
  }, [localParticipant, room, props.isMuted]);

  // ── 3. Đồng bộ Loa ngoài / Loa trong xuống phần cứng thiết bị ──
  useEffect(() => {
    const syncSpeaker = async () => {
      try {
        if (AudioSession?.selectAudioOutput) {
          if (Platform.OS === 'ios') {
            await AudioSession.selectAudioOutput(props.isSpeaker ? 'force_speaker' : 'default');
          } else {
            await AudioSession.selectAudioOutput(props.isSpeaker ? 'speaker' : 'earpiece');
          }
        }
      } catch (e) {
        console.warn('[LiveKit] Failed to toggle audio output:', e);
      }
    };

    void syncSpeaker();
  }, [props.isSpeaker]);

  // ── 4. Re-sync khi phòng gọi kết nối thành công (Room connected event) ──
  useEffect(() => {
    if (!room || typeof room.on !== 'function') return;

    const onConnected = () => {
      if (AudioSession?.selectAudioOutput) {
        if (Platform.OS === 'ios') {
          void AudioSession.selectAudioOutput(props.isSpeaker ? 'force_speaker' : 'default');
        } else {
          void AudioSession.selectAudioOutput(props.isSpeaker ? 'speaker' : 'earpiece');
        }
      }
      if (props.isMuted && room.localParticipant) {
        void room.localParticipant.setMicrophoneEnabled(false);
        room.localParticipant.audioTrackPublications?.forEach((pub: any) => {
          if (pub.track?.mediaStreamTrack) pub.track.mediaStreamTrack.enabled = false;
          if (typeof pub.mute === 'function') void pub.mute();
        });
      }
    };

    room.on('connected', onConnected);
    return () => {
      room.off?.('connected', onConnected);
    };
  }, [room, props.isSpeaker, props.isMuted]);

  return (
    <ActiveCallScreen
      peerName={props.peerName}
      peerAvatar={props.peerAvatar}
      isMuted={props.isMuted}
      isSpeaker={props.isSpeaker}
      onToggleMute={props.onToggleMute}
      onToggleSpeaker={props.onToggleSpeaker}
      onEndCall={props.onEndCall}
      connectionState={room?.state}
    />
  );
}

// ── Active call dynamic wrapper ──
function ActiveCallLiveKitWrapper(props: {
  serverUrl: string;
  token: string;
  peerName: string;
  peerAvatar?: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: (duration?: number) => void;
  roomRef: React.MutableRefObject<any>;
}) {
  if (!LiveKitRoom) {
    return (
      <ActiveCallScreen
        peerName={props.peerName}
        peerAvatar={props.peerAvatar}
        isMuted={props.isMuted}
        isSpeaker={props.isSpeaker}
        onToggleMute={props.onToggleMute}
        onToggleSpeaker={props.onToggleSpeaker}
        onEndCall={props.onEndCall}
      />
    );
  }

  return (
    <LiveKitRoom
      serverUrl={props.serverUrl}
      token={props.token}
      connect={true}
      audio={!props.isMuted}
      video={false}
      onConnected={(room: any) => { props.roomRef.current = room; }}
    >
      <ActiveCallContent
        peerName={props.peerName}
        peerAvatar={props.peerAvatar}
        isMuted={props.isMuted}
        isSpeaker={props.isSpeaker}
        onToggleMute={props.onToggleMute}
        onToggleSpeaker={props.onToggleSpeaker}
        onEndCall={props.onEndCall}
        roomRef={props.roomRef}
      />
    </LiveKitRoom>
  );
}
