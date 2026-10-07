import React, { useState, useEffect, useMemo } from 'react';
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

import { useDepartment, useUpdateDepartment, useDepartments } from '../../hooks/useDepartments';
import { useBranches } from '../../api/branches.api';
import { CustomAlert } from '../../components/CustomAlert';
import { normalizeApiError } from '../../utils/api-error';
import { SelectModal, SelectOption } from '../../components/SelectModal';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export function EditDepartmentScreen() {
  const router = useRouter();
  const { id, departmentId } = useLocalSearchParams<{ id?: string; departmentId?: string }>();
  const actualId = (id || departmentId) as string;

  const departmentQuery = useDepartment(actualId);
  const updateMutation = useUpdateDepartment(actualId);
  const branchesQuery = useBranches();
  const allDepartmentsQuery = useDepartments({ limit: 1000 });

  const branches = branchesQuery.data || [];
  const departments = allDepartmentsQuery.data?.items || [];

  const [branchId, setBranchId] = useState<string>('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [parentModalVisible, setParentModalVisible] = useState(false);

  // Prepopulate data
  useEffect(() => {
    if (departmentQuery.data) {
      setBranchId(departmentQuery.data.branchId || '');
      setCode(departmentQuery.data.code || '');
      setName(departmentQuery.data.name || '');
      setDescription(departmentQuery.data.description || '');
      setParentId(departmentQuery.data.parentId || '');
    }
  }, [departmentQuery.data]);

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
    // Filter out current department to prevent cycle
    const candidates = departments.filter((d) => d.id !== actualId);
    candidates.forEach((d) => {
      list.push({ id: d.id, label: d.name });
    });
    return list;
  }, [departments, actualId]);

  const submit = async () => {
    if (!name.trim()) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng nhập tên phòng ban');
      return;
    }
    if (!branchId) {
      CustomAlert.alert('Thiếu thông tin', 'Vui lòng chọn chi nhánh');
      return;
    }

    try {
      const payload = {
        branchId,
        code,
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId || undefined,
      };

      await updateMutation.mutateAsync(payload as any);
      CustomAlert.alert('Thành công', 'Đã lưu thay đổi phòng ban', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      const normalized = normalizeApiError(error);
      CustomAlert.alert('Lỗi cập nhật phòng ban', normalized.message);
    }
  };

  if (departmentQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState label="Đang tải dữ liệu phòng ban..." />
      </SafeAreaView>
    );
  }

  if (departmentQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          error={departmentQuery.error}
          onRetry={() => void departmentQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const isFormValid = name.trim().length > 0 && !!branchId;
  const branchName = selectedBranch?.name || 'Chi nhánh';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back button + Title + Subtitle) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Cập nhật phòng ban</Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {name || 'Phòng ban'} • {branchName}
        </Text>
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

          {/* Mã phòng ban (Readonly with Lock) */}
          <Text style={styles.fieldLabel}>Mã phòng ban</Text>
          <View style={[styles.inputBox, styles.inputBoxLocked]}>
            <TextInput
              value={code}
              editable={false}
              style={[styles.textInput, styles.textInputLocked]}
            />
            <Ionicons name="lock-closed" size={16} color="#64748B" />
          </View>
          <Text style={styles.helperNote}>Mã cố định, không thể chỉnh sửa</Text>

          {/* Tên phòng ban * */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            Tên phòng ban <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Nhập tên phòng ban"
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
          disabled={updateMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitBtn,
            (!isFormValid || updateMutation.isPending) && styles.submitBtnDisabled,
          ]}
          onPress={() => void submit()}
          disabled={!isFormValid || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Lưu thay đổi</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
  },
  inputBoxLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  textInputLocked: {
    color: '#64748B',
    fontWeight: '600',
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
