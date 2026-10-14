import React, { useRef, useState, useEffect } from 'react';
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
import { useAppAlert } from '../../contexts/AlertContext';
import { uploadFile } from '../../api/uploads.api';
import { updateMyFace } from '../../api/users.api';
import { LoadingState } from '../../components/LoadingState';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import type { FacePose } from '../../types/registration.types';
import { normalizeApiError } from '../../utils/api-error';

const { width } = Dimensions.get('window');
const OVAL_WIDTH = Math.min(width * 0.74, 290);
const OVAL_HEIGHT = OVAL_WIDTH * 1.32;

const POSES: FacePose[] = ['FRONT', 'LEFT', 'RIGHT'];

const POSE_INFO: Record<FacePose, { title: string; subtitle: string; icon: string }> = {
  FRONT: {
    title: 'Nhìn thẳng vào camera',
    subtitle: 'Giữ khuôn mặt ở chính giữa khung hình',
    icon: 'face-man',
  },
  LEFT: {
    title: 'Quay mặt sang TRÁI',
    subtitle: 'Nghiêng góc mặt khoảng 20° - 30° sang bên trái',
    icon: 'arrow-left-bold-circle',
  },
  RIGHT: {
    title: 'Quay mặt sang PHẢI',
    subtitle: 'Nghiêng góc mặt khoảng 20° - 30° sang bên phải',
    icon: 'arrow-right-bold-circle',
  },
};

export function EmployeeUpdateFaceScreen() {
  const router = useRouter();
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
  const [justCapturedPose, setJustCapturedPose] = useState<FacePose | null>(null);
  const [step, setStep] = useState<'SCANNING' | 'UPLOADING' | 'COMPLETED'>('SCANNING');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('Đang chuẩn bị dữ liệu...');
  const [captureError, setCaptureError] = useState<string | null>(null);

  const activePose: FacePose = POSES[activePoseIndex] ?? 'FRONT';

  // Animations
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Radar beam animation
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    );
    scanLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => {
      scanLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Automatic Hands-free Capture Timer
  useEffect(() => {
    if (!cameraReady || step !== 'SCANNING' || capturing) return;
    if (capturedPhotos[activePose]) return; // Already captured this pose

    progressAnim.setValue(0);
    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: activePose === 'FRONT' ? 1400 : 1800,
      useNativeDriver: false,
    });
    progressAnimation.start();

    const autoTimer = setTimeout(() => {
      void takeSnapshot(activePose);
    }, activePose === 'FRONT' ? 1400 : 1800);

    return () => {
      progressAnimation.stop();
      clearTimeout(autoTimer);
    };
  }, [cameraReady, activePose, step, capturedPhotos]);

  const takeSnapshot = async (pose: FacePose) => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    setCaptureError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error('Không thể chụp ảnh');

      try {
        Vibration.vibrate(50);
      } catch {}

      setCapturedPhotos((prev) => ({
        ...prev,
        [pose]: { localUri: photo.uri },
      }));

      setJustCapturedPose(pose);

      // Advance to next pose or complete
      setTimeout(() => {
        setJustCapturedPose(null);
        setCapturing(false);

        if (activePoseIndex < POSES.length - 1) {
          setActivePoseIndex(activePoseIndex + 1);
        } else {
          // Check if all poses are captured
          const nextCaptured = {
            ...capturedPhotos,
            [pose]: { localUri: photo.uri },
          };
          const allDone = POSES.every((p) => Boolean(nextCaptured[p]));
          if (allDone) {
            void handleBatchUpload(nextCaptured);
          }
        }
      }, 500);
    } catch (err: any) {
      setCaptureError(err?.message || 'Lỗi khi chụp góc này, vui lòng thử lại');
      setCapturing(false);
    }
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

        setUploadStatusText(`Đang đồng bộ góc ${POSE_INFO[p].title.toLowerCase()}...`);
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
      setUploadStatusText('Cập nhật hoàn tất!');
      await reloadProfile();

      try {
        Vibration.vibrate([0, 80, 50, 80]);
      } catch {}

      setStep('COMPLETED');
    } catch (error: any) {
      showAlert('Lỗi tải lên', normalizeApiError(error).message);
      setStep('SCANNING');
    }
  };

  if (!permission) return <LoadingState label="Đang kiểm tra quyền camera..." />;

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.permissionScreen}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconCircle}>
              <Ionicons name="camera-outline" size={42} color="#1E88E5" />
            </View>
            <Text style={styles.permissionTitle}>Cấp quyền Camera</Text>
            <Text style={styles.permissionDesc}>
              Ứng dụng cần quyền camera để quét 3 góc mặt phục vụ định danh bảo mật eKYC.
            </Text>
            <Pressable onPress={() => void requestPermission()} style={styles.permBtnPrimary}>
              <Text style={styles.permBtnText}>CẤP QUYỀN CAMERA</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.permBtnSecondary}>
              <Text style={styles.permBtnSecText}>QUAY LẠI</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, OVAL_HEIGHT - 6],
  });

  return (
    <Screen>
      <View style={styles.container}>
        {/* Live Camera Background */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
          mirror
          onCameraReady={() => setCameraReady(true)}
        />

        {/* TOP HUD: Step Indicator & Back Button */}
        <View style={styles.topHud}>
          <View style={styles.headerBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerBadge}>AI eKYC ENROLLMENT</Text>
              <Text style={styles.headerTitle}>Đăng ký khuôn mặt</Text>
            </View>
          </View>

          {/* 3-Step Pose Cards */}
          <View style={styles.poseStepsCard}>
            {POSES.map((pose, index) => {
              const isCaptured = Boolean(capturedPhotos[pose]);
              const isActive = index === activePoseIndex && step === 'SCANNING';
              return (
                <Pressable
                  key={pose}
                  onPress={() => {
                    if (step === 'SCANNING') setActivePoseIndex(index);
                  }}
                  style={[
                    styles.poseTab,
                    isActive && styles.poseTabActive,
                    isCaptured && styles.poseTabCaptured,
                  ]}
                >
                  <View style={styles.poseIconBox}>
                    {isCaptured ? (
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    ) : (
                      <MaterialCommunityIcons
                        name={POSE_INFO[pose].icon as any}
                        size={16}
                        color={isActive ? '#38BDF8' : 'rgba(255,255,255,0.45)'}
                      />
                    )}
                    <Text
                      style={[
                        styles.poseTabText,
                        isActive && styles.poseTabTextActive,
                        isCaptured && styles.poseTabTextCaptured,
                      ]}
                    >
                      {pose}
                    </Text>
                  </View>
                  {isCaptured && capturedPhotos[pose]?.localUri ? (
                    <Image
                      source={{ uri: capturedPhotos[pose]?.localUri }}
                      style={styles.poseThumbnail}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* CENTER: eKYC Oval Target Guide */}
        <View style={styles.centerTargetArea}>
          {/* Pulsing Outer Glow */}
          <Animated.View
            style={[
              styles.ovalGlowRing,
              {
                borderColor: justCapturedPose
                  ? '#10B981'
                  : capturing
                  ? '#38BDF8'
                  : 'rgba(56, 189, 248, 0.45)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Oval Face Guide Mask */}
          <View
            style={[
              styles.ovalMask,
              justCapturedPose && styles.ovalMaskCaptured,
              capturing && !justCapturedPose && styles.ovalMaskCapturing,
            ]}
          >
            {/* Tech Corner HUD Brackets */}
            <View style={[styles.cornerBracket, styles.bracketTL]} />
            <View style={[styles.cornerBracket, styles.bracketTR]} />
            <View style={[styles.cornerBracket, styles.bracketBL]} />
            <View style={[styles.cornerBracket, styles.bracketBR]} />

            {/* Radar Scanning Line */}
            {step === 'SCANNING' && !justCapturedPose && (
              <Animated.View
                style={[
                  styles.radarBeam,
                  {
                    transform: [{ translateY }],
                  },
                ]}
              />
            )}

            {/* Pose Instruction Floating Inside Frame */}
            {step === 'SCANNING' && !justCapturedPose && (
              <View style={styles.poseInstructionInside}>
                <MaterialCommunityIcons
                  name={POSE_INFO[activePose].icon as any}
                  size={56}
                  color="rgba(255, 255, 255, 0.22)"
                />
              </View>
            )}

            {justCapturedPose && (
              <View style={styles.capturedBadge}>
                <Ionicons name="checkmark-circle" size={72} color="#10B981" />
                <Text style={styles.capturedText}>ĐÃ BẮT GÓC {justCapturedPose}</Text>
              </View>
            )}
          </View>
        </View>

        {/* BOTTOM HUD: Instruction, Auto-Progress, Manual Button */}
        <View style={styles.bottomHud}>
          {/* Main Direction Box */}
          <View style={styles.directionBox}>
            <View style={styles.directionHeader}>
              <MaterialCommunityIcons
                name={POSE_INFO[activePose].icon as any}
                size={22}
                color="#38BDF8"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.directionTitle}>{POSE_INFO[activePose].title}</Text>
            </View>
            <Text style={styles.directionSubtitle}>{POSE_INFO[activePose].subtitle}</Text>

            {/* Auto Capture Progress Bar */}
            {!capturedPhotos[activePose] && (
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {captureError ? <Text style={styles.errorText}>{captureError}</Text> : null}

          {/* Quick Manual Snap Button */}
          {step === 'SCANNING' && (
            <View style={styles.shutterRow}>
              <Pressable
                onPress={() => void takeSnapshot(activePose)}
                disabled={capturing}
                style={({ pressed }) => [styles.shutterBtn, pressed && styles.shutterBtnPressed]}
              >
                <View style={styles.shutterBtnInner}>
                  <MaterialCommunityIcons name="camera" size={24} color="#0F172A" />
                </View>
              </Pressable>
              <Text style={styles.shutterHint}>Tự động chụp sau 1.5s hoặc chạm để chụp ngay</Text>
            </View>
          )}
        </View>

        {/* FULLSCREEN UPLOAD OVERLAY */}
        {step === 'UPLOADING' && (
          <View style={styles.fullscreenModal}>
            <View style={styles.uploadCard}>
              <ActivityIndicator size="large" color="#38BDF8" style={{ marginBottom: 20 }} />
              <Text style={styles.uploadModalTitle}>Đang xử lý dữ liệu khuôn mặt</Text>
              <Text style={styles.uploadModalDesc}>{uploadStatusText}</Text>
              <View style={styles.uploadModalProgressTrack}>
                <View style={[styles.uploadModalProgressFill, { width: `${uploadPercent}%` }]} />
              </View>
              <Text style={styles.uploadPercentText}>{uploadPercent}%</Text>
            </View>
          </View>
        )}

        {/* FULLSCREEN SUCCESS MODAL */}
        {step === 'COMPLETED' && (
          <View style={styles.fullscreenModal}>
            <View style={styles.uploadCard}>
              <Ionicons name="checkmark-circle" size={72} color="#10B981" style={{ marginBottom: 16 }} />
              <Text style={styles.uploadModalTitle}>Đăng ký thành công!</Text>
              <Text style={styles.uploadModalDesc}>
                Dữ liệu 3 góc khuôn mặt của bạn đã được mã hóa an toàn vào hệ thống chấm công.
              </Text>
              <Pressable
                onPress={() => router.back()}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>HOÀN TẤT & TRỞ VỀ</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 136, 229, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permBtnPrimary: {
    width: '100%',
    backgroundColor: '#1E88E5',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  permBtnSecondary: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  permBtnSecText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  topHud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerBadge: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  poseStepsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
  },
  poseTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  poseTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  poseTabCaptured: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderWidth: 1,
  },
  poseIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poseTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  poseTabTextActive: {
    color: '#FFFFFF',
  },
  poseTabTextCaptured: {
    color: '#10B981',
  },
  poseThumbnail: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  centerTargetArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovalGlowRing: {
    position: 'absolute',
    width: OVAL_WIDTH + 14,
    height: OVAL_HEIGHT + 14,
    borderRadius: (OVAL_WIDTH + 14) / 2,
    borderWidth: 2,
    opacity: 0.85,
  },
  ovalMask: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  ovalMaskCapturing: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  ovalMaskCaptured: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 3.5,
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
  },
  bracketTL: {
    top: 20,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTR: {
    top: 20,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBL: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBR: {
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
  poseInstructionInside: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  bottomHud: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    alignItems: 'center',
  },
  directionBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  directionSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  shutterRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    width: 50,
    height: 50,
    borderRadius: 25,
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
  fullscreenModal: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 50,
  },
  uploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  uploadModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadModalDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  uploadModalProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  uploadModalProgressFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 4,
  },
  uploadPercentText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
