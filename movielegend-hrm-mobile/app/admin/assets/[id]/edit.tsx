import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { normalizeApiError } from '../../../../src/utils/api-error';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Screen } from '../../../../src/components/Screen';
import { ScreenContainer } from '../../../../src/components/ScreenContainer';
import { FormField } from '../../../../src/components/FormField';
import { PrimaryButton } from '../../../../src/components/Buttons';
import { useAsset, useUpdateAsset } from '../../../../src/hooks/useAssets';
import { LoadingState } from '../../../../src/components/LoadingState';
import { ErrorState } from '../../../../src/components/ErrorState';
import { spacing } from '../../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { assetStatusLabels, assetConditionLabels } from '../../../../src/features/assets/asset.logic';
import type { AssetStatus, AssetConditionStatus } from '../../../../src/types/asset.types';
import { SelectModal } from '../../../../src/components/SelectModal';

export default function AssetEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const assetQuery = useAsset(id);
  const updateMutation = useUpdateAsset();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [conditionNote, setConditionNote] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [assetStatus, setAssetStatus] = useState<AssetStatus>('IN_STOCK');
  const [conditionStatus, setConditionStatus] = useState<AssetConditionStatus>('GOOD');

  const [showBrandSelect, setShowBrandSelect] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showStatusSelect, setShowStatusSelect] = useState(false);
  const [showConditionSelect, setShowConditionSelect] = useState(false);

  const brandOptions = ['Dell', 'HP', 'Apple', 'Lenovo', 'Asus', 'Acer', 'Khác'];
  const modelOptions = ['XPS', 'ThinkPad', 'MacBook Pro', 'MacBook Air', 'EliteBook', 'Khác'];

  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');

  useEffect(() => {
    if (assetQuery.data) {
      setName(assetQuery.data.name || '');
      
      const _brand = assetQuery.data.brand || '';
      if (brandOptions.includes(_brand)) setBrand(_brand);
      else if (_brand) { setBrand('Khác'); setCustomBrand(_brand); }
      
      const _model = assetQuery.data.model || '';
      if (modelOptions.includes(_model)) setModel(_model);
      else if (_model) { setModel('Khác'); setCustomModel(_model); }

      setConditionNote(assetQuery.data.conditionNote || '');
      setImageUrl(assetQuery.data.imageUrl || '');
      setAssetStatus(assetQuery.data.assetStatus || 'IN_STOCK');
      setConditionStatus(assetQuery.data.conditionStatus || 'GOOD');
    }
  }, [assetQuery.data]);

  if (assetQuery.isLoading) return <LoadingState />;
  if (assetQuery.isError) return <ErrorState error={assetQuery.error} />;

  async function handleSave() {
    if (!id) return;
    try {
      const finalBrand = brand === 'Khác' ? customBrand : brand;
      const finalModel = model === 'Khác' ? customModel : model;
      await updateMutation.mutateAsync({
        id,
        payload: { 
          name, 
          assetStatus,
          conditionStatus,
          ...(finalBrand.trim() ? { brand: finalBrand.trim() } : {}), 
          ...(finalModel.trim() ? { model: finalModel.trim() } : {}), 
          ...(conditionNote.trim() ? { conditionNote: conditionNote.trim() } : {}),
          ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
        }
      });
      router.back();
    } catch (e) {
      console.error(e);
      const normalized = normalizeApiError(e);
      Alert.alert('Lỗi', normalized.message);
    }
  }

  return (
    <Screen>
      <ScreenContainer style={styles.content} disableGlobalRefresh={true}>
        <PageHeader title="Sửa tài sản" subtitle={`Mã: ${assetQuery.data?.assetCode}`} onBack={() => router.back()} />
        <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: spacing.md }}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên thiết bị</Text>
            <TextInput
              style={styles.inputRounded}
              placeholder="Ví dụ: Laptop làm việc 01"
              placeholderTextColor="#98A0A8"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hãng sản xuất</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowBrandSelect(true)}>
              <Text style={[styles.pickerText, !brand && styles.pickerPlaceholder]}>{brand || 'Chọn hãng sản xuất'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {brand === 'Khác' && (
            <View style={styles.formGroup}>
               <TextInput style={styles.inputRounded} placeholder="Nhập tên hãng" value={customBrand} onChangeText={setCustomBrand} />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dòng máy</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowModelSelect(true)}>
              <Text style={[styles.pickerText, !model && styles.pickerPlaceholder]}>{model || 'Chọn dòng máy'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {model === 'Khác' && (
            <View style={styles.formGroup}>
               <TextInput style={styles.inputRounded} placeholder="Nhập dòng máy" value={customModel} onChangeText={setCustomModel} />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Trạng thái sử dụng</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowStatusSelect(true)}>
              <Text style={styles.pickerText}>{assetStatusLabels[assetStatus]}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tình trạng hiện tại</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowConditionSelect(true)}>
              <Text style={styles.pickerText}>{assetConditionLabels[conditionStatus]}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú thủ công (Tình trạng)</Text>
            <TextInput
              style={[styles.inputRounded, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Nhập ghi chú thêm về thiết bị (nếu có)..."
              placeholderTextColor="#98A0A8"
              value={conditionNote}
              onChangeText={setConditionNote}
              multiline
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ảnh thiết bị</Text>
            <View style={styles.imageUploaderRow}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imageUploaderBox}>
                  <MaterialCommunityIcons name="plus" size={24} color="#98A0A8" />
                </View>
              )}
              <View style={styles.imageUploaderTexts}>
                {/* <Text style={styles.imageUploaderError}>Ảnh quá lớn {'>'}5MB</Text> */}
                <TextInput
                  style={styles.inputRoundedUrl}
                  placeholder="URL ảnh (VD: https://picsum.photos/200)"
                  placeholderTextColor="#98A0A8"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={styles.bottomButtonsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, !name.trim() && { opacity: 0.5 }]} onPress={handleSave} disabled={!name.trim() || updateMutation.isPending}>
              <Text style={styles.submitBtnText}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>

      <SelectModal
        visible={showBrandSelect}
        title="Chọn hãng sản xuất"
        options={brandOptions.map(b => ({ id: b, label: b }))}
        selectedValue={brand}
        onSelect={(opt) => { setBrand(opt.id); setShowBrandSelect(false); }}
        onClose={() => setShowBrandSelect(false)}
      />
      
      <SelectModal
        visible={showModelSelect}
        title="Chọn dòng máy"
        options={modelOptions.map(m => ({ id: m, label: m }))}
        selectedValue={model}
        onSelect={(opt) => { setModel(opt.id); setShowModelSelect(false); }}
        onClose={() => setShowModelSelect(false)}
      />
      
      <SelectModal
        visible={showStatusSelect}
        title="Chọn trạng thái sử dụng"
        options={(Object.keys(assetStatusLabels) as AssetStatus[]).map(k => ({ id: k, label: assetStatusLabels[k] }))}
        selectedValue={assetStatus}
        onSelect={(opt) => { setAssetStatus(opt.id as AssetStatus); setShowStatusSelect(false); }}
        onClose={() => setShowStatusSelect(false)}
      />
      
      <SelectModal
        visible={showConditionSelect}
        title="Chọn tình trạng hiện tại"
        options={(Object.keys(assetConditionLabels) as AssetConditionStatus[]).map(k => ({ id: k, label: assetConditionLabels[k] }))}
        selectedValue={conditionStatus}
        onSelect={(opt) => { setConditionStatus(opt.id as AssetConditionStatus); setShowConditionSelect(false); }}
        onClose={() => setShowConditionSelect(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  formGroup: { marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  inputRounded: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#334155', backgroundColor: '#FFF' },
  inputRoundedUrl: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#334155', backgroundColor: '#FFF', marginTop: 8 },
  pill: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFF' },
  pillSelected: { borderColor: '#36C59E', backgroundColor: '#F0FDF4' },
  pillText: { fontSize: 14, color: '#64748B' },
  pillTextSelected: { color: '#36C59E', fontWeight: '600' },
  pickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  pickerText: { fontSize: 14, color: '#334155' },
  pickerPlaceholder: { color: '#98A0A8' },
  imageUploaderRow: { flexDirection: 'row', alignItems: 'center' },
  imageUploaderBox: { width: 60, height: 60, borderWidth: 1, borderColor: '#98A0A8', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#F8FAFC' },
  imagePreview: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  imageUploaderTexts: { flex: 1 },
  imageUploaderError: { color: '#EF4444', fontSize: 12 },
  bottomButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  submitBtn: { backgroundColor: '#36C59E', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', flex: 1, marginLeft: 16 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
