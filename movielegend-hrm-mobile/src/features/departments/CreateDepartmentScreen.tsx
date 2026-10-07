import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useCreateDepartment, useDepartments } from '../../hooks/useDepartments';
import { useBranches } from '../../api/branches.api';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';
import { SelectModal, SelectOption } from '../../components/SelectModal';

export function CreateDepartmentScreen() {
  const router = useRouter();
  const { branchId: paramBranchId } = useLocalSearchParams<{ branchId?: string }>();
  const createMutation = useCreateDepartment();
  const branchesQuery = useBranches();
  const allDepartmentsQuery = useDepartments({ limit: 1000 });

  const branches = branchesQuery.data || [];
  const departments = allDepartmentsQuery.data?.items || [];

  const [branchId, setBranchId] = useState<string>(paramBranchId || '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [parentModalVisible, setParentModalVisible] = useState(false);

  // Default branch if paramBranchId or first branch
  React.useEffect(() => {
    if (!branchId && branches.length > 0) {
      setBranchId(branches[0].id);
    }
  }, [branches, branchId]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId),
    [branches, branchId]
  );

  const selectedParentDept = useMemo(
    () => departments.find((d) => d.id === parentId),
    [departments, parentId]
  );

  const branchOptions: SelectOption[] = useMemo(() => {
    return branches.map((b) => ({ id: b.id, label: b.name }));
  }, [branches]);

  const parentDeptOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [{ id: '', label: 'Không có (Cấp cao nhất)' }];
    // Filter to departments in same branch if branch selected
    const candidates = branchId
      ? departments.filter((d) => d.branchId === branchId)
      : departments;
    candidates.forEach((d) => {
      list.push({ id: d.id, label: d.name });
    });
    return list;
  }, [departments, branchId]);

  const submit = async () => {
    if (!name.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập tên phòng ban');
      return;
    }
    if (!branchId) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng chọn chi nhánh trực thuộc');
      return;
    }

    try {
      let finalName = name.trim();
      if (selectedBranch?.name) {
        const cleanBranch = selectedBranch.name.replace(/^chi nhánh\s+/i, '').trim();
        const hasBranch =
          finalName.toLowerCase().includes(cleanBranch.toLowerCase()) ||
          finalName.toLowerCase().includes(selectedBranch.name.toLowerCase());
        if (!hasBranch) {
          finalName = `${finalName} (${cleanBranch})`;
        }
      }

      let generatedCode = code.trim();
      if (!generatedCode) {
        const initials = finalName
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .replace(/[^A-Z]/g, '');
        const timestamp = new Date().getTime().toString().slice(-4);
        generatedCode = `${initials || 'PB'}-${timestamp}`;
      }

      const payload = {
        branchId,
        code: generatedCode,
        name: finalName,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(parentId ? { parentId } : {}),
      };

      await createMutation.mutateAsync(payload as any);
      CustomAlert.alert('Thành công', 'Đã tạo phòng ban mới', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi tạo phòng ban', normalized.message);
    }
  };

  const isFormValid = name.trim().length > 0 && !!branchId;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back button + Title + Subtitle) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Thêm phòng ban</Text>
        </View>
        <Text style={styles.subtitle}>Thiết lập thông tin phòng ban mới</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: Đơn vị trực thuộc */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đơn vị trực thuộc</Text>

          <Text style={styles.fieldLabel}>
            Chi nhánh <Text style={styles.reqStar}>*</Text>
          </Text>
          <Pressable
            style={styles.selectPill}
            onPress={() => setBranchModalVisible(true)}
            android_ripple={{ color: '#F1F5F9' }}
          >
            <View style={styles.selectLeft}>
              <MaterialCommunityIcons name="office-building" size={18} color="#166534" />
              <Text
                style={[
                  styles.selectText,
                  !selectedBranch && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedBranch?.name || 'Chọn chi nhánh'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>
        </View>

        {/* CARD 2: Thông tin phòng ban */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin phòng ban</Text>

          {/* Mã phòng ban */}
          <Text style={styles.fieldLabel}>Mã phòng ban</Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Tự động tạo (Ví dụ: KDN-6883)"
              placeholderTextColor="#94A3B8"
              value={code}
              onChangeText={setCode}
              style={styles.textInput}
              autoCapitalize="characters"
            />
          </View>
          <Text style={styles.helperNote}>Hệ thống sẽ tự động tạo mã nếu để trống.</Text>

          {/* Tên phòng ban * */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Tên phòng ban <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Nhập tên phòng ban (Ví dụ: Kinh doanh)"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              style={styles.textInput}
            />
          </View>

          {/* Mô tả */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Mô tả</Text>
          <View style={[styles.inputBox, styles.textAreaBox]}>
            <TextInput
              placeholder="Mô tả chức năng, nhiệm vụ phòng ban..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              style={[styles.textInput, styles.textAreaInput]}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* CARD 3: Cơ cấu quản lý */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cơ cấu quản lý</Text>

          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Phòng ban quản lý</Text>
            <Text style={styles.optionalText}>Tùy chọn</Text>
          </View>

          <Pressable
            style={styles.selectPill}
            onPress={() => setParentModalVisible(true)}
            android_ripple={{ color: '#F1F5F9' }}
          >
            <View style={styles.selectLeft}>
              <MaterialCommunityIcons name="sitemap" size={18} color="#166534" />
              <Text
                style={[
                  styles.selectText,
                  !selectedParentDept && styles.placeholderText,
                ]}
                numberOfLines={1}
              >
                {selectedParentDept?.name || 'Chọn phòng ban quản lý'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </Pressable>
        </View>
      </ScrollView>

      {/* 4. Bottom Fixed Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={createMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitBtn,
            (!isFormValid || createMutation.isPending) && styles.submitBtnDisabled,
          ]}
          onPress={() => void submit()}
          disabled={!isFormValid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Tạo phòng ban</Text>
          )}
        </Pressable>
      </View>

      {/* Branch Select Modal */}
      <SelectModal
        visible={branchModalVisible}
        title="Chọn chi nhánh"
        options={branchOptions}
        selectedValue={branchId}
        onSelect={(opt) => {
          setBranchId(opt.id);
          setBranchModalVisible(false);
        }}
        onClose={() => setBranchModalVisible(false)}
      />

      {/* Parent Dept Select Modal */}
      <SelectModal
        visible={parentModalVisible}
        title="Chọn phòng ban quản lý"
        options={parentDeptOptions}
        selectedValue={parentId}
        onSelect={(opt) => {
          setParentId(opt.id);
          setParentModalVisible(false);
        }}
        onClose={() => setParentModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  reqStar: {
    color: '#EF4444',
  },
  labelWithOptionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  textAreaBox: {
    height: 80,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  textAreaInput: {
    flex: 1,
    textAlignVertical: 'top',
    width: '100%',
  },
  helperNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  selectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: '#1B382B', // Deep forest green
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#8FA89B',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
