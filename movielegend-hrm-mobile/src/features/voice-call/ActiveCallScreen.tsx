import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ActiveCallScreenProps {
  peerName: string;
  peerAvatar?: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  connectionState?: string;
}

export function ActiveCallScreen({
  peerName,
  peerAvatar,
  isMuted,
  isSpeaker,
  onToggleMute,
  onToggleSpeaker,
  onEndCall,
  connectionState,
}: ActiveCallScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const waveAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);

    // Sound wave animation
    waveAnims.forEach((anim, idx) => {
      const animate = () => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 200 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      setTimeout(() => animate(), idx * 100);
    });

    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const initials = peerName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Decorative */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />

      <View style={styles.content}>
        {/* Connection indicator */}
        <View style={styles.connectionRow}>
          <View style={[
            styles.connectionDot,
            { backgroundColor: connectionState === 'connected' ? '#22c55e' : '#f59e0b' },
          ]} />
          <Text style={styles.connectionText}>
            {connectionState === 'connected' ? 'Đã kết nối' : 'Đang kết nối...'}
          </Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              {peerAvatar ? (
                <Image source={{ uri: peerAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.peerName}>{peerName}</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>

        {/* Sound wave visualization */}
        {!isMuted && (
          <View style={styles.soundWave}>
            {waveAnims.map((anim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.soundBar,
                  {
                    transform: [{ scaleY: anim }],
                    backgroundColor: idx % 2 === 0 ? '#22c55e' : '#16a34a',
                  },
                ]}
              />
            ))}
          </View>
        )}

        {isMuted && (
          <View style={styles.mutedIndicator}>
            <MaterialCommunityIcons name="microphone-off" size={18} color="#ef4444" />
            <Text style={styles.mutedText}>Micro đã tắt</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          {/* Mute */}
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={onToggleMute}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={26}
                color={isMuted ? '#ef4444' : '#fff'}
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isMuted ? 'Bỏ tắt' : 'Tắt mic'}</Text>
          </View>

          {/* Speaker */}
          <View style={styles.controlItem}>
            <TouchableOpacity
              style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
              onPress={onToggleSpeaker}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isSpeaker ? 'volume-high' : 'volume-medium'}
                size={26}
                color={isSpeaker ? '#3b82f6' : '#fff'}
              />
            </TouchableOpacity>
            <Text style={styles.controlLabel}>{isSpeaker ? 'Loa ngoài' : 'Loa trong'}</Text>
          </View>
        </View>

        {/* End call */}
        <View style={styles.endCallSection}>
          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={onEndCall}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.controlLabel}>Kết thúc</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  decorCircle1: {
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    top: -SCREEN_WIDTH * 0.5,
    left: -SCREEN_WIDTH * 0.25,
    borderColor: 'rgba(34, 197, 94, 0.05)',
  },
  decorCircle2: {
    width: SCREEN_WIDTH * 1.1,
    height: SCREEN_WIDTH * 1.1,
    bottom: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
    borderColor: 'rgba(59, 130, 246, 0.05)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 38,
    fontWeight: '700',
  },
  peerName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timer: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    marginBottom: 24,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 4,
  },
  soundBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  mutedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 20,
  },
  mutedText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  controlItem: {
    alignItems: 'center',
    gap: 10,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  endCallSection: {
    alignItems: 'center',
    gap: 10,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
