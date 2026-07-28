import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CallingScreenProps {
  targetName: string;
  targetAvatar?: string | null;
  onEndCall: () => void;
}

export function CallingScreen({ targetName, targetAvatar, onEndCall }: CallingScreenProps) {
  const [elapsed, setElapsed] = useState(0);
  const dotAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);

    // Dots animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 2, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 3, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    // Subtle pulse on avatar
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(timer);
  }, []);

  const initials = targetName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Decorative elements */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />

      <View style={styles.content}>
        <Text style={styles.label}>Đang gọi...</Text>

        {/* Avatar */}
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.avatar}>
            {targetAvatar ? (
              <Image source={{ uri: targetAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
        </Animated.View>

        <Text style={styles.targetName}>{targetName}</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>

        {/* Wave dots */}
        <View style={styles.waveDots}>
          {[0, 1, 2].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.waveDot,
                {
                  opacity: dotAnim.interpolate({
                    inputRange: [i, i + 0.5, i + 1],
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    scale: dotAnim.interpolate({
                      inputRange: [i, i + 0.5, i + 1],
                      outputRange: [0.8, 1.2, 0.8],
                      extrapolate: 'clamp',
                    }),
                  }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* End call button */}
      <View style={styles.bottomSection}>
        <View style={styles.actionItem}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.endBtn]}
            onPress={onEndCall}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Kết thúc</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  decorCircle1: {
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
    borderColor: 'rgba(59, 130, 246, 0.06)',
  },
  decorCircle2: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    bottom: -SCREEN_WIDTH * 0.3,
    left: -SCREEN_WIDTH * 0.2,
    borderColor: 'rgba(59, 130, 246, 0.04)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  label: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 40,
  },
  avatarContainer: {
    marginBottom: 28,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  avatarImage: {
    width: 114,
    height: 114,
    borderRadius: 57,
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  targetName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timer: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  waveDots: {
    flexDirection: 'row',
    gap: 8,
  },
  waveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  bottomSection: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  endBtn: {
    backgroundColor: '#ef4444',
  },
  actionLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
