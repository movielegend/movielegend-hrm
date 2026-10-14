import React, { useRef, useState, useEffect } from 'react';
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
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const OVAL_WIDTH = Math.min(width * 0.68, 250);
const OVAL_HEIGHT = Math.round(OVAL_WIDTH * 1.3);

interface AttendanceCameraProps {
  photoUri: string | null;
  onCapture: (uri: string) => Promise<void> | void;
  onClose?: () => void;
}

export function AttendanceCamera({ photoUri, onCapture, onClose }: AttendanceCameraProps) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturing, setCapturing] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Animations: Radar beam + Pulsing glow
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0.7)).current;

  // Continuous subtle radar sweep
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const handleSnap = async () => {
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

      // Hand over to parent onCapture (which compresses, uploads and verifies with Backend)
      await onCapture(photo.uri);

      // ONLY if onCapture resolves without throwing error: Show verified success!
      setVerifiedSuccess(true);
      try {
        Vibration.vibrate([0, 80, 50, 80]);
      } catch {}

      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error?.message ||
        e?.message ||
        'Khuôn mặt chưa khớp hoặc không hợp lệ. Vui lòng căn chỉnh và chụp lại!';
      setError(errorMsg);
      setCapturing(false);
      setVerifiedSuccess(false);
    }
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

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, OVAL_HEIGHT - 6],
  });

  return (
    <View style={styles.container}>
      {/* Live Camera Background */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Foreground Overlay HUD */}
      <View
        style={[
          styles.overlayContainer,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 28),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBadge}>AI eKYC CHECK-IN</Text>
            <Text style={styles.headerTitle}>Xác thực khuôn mặt</Text>
          </View>
          {onClose && (
            <Pressable style={styles.closeBtn} onPress={onClose} disabled={capturing}>
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Center Oval Face Guide */}
        <View style={styles.faceFrameContainer}>
          {/* Outer Pulsing Aura */}
          <Animated.View
            style={[
              styles.ovalGlow,
              {
                borderColor: verifiedSuccess ? '#10B981' : capturing ? '#38BDF8' : 'rgba(56, 189, 248, 0.4)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Main Oval Frame */}
          <View
            style={[
              styles.faceMask,
              verifiedSuccess && styles.faceMaskSuccess,
              capturing && !verifiedSuccess && styles.faceMaskCapturing,
            ]}
          >
            {/* Tech Corner Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
            <View style={[styles.cornerBracket, styles.bracketTopRight]} />
            <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
            <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

            {/* Radar Beam Scanning Line */}
            {!verifiedSuccess && (
              <Animated.View
                style={[
                  styles.radarBeam,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              />
            )}

            {/* Center Visual Cue */}
            {verifiedSuccess && (
              <Animated.View style={[styles.successBadge, { transform: [{ scale: successScale }] }]}>
                <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
                <Text style={styles.successLabel}>XÁC THỰC THÀNH CÔNG</Text>
              </Animated.View>
            )}

            {!verifiedSuccess && !capturing && (
              <MaterialCommunityIcons
                name="face-recognition"
                size={80}
                color="rgba(255, 255, 255, 0.2)"
              />
            )}

            {capturing && !verifiedSuccess && (
              <View style={styles.processingBadge}>
                <ActivityIndicator size="large" color="#38BDF8" style={{ marginBottom: 12 }} />
                <Text style={styles.processingLabel}>ĐANG ĐỐI CHIẾU AI...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Status Instruction Pill */}
          <View
            style={[
              styles.instructionPill,
              verifiedSuccess && styles.instructionPillSuccess,
              capturing && !verifiedSuccess && styles.instructionPillCapturing,
              Boolean(error) && styles.instructionPillError,
            ]}
          >
            <MaterialCommunityIcons
              name={
                verifiedSuccess
                  ? 'check-decagram'
                  : capturing
                  ? 'cloud-sync'
                  : error
                  ? 'alert-circle'
                  : 'face-recognition'
              }
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.instructionText}>
              {verifiedSuccess
                ? 'Đã khớp khuôn mặt! Đang lưu ca...'
                : capturing
                ? 'Đang gửi ảnh & đối chiếu khuôn mặt...'
                : error
                ? error
                : 'Đưa mặt vào khung và bấm nút Chụp'}
            </Text>
          </View>

          {/* Shutter Button */}
          {!verifiedSuccess && (
            <View style={styles.shutterRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.shutterBtn,
                  pressed && styles.shutterBtnPressed,
                  capturing && { opacity: 0.6 },
                ]}
                onPress={() => void handleSnap()}
                disabled={capturing}
              >
                <View style={styles.shutterBtnInner}>
                  {capturing ? (
                    <ActivityIndicator size="small" color="#102739" />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={28} color="#102739" />
                  )}
                </View>
              </Pressable>
              <Text style={styles.shutterHint}>
                {capturing ? 'Đang phân tích...' : 'Bấm để chụp & điểm danh'}
              </Text>
            </View>
          )}
        </View>
      </View>
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#1E293B',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  permissionDesc: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: '#1E88E5',
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 20,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  faceFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ovalGlow: {
    position: 'absolute',
    width: OVAL_WIDTH + 14,
    height: OVAL_HEIGHT + 14,
    borderRadius: (OVAL_WIDTH + 14) / 2,
    borderWidth: 2,
    opacity: 0.85,
  },
  faceMask: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  faceMaskCapturing: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  faceMaskSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 3.5,
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38BDF8',
  },
  bracketTopLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTopRight: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  radarBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  successBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successLabel: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  processingBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingLabel: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomControls: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxWidth: width - 40,
  },
  instructionPillCapturing: {
    backgroundColor: 'rgba(30, 58, 138, 0.92)',
    borderColor: '#38BDF8',
  },
  instructionPillSuccess: {
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderColor: '#10B981',
  },
  instructionPillError: {
    backgroundColor: 'rgba(185, 28, 28, 0.92)',
    borderColor: '#EF4444',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  shutterRow: {
    alignItems: 'center',
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  shutterBtnPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  shutterBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});
