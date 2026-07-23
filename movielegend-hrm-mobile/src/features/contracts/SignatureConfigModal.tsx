import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { PrimaryButton } from '../../components/Buttons';
import { useUpdateTemplateMapping } from '../../hooks/useContracts';

interface SignatureConfigModalProps {
  visible: boolean;
  onClose: () => void;
  templateId: string;
  initialConfig?: any[];
}

export function SignatureConfigModal({ visible, onClose, templateId, initialConfig }: SignatureConfigModalProps) {
  const [page, setPage] = useState('1');
  const [x, setX] = useState('100');
  const [y, setY] = useState('100');
  const updateMapping = useUpdateTemplateMapping(templateId);

  useEffect(() => {
    if (visible && initialConfig && initialConfig.length > 0) {
      const sig = initialConfig.find((c: any) => c.type === 'signature' && c.id === 'signature');
      if (sig) {
        setPage(sig.page?.toString() || '1');
        setX(sig.x?.toString() || '100');
        setY(sig.y?.toString() || '100');
      }
    }
  }, [visible, initialConfig]);

  const handleSubmit = async () => {
    const pageNum = parseInt(page, 10);
    const xNum = parseInt(x, 10);
    const yNum = parseInt(y, 10);

    if (isNaN(pageNum) || isNaN(xNum) || isNaN(yNum)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ');
      return;
    }

    try {
      await updateMapping.mutateAsync({
        mappingConfig: [
          {
            type: 'signature',
            id: 'signature',
            page: pageNum,
            x: xNum,
            y: yNum,
          }
        ]
      });
      Alert.alert('Thành công', 'Đã cập nhật vị trí chữ ký');
      onClose();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Cấu hình vị trí chữ ký</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.field}>
              <Text style={styles.label}>Trang số</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={page}
                onChangeText={setPage}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Tọa độ X</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={x}
                  onChangeText={setX}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Tọa độ Y</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={y}
                  onChangeText={setY}
                />
              </View>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>
              Lưu ý: Tọa độ gốc (0,0) nằm ở góc dưới cùng bên trái của PDF. Kích thước chữ ký là 150x75.
            </Text>
          </View>

          <View style={styles.footer}>
            <PrimaryButton onPress={handleSubmit} loading={updateMapping.isPending}>
              Lưu cấu hình
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  container: { backgroundColor: colors.background, borderRadius: 16, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  closeBtn: { padding: 4 },
  body: { padding: 16 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
});
