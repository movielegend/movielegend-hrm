import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View, Text, TextInput, Pressable, ScrollView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SignatureScreen from '../../components/SignaturePad/SignaturePad';
import { colors } from '../../theme/colors';
import { PdfViewerModal } from '../../components/PdfViewerModal';
import { resolveFileUrl } from '../../utils/url';
import { useAppAlert } from '../../contexts/AlertContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureBase64: string, filledFields: Record<string, any>) => void;
  pdfUrl?: string;
  fieldsToFill?: any[]; // Array of fields from mappingConfig
  contractUser?: any;
}

export function ContractSignatureModal({ visible, onClose, onSave, pdfUrl, fieldsToFill = [], contractUser }: Props) {
  const insets = useSafeAreaInsets();
  const safeTopInset = Math.max(insets.top, Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24));
  const ref = useRef<any>();
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const { showAlert } = useAppAlert();
  
  const [filledValues, setFilledValues] = useState<Record<string, any>>({});

  React.useEffect(() => {
    if (visible && fieldsToFill.length > 0) {
      const initial: Record<string, any> = {};
      const profile = contractUser?.profile;
      const user = contractUser;

      fieldsToFill.forEach(field => {
        if (field.type === 'text') {
          const fId = String(field.id || '').toLowerCase();
          const fLabel = String(field.label || '').toLowerCase();
          const normId = fId.replace(/[^a-z0-9]/g, '');
          const normLabel = fLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
          const isMatch = (keywords: string[]) => keywords.some(k => normId.includes(k) || normLabel.includes(k));

          // 1. Full Name
          if (
            isMatch(['fullname', 'name', 'ten', 'hoten', 'nguoilaodong', 'partyb', 'benb', 'ongba', 'nhanvien', 'employee', 'full_name']) ||
            normLabel.includes('hoten') || normLabel.includes('ten') || normLabel.includes('nguoiky') || normLabel.includes('benb')
          ) {
            initial[field.id] = profile?.fullName || user?.fullName || '';
          }
          // 2. Permanent Address
          else if (
            isMatch(['permanentaddress', 'thuongtru', 'diachithuongtru', 'noithuongtru', 'hokhau', 'diachihokhau']) ||
            normLabel.includes('thuongtru') || normLabel.includes('hokhau') ||
            (isMatch(['diachi', 'address']) && !isMatch(['tamtru', 'choo', 'temporary']))
          ) {
            initial[field.id] = profile?.permanentAddress || profile?.temporaryAddress || '';
          }
          // 3. Temporary Address
          else if (
            isMatch(['temporaryaddress', 'tamtru', 'diachitamtru', 'choo', 'choohientai', 'diachihientai']) ||
            normLabel.includes('tamtru') || normLabel.includes('choohientai')
          ) {
            initial[field.id] = profile?.temporaryAddress || profile?.permanentAddress || '';
          }
          // 4. CCCD
          else if (isMatch(['cccd', 'cmnd', 'cancuoc', 'chungminh', 'socccd', 'socmnd', 'idcard'])) {
            initial[field.id] = profile?.idCardNumber || '';
          }
          // 5. CCCD Issue Date
          else if (isMatch(['idcardissuedate', 'ngaycap', 'ngaycapcccd', 'issuedate']) || normLabel.includes('ngaycap')) {
            initial[field.id] = profile?.idCardIssueDate ? new Date(profile.idCardIssueDate).toLocaleDateString('vi-VN') : '';
          }
          // 6. CCCD Issue Place
          else if (isMatch(['idcardissueplace', 'noicap', 'noicapcccd', 'issueplace']) || normLabel.includes('noicap')) {
            initial[field.id] = profile?.idCardIssuePlace || '';
          }
          // 7. Phone
          else if (isMatch(['phone', 'sdt', 'dienthoai', 'sodienthoai', 'mobile']) || normLabel.includes('dienthoai') || normLabel.includes('sdt')) {
            initial[field.id] = user?.phone || '';
          }
          // 8. Email
          else if (isMatch(['email', 'thudientu']) || normLabel.includes('email')) {
            initial[field.id] = user?.email || '';
          }
          // 9. Date of Birth
          else if (isMatch(['dob', 'sinh', 'ngaysinh', 'dateofbirth']) || normLabel.includes('ngaysinh')) {
            initial[field.id] = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '';
          }
          // 10. Position
          else if (isMatch(['position', 'chucvu', 'chucdanh']) || normLabel.includes('chucvu') || normLabel.includes('chucdanh')) {
            initial[field.id] = profile?.position?.name || '';
          }
          // 11. Gender
          else if (isMatch(['gender', 'gioitinh']) || normLabel.includes('gioitinh')) {
            initial[field.id] = profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : '';
          }
          // 12. Signing Date
          else if (isMatch(['ngayky', 'homnay', 'today']) || normLabel === 'ngay' || normId === 'date' || normLabel === 'date') {
            initial[field.id] = new Date().toLocaleDateString('vi-VN');
          }
        }
      });
      setFilledValues(initial);
    }
  }, [visible, fieldsToFill, contractUser]);

  const handleSignature = (signature: string) => {
    onSave(signature, filledValues);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: safeTopInset }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        
        {/* Header: Back Button + Title on same line */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} style={styles.backBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </Pressable>
            <View>
              <Text style={styles.screenTitle}>Ký hợp đồng</Text>
              <Text style={styles.screenSubtitle}>Hoàn tất thông tin và ký xác nhận</Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
          {pdfUrl ? (
            <Pressable
              style={styles.pdfCard}
              onPress={() => {
                const url = resolveFileUrl(pdfUrl);
                if (url) {
                  setPdfViewerUrl(url);
                  setPdfViewerVisible(true);
                } else {
                  showAlert('Lỗi', 'Không tìm thấy file hợp đồng');
                }
              }}
            >
              <View style={styles.pdfIconCircle}>
                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfCardTitle}>Xem phôi hợp đồng</Text>
                <Text style={styles.pdfCardSub}>Bản phôi mẫu văn bản chưa điền thông tin</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          ) : null}

          <PdfViewerModal
            visible={pdfViewerVisible}
            url={pdfViewerUrl}
            onClose={() => {
              setPdfViewerVisible(false);
              setPdfViewerUrl(null);
            }}
            title="Xem hợp đồng"
          />
          
          {fieldsToFill.length > 0 && (
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="form-textbox" size={20} color="#1E3E2F" />
                <Text style={styles.cardTitle}>Thông tin bổ sung hợp đồng</Text>
              </View>
              {fieldsToFill.map(field => {
                if (field.type === 'text') {
                  return (
                    <View key={field.id} style={{ marginBottom: 12 }}>
                      <Text style={styles.fieldLabel}>{field.label || field.id}</Text>
                      {field.description ? <Text style={styles.fieldDesc}>{field.description}</Text> : null}
                      <TextInput 
                        style={styles.input}
                        value={filledValues[field.id] || ''}
                        onChangeText={(val) => setFilledValues(prev => ({ ...prev, [field.id]: val }))}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  );
                }
                if (field.type === 'checkbox') {
                  return (
                    <View key={field.id} style={{ marginBottom: 12 }}>
                      <Pressable 
                        style={{ flexDirection: 'row', alignItems: 'center' }} 
                        onPress={() => setFilledValues(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                      >
                        <View style={[styles.checkbox, filledValues[field.id] && styles.checkboxActive]}>
                          {filledValues[field.id] && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                        <Text style={styles.fieldLabel}>{field.label || field.id}</Text>
                      </Pressable>
                      {field.description ? <Text style={[styles.fieldDesc, { marginLeft: 32 }]}>{field.description}</Text> : null}
                    </View>
                  );
                }
                return null;
              })}
            </View>
          )}

          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="draw-pen" size={20} color="#1E3E2F" />
              <Text style={styles.cardTitle}>Ký tên xác nhận</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>
              Dùng ngón tay ký tên vào khung trắng bên dưới
            </Text>
            <View style={styles.padWrapper}>
              <SignatureScreen
                ref={ref}
                onOK={handleSignature}
                descriptionText="Ký tên của bạn"
                clearText="Xóa"
                confirmText="Lưu"
                webStyle={`
                  .m-signature-pad { box-shadow: none; border: none; }
                  .m-signature-pad--body { border: none; }
                  .m-signature-pad--footer { display: none; margin: 0px; }
                `}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={handleClear} style={styles.clearBtn}>
            <MaterialCommunityIcons name="eraser" size={18} color="#475569" />
            <Text style={styles.clearBtnText}>Xóa ký lại</Text>
          </Pressable>
          <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>Xác nhận ký</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  pdfIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  pdfCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  fieldDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#1E3E2F',
    borderColor: '#1E3E2F',
  },
  padWrapper: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  clearBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E3E2F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

