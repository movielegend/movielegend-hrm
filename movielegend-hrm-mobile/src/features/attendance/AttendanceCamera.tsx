import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { SectionCard } from '../../components/SectionCard';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface AttendanceCameraProps {
  photoUri: string | null;
  onCapture: (uri: string) => void;
}

export function AttendanceCamera({ photoUri, onCapture }: AttendanceCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  async function capture() {
    setError(null);
    setCapturing(true);
    try {
      const picture = await cameraRef.current?.takePictureAsync({ quality: 0.8, exif: false });
      if (!picture?.uri) throw new Error('CAMERA_UNAVAILABLE');
      onCapture(picture.uri);
    } catch {
      setError('Khong chup duoc anh cham cong. Hay thu lai.');
    } finally {
      setCapturing(false);
    }
  }

  if (!permission?.granted) {
    return (
      <SectionCard title="Camera">
        <Text style={styles.text}>Ung dung can camera de chup anh cham cong.</Text>
        <SecondaryButton onPress={() => void requestPermission()}>Cap quyen camera</SecondaryButton>
      </SectionCard>
    );
  }

  if (photoUri) {
    return (
      <SectionCard title="Anh cham cong">
        <Image source={{ uri: photoUri }} style={styles.preview} />
        <SecondaryButton onPress={() => onCapture('')}>Chup lai</SecondaryButton>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Camera">
      <View style={styles.cameraBox}>
        <CameraView ref={cameraRef} active facing="front" mirror style={StyleSheet.absoluteFill} onMountError={() => setError('Camera khong kha dung')} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton accessibilityLabel="Chup anh cham cong" loading={capturing} onPress={() => void capture()}>
        Chup anh
      </PrimaryButton>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    backgroundColor: colors.text,
    borderRadius: 8,
    height: 280,
    overflow: 'hidden',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  preview: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 280,
    width: '100%',
  },
  text: {
    color: colors.text,
    fontSize: 14,
  },
  wrap: {
    gap: spacing.md,
  },
});
