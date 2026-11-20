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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Portrait Oval proportions (Apple Face ID & Banking standard)
const OVAL_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 270);
const OVAL_HEIGHT = Math.round(OVAL_WIDTH * 1.34); // ~362px for natural portrait face fitting
const OVAL_RADIUS = OVAL_WIDTH / 2;

// Exact stadium perimeter: 2 vertical straight lines + 2 semicircles
const STRAIGHT_LINE_LEN = OVAL_HEIGHT - OVAL_WIDTH;
const OVAL_PERIMETER = 2 * STRAIGHT_LINE_LEN + 2 * Math.PI * OVAL_RADIUS;

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
  const [capturing, setCapturing] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated values
  const successScale = useRef(new Animated.Value(0.7)).current;

  // Manual capture & submit flow (Người dùng tự bấm chụp theo ý muốn)
  const handleCapture = useCallback(async () => {
    if (capturing || verifiedSuccess || !cameraRef.current) return;
    setCapturing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (!photo?.uri) throw new Error('Không thể chụp được ảnh từ camera');

      try {
        Vibration.vibrate(40);
      } catch {}

      // Gửi sang hàm xử lý chấm công (nén ảnh và gọi API)
      await onCapture(photo.uri);

      // Backend xác nhận thành công!
      setVerifiedSuccess(true);
      try {
        Vibration.vibrate([0, 60, 40, 60]);
      } catch {}

      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose?.();
        }
      }, 100);
    } catch (e: any) {
      const errorMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error?.message ||
        e?.message ||
        'Khuôn mặt chưa khớp. Vui lòng căn chỉnh lại!';
      setError(errorMsg);
      setCapturing(false);
      setVerifiedSuccess(false);

      try {
        Vibration.vibrate([0, 80, 40, 80]);
      } catch {}
    }
  }, [capturing, verifiedSuccess, onCapture, onSuccess, onClose]);

  const handleCameraReady = () => {
    setCameraReady(true);
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
            Ứng dụng cần camera để nhận diện khuôn mặt và chấm công an toàn.
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

  // Vertical placement: eye-level center (42% of available safe screen height)
  const availableHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
  const ovalCenterY = insets.top + availableHeight * 0.42;
  const ovalTop = Math.round(ovalCenterY - OVAL_HEIGHT / 2);
  const ovalLeft = Math.round((SCREEN_WIDTH - OVAL_WIDTH) / 2);

  const ringColor = verifiedSuccess ? '#22C55E' : error ? '#EF4444' : '#22C55E';

  return (
    <View style={styles.container}>
      {/* 1. Fullscreen Live Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={handleCameraReady}
      />

      {/* 2. Soft Dark Vignette Mask (Cutout Oval) */}
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Mask id="faceCutoutMask">
            <Rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="#FFFFFF" />
            <Rect
              x={ovalLeft}
              y={ovalTop}
              width={OVAL_WIDTH}
              height={OVAL_HEIGHT}
              rx={OVAL_RADIUS}
              ry={OVAL_RADIUS}
              fill="#000000"
            />
          </Mask>
        </Defs>
        <Rect
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="rgba(0, 0, 0, 0.58)"
          mask="url(#faceCutoutMask)"
        />
      </Svg>

      {/* 3. Minimalist Oval Guide with Soft Rounded Face ID Corners */}
      <View
        style={[
          styles.ovalFrame,
          {
            left: ovalLeft,
            top: ovalTop,
            width: OVAL_WIDTH,
            height: OVAL_HEIGHT,
            borderRadius: OVAL_RADIUS,
            borderColor: verifiedSuccess
              ? '#22C55E'
              : error
              ? '#EF4444'
              : 'rgba(255, 255, 255, 0.4)',
          },
        ]}
        pointerEvents="none"
      >
        {/* Apple Face ID Style Corner Brackets */}
        <View style={[styles.cornerBracket, styles.bracketTL, { borderColor: ringColor }]} />
        <View style={[styles.cornerBracket, styles.bracketTR, { borderColor: ringColor }]} />
        <View style={[styles.cornerBracket, styles.bracketBL, { borderColor: ringColor }]} />
        <View style={[styles.cornerBracket, styles.bracketBR, { borderColor: ringColor }]} />
      </View>

      {/* 4. Top Header with Scrim Gradient */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.45)', 'transparent']}
        style={[styles.topScrim, { paddingTop: insets.top + (Platform.OS === 'ios' ? 12 : 16) }]}
        pointerEvents="box-none"
      >
        <View style={styles.topHeaderRow}>
          <View style={styles.topTitleBox}>
            <Text style={styles.topHeaderTitle}>{title}</Text>
            <Text style={styles.topHeaderSubtitle}>
              {capturing
                ? 'Đang đối soát khuôn mặt...'
                : 'Căn chỉnh khuôn mặt vào giữa khung hình'}
            </Text>
          </View>

          {onClose && (
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              disabled={capturing || verifiedSuccess}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* 5. Bottom Controls (Nút chụp thủ công chủ động) */}
      <View
        style={[
          styles.bottomControlsWrap,
          {
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {verifiedSuccess ? (
          <View style={styles.statusPillSuccess}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#22C55E" style={{ marginRight: 8 }} />
            <Text style={styles.statusPillSuccessText}>Nhận diện thành công!</Text>
          </View>
        ) : error ? (
          <View style={styles.statusPillError}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
            <Text style={styles.statusPillErrorText} numberOfLines={2}>
              {error}
            </Text>
          </View>
        ) : (
          <Text style={styles.bottomInstructionText}>
            {capturing ? 'Đang phân tích khuôn mặt...' : 'Căn mặt ngay ngắn rồi chạm nút chụp'}
          </Text>
        )}

        {/* Nút bấm chụp ảnh thủ công */}
        <Pressable
          style={[styles.shutterBtn, (capturing || verifiedSuccess) && styles.shutterBtnDisabled]}
          onPress={handleCapture}
          disabled={capturing || verifiedSuccess}
        >
          {capturing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.shutterInnerCircle}>
              <MaterialCommunityIcons name="camera" size={30} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
      </View>

      {/* 7. Success Dialog Modal (Clean Apple / Banking standard) */}
      {verifiedSuccess && (
        <View style={styles.successModalBackdrop}>
          <Animated.View style={[styles.successModalCard, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={44} color="#16A34A" />
            </View>
            <Text style={styles.successModalTitle}>
              {mode === 'out' ? 'Điểm danh ra ca thành công' : 'Điểm danh vào ca thành công'}
            </Text>
            <Text style={styles.successModalSubtitle}>
              Dữ liệu chấm công đã được ghi nhận vào hệ thống
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

  // Oval Frame & Brackets
  ovalFrame: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgRingWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Apple Face ID Corner Brackets
  cornerBracket: {
    position: 'absolute',
    width: 26,
    height: 26,
  },
  bracketTL: {
    top: 14,
    left: 14,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  bracketTR: {
    top: 14,
    right: 14,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  bracketBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  bracketBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },

  // Top Scrim Header
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 28,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitleBox: {
    flex: 1,
    paddingRight: 12,
  },
  topHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Bottom Controls & Shutter
  bottomControlsWrap: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bottomInstructionText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  shutterBtnDisabled: {
    opacity: 0.6,
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPillSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.92)',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statusPillSuccessText: {
    color: '#22C55E',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusPillError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH - 60,
  },
  statusPillErrorText: {
    color: '#FFFFFF',
    fontSize: 13,
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

  // Success Modal Dialog
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
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 2.5,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 25,
  },
  successModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
