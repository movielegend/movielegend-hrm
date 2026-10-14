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
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
const OVAL_WIDTH = Math.min(width * 0.76, 300);
const OVAL_HEIGHT = OVAL_WIDTH * 1.32;

interface AttendanceCameraProps {
  photoUri: string | null;
  onCapture: (uri: string) => void;
  onClose?: () => void;
}

export function AttendanceCamera({ photoUri, onCapture, onClose }: AttendanceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturing, setCapturing] = useState(false);
  const [capturedSuccess, setCapturedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Animations: Radar beam + Pulsing glow
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;

  // Start continuous radar scan animation
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
          toValue: 1.05,
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
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Auto-capture timer: Once camera is mounted and stable (1.2s), trigger automatic photo capture
  useEffect(() => {
    if (!cameraReady || capturing || capturedSuccess || photoUri) return;

    const autoTimer = setTimeout(() => {
      void takePhoto();
    }, 1400);

    return () => clearTimeout(autoTimer);
  }, [cameraReady, capturing, capturedSuccess, photoUri]);

  const takePhoto = async () => {
    if (capturing || capturedSuccess || !cameraRef.current) return;
    setCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedSuccess(true);
        try {
          Vibration.vibrate(60);
        } catch {}

        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start();

        // Brief 400ms delay to display emerald confirmation before handing over
        setTimeout(() => {
          onCapture(photo.uri);
        }, 450);
      } else {
        throw new Error('Không thể chụp được ảnh');
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi chụp ảnh');
      setCapturing(false);
      setCapturedSuccess(false);
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
            Ứng dụng cần camera để quét sinh trắc học khuôn mặt và điểm danh an toàn.
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
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Dark vignette backdrop with clear oval hole */}
      <View style={styles.overlayContainer}>
        {/* Header bar */}
        <View style={styles.topHeader}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBadge}>AI eKYC CHECK-IN</Text>
            <Text style={styles.headerTitle}>Xác thực khuôn mặt</Text>
          </View>
          {onClose && (
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Center eKYC Oval Target with Corner Brackets */}
        <View style={styles.faceFrameContainer}>
          {/* Outer glowing pulsing ring */}
          <Animated.View
            style={[
              styles.ovalGlow,
              {
                borderColor: capturedSuccess ? '#10B981' : capturing ? '#60A5FA' : 'rgba(59, 130, 246, 0.4)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Main Oval Frame */}
          <View
            style={[
              styles.faceMask,
              capturedSuccess && styles.faceMaskSuccess,
              capturing && !capturedSuccess && styles.faceMaskCapturing,
            ]}
          >
            {/* Corner Tech Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
            <View style={[styles.cornerBracket, styles.bracketTopRight]} />
            <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
            <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

            {/* Radar Beam Scanning Line */}
            {!capturedSuccess && (
              <Animated.View
                style={[
                  styles.radarBeam,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              />
            )}

            {/* Success Overlay Indicator */}
            {capturedSuccess && (
              <Animated.View style={[styles.successBadge, { transform: [{ scale: successScale }] }]}>
                <MaterialCommunityIcons name="check-circle" size={84} color="#10B981" />
                <Text style={styles.successLabel}>ĐÃ KHỚP KHUÔN MẶT</Text>
              </Animated.View>
            )}

            {!capturedSuccess && !capturing && (
              <MaterialCommunityIcons
                name="face-recognition"
                size={88}
                color="rgba(255, 255, 255, 0.18)"
              />
            )}

            {capturing && !capturedSuccess && (
              <ActivityIndicator size="large" color="#60A5FA" />
            )}
          </View>
        </View>

        {/* Bottom controls & Guidance Pill */}
        <View style={styles.bottomControls}>
          <View
            style={[
              styles.instructionPill,
              capturedSuccess && styles.instructionPillSuccess,
              capturing && !capturedSuccess && styles.instructionPillCapturing,
            ]}
          >
            <MaterialCommunityIcons
              name={capturedSuccess ? 'check-decagram' : capturing ? 'cloud-sync' : 'scan-helper'}
              size={20}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.instructionText}>
              {capturedSuccess
                ? 'Nhận diện thành công! Đang lưu ca...'
                : capturing
                ? 'Đang chụp & xử lý khuôn mặt...'
                : 'Giữ yên mặt trong khung elip để tự động quét'}
            </Text>
          </View>

          {error && (
            <View style={styles.errorPill}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Quick Manual Snap Button (fallback/instant) */}
          {!capturedSuccess && (
            <View style={styles.shutterRow}>
              <Pressable
                style={({ pressed }) => [styles.shutterBtn, pressed && styles.shutterBtnPressed]}
                onPress={() => void takePhoto()}
                disabled={capturing}
              >
                <View style={styles.shutterBtnInner}>
                  <MaterialCommunityIcons name="camera" size={26} color="#102739" />
                </View>
              </Pressable>
              <Text style={styles.shutterHint}>Chạm để chụp ngay</Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    opacity: 0.8,
  },
  faceMask: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  faceMaskCapturing: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  faceMaskSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 3.5,
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#60A5FA',
  },
  bracketTopLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTopRight: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBottomRight: {
    bottom: 20,
    right: 20,
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
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  bottomControls: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  instructionPillCapturing: {
    backgroundColor: 'rgba(30, 58, 138, 0.88)',
    borderColor: '#60A5FA',
  },
  instructionPillSuccess: {
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    borderColor: '#10B981',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  shutterRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shutterBtnPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  shutterBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterHint: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
});
