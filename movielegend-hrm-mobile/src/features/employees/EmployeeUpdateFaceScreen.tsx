import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Dimensions,
  Animated,
  Vibration,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { useAppAlert } from '../../contexts/AlertContext';
import { uploadFile } from '../../api/uploads.api';
import { updateMyFace, validateFacePose } from '../../api/users.api';
import { LoadingState } from '../../components/LoadingState';
import { useAuth } from '../../providers/AuthProvider';
import type { FacePose } from '../../types/registration.types';
import { normalizeApiError } from '../../utils/api-error';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Apple Face ID Portrait Oval proportions
const OVAL_WIDTH = Math.min(SCREEN_WIDTH * 0.72, 270);
const OVAL_HEIGHT = Math.round(OVAL_WIDTH * 1.34); // ~362px
const OVAL_RADIUS = OVAL_WIDTH / 2;

// Perimeter of rounded rect (two vertical straight lines + two semicircles = 2 * (H - 2R) + 2 * PI * R)
const OVAL_STRAIGHT_SEGMENT = Math.max(0, OVAL_HEIGHT - 2 * OVAL_RADIUS);
const OVAL_PERIMETER = 2 * OVAL_STRAIGHT_SEGMENT + 2 * Math.PI * OVAL_RADIUS;
const AUTO_SCAN_DURATION = 3000; // 3.0 seconds auto-scan flow

const POSES: FacePose[] = ['FRONT', 'LEFT', 'RIGHT'];

const POSE_INFO: Record<FacePose, { title: string; subtitle: string; shortLabel: string; icon: string }> = {
  FRONT: {
    title: 'Nhìn thẳng vào camera',
    subtitle: 'Giữ khuôn mặt ở chính giữa khung hình',
    shortLabel: 'Nhìn thẳng',
    icon: 'face-recognition',
  },
  LEFT: {
    title: 'Nghiêng mặt sang TRÁI',
    subtitle: 'Nghiêng góc mặt khoảng 20° - 30° sang bên trái',
    shortLabel: 'Nghiêng trái',
    icon: 'arrow-left-bold-circle',
  },
  RIGHT: {
    title: 'Nghiêng mặt sang PHẢI',
    subtitle: 'Nghiêng góc mặt khoảng 20° - 30° sang bên phải',
    shortLabel: 'Nghiêng phải',
    icon: 'arrow-right-bold-circle',
  },
};

export function EmployeeUpdateFaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reloadProfile } = useAuth();
  const { showAlert } = useAppAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [activePoseIndex, setActivePoseIndex] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<
    Record<FacePose, { localUri: string; fileId?: string; imageUrl?: string } | null>
  >({
    FRONT: null,
    LEFT: null,
    RIGHT: null,
  });

  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [justCapturedPose, setJustCapturedPose] = useState<FacePose | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastAttemptPhoto, setLastAttemptPhoto] = useState<{ uri: string; pose: FacePose } | null>(null);

  const [step, setStep] = useState<'SCANNING' | 'UPLOADING' | 'COMPLETED'>('SCANNING');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Đang chuẩn bị dữ liệu...');

  // 3s Auto-scan progress state (Face ID automated flow)
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPercent, setProgressPercent] = useState(0);
  const scanTimerRef = useRef<any>(null);
  const isAutoScanningRef = useRef<boolean>(false);

  const activePose: FacePose = POSES[activePoseIndex] ?? 'FRONT';

  // Animations
  const successScale = useRef(new Animated.Value(0.7)).current;

  // Sync animated progress value to state for SVG strokeDashoffset and countdown display
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.min(100, Math.max(0, Math.round(value))));
    });

    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  // Stop current scan sequence
  const stopScanSequence = useCallback(() => {
    isAutoScanningRef.current = false;
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    setProgressPercent(0);
  }, [progressAnim]);

  // Handle snapping and intelligent validation
  const handleCapturePose = useCallback(async (pose: FacePose) => {
    if (capturing || isValidating || !cameraRef.current) return;
    stopScanSequence();
    setCapturing(true);
    setValidationError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error('Không thể chụp được ảnh');

      setIsValidating(true);

      // Lightweight compression to 320px for rapid AI validation (~15-20KB base64)
      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 320 } }],
        { compress: 0.35, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64Data = await FileSystem.readAsStringAsync(compressed.uri, { encoding: 'base64' });

      // Call backend to verify: (1) Is there a real face? (2) Is the pose matching expected angle?
      const checkResult = await validateFacePose({
        imageBase64: base64Data,
        pose,
      });

      if (!checkResult.valid) {
        setLastAttemptPhoto({ uri: photo.uri, pose });
        setValidationError(checkResult.message || 'Khuôn mặt chưa khớp tư thế yêu cầu. Vui lòng căn chỉnh lại.');
        setCapturing(false);
        setIsValidating(false);

        try {
          Vibration.vibrate([0, 80, 40, 80]);
        } catch {}

        // Auto restart scan after 2.5s so user can re-align and auto-capture without touching screen!
        scanTimerRef.current = setTimeout(() => {
          setValidationError(null);
          startScanSequence();
        }, 2500);
        return;
      }

      // Face and angle are VALID!
      setLastAttemptPhoto(null);
      try {
        Vibration.vibrate([0, 50, 30, 50]);
      } catch {}

      const nextCaptured = {
        ...capturedPhotos,
        [pose]: { localUri: photo.uri },
      };
      setCapturedPhotos(nextCaptured);
      setJustCapturedPose(pose);
      setCapturing(false);
      setIsValidating(false);

      // Advance to next pose or complete registration
      setTimeout(() => {
        setJustCapturedPose(null);

        if (activePoseIndex < POSES.length - 1) {
          setActivePoseIndex(activePoseIndex + 1);
        } else {
          const allDone = POSES.every((p) => Boolean(nextCaptured[p]));
          if (allDone) {
            void handleBatchUpload(nextCaptured);
          }
        }
      }, 700);

    } catch (err: any) {
      setValidationError(
        err?.response?.data?.message ||
        err?.message ||
        'Lỗi kiểm tra ảnh, vui lòng thử lại.'
      );
      setCapturing(false);
      setIsValidating(false);

      try {
        Vibration.vibrate([0, 80, 40, 80]);
      } catch {}

      scanTimerRef.current = setTimeout(() => {
        setValidationError(null);
        startScanSequence();
      }, 2500);
    }
  }, [capturing, isValidating, capturedPhotos, activePoseIndex, stopScanSequence]);

  // Start the 3-second progress sequence (Face ID style auto-capture)
  const startScanSequence = useCallback(() => {
    if (capturing || isValidating || step !== 'SCANNING') return;
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    setProgressPercent(0);
    isAutoScanningRef.current = true;

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: AUTO_SCAN_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && isAutoScanningRef.current) {
        isAutoScanningRef.current = false;
        void handleCapturePose(activePose);
      }
    });
  }, [capturing, isValidating, step, activePose, handleCapturePose, progressAnim]);

  // Clear errors and auto-start scan when changing pose or when camera is ready
  useEffect(() => {
    setValidationError(null);
    setLastAttemptPhoto(null);
    setJustCapturedPose(null);
    stopScanSequence();

    if (cameraReady && step === 'SCANNING') {
      // 500ms delay to let user stabilize position before 3s scan
      scanTimerRef.current = setTimeout(() => {
        startScanSequence();
      }, 500);
    }

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      stopScanSequence();
    };
  }, [activePoseIndex, cameraReady, step]);

  // Fallback to accept photo if user is confident with their angle
  const acceptCurrentPhotoAnyway = () => {
    if (!lastAttemptPhoto) return;
    stopScanSequence();
    const { uri, pose } = lastAttemptPhoto;
    setValidationError(null);
    setLastAttemptPhoto(null);

    const nextCaptured = {
      ...capturedPhotos,
      [pose]: { localUri: uri },
    };
    setCapturedPhotos(nextCaptured);
    setJustCapturedPose(pose);

    try {
      Vibration.vibrate([0, 50, 30, 50]);
    } catch {}

    setTimeout(() => {
      setJustCapturedPose(null);
      if (activePoseIndex < POSES.length - 1) {
        setActivePoseIndex(activePoseIndex + 1);
      } else {
        const allDone = POSES.every((p) => Boolean(nextCaptured[p]));
        if (allDone) {
          void handleBatchUpload(nextCaptured);
        }
      }
    }, 600);
  };

  const handleBatchUpload = async (photosMap: typeof capturedPhotos) => {
    setStep('UPLOADING');
    setUploadPercent(10);
    setUploadStatusText('Đang nén & mã hóa ảnh...');

    try {
      const uploadedPayload: Array<{ pose: FacePose; imageUrl: string; fileId?: string }> = [];

      let idx = 0;
      for (const p of POSES) {
        const item = photosMap[p];
        if (!item?.localUri) throw new Error(`Thiếu ảnh góc ${p}`);

        setUploadStatusText(`Đang đồng bộ góc ${POSE_INFO[p].shortLabel.toLowerCase()}...`);
        const result = await uploadFile({
          uri: item.localUri,
          name: `${p.toLowerCase()}-face.jpg`,
          mimeType: 'image/jpeg',
          purpose: 'FACE_REGISTRATION',
          onProgress: (pEvent) => {
            const basePct = 15 + Math.round((idx / POSES.length) * 60);
            const stepPct = Math.round((pEvent.percent / 100) * (60 / POSES.length));
            setUploadPercent(Math.min(basePct + stepPct, 78));
          },
        });

        uploadedPayload.push({
          pose: p,
          imageUrl: result.fileUrl,
          fileId: result.fileId,
        });
        idx++;
      }

      setUploadPercent(85);
      setUploadStatusText('Đang lưu trữ dữ liệu sinh trắc học vào hệ thống...');
      await updateMyFace({ faceImages: uploadedPayload });

      setUploadPercent(100);
      setUploadStatusText('Đăng ký hoàn tất!');
      await reloadProfile();

      try {
        Vibration.vibrate([0, 60, 40, 60]);
      } catch {}

      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      setStep('COMPLETED');
    } catch (error: any) {
      showAlert('Lỗi tải lên', normalizeApiError(error).message);
      setStep('SCANNING');
    }
  };

  if (!permission) return <LoadingState label="Đang kiểm tra quyền camera..." />;

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-off" size={48} color="#6B7280" style={{ marginBottom: 16 }} />
          <Text style={styles.permissionTitle}>Cần quyền truy cập Camera</Text>
          <Text style={styles.permissionDesc}>
            Ứng dụng cần camera để quét 3 góc mặt phục vụ nhận diện chấm công an toàn.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => void requestPermission()}>
            <Text style={styles.primaryBtnText}>Cho phép truy cập</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Quay lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Eye-level vertical position
  const availableHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
  const ovalCenterY = insets.top + availableHeight * 0.44;
  const ovalTop = Math.round(ovalCenterY - OVAL_HEIGHT / 2);
  const ovalLeft = Math.round((SCREEN_WIDTH - OVAL_WIDTH) / 2);

  const strokeDashoffset = OVAL_PERIMETER * (1 - progressPercent / 100);
  const secondsLeft = Math.max(1, Math.ceil(3 - (progressPercent / 100) * 3));

  const ringColor = justCapturedPose
    ? '#22C55E'
    : validationError
    ? '#EF4444'
    : progressPercent > 0
    ? '#22C55E'
    : 'rgba(255, 255, 255, 0.4)';

  const frameBorderColor = justCapturedPose
    ? '#22C55E'
    : validationError
    ? '#EF4444'
    : 'rgba(255, 255, 255, 0.45)';

  return (
    <View style={styles.container}>
      {/* 1. Live Camera Background */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onCameraReady={() => setCameraReady(true)}
      />

      {/* 2. Soft Dark Vignette Cutout (SVG) */}
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Mask id="faceRegMask">
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
          mask="url(#faceRegMask)"
        />
      </Svg>

      {/* 3. Outer Smooth SVG Progress Ring (Face ID Style 3s Auto-Scan) */}
      <View
        style={[
          styles.svgRingWrapper,
          {
            left: ovalLeft - 5,
            top: ovalTop - 5,
            width: OVAL_WIDTH + 10,
            height: OVAL_HEIGHT + 10,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={OVAL_WIDTH + 10} height={OVAL_HEIGHT + 10}>
          {/* Subtle faint background track */}
          <Rect
            x={5}
            y={5}
            width={OVAL_WIDTH}
            height={OVAL_HEIGHT}
            rx={OVAL_RADIUS}
            ry={OVAL_RADIUS}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={2.5}
            fill="none"
          />
          {/* Active 3s Progress Ring */}
          <Rect
            x={5}
            y={5}
            width={OVAL_WIDTH}
            height={OVAL_HEIGHT}
            rx={OVAL_RADIUS}
            ry={OVAL_RADIUS}
            stroke={ringColor}
            strokeWidth={4.5}
            strokeDasharray={`${OVAL_PERIMETER} ${OVAL_PERIMETER}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>

      {/* 4. Apple Face ID Style Oval Frame with 4 Rounded Corners */}
      <View
        style={[
          styles.ovalFrame,
          {
            left: ovalLeft,
            top: ovalTop,
            width: OVAL_WIDTH,
            height: OVAL_HEIGHT,
            borderRadius: OVAL_RADIUS,
            borderColor: frameBorderColor,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.cornerBracket, styles.bracketTL, { borderColor: frameBorderColor }]} />
        <View style={[styles.cornerBracket, styles.bracketTR, { borderColor: frameBorderColor }]} />
        <View style={[styles.cornerBracket, styles.bracketBL, { borderColor: frameBorderColor }]} />
        <View style={[styles.cornerBracket, styles.bracketBR, { borderColor: frameBorderColor }]} />

        {justCapturedPose ? (
          <View style={styles.capturedCenterBadge}>
            <Ionicons name="checkmark-circle" size={54} color="#22C55E" />
            <Text style={styles.capturedCenterText}>Góc {POSE_INFO[justCapturedPose].shortLabel} hợp lệ</Text>
          </View>
        ) : progressPercent > 0 && !isValidating && !validationError ? (
          <View style={styles.countdownCenterBadge}>
            <Text style={styles.countdownCenterNumber}>{secondsLeft}</Text>
            <Text style={styles.countdownCenterText}>
              Giữ yên góc {POSE_INFO[activePose].shortLabel.toLowerCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 4. Top Header with Scrim Gradient & 3 Step Indicators */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.88)', 'rgba(0, 0, 0, 0.5)', 'transparent']}
        style={[styles.topScrim, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 16) }]}
        pointerEvents="box-none"
      >
        <View style={styles.topHeaderBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerMainTitle}>Đăng ký khuôn mặt</Text>
            <Text style={styles.headerSubTitle}>
              Bước {activePoseIndex + 1}/3: {POSE_INFO[activePose].shortLabel}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* 3-Step Pose Pills (Face ID Style) */}
        <View style={styles.stepPillRow}>
          {POSES.map((pose, index) => {
            const isCaptured = Boolean(capturedPhotos[pose]);
            const isActive = index === activePoseIndex;
            return (
              <View
                key={pose}
                style={[
                  styles.stepPillItem,
                  isActive && styles.stepPillActive,
                  isCaptured && styles.stepPillCaptured,
                ]}
              >
                {isCaptured ? (
                  <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{ marginRight: 6 }} />
                ) : (
                  <View style={[styles.stepNumDot, isActive && styles.stepNumDotActive]}>
                    <Text style={[styles.stepNumText, isActive && styles.stepNumTextActive]}>
                      {index + 1}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.stepPillLabel,
                    isActive && styles.stepPillLabelActive,
                    isCaptured && styles.stepPillLabelCaptured,
                  ]}
                >
                  {POSE_INFO[pose].shortLabel}
                </Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      {/* 5. Bottom Guidance & Shutter Controls */}
      <View
        style={[
          styles.bottomControlsArea,
          {
            top: ovalTop + OVAL_HEIGHT + 24,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Status / Instruction Pill */}
        {isValidating ? (
          <View style={styles.guidancePillProcessing}>
            <ActivityIndicator size="small" color="#22C55E" style={{ marginRight: 10 }} />
            <Text style={styles.guidancePillProcessingText}>Đang đối soát góc mặt...</Text>
          </View>
        ) : validationError ? (
          <View style={styles.errorContainer}>
            <View style={styles.guidancePillError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#F87171" style={{ marginRight: 8 }} />
              <Text style={styles.guidancePillErrorText} numberOfLines={2}>
                {validationError}
              </Text>
            </View>
            {lastAttemptPhoto && (
              <Pressable
                onPress={acceptCurrentPhotoAnyway}
                style={({ pressed }) => [styles.forceAcceptBtn, pressed && { opacity: 0.8 }]}
              >
                <MaterialCommunityIcons name="check-circle-outline" size={17} color="#22C55E" style={{ marginRight: 6 }} />
                <Text style={styles.forceAcceptBtnText}>Vẫn dùng ảnh vừa chụp</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceTitle}>{POSE_INFO[activePose].title}</Text>
            <Text style={styles.guidanceSubtitle}>{POSE_INFO[activePose].subtitle}</Text>
          </View>
        )}

        {/* Shutter Button & Auto-capture Status */}
        <View style={styles.shutterActionRow}>
          <View style={styles.shutterCenterBox}>
            <Pressable
              onPress={() => void handleCapturePose(activePose)}
              disabled={capturing || isValidating}
              style={({ pressed }) => [styles.shutterButton, pressed && styles.shutterButtonPressed]}
            >
              <View style={styles.shutterButtonInner}>
                {capturing || isValidating ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <MaterialCommunityIcons name="camera" size={28} color="#0F172A" />
                )}
              </View>
            </Pressable>

            <Text style={styles.autoScanHintText}>
              {isValidating
                ? 'Đang kiểm tra ảnh...'
                : progressPercent > 0
                ? `Tự động chụp sau ${secondsLeft}s (hoặc bấm để chụp ngay)`
                : 'Căn chỉnh mặt vào khung để tự chụp'}
            </Text>
          </View>
        </View>
      </View>

      {/* 6. Uploading Overlay */}
      {step === 'UPLOADING' && (
        <View style={styles.fullscreenModalBackdrop}>
          <View style={styles.uploadCard}>
            <ActivityIndicator size="large" color="#22C55E" style={{ marginBottom: 20 }} />
            <Text style={styles.uploadModalTitle}>Đang đăng ký khuôn mặt</Text>
            <Text style={styles.uploadModalDesc}>{uploadStatusText}</Text>
            <View style={styles.uploadProgressTrack}>
              <View style={[styles.uploadProgressFill, { width: `${uploadPercent}%` }]} />
            </View>
            <Text style={styles.uploadPercentText}>{uploadPercent}%</Text>
          </View>
        </View>
      )}

      {/* 7. Success Dialog Modal (Apple Standard) */}
      {step === 'COMPLETED' && (
        <View style={styles.fullscreenModalBackdrop}>
          <Animated.View style={[styles.successModalCard, { transform: [{ scale: successScale }] }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={46} color="#16A34A" />
            </View>
            <Text style={styles.successModalTitle}>Đăng ký khuôn mặt thành công!</Text>
            <Text style={styles.successModalSubtitle}>
              Dữ liệu 3 góc khuôn mặt đã được xác thực và kích hoạt sẵn sàng để chấm công.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Hoàn tất</Text>
            </Pressable>
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
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: '#16A34A',
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

  capturedCenterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  capturedCenterText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },

  svgRingWrapper: {
    position: 'absolute',
    zIndex: 10,
  },
  countdownCenterBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  countdownCenterNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#22C55E',
    lineHeight: 46,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  countdownCenterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Top Scrim & Step Indicators
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerMainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },

  stepPillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepPillActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderColor: '#22C55E',
  },
  stepPillCaptured: {
    backgroundColor: 'rgba(6, 78, 59, 0.6)',
    borderColor: '#22C55E',
  },
  stepNumDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepNumDotActive: {
    backgroundColor: '#22C55E',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepNumTextActive: {
    color: '#FFFFFF',
  },
  stepPillLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  stepPillLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepPillLabelCaptured: {
    color: '#22C55E',
    fontWeight: '700',
  },

  // Bottom Controls
  bottomControlsArea: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  guidanceCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 18,
    width: '100%',
    maxWidth: 320,
  },
  guidanceTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  guidanceSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  guidancePillProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    marginBottom: 18,
  },
  guidancePillProcessingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  guidancePillError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.94)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH - 60,
  },
  guidancePillErrorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  forceAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  forceAcceptBtnText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
  },

  // Shutter Row
  shutterActionRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCenterBox: {
    alignItems: 'center',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  shutterButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  shutterButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoScanHintText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Fullscreen Modals (Upload & Success)
  fullscreenModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    paddingHorizontal: 28,
  },
  uploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadModalDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  uploadPercentText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '800',
  },

  // Success Card
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
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
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
  },
  successModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    marginBottom: 24,
  },
  doneBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
