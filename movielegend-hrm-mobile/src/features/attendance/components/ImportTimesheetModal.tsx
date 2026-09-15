import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { importMonthlyTimesheet, ImportTimesheetItem } from '../../../api/attendance.api';
import { exportTimesheetTemplate, parseTimesheetExcelData } from '../../../utils/timesheet-excel.util';

interface Props {
  visible: boolean;
  onClose: () => void;
  month: number;
  year: number;
  onSuccess: () => void;
}

export function ImportTimesheetModal({ visible, onClose, month, year, onSuccess }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ImportTimesheetItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePickFile = async () => {
    try {
      setErrorMsg(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const file = res.assets[0];
      setFileName(file.name);
      setIsParsing(true);

      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const parsed = parseTimesheetExcelData(base64Data);
      if (parsed.errors.length > 0) {
        setErrorMsg(parsed.errors.join('\n'));
      }
      if (parsed.items.length === 0) {
        setErrorMsg('Không tìm thấy bản ghi nhân viên hợp lệ nào trong file Excel.');
      }
      setParsedItems(parsed.items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đọc file Excel');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await exportTimesheetTemplate(month, year);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải file mẫu');
    }
  };

  const handleSubmit = async () => {
    if (parsedItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn file Excel có dữ liệu chấm công');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await importMonthlyTimesheet({
        month,
        year,
        items: parsedItems,
      });

      Alert.alert('Thành công', res.message || `Đã import bảng công tháng ${month}/${year} thành công!`, [
        {
          text: 'Đồng ý',
          onPress: () => {
            handleReset();
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi Import', err.message || 'Đã có lỗi xảy ra khi import bảng công');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedItems([]);
    setErrorMsg(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <MaterialCommunityIcons name="file-excel" size={24} color="#10B981" />
              <Text style={styles.headerTitle}>Import Bảng Công (HR)</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <Text style={styles.subTitle}>
            Kỳ chấm công: <Text style={styles.boldText}>Tháng {month}/{year}</Text>
          </Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Action Bar: Download template */}
            <View style={styles.templateCard}>
              <View style={styles.templateInfo}>
                <MaterialCommunityIcons name="file-download-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateTitle}>File mẫu Bảng công Excel</Text>
                  <Text style={styles.templateDesc}>Tải mẫu chuẩn gồm cột Mã NV, công chuẩn, công thực, OT...</Text>
                </View>
              </View>
              <Pressable style={styles.templateBtn} onPress={handleDownloadTemplate}>
                <Text style={styles.templateBtnText}>Tải mẫu</Text>
              </Pressable>
            </View>

            {/* Upload Box */}
            <Pressable style={styles.uploadBox} onPress={handlePickFile} disabled={isParsing || isSubmitting}>
              {isParsing ? (
                <View style={styles.centerWrap}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={styles.uploadHint}>Đang đọc dữ liệu Excel...</Text>
                </View>
              ) : fileName ? (
                <View style={styles.centerWrap}>
                  <MaterialCommunityIcons name="file-check-outline" size={36} color="#10B981" />
                  <Text style={styles.fileNameText} numberOfLines={1}>{fileName}</Text>
                  <Text style={styles.changeFileText}>Bấm để chọn file khác</Text>
                </View>
              ) : (
                <View style={styles.centerWrap}>
                  <MaterialCommunityIcons name="cloud-upload-outline" size={38} color="#6B7280" />
                  <Text style={styles.uploadTitle}>Chọn file Excel từ máy</Text>
                  <Text style={styles.uploadHint}>Định dạng .xlsx hoặc .xls</Text>
                </View>
              )}
            </Pressable>

            {errorMsg && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Preview List */}
            {parsedItems.length > 0 && (
              <View style={styles.previewSection}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Dữ liệu hợp lệ ({parsedItems.length} nhân sự)</Text>
                  <Pressable onPress={handleReset}>
                    <Text style={styles.clearText}>Xóa</Text>
                  </Pressable>
                </View>

                {parsedItems.slice(0, 10).map((item, index) => (
                  <View key={index} style={styles.previewItem}>
                    <View style={styles.previewItemLeft}>
                      <Text style={styles.previewUserCode}>{item.userCode}</Text>
                      {item.fullName && <Text style={styles.previewFullName}>{item.fullName}</Text>}
                    </View>
                    <View style={styles.previewItemRight}>
                      <Text style={styles.previewMetric}>Công: <Text style={styles.boldText}>{item.actualWorkingDays}/{item.standardWorkingDays || 26}</Text></Text>
                      <Text style={styles.previewOt}>OT: <Text style={styles.boldText}>{item.otHours || 0}h</Text></Text>
                      {(item.lateMinutes || 0) > 0 && (
                        <Text style={styles.previewLate}>Muộn: {item.lateMinutes}p</Text>
                      )}
                    </View>
                  </View>
                ))}

                {parsedItems.length > 10 && (
                  <Text style={styles.moreText}>Và {parsedItems.length - 10} nhân sự khác...</Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, (parsedItems.length === 0 || isSubmitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={parsedItems.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận Import ({parsedItems.length})</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  subTitle: {
    fontSize: 14,
    color: '#4B5563',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  boldText: {
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  templateDesc: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  templateBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  templateBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginBottom: 14,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  changeFileText: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  previewSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  clearText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  previewItemLeft: {
    flex: 1,
  },
  previewUserCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  previewFullName: {
    fontSize: 12,
    color: '#6B7280',
  },
  previewItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  previewMetric: {
    fontSize: 12,
    color: '#4B5563',
  },
  previewOt: {
    fontSize: 11,
    color: '#F59E0B',
  },
  previewLate: {
    fontSize: 11,
    color: '#DC2626',
  },
  moreText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
