import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Platform,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { reportsApi } from '../../api/reports.api';
import { getDepartments } from '../../api/departments.api';
import { getScopedEmployees } from '../../api/employees.api';
import { useSnackbar } from '../../hooks/useSnackbar';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';

const getFormattedDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDisplayDate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Initial avatar with fallback
function EmployeeInitialAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ML';
    if (parts.length === 1) return (parts[0] || '').slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'ML';
  }, [name]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#334155', fontSize: 13, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

export function AttendanceReportScreen() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // Date range filter mode: 'thisMonth' | 'lastMonth' | 'custom'
  const [dateMode, setDateMode] = useState<'thisMonth' | 'lastMonth' | 'custom'>('custom');

  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const [showPickerFor, setShowPickerFor] = useState<'start' | 'end' | null>(null);

  // Departments & Employees
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Search employee & pagination limit
  const [searchEmployee, setSearchEmployee] = useState('');
  const [displayLimit, setDisplayLimit] = useState(3);

  // Modals for Department & Personnel selection
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [tempSelectedDepts, setTempSelectedDepts] = useState<string[]>([]);
  const [searchDeptModal, setSearchDeptModal] = useState('');

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        getDepartments(),
        getScopedEmployees({ limit: 150 }),
      ]);
      const depts = deptRes.items || [];
      const emps = userRes.items || [];
      setDepartments(depts);
      setUsers(emps);
      // Select all employees by default
      setSelectedUsers(emps.map(u => u.id));
    } catch {
      showSnackbar('Lỗi tải dữ liệu phòng ban / nhân sự', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Date Selectors
  const handleSelectDateMode = (mode: 'thisMonth' | 'lastMonth' | 'custom') => {
    setDateMode(mode);
    const now = new Date();
    if (mode === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(start);
      setEndDate(end);
    } else if (mode === 'lastMonth') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Filtered employees by department and search
  const availableUsers = useMemo(() => {
    if (selectedDepts.length > 0) {
      return users.filter(u => u.department?.id && selectedDepts.includes(u.department.id));
    }
    return users;
  }, [users, selectedDepts]);

  const filteredUsers = useMemo(() => {
    if (!searchEmployee.trim()) return availableUsers;
    const q = searchEmployee.trim().toLowerCase();
    return availableUsers.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const code = (u.userCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [availableUsers, searchEmployee]);

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAllUsers = () => {
    const allFilteredIds = filteredUsers.map(u => u.id);
    const allSelected = allFilteredIds.every(id => selectedUsers.includes(id));
    if (allSelected) {
      setSelectedUsers(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedUsers(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Open Department Selection Bottom Sheet
  const openDepartmentModal = () => {
    setTempSelectedDepts(selectedDepts);
    setSearchDeptModal('');
    setShowDeptModal(true);
  };

  const toggleTempDept = (deptId: string) => {
    setTempSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleSelectAllTempDepts = () => {
    if (tempSelectedDepts.length === departments.length) {
      setTempSelectedDepts([]);
    } else {
      setTempSelectedDepts(departments.map(d => d.id));
    }
  };

  const applyDepartmentSelection = () => {
    setSelectedDepts(tempSelectedDepts);
    setShowDeptModal(false);

    // Auto update selected users based on department filter
    if (tempSelectedDepts.length > 0) {
      const usersInDepts = users
        .filter(u => u.department?.id && tempSelectedDepts.includes(u.department.id))
        .map(u => u.id);
      setSelectedUsers(usersInDepts);
    } else {
      // If all departments, select all users
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const filteredDeptsModal = useMemo(() => {
    if (!searchDeptModal.trim()) return departments;
    const q = searchDeptModal.trim().toLowerCase();
    return departments.filter(d => (d.name || '').toLowerCase().includes(q));
  }, [departments, searchDeptModal]);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      showSnackbar('Vui lòng chọn ngày hợp lệ', 'warning');
      return;
    }
    if (selectedUsers.length === 0) {
      showSnackbar('Vui lòng chọn ít nhất 1 nhân viên để xuất báo cáo', 'warning');
      return;
    }

    try {
      setExporting(true);
      const startStr = getFormattedDate(startDate);
      const endStr = getFormattedDate(endDate);
      const url = await reportsApi.getAttendanceDetailExcelUrl({
        startDate: startStr,
        endDate: endStr,
        departmentId: selectedDepts.length > 0 ? selectedDepts : undefined,
        userId: selectedUsers,
      });

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const fileUri = `${FileSystem.documentDirectory}bang-cham-cong-${startStr}-den-${endStr}.xlsx`;
        const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (status === 200) {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              dialogTitle: 'Mở Bảng Chấm Công Excel',
            });
          } else {
            showSnackbar('Thiết bị không hỗ trợ chia sẻ/mở file', 'warning');
          }
        } else {
          showSnackbar(`Tải file thất bại (HTTP ${status})`, 'error');
        }
      }
    } catch (e: any) {
      showSnackbar(`Lỗi xuất Excel: ${e.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back Button, Title, Subtitle) */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
        </View>

        <Text style={styles.title}>Báo cáo chấm công</Text>
        <Text style={styles.subtitle}>Tạo và xuất bảng công của đội ngũ</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SECTION 1: Thời gian báo cáo */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#0F172A" />
            <Text style={styles.cardTitle}>Thời gian báo cáo</Text>
          </View>

          {/* Preset Buttons: [Tháng này] [Tháng trước] [Tùy chọn] */}
          <View style={styles.dateModeRow}>
            <Pressable
              onPress={() => handleSelectDateMode('thisMonth')}
              style={[styles.dateModeBtn, dateMode === 'thisMonth' && styles.dateModeBtnActive]}
            >
              <Text style={[styles.dateModeText, dateMode === 'thisMonth' && styles.dateModeTextActive]}>
                Tháng này
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSelectDateMode('lastMonth')}
              style={[styles.dateModeBtn, dateMode === 'lastMonth' && styles.dateModeBtnActive]}
            >
              <Text style={[styles.dateModeText, dateMode === 'lastMonth' && styles.dateModeTextActive]}>
                Tháng trước
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDateMode('custom')}
              style={[styles.dateModeBtn, dateMode === 'custom' && styles.dateModeBtnActive]}
            >
              <Text style={[styles.dateModeText, dateMode === 'custom' && styles.dateModeTextActive]}>
                Tùy chọn
              </Text>
            </Pressable>
          </View>

          {/* From Date & To Date Inputs */}
          <View style={styles.dateInputsRow}>
            {/* From Date Box */}
            <Pressable onPress={() => setShowPickerFor('start')} style={styles.dateBox}>
              <Text style={styles.dateBoxLabel}>Từ ngày</Text>
              <View style={styles.dateBoxValueRow}>
                <Text style={styles.dateBoxValue}>{getDisplayDate(startDate)}</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
              </View>
            </Pressable>

            {/* To Date Box */}
            <Pressable onPress={() => setShowPickerFor('end')} style={styles.dateBox}>
              <Text style={styles.dateBoxLabel}>Đến ngày</Text>
              <View style={styles.dateBoxValueRow}>
                <Text style={styles.dateBoxValue}>{getDisplayDate(endDate)}</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* SECTION 2: Phạm vi báo cáo (Phòng ban & Nhân sự summary) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="filter-outline" size={18} color="#0F172A" />
            <Text style={styles.cardTitle}>Phạm vi báo cáo</Text>
          </View>

          {/* Department Row Navigation -> Opens Modal to choose departments */}
          <Pressable
            onPress={openDepartmentModal}
            style={styles.scopeRow}
            android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
          >
            <View style={styles.scopeIconWrap}>
              <Ionicons name="business-outline" size={18} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.scopeLabel}>Phòng ban</Text>
              <Text style={styles.scopeValue}>
                {selectedDepts.length === 0 || selectedDepts.length === departments.length
                  ? 'Tất cả phòng ban'
                  : `Đã chọn ${selectedDepts.length}/${departments.length} phòng ban`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          <View style={styles.cardDivider} />

          {/* Personnel Summary Row */}
          <Pressable
            onPress={() => {
              // Focus or expand to personnel list
              setDisplayLimit(filteredUsers.length);
            }}
            style={styles.scopeRow}
            android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
          >
            <View style={styles.scopeIconWrap}>
              <Ionicons name="people-outline" size={18} color="#0F172A" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.scopeLabel}>Nhân sự</Text>
              <Text style={styles.scopeValue}>Đã chọn {selectedUsers.length} nhân viên</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>
        </View>

        {/* SECTION 3: Nhân sự được chọn */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar-outline" size={18} color="#0F172A" />
              <Text style={styles.cardTitle}>Nhân sự được chọn</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{selectedUsers.length}</Text>
            </View>
          </View>

          {/* Search Bar: Tìm tên hoặc mã nhân viên */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Tìm tên hoặc mã nhân viên"
              placeholderTextColor="#94A3B8"
              value={searchEmployee}
              onChangeText={setSearchEmployee}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Select All Row: Checkbox + "Chọn tất cả" + Count (e.g. 39/39) */}
          <Pressable onPress={toggleSelectAllUsers} style={styles.selectAllRow}>
            <View style={[styles.checkbox, isAllSelected && styles.checkboxActive]}>
              {isAllSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
            </View>
            <Text style={styles.selectAllLabel}>Chọn tất cả</Text>
            <Text style={styles.selectAllCount}>
              {selectedUsers.length}/{filteredUsers.length}
            </Text>
          </Pressable>

          {/* Employee List Items */}
          {loading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color="#1B382B" size="small" />
            </View>
          ) : filteredUsers.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy nhân viên phù hợp</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {filteredUsers.slice(0, displayLimit).map(user => {
                const isSelected = selectedUsers.includes(user.id);
                const deptName = user.department?.name || 'Văn phòng';
                const branchName = user.branch?.name || 'Hà Nội';

                return (
                  <Pressable
                    key={user.id}
                    onPress={() => toggleUser(user.id)}
                    style={styles.employeeItemRow}
                    android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                  >
                    {/* Checkbox */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>

                    {/* Initials Avatar */}
                    <EmployeeInitialAvatar name={user.fullName || user.userCode} size={36} />

                    {/* Name & Department Subtitle */}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.employeeName} numberOfLines={1}>
                        {user.fullName || user.userCode}
                      </Text>
                      <Text style={styles.employeeSubtitle}>
                        {deptName} • {branchName}
                      </Text>
                    </View>

                    {/* Overflow menu 3 dots */}
                    <Ionicons name="ellipsis-vertical" size={16} color="#94A3B8" />
                  </Pressable>
                );
              })}

              {/* Show more / collapse toggle */}
              {filteredUsers.length > displayLimit ? (
                <Pressable
                  onPress={() => setDisplayLimit(filteredUsers.length)}
                  style={styles.seeMoreBtn}
                  hitSlop={6}
                >
                  <Text style={styles.seeMoreText}>
                    Xem thêm {filteredUsers.length - displayLimit} nhân viên
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#64748B" />
                </Pressable>
              ) : displayLimit > 3 && filteredUsers.length > 3 ? (
                <Pressable onPress={() => setDisplayLimit(3)} style={styles.seeMoreBtn} hitSlop={6}>
                  <Text style={styles.seeMoreText}>Thu gọn danh sách</Text>
                  <Ionicons name="chevron-up" size={14} color="#64748B" />
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      {/* BOTTOM STICKY BAR: Count info + Green button [ Xuất báo cáo Excel ] */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bottomBarMeta}>{selectedUsers.length} nhân viên • Tệp .xlsx</Text>
        </View>
        <Pressable
          onPress={() => void handleExport()}
          disabled={exporting}
          style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Xuất báo cáo Excel</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* BOTTOM SHEET MODAL: CHỌN PHÒNG BAN */}
      <Modal visible={showDeptModal} transparent animationType="slide" onRequestClose={() => setShowDeptModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDeptModal(false)} />
          <View style={styles.bottomSheetDept}>
            <View style={styles.grabberHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Chọn phòng ban</Text>
                <Text style={styles.modalSubtitle}>Đã chọn {tempSelectedDepts.length}/{departments.length} phòng ban</Text>
              </View>
              <Pressable onPress={() => setShowDeptModal(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>

            {/* Search Dept */}
            <View style={[styles.searchBar, { marginBottom: 10 }]}>
              <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Tìm phòng ban"
                placeholderTextColor="#94A3B8"
                value={searchDeptModal}
                onChangeText={setSearchDeptModal}
                style={styles.searchInput}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Select All Toggle */}
            <Pressable onPress={toggleSelectAllTempDepts} style={styles.selectAllRow}>
              <View style={[styles.checkbox, tempSelectedDepts.length === departments.length && departments.length > 0 && styles.checkboxActive]}>
                {tempSelectedDepts.length === departments.length && departments.length > 0 && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.selectAllLabel}>Chọn tất cả phòng ban</Text>
            </Pressable>

            {/* Dept List */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {filteredDeptsModal.map(dept => {
                const isSelected = tempSelectedDepts.includes(dept.id);
                const locationName = dept.branch?.name || dept.branch?.region?.name || 'Văn phòng chính';

                return (
                  <Pressable
                    key={dept.id}
                    onPress={() => toggleTempDept(dept.id)}
                    style={styles.deptItemRow}
                    android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.deptItemName}>{dept.name}</Text>
                      <Text style={styles.deptItemLocation}>{locationName}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalFooterRow}>
              <Pressable onPress={() => setShowDeptModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </Pressable>
              <Pressable onPress={applyDepartmentSelection} style={styles.modalApplyBtn}>
                <Text style={styles.modalApplyText}>Áp dụng ({tempSelectedDepts.length})</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modals */}
      {showPickerFor === 'start' && (
        <CustomDatePickerModal
          visible={true}
          initialDate={startDate}
          onClose={() => setShowPickerFor(null)}
          onSelect={date => {
            setShowPickerFor(null);
            setStartDate(date);
            setDateMode('custom');
          }}
        />
      )}

      {showPickerFor === 'end' && (
        <CustomDatePickerModal
          visible={true}
          initialDate={endDate}
          onClose={() => setShowPickerFor(null)}
          onSelect={date => {
            setShowPickerFor(null);
            setEndDate(date);
            setDateMode('custom');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#132E22',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  dateModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateModeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModeBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  dateModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  dateModeTextActive: {
    color: '#166534',
    fontWeight: '800',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  dateBoxLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  dateBoxValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  scopeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  scopeValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  selectAllLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 10,
  },
  selectAllCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkboxActive: {
    backgroundColor: '#1B382B',
    borderColor: '#1B382B',
  },
  employeeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomBarMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  exportBtn: {
    backgroundColor: '#1B382B', // Deep forest green matching template
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal Department styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  bottomSheetDept: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  grabberHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  deptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  deptItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  deptItemLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalApplyBtn: {
    flex: 1.6,
    backgroundColor: '#1B382B',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
