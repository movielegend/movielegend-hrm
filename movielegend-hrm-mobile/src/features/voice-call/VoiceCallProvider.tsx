import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
// Fallback mock component cho LiveKit nếu chưa cài thư viện native LiveKit
const LiveKitRoom = ({ children }: any) => <>{children}</>;
const useRoomContext = () => ({ state: 'connected' });
import { useSocketStatus } from '../../providers/SocketProvider';
import { useAuth } from '../../providers/AuthProvider';

interface VoiceCallContextType {
  initiateCall: (targetUserId: string, targetName: string) => void;
}

const VoiceCallContext = createContext<VoiceCallContextType>({
  initiateCall: () => { },
});

export const useVoiceCall = () => useContext(VoiceCallContext);

export function VoiceCallProvider({ children }: { children: React.ReactNode }) {
  const { getSocket } = useSocketStatus();
  const socket = getSocket();

  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'INCOMING' | 'ACTIVE'>('IDLE');
  const [callerId, setCallerId] = useState<string | null>(null);
  const [callerName, setCallerName] = useState<string>('Unknown');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>('Unknown');
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  const liveKitUrl = 'wss://mvl-2pvg5pqv.livekit.cloud';

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data: { callerId: string, callerName?: string }) => {
      setCallerId(data.callerId);
      setCallerName(data.callerName || 'Người dùng');
      setCallState('INCOMING');
    };

    const onAccepted = (data: { token: string, roomName: string, receiverId: string }) => {
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
    };

    const onToken = (data: { token: string, roomName: string }) => {
      setToken(data.token);
      setRoomName(data.roomName);
      setCallState('ACTIVE');
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
  }, [socket]);

  const initiateCall = (targetUserId: string, tName: string) => {
    if (!socket) return;
    setTargetId(targetUserId);
    setTargetName(tName);
    setCallState('CALLING');
    socket.emit('voice_call:request', { targetUserId });
  };

  const acceptCall = () => {
    if (!socket || !callerId) return;
    socket.emit('voice_call:accept', { callerId });
  };

  const rejectCall = () => {
    if (!socket || !callerId) return;
    socket.emit('voice_call:reject', { callerId });
    resetCall();
  };

  const endCall = () => {
    if (!socket) return;
    const peerId = targetId || callerId;
    if (peerId) {
      socket.emit('voice_call:end', { targetUserId: peerId });
    }
    resetCall();
  };

  const resetCall = () => {
    setCallState('IDLE');
    setCallerId(null);
    setTargetId(null);
    setToken(null);
    setRoomName(null);
  };

  return (
    <VoiceCallContext.Provider value={{ initiateCall }}>
      {children}
      <Modal visible={callState !== 'IDLE'} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          {callState === 'INCOMING' && (
            <View style={styles.content}>
              <Text style={styles.title}>Cuộc gọi đến</Text>
              <Text style={styles.name}>{callerName}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={rejectCall}>
                  <Text style={styles.btnText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={acceptCall}>
                  <Text style={styles.btnText}>Nghe</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {callState === 'CALLING' && (
            <View style={styles.content}>
              <Text style={styles.title}>Đang gọi...</Text>
              <Text style={styles.name}>{targetName}</Text>
              <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
              <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={endCall}>
                <Text style={styles.btnText}>Kết thúc</Text>
              </TouchableOpacity>
            </View>
          )}

          {callState === 'ACTIVE' && token && (
            <LiveKitRoom
              serverUrl={liveKitUrl}
              token={token}
              connect={true}
              audio={true}
              video={false}
            >
              <ActiveCallView peerName={callerId ? callerName : targetName} onEndCall={endCall} />
            </LiveKitRoom>
          )}
        </View>
      </Modal>
    </VoiceCallContext.Provider>
  );
}

function ActiveCallView({ peerName, onEndCall }: { peerName: string, onEndCall: () => void }) {
  const room = useRoomContext();

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Đang đàm thoại</Text>
      <Text style={styles.name}>{peerName}</Text>
      <Text style={{ color: '#fff', marginTop: 10 }}>{room?.state}</Text>
      <TouchableOpacity style={[styles.btn, styles.btnReject, { marginTop: 40 }]} onPress={onEndCall}>
        <Text style={styles.btnText}>Kết thúc</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#ccc',
    fontSize: 18,
    marginBottom: 10,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 30,
  },
  btn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnAccept: {
    backgroundColor: '#22c55e',
  },
  btnReject: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
