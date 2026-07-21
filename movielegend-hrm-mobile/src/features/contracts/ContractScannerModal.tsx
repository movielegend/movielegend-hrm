import React, { useState } from 'react';
import { Modal, StyleSheet, View, Text, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { colors } from '../../theme/colors';
import { useScanContract } from '../../hooks/useContracts';
import { ContractType } from '../../types/contract.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (data: any) => void;
}

export function ContractScannerModal({ visible, onClose, onScanComplete }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const scanMutation = useScanContract();

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Lỗi quyền truy cập', 'Bạn cần cấp quyền sử dụng camera để chụp ảnh hợp đồng.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleScan = () => {
    if (!image) return;
    scanMutation.mutate(image, {
      onSuccess: (data) => {
        onScanComplete({ ...data, scannedDocumentUrl: image });
      },
      onError: () => {
        Alert.alert('Lỗi', 'Không thể bóc tách dữ liệu từ ảnh. Vui lòng thử lại.');
      }
    });
  };

  const reset = () => {
    setImage(null);
    scanMutation.reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onDismiss={reset}>
      <View style={styles.container}>
        <PageHeader title="Scan Hợp Đồng" subtitle="Chụp ảnh để AI tự động bóc tách dữ liệu" />
        
        <ScrollView contentContainerStyle={styles.content}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có ảnh hợp đồng</Text>
            </View>
          )}

          {scanMutation.isPending && (
            <Text style={styles.loadingText}>Đang bóc tách dữ liệu bằng AI...</Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {!image ? (
            <>
              <SecondaryButton title="Đóng" onPress={onClose} style={styles.button} />
              <PrimaryButton title="Chụp ảnh" onPress={takePhoto} style={styles.button} icon="camera" />
            </>
          ) : (
            <>
              <SecondaryButton title="Chụp lại" onPress={reset} style={styles.button} disabled={scanMutation.isPending} />
              <PrimaryButton title="Tiến hành bóc tách" onPress={handleScan} style={styles.button} isLoading={scanMutation.isPending} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  preview: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  emptyContainer: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  button: {
    flex: 1,
  },
});
