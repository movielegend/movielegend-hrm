import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import SignatureScreen from '../../components/SignaturePad/SignaturePad';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { colors } from '../../theme/colors';
import { PdfViewerModal } from '../../components/PdfViewerModal';

import { Linking, Alert } from 'react-native';
import { resolveFileUrl } from '../../utils/url';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureBase64: string, filledFields: Record<string, any>) => void;
  pdfUrl?: string;
  fieldsToFill?: any[]; // Array of fields from mappingConfig
}

export function ContractSignatureModal({ visible, onClose, onSave, pdfUrl, fieldsToFill = [] }: Props) {
  const ref = useRef<any>();
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  
  const [filledValues, setFilledValues] = useState<Record<string, any>>({});

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
                    Alert.alert('Lỗi', 'Không tìm thấy file hợp đồng');
                  }
                }}
              >
                📄 Xem file hợp đồng trước khi ký (PDF)
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
