import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/Buttons';
import { uploadFile } from '../../api/uploads.api';
import { useCreateContractTemplate } from '../../hooks/useContracts';
import type { ContractType } from '../../types/contract.types';
import { useAppAlert } from '../../contexts/AlertContext';

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
  const { showAlert } = useAppAlert();

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
      showAlert('Lỗi', 'Không thể chọn tệp');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !file) {
      showAlert('Lỗi', 'Vui lòng nhập tên và chọn tệp PDF');
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
      const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().replace(/[^A-Z]/g, '');
      const timestamp = new Date().getTime().toString().slice(-4);
      const generatedCode = `MHD-${initials ? initials + '-' : ''}${timestamp}`;

      await createTemplate.mutateAsync({
        code: generatedCode,
        name: name.trim(),
        contractType,
        description: description.trim() || undefined,
        templateFileUrl: uploadedFile.fileUrl,
        storageKey: uploadedFile.fileId,
      });

      showAlert('Thành công', 'Tạo mẫu hợp đồng thành công');
      handleClose();
    } catch (error: any) {
      showAlert('Lỗi', error?.message || 'Có lỗi xảy ra');
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
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Thêm mẫu hợp đồng</Text>
              <Text style={styles.subtitle}>Tải lên file mẫu PDF để thiết lập hợp đồng</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Tên mẫu hợp đồng <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Hợp đồng lao động xác định thời hạn"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Loại hợp đồng</Text>
              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeBtn,
                    contractType === 'FIXED_TERM' && styles.typeBtnActive,
                  ]}
                  onPress={() => setContractType('FIXED_TERM')}
                >
                  <MaterialCommunityIcons
                    name={contractType === 'FIXED_TERM' ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={contractType === 'FIXED_TERM' ? '#1E3E2F' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      contractType === 'FIXED_TERM' && styles.typeTextActive,
                    ]}
                  >
                    Xác định thời hạn
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeBtn,
                    contractType === 'INDEFINITE_TERM' && styles.typeBtnActive,
                  ]}
                  onPress={() => setContractType('INDEFINITE_TERM')}
                >
                  <MaterialCommunityIcons
                    name={contractType === 'INDEFINITE_TERM' ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={contractType === 'INDEFINITE_TERM' ? '#1E3E2F' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      contractType === 'INDEFINITE_TERM' && styles.typeTextActive,
                    ]}
                  >
                    Không xác định thời hạn
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tệp PDF mẫu <Text style={styles.required}>*</Text></Text>
              <Pressable
                style={[styles.fileBox, file && styles.fileBoxSelected]}
                onPress={handlePickDocument}
              >
                <View
                  style={[
                    styles.fileIconCircle,
                    file ? styles.fileIconCircleActive : undefined,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={file ? 'file-pdf-box' : 'cloud-upload-outline'}
                    size={26}
                    color={file ? '#DC2626' : '#1E3E2F'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file ? file.name : 'Bấm để chọn tệp PDF'}
                  </Text>
                  <Text style={styles.fileHint}>
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng tải lên`
                      : 'Hỗ trợ định dạng .pdf (Tối đa 15MB)'}
                  </Text>
                </View>
                {file && (
                  <Pressable onPress={() => setFile(null)} hitSlop={8} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
                  </Pressable>
                )}
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mô tả thêm</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập mô tả hoặc ghi chú cho mẫu hợp đồng này..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                isLoading && { opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons name="cloud-upload" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>
                {isLoading ? 'Đang tải lên...' : 'Upload mẫu hợp đồng'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'column',
    gap: 8,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  typeBtnActive: {
    borderColor: '#1E3E2F',
    backgroundColor: '#D9E4DD',
  },
  typeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#1E3E2F',
    fontWeight: '700',
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  fileBoxSelected: {
    borderColor: '#1E3E2F',
    backgroundColor: '#D9E4DD',
  },
  fileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconCircleActive: {
    backgroundColor: '#FEE2E2',
  },
  fileName: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  fileHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#1E3E2F',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
