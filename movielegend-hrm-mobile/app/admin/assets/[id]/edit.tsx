import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { normalizeApiError } from '../../../../src/utils/api-error';
import { PageHeader } from '../../../../src/components/PageHeader';
import { Screen } from '../../../../src/components/Screen';
import { ScreenContainer } from '../../../../src/components/ScreenContainer';
import { FormField } from '../../../../src/components/FormField';
import { useAsset, useUpdateAsset } from '../../../../src/hooks/useAssets';
import { LoadingState } from '../../../../src/components/LoadingState';
import { ErrorState } from '../../../../src/components/ErrorState';
import { spacing } from '../../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { assetStatusLabels, assetConditionLabels } from '../../../../src/features/assets/asset.logic';
import type { AssetStatus, AssetConditionStatus } from '../../../../src/types/asset.types';
import { SelectModal } from '../../../../src/components/SelectModal';
import { SectionCard } from '../../../../src/components/SectionCard';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../../../../src/api/uploads.api';

export default function AssetEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const assetQuery = useAsset(id);
  const updateMutation = useUpdateAsset();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [conditionNote, setConditionNote] = useState('');
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      
      const imgs = assetQuery.data.imageUrl ? assetQuery.data.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
      setImageUrls(imgs);
      
      setAssetStatus(assetQuery.data.assetStatus || 'IN_STOCK');
      setConditionStatus(assetQuery.data.conditionStatus || 'GOOD');
    }
  }, [assetQuery.data]);

  const uploadSelectedImage = async (uri: string) => {
    try {
      setIsUploading(true);
      const fileType = uri.substring(uri.lastIndexOf('.') + 1);
      const uploaded = await uploadFile({
        uri,
        name: `asset_${Date.now()}.${fileType}`,
        mimeType: `image/${fileType}`,
        purpose: 'ASSET_INCIDENT'
      });
      setIsUploading(false);

      const cdnUrl = uploaded.fileUrl || (uploaded as any).url;
      if (cdnUrl) {
        setImageUrls(prev => [...prev, cdnUrl]);
      }
    } catch (error: any) {
      setIsUploading(false);
      Alert.alert('Lỗi tải ảnh', error.message || 'Không thể tải ảnh lên');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Từ chối', 'Bạn cần cấp quyền sử dụng máy ảnh để chụp ảnh thiết bị.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể mở Camera');
    }
  };

  const handleSelectImage = () => {
    Alert.alert(
      'Ảnh thiết bị',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Chụp ảnh mới', onPress: takePhoto },
        { text: 'Chọn từ thư viện', onPress: pickImage },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

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
          imageUrl: imageUrls.length > 0 ? imageUrls.join(',') : '',
        }
      });
      Alert.alert('Thành công', 'Đã lưu thay đổi thiết bị');
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
        <SectionCard>
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
            <FormField label="Nhập tên hãng" value={customBrand} onChangeText={setCustomBrand} />
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dòng máy</Text>
            <Pressable style={styles.pickerContainer} onPress={() => setShowModelSelect(true)}>
              <Text style={[styles.pickerText, !model && styles.pickerPlaceholder]}>{model || 'Chọn dòng máy'}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
            </Pressable>
          </View>
          {model === 'Khác' && (
            <FormField label="Nhập dòng máy" value={customModel} onChangeText={setCustomModel} />
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
            <Text style={[styles.label, { marginBottom: 8 }]}>Ảnh thiết bị (tối đa 5 ảnh)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {imageUrls.map((uri, index) => (
                <View key={index} style={{ position: 'relative', width: 120, height: 120 }}>
                  <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
                  <Pressable
                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}
                    onPress={() => setImageUrls(prev => prev.filter((_, i) => i !== index))}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                  </Pressable>
                </View>
              ))}
              
              {imageUrls.length < 5 && (
                <Pressable
                  style={[
                    { width: 120, height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
                    isUploading && { opacity: 0.5 },
                  ]}
                  onPress={handleSelectImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#36C59E" />
                  ) : (
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color="#98A0A8" />
                      <Text style={{ fontSize: 12, color: '#98A0A8' }}>Thêm ảnh</Text>
                    </View>
                  )}
                </Pressable>
              )}
            </ScrollView>
          </View>

          <View style={styles.bottomButtonsRow}>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, !name.trim() && { opacity: 0.5 }]} onPress={handleSave} disabled={!name.trim() || updateMutation.isPending}>
              <Text style={styles.submitBtnText}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </Pressable>
          </View>
        </SectionCard>
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
        options={Object.entries(assetStatusLabels).map(([id, label]) => ({ id, label }))}
        selectedValue={assetStatus}
        onSelect={(opt) => { setAssetStatus(opt.id as AssetStatus); setShowStatusSelect(false); }}
        onClose={() => setShowStatusSelect(false)}
      />

      <SelectModal
        visible={showConditionSelect}
        title="Chọn tình trạng hiện tại"
        options={Object.entries(assetConditionLabels).map(([id, label]) => ({ id, label }))}
        selectedValue={conditionStatus}
        onSelect={(opt) => { setConditionStatus(opt.id as AssetConditionStatus); setShowConditionSelect(false); }}
        onClose={() => setShowConditionSelect(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  inputRounded: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 14,
    color: '#0F172A',
  },
  pickerPlaceholder: {
    color: '#98A0A8',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#36C59E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
