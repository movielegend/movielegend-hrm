import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/Buttons';
import { uploadFile } from '../../api/uploads.api';
import { useCreateContractTemplate } from '../../hooks/useContracts';
import type { ContractType } from '../../types/contract.types';

interface CreateTemplateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateTemplateModal({ visible, onClose }: CreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contractType, setContractType] = useState<ContractType>('FIXED_TERM');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createTemplate = useCreateContractTemplate();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể chọn tệp');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || !file) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên, mã và chọn tệp PDF');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload file
      const uploadedFile = await uploadFile({
        purpose: 'CONTRACT_TEMPLATE',
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType || 'application/pdf',
      });

      // 2. Create Template
      await createTemplate.mutateAsync({
        companyId: '', // Handled by backend if empty
        code: code.trim(),
        name: name.trim(),
        contractType,
        description: description.trim() || undefined,
        templateFileUrl: uploadedFile.fileUrl,
        storageKey: uploadedFile.fileId,
      });

      Alert.alert('Thành công', 'Tạo mẫu hợp đồng thành công');
      handleClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setContractType('FIXED_TERM');
    setDescription('');
    setFile(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Thêm mẫu hợp đồng</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.field}>
              <Text style={styles.label}>Tên mẫu hợp đồng (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hợp Đồng Lao Động Chuẩn"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mã mẫu hợp đồng (*)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: HDLD-001"
                placeholderTextColor={colors.muted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Loại hợp đồng</Text>
              <View style={styles.typeRow}>
                <Pressable
                  style={[styles.typeBtn, contractType === 'FIXED_TERM' && styles.typeBtnActive]}
                  onPress={() => setContractType('FIXED_TERM')}
                >
                  <Text style={[styles.typeText, contractType === 'FIXED_TERM' && styles.typeTextActive]}>Xác định t/hạn</Text>
                </Pressable>
                <Pressable
                  style={[styles.typeBtn, contractType === 'INDEFINITE_TERM' && styles.typeBtnActive]}
                  onPress={() => setContractType('INDEFINITE_TERM')}
                >
                  <Text style={[styles.typeText, contractType === 'INDEFINITE_TERM' && styles.typeTextActive]}>Không XĐ t/hạn</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tệp PDF (*)</Text>
              <Pressable style={styles.fileBox} onPress={handlePickDocument}>
                <MaterialCommunityIcons name="file-pdf-box" size={32} color={file ? colors.error : colors.muted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file ? file.name : 'Nhấn để chọn tệp PDF'}
                  </Text>
                  {file && (
                    <Text style={{ fontSize: 12, color: colors.muted }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mô tả thêm</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Nhập mô tả"
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton onPress={handleSubmit} loading={isLoading}>
              Upload mẫu hợp đồng
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeText: {
    fontSize: 14,
    color: colors.text,
  },
  typeTextActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.backgroundDim,
  },
  fileName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 32,
  },
});
