import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, View, Text } from 'react-native';
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
  onSave: (signatureBase64: string) => void;
  pdfUrl?: string;
}

export function ContractSignatureModal({ visible, onClose, onSave, pdfUrl }: Props) {
  const ref = useRef<any>();
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);

  const handleSignature = (signature: string) => {
    onSave(signature);
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
        <View style={styles.signatureContainer}>
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
    flex: 1,
    padding: 16,
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
