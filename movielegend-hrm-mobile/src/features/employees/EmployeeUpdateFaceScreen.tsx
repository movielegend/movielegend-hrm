import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadFile } from '../../api/uploads.api';
import { updateMyFace } from '../../api/users.api';
import { LoadingState } from '../../components/LoadingState';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import type { FaceImageInput, FacePose } from '../../types/registration.types';
import { mapLoginError, normalizeApiError } from '../../utils/api-error';

const facePoseLabels: Record<FacePose, string> = {
  FRONT: 'Nhìn thẳng vào camera',
  LEFT: 'Quay mặt sang trái',
  RIGHT: 'Quay mặt sang phải',
};

function nextPose(pose: FacePose): FacePose {
  if (pose === 'FRONT') return 'LEFT';
  if (pose === 'LEFT') return 'RIGHT';
  return 'FRONT';
}

export function EmployeeUpdateFaceScreen() {
  const router = useRouter();
  const { reloadProfile } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  
  const [faceImages, setFaceImages] = useState<FaceImageInput[]>([]);
  const [activePose, setActivePose] = useState<FacePose>('FRONT');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const poses: FacePose[] = ['FRONT', 'LEFT', 'RIGHT'];
  const currentImage = faceImages.find((image) => image.pose === activePose);
  const complete = poses.every(p => faceImages.find(img => img.pose === p)?.uploadStatus === 'SUCCESS');

  const updateFaceImage = (update: Partial<FaceImageInput> & { pose: FacePose }) => {
    setFaceImages(prev => {
      const exists = prev.find(i => i.pose === update.pose);
      if (exists) {
        return prev.map(i => i.pose === update.pose ? { ...i, ...update } : i);
      }
      return [...prev, update as FaceImageInput];
    });
  };

  async function capture() {
    setCaptureError(null);
    setCapturing(true);
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8, exif: false });
      if (!picture) throw new Error('CAMERA_UNAVAILABLE');
      await uploadPose(activePose, picture.uri);
    } catch {
      setCaptureError('Không thể chụp hoặc upload ảnh, vui lòng thử lại');
    } finally {
      setCapturing(false);
    }
  }

  async function retryUpload(image: FaceImageInput) {
    setCaptureError(null);
    setCapturing(true);
    try {
      await uploadPose(image.pose, image.localUri);
    } catch {
      setCaptureError('Upload failed, please retry this pose');
    } finally {
      setCapturing(false);
    }
  }

  async function uploadPose(pose: FacePose, uri: string) {
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    updateFaceImage({ pose, localUri: uri, previewUri: uri, imageUrl: '', uploadStatus: 'UPLOADING', uploadProgress: 0 });
    try {
      const uploaded = await uploadFile({
        uri,
        name: `${pose.toLowerCase()}-face.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'FACE_REGISTRATION',
        signal: controller.signal,
        onProgress: (progress) => {
          updateFaceImage({ pose, uploadProgress: progress.percent });
        },
      });
      updateFaceImage({
        pose,
        imageUrl: uploaded.fileUrl,
        uploadedFileId: uploaded.fileId,
        uploadStatus: 'SUCCESS',
        uploadProgress: 100,
      });
    } catch (error) {
      const cancelled = controller.signal.aborted;
      updateFaceImage({
        pose,
        uploadStatus: cancelled ? 'CANCELLED' : 'FAILED',
        uploadError: cancelled ? 'Upload cancelled' : 'Lỗi tải lên',
      });
      throw error;
    } finally {
      if (uploadAbortRef.current === controller) uploadAbortRef.current = null;
    }
  }

  async function submit() {
    if (!complete) return;
    setSubmitting(true);
    try {
      const payload = {
        faceImages: faceImages.map(({ pose, imageUrl, uploadedFileId }) => ({ pose, imageUrl, fileId: uploadedFileId })),
      };
      await updateMyFace(payload);
      await reloadProfile();
      Alert.alert('Thành công', 'Dữ liệu khuôn mặt đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Lỗi', normalizeApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!permission) return <LoadingState label="Đang kiểm tra camera" />;
  if (!permission.granted) {
    return (
      <Screen>
        <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#EAF4FE', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                <Ionicons name="camera-outline" size={40} color="#1E88E5" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0B3B61', marginBottom: 12, textAlign: 'center' }}>Quyền Camera</Text>
              <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                Ứng dụng cần quyền truy cập camera để chụp ảnh khuôn mặt phục vụ quá trình định danh bảo mật.
              </Text>
              <Pressable onPress={() => void requestPermission()} style={{ width: '100%', backgroundColor: '#1E88E5', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>CẤP QUYỀN CAMERA</Text>
              </Pressable>
              <Pressable onPress={() => router.back()} style={{ width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ color: '#64748B', fontSize: 16, fontWeight: '700' }}>QUAY LẠI</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <CameraView ref={cameraRef} active facing="front" mirror style={StyleSheet.absoluteFill} onMountError={() => setCaptureError('Camera không khả dụng trên thiết bị này')} />
        
        {/* Top Header Layer */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 60, paddingHorizontal: 24, zIndex: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>Cập nhật khuôn mặt</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>3 góc mặt (Thẳng, Trái, Phải)</Text>
            </View>
          </View>
          
          <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            {poses.map((pose) => {
              const image = faceImages.find((item) => item.pose === pose);
              const isSuccess = image?.uploadStatus === 'SUCCESS';
              const isActive = pose === activePose;
              return (
                <View key={pose} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isSuccess ? '#10B981' : isActive ? '#1E88E5' : 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: isActive ? 2 : 0, borderColor: '#FFFFFF' }}>
                    <Ionicons name={isSuccess ? "checkmark" : "person"} size={16} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' }}>{pose}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Center Guide Box */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 250, height: 300, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 20, borderStyle: 'dashed' }} />
          <Text style={{ position: 'absolute', bottom: '25%', color: '#FFFFFF', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden' }}>
            {facePoseLabels[activePose]}
          </Text>
        </View>

        {/* Bottom Action Layer */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.8)', borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
          
          {currentImage?.previewUri ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 16 }}>
              <Image source={{ uri: currentImage.previewUri }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Trạng thái ảnh</Text>
                {currentImage.uploadStatus === 'UPLOADING' ? <Text style={{ color: '#60A5FA', fontSize: 13 }}>Đang tải lên: {currentImage.uploadProgress ?? 0}%</Text> : null}
                {currentImage.uploadStatus === 'SUCCESS' ? <Text style={{ color: '#10B981', fontSize: 13 }}>Tải lên thành công</Text> : null}
                {currentImage.uploadStatus === 'FAILED' ? <Text style={{ color: '#EF4444', fontSize: 13 }}>Tải lên thất bại</Text> : null}
              </View>
            </View>
          ) : null}
          
          {captureError ? <Text style={{ color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' }}>{captureError}</Text> : null}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentImage?.uploadStatus === 'SUCCESS' ? (
              <Pressable disabled={activePose === 'RIGHT' && !complete} onPress={() => setActivePose(nextPose(activePose))} style={{ flex: 1, backgroundColor: (activePose === 'RIGHT' && !complete) ? '#475569' : '#1E88E5', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{activePose === 'RIGHT' ? 'HOÀN TẤT CHỤP' : 'CHỤP GÓC TIẾP THEO'}</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 }}>
                <View style={{ width: 48, height: 48 }} />
                <Pressable onPress={capture} disabled={capturing} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF' }} />
                </Pressable>
                <View style={{ width: 48, height: 48 }}>
                  {currentImage?.uploadStatus === 'FAILED' ? (
                    <Pressable onPress={() => void retryUpload(currentImage)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                       <Ionicons name="refresh" size={24} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          {complete ? (
             <Pressable disabled={submitting} onPress={() => void submit()} style={{ backgroundColor: submitting ? '#93C5FD' : '#10B981', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{submitting ? 'ĐANG LƯU DỮ LIỆU...' : 'XÁC NHẬN CẬP NHẬT'}</Text>
              </Pressable>
          ) : null}
          
        </View>
      </View>
    </Screen>
  );
}
