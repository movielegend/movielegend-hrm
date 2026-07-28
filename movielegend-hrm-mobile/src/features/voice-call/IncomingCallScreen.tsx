import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Vibration,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IncomingCallScreenProps {
  callerName: string;
  callerAvatar?: string | null;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallScreen({ callerName, callerAvatar, onAccept, onReject }: IncomingCallScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let currentSound: Audio.Sound | null = null;
    let isMounted = true;

    async function playRingtone() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          require('../../../../assets/nhac_chuong_Dai_ca_oi_co_dien_thoai_ban_goc_ngan-www_tiengdong_com.mp3'),
          { isLooping: true }
        );
        
        if (isMounted) {
          currentSound = newSound;
          setSound(newSound);
          await newSound.playAsync();
        } else {
          // If unmounted before loading finished
          await newSound.unloadAsync();
        }
      } catch (error) {
        console.warn('Failed to load ringtone:', error);
      }
    }

    playRingtone();

    // Vibrate pattern for incoming call
    const vibrationPattern = [0, 800, 400, 800];
    Vibration.vibrate(vibrationPattern, true);

    // Pulse animation for avatar ring
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    // Ring rotation for phone icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: -0.5, duration: 150, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    ).start();

    // Entrance animation
    Animated.parallel([
      Animated.timing(slideUpAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeInAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    return () => {
      isMounted = false;
      Vibration.cancel();
      if (currentSound) {
        currentSound.stopAsync().then(() => {
          currentSound?.unloadAsync();
        }).catch(() => {}); // ignore errors on unmount
      }
    };
  }, []);

  const ringRotate = ringAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const initials = callerName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      <View style={[styles.decorCircle, styles.decorCircle3]} />

      <Animated.View style={[styles.content, { opacity: fadeInAnim, transform: [{ translateY: slideUpAnim }] }]}>
        {/* Phone icon ringing */}
        <Animated.View style={{ transform: [{ rotate: ringRotate }], marginBottom: 28 }}>
          <MaterialCommunityIcons name="phone-ring" size={36} color="#22c55e" />
        </Animated.View>

        <Text style={styles.label}>Cuộc gọi đến</Text>

        {/* Avatar with pulse */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing2,
              {
                transform: [{ scale: Animated.add(pulseAnim, -0.15) }],
                opacity: Animated.add(pulseOpacity, 0.1),
              },
            ]}
          />
          <View style={styles.avatar}>
            {callerAvatar ? (
              <Image source={{ uri: callerAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
        </View>

        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.subtitle}>Cuộc gọi thoại</Text>
      </Animated.View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={onReject}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Từ chối</Text>
        </View>

        <View style={styles.actionItem}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={onAccept}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Nghe</Text>
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
    width: SCREEN_WIDTH * 1.6,
    height: SCREEN_WIDTH * 1.6,
    top: -SCREEN_WIDTH * 0.4,
    left: -SCREEN_WIDTH * 0.3,
    borderColor: 'rgba(34, 197, 94, 0.06)',
  },
  decorCircle2: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    bottom: -SCREEN_WIDTH * 0.4,
    right: -SCREEN_WIDTH * 0.3,
    borderColor: 'rgba(34, 197, 94, 0.04)',
  },
  decorCircle3: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    top: '20%',
    right: -SCREEN_WIDTH * 0.2,
    borderColor: 'rgba(59, 130, 246, 0.04)',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  label: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
  },
  pulseRing2: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(34, 197, 94, 0.5)',
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
  callerName: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 60,
    paddingBottom: 80,
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
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  acceptBtn: {
    backgroundColor: '#22c55e',
  },
  actionLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
