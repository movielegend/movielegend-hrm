import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable, Platform, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface AttendanceCameraProps {
  photoUri: string | null;
  onCapture: (uri: string) => void;
  onClose?: () => void;
}

export function AttendanceCamera({ photoUri, onCapture, onClose }: AttendanceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown < 0) return;
    
    if (countdown === 0) {
      takePhotoAutomatically();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const startCountdown = () => {
    if (capturing) return;
    setCountdown(3); 
  };

  const takePhotoAutomatically = async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5, // Increased quality slightly for better face recognition
        // Removed skipProcessing because it causes malformed JPEGs on Android
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      } else {
        throw new Error('Không thể lấy được ảnh chụp');
      }
    } catch (e) {
      setError('Lỗi khi chụp ảnh');
      setCapturing(false);
      setCountdown(null);
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
          <Text style={styles.permissionDesc}>Ứng dụng cần camera để quét khuôn mặt và điểm danh an toàn.</Text>
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

  if (photoUri) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
        <Text style={styles.successTitle}>Chụp thành công!</Text>
        <Text style={styles.successDesc}>Khuôn mặt của bạn đã được ghi nhận.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFill} 
        facing="front"
        mirror
      />
      
      {/* Lớp phủ làm tối mờ khung xung quanh (Face Frame Overlay) */}
      <View style={styles.overlayContainer}>
        {/* Nút Đóng (Góc trên phải) */}
        {onClose && (
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </Pressable>
        )}

        <View style={styles.faceFrameContainer}>
           {/* Khung hướng dẫn bo tròn ở giữa */}
           <View style={styles.faceMask}>
             {countdown !== null && countdown > 0 ? (
               <View style={styles.countdownCircle}>
                 <Text style={styles.countdownText}>{countdown}</Text>
               </View>
             ) : (
                <MaterialCommunityIcons 
                  name={capturing ? "timer-sand" : "face-recognition"} 
                  size={120} 
                  color="rgba(255,255,255,0.2)" 
                />
             )}
           </View>
        </View>

        <View style={styles.bottomControls}>
          <View style={styles.instructionPill}>
             <MaterialCommunityIcons name="information" size={20} color="#fff" style={{ marginRight: 8 }} />
             <Text style={styles.instructionText}>
               {capturing ? "Đang xử lý ảnh..." : "Đưa khuôn mặt vào giữa khung hình"}
             </Text>
          </View>

          {error && (
            <View style={styles.errorPill}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!capturing && countdown === null && (
            <Pressable 
              style={({ pressed }) => [styles.shutterBtn, pressed && styles.shutterBtnPressed]} 
              onPress={startCountdown}
            >
              <View style={styles.shutterBtnInner} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#1F2937',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  permissionDesc: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  successDesc: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  faceFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceMask: {
    width: width * 0.7,
    height: width * 0.9,
    borderRadius: width * 0.35,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  bottomControls: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  instructionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginBottom: 32,
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  errorPill: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  shutterBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  }
});
