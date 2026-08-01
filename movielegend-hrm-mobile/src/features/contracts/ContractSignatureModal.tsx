import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import SignatureScreen from '../../components/SignaturePad/SignaturePad';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { colors } from '../../theme/colors';
import { PdfViewerModal } from '../../components/PdfViewerModal';

import { Linking } from 'react-native';
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
      <View style={styles.container}>
        <PageHeader title="Ký hợp đồng" subtitle="Vui lòng ký tên vào khung bên dưới" />
        
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
          {pdfUrl ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <SecondaryButton
                onPress={() => {
                  const url = resolveFileUrl(pdfUrl);
                  if (url) {
                    setPdfViewerVisible(true);
                    setPdfViewerUrl(url);
                  } else {
                    showAlert('Lỗi', 'Không tìm thấy file hợp đồng');
                  }
                }}
              >
                📄 Xem phôi hợp đồng (bản chưa điền)
              </SecondaryButton>
              <PdfViewerModal
                visible={pdfViewerVisible}
                url={pdfViewerUrl}
                onClose={() => {
                  setPdfViewerVisible(false);
                  setPdfViewerUrl(null);
                }}
                title="Xem hợp đồng"
              />
            </View>
          ) : null}
          
          {fieldsToFill.length > 0 && (
            <View style={styles.formContainer}>
              <Text style={{fontWeight: 'bold', marginBottom: 8}}>Vui lòng điền các thông tin sau:</Text>
              {fieldsToFill.map(field => {
                if (field.type === 'text') {
                  return (
                    <View key={field.id} style={{marginBottom: 12}}>
                    <Text style={{marginBottom: 4, fontWeight: '500'}}>{field.label || field.id}</Text>
                    {field.description ? <Text style={{fontSize: 12, color: colors.muted, marginBottom: 8}}>{field.description}</Text> : null}
                    <TextInput 
                      style={{borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8}}
                      value={filledValues[field.id] || ''}
                      onChangeText={(val) => setFilledValues(prev => ({...prev, [field.id]: val}))}
                    />
                  </View>
                  );
                }
                if (field.type === 'checkbox') {
                  return (
                    <View key={field.id} style={{marginBottom: 12}}>
                    <Pressable style={{flexDirection: 'row', alignItems: 'center'}} onPress={() => setFilledValues(prev => ({...prev, [field.id]: !prev[field.id]}))}>
                      <View style={{width: 24, height: 24, borderWidth: 1, borderColor: colors.border, borderRadius: 4, marginRight: 8, alignItems: 'center', justifyContent: 'center'}}>
                        {filledValues[field.id] && <Text>✓</Text>}
                      </View>
                      <Text style={{fontWeight: '500'}}>{field.label || field.id}</Text>
                    </Pressable>
                    {field.description ? <Text style={{fontSize: 12, color: colors.muted, marginTop: 4, marginLeft: 32}}>{field.description}</Text> : null}
                  </View>
                  );
                }
                return null;
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.signatureContainer}>
          <Text style={{fontWeight: 'bold', marginBottom: 8, color: colors.text}}>Ký tên xác nhận:</Text>
          <SignatureScreen
            ref={ref}
            onOK={handleSignature}
            descriptionText="Ký tên của bạn"
            clearText="Xóa"
            confirmText="Lưu"
            webStyle={`
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: 1px solid #e2e8f0; border-radius: 8px; }
              .m-signature-pad--footer { display: none; margin: 0px; }
            `}
          />
        </View>

        <View style={styles.footer}>
          <SecondaryButton onPress={onClose} style={styles.button}>Hủy</SecondaryButton>
          <SecondaryButton onPress={handleClear} style={styles.button}>Xóa ký lại</SecondaryButton>
          <PrimaryButton onPress={handleConfirm} style={styles.button}>Xác nhận</PrimaryButton>
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
  signatureContainer: {
    height: 250,
    padding: 16,
    paddingTop: 0,
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
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  }
});
