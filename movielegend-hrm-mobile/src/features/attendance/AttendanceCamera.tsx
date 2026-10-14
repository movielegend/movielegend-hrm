import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.72, 260);
const RING_SIZE = CIRCLE_SIZE + 24;
const STROKE_WIDTH = 4.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface AttendanceCameraProps {
  photoUri: string | null;
  onCapture: (uri: string) => Promise<void> | void;
  onClose?: () => void;
  onSuccess?: () => void;
  title?: string;
  mode?: 'in' | 'out';
}

export function AttendanceCamera({
  photoUri,
  onCapture,
  onClose,
  onSuccess,
  title = 'Xác thực khuôn mặt',
  mode = 'in',
}: AttendanceCameraProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0.7)).current;
  const scanTimerRef = useRef<any>(null);

  // Subtle pulsing animation around the ring
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  // Sync animated progress value to state for SVG strokeDashoffset and percentage text
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.min(100, Math.max(0, Math.round(value))));
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

  // Automated capture & submit flow
  const handleAutoCapture = useCallback(async () => {
    if (capturing || verifiedSuccess || !cameraRef.current) return;
    setCapturing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.65,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error('Không thể chụp được ảnh từ camera');

      try {
        Vibration.vibrate(50);
      } catch {}

      // Hand over to parent onCapture (compress, upload, verify on backend)
      await onCapture(photo.uri);

      // Backend confirmed success!
      setVerifiedSuccess(true);
      try {
        Vibration.vibrate([0, 80, 50, 80]);
      } catch {}

      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose?.();
        }
      }, 1300);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error?.message ||
        e?.message ||
        'Khuôn mặt chưa khớp hoặc không hợp lệ. Vui lòng căn chỉnh lại!';
      setError(errorMsg);
      setCapturing(false);
      setVerifiedSuccess(false);

      try {
        Vibration.vibrate([0, 100, 50, 100]);
      } catch {}

      // Auto-restart scanning after 2.5 seconds so user can adjust face without touching screen
      scanTimerRef.current = setTimeout(() => {
        startScanSequence();
      }, 2500);
    }
  }, [capturing, verifiedSuccess, onCapture, onClose]);

  // Start the circular progress sequence (0% -> 100% over 1.9s)
  const startScanSequence = useCallback(() => {
    if (capturing || verifiedSuccess) return;
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    setError(null);
    progressAnim.setValue(0);
    setProgressPercent(0);

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 1900,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        void handleAutoCapture();
      }
    });
  }, [capturing, verifiedSuccess, handleAutoCapture]);

  // Trigger scanning sequence once camera is ready
  const handleCameraReady = () => {
    setCameraReady(true);
    // Give camera 400ms to stabilize auto-exposure/focus before starting progress
    scanTimerRef.current = setTimeout(() => {
      startScanSequence();
    }, 450);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#6B7280" style={{ marginBottom: 16 }} />
          <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
          <Text style={styles.permissionDesc}>
            Ứng dụng cần camera để quét khuôn mặt và điểm danh an toàn.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Cho phép truy cập</Text>
          </Pressable>
          {onClose && (
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Hủy bỏ</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  const strokeDashoffset = CIRCUMFERENCE * (1 - progressPercent / 100);
  // Center the circular frame at 48% of available vertical height (perfect eye and face level)
  const centerTop = insets.top + (SCREEN_HEIGHT - insets.top - insets.bottom) * 0.48 - CIRCLE_SIZE / 2;

  return (
    <View style={styles.container}>
      {/* Live Camera View full screen */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={handleCameraReady}
      />

      {/* Unified Center Anchor: Cutout, SVG Ring, Aura, Top Capsule, Bottom Status */}
      <View style={[styles.circleCenterAnchor, { top: centerTop }]}>
        {/* 1. Dark vignette surround cutout - creates circular camera window */}
        <View style={styles.cutoutHole} pointerEvents="none" />

        {/* 2. Top Capsule - floats directly above the circle */}
        <View style={styles.topCapsule}>
          <Text style={styles.topCapsuleTitle}>{title}</Text>
          <Text style={styles.topCapsuleSubtitle}>
            {capturing ? 'Đang gửi dữ liệu xác thực...' : 'Giữ yên khi đang xác minh...'}
          </Text>
        </View>

        {/* 3. Outer SVG Progress Ring */}
        <View style={[styles.svgWrapper, { width: RING_SIZE, height: RING_SIZE }]} pointerEvents="none">
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Dark dashed circular track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.28)"
              strokeDasharray="6 6"
              strokeWidth={2}
              fill="none"
            />
            {/* Animated Progress Ring (Green / Red) */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={verifiedSuccess ? '#22C55E' : error ? '#EF4444' : '#22C55E'}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
        </View>

        {/* 4. Pulsing Aura Border */}
        <Animated.View
          style={[
            styles.innerAura,
            {
              borderColor: verifiedSuccess
                ? '#22C55E'
                : error
                ? '#EF4444'
                : capturing
                ? '#38BDF8'
                : 'rgba(34, 197, 94, 0.45)',
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        />

        {/* 5. Bottom Status Text - floats directly below the circle */}
        <View style={styles.bottomStatusWrap}>
          {verifiedSuccess ? (
            <View style={styles.successPill}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#22C55E" style={{ marginRight: 6 }} />
              <Text style={styles.successPillText}>Nhận diện thành công!</Text>
            </View>
          ) : capturing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#22C55E" style={{ marginRight: 8 }} />
              <Text style={styles.processingText}>Đang xử lý xác minh khuôn mặt... Vui lòng chờ...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <View style={styles.errorPill}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#F87171" style={{ marginRight: 6 }} />
                <Text style={styles.errorText} numberOfLines={2}>
                  {error}
                </Text>
              </View>
              <Pressable style={styles.retryBtn} onPress={startScanSequence}>
                <MaterialCommunityIcons name="reload" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Thử lại ngay</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.bottomPercentText}>
              Đang xác minh khuôn mặt... {progressPercent}%
            </Text>
          )}
        </View>
      </View>

      {/* Close Button in top right corner */}
      {onClose && (
        <Pressable
          style={[styles.closeBtn, { top: insets.top + (Platform.OS === 'ios' ? 12 : 20) }]}
          onPress={onClose}
          disabled={capturing || verifiedSuccess}
        >
          <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Success Dialog Modal - Exactly like videoplayback.mp4 (00:52) */}
      {verifiedSuccess && (
        <View style={styles.successModalBackdrop}>
          <Animated.View style={[styles.successModalCard, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={48} color="#22C55E" />
            </View>
            <Text style={styles.successModalTitle}>
              {mode === 'out' ? 'Bạn đã check out thành công!' : 'Bạn đã check in thành công!'}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryBtnText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
  },

  circleCenterAnchor: {
    position: 'absolute',
    left: (SCREEN_WIDTH - CIRCLE_SIZE) / 2,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cutoutHole: {
    position: 'absolute',
    width: CIRCLE_SIZE + 4000,
    height: CIRCLE_SIZE + 4000,
    borderRadius: (CIRCLE_SIZE + 4000) / 2,
    borderWidth: 2000,
    borderColor: 'rgba(0, 0, 0, 0.85)',
  },
  svgWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerAura: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2.5,
    opacity: 0.9,
  },
  topCapsule: {
    position: 'absolute',
    bottom: CIRCLE_SIZE + 20,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  topCapsuleTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topCapsuleSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  bottomStatusWrap: {
    position: 'absolute',
    top: CIRCLE_SIZE + 24,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    width: SCREEN_WIDTH - 40,
  },
  bottomPercentText: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  successPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  successPillText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '800',
  },
  errorBox: {
    alignItems: 'center',
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH - 60,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Close button in top right
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },

  // Modal dialog when check-in succeeds (like videoplayback.mp4 00:52)
  successModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: 32,
  },
  successModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 3,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
  },
});
