import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { useAttendanceDashboardStats, useAttendanceReport } from '../../hooks/useAttendance';
import { getDepartments } from '../../api/departments.api';
import { deptOvertimeConfigApi, type DeptOvertimeConfig } from '../../api/dept-overtime-config.api';
import { CustomDatePickerModal } from '../../components/CustomDatePickerModal';
import { CustomAlert } from '../../components/CustomAlert';
import { useSnackbar } from '../../hooks/useSnackbar';
import { assertSocketUrl } from '../../constants/env';
import { formatDateYYYYMMDD, parseDateYYYYMMDD } from '../../utils/date-time';

function getAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${assertSocketUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Circular Progress Component matching the Hero Card design
function CircularProgressRing({ percentage, size = 64, strokeWidth = 6 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(Math.max(percentage, 0), 100)) / 100;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress active circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4ADE80" // Bright mint green
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject && { position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
}

// Avatar with fallback Initials matching the template
function UserInitialAvatar({ name, uri, size = 44 }: { name: string; uri?: string | null; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const absoluteUri = getAbsoluteImageUrl(uri);

  if (absoluteUri) {
    return (
      <Image
        source={{ uri: absoluteUri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9',
      }}
    >
      <Text style={{ color: '#1B382B', fontSize: Math.max(12, Math.floor(size * 0.36)), fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
}

export function AdminAttendanceScreen() {
  const router = useRouter();
  const segments = useSegments();
  const basePath = segments[0] === 'leader' ? '/leader' : segments[0] === 'hr' ? '/hr' : '/admin';
  const isLeader = segments[0] === 'leader';
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // Top level active tab: 'attendance' (Chấm công) | 'config' (Cấu hình)
  const [activeTab, setActiveTab] = useState<'attendance' | 'config'>('attendance');

  // --- TAB 1: ATTENDANCE STATE ---
  const [currentDate, setCurrentDate] = useState<string>(formatDateYYYYMMDD());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const dateObj = parseDateYYYYMMDD(currentDate);

  const statsQuery = useAttendanceDashboardStats({ fromDate: currentDate, toDate: currentDate });
  const reportQuery = useAttendanceReport({ fromDate: currentDate, toDate: currentDate, limit: 100 });

  const stats = statsQuery.data;
  const records = reportQuery.data?.items || [];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  // Filtered employees
  const filteredRecords = useMemo(() => {
    if (!searchEmployee.trim()) return records;
    const query = searchEmployee.trim().toLowerCase();
    return records.filter((rec: any) => {
      const user = rec.user;
      const name = (user?.profile?.fullName || '').toLowerCase();
      const code = (user?.userCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [records, searchEmployee]);

  // Derived metrics
  const totalEmployees = stats?.totalUsers ?? 37;
  const presentEmployees = stats?.present ?? 0;
  const onTimePercentage = presentEmployees > 0 ? Math.round(((stats?.onTime || 0) / presentEmployees) * 100) : 0;
  const lateEmployees = stats?.late ?? 0;
  const absentEmployees = stats?.absent ?? Math.max(0, totalEmployees - presentEmployees);
  const attendanceProgress = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;

  // Formatted date string in Vietnamese: "Thứ Tư, 07/10/2026"
  const formattedDatePill = useMemo(() => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = days[dateObj.getDay()];
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dayOfWeek}, ${dd}/${mm}/${yyyy}`;
  }, [dateObj]);

  // --- TAB 2: CONFIGURATION STEPPER STATE ---
  const [configStep, setConfigStep] = useState<1 | 2>(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [searchDept, setSearchDept] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Policy Form State
  const [configForm, setConfigForm] = useState({
    weekdayMultiplier: '1.5',
    weekendMultiplier: '2.0',
    holidayMultiplier: '3.0',
    nightStartHour: '21',
    nightAllowanceAmount: '50000',
    lateThresholdMinutes: '5',
    lateDeductionAmount: '50000',
  });

  // Load departments when switching to config or on mount
  const loadDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const response = await getDepartments();
      const items = response.items || [];
      setDepartments(items);
    } catch {
      // Ignore or notify
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'config') {
      void loadDepartments();
    }
  }, [activeTab, loadDepartments]);

  // Load config if 1 department selected
  useEffect(() => {
    if (selectedDeptIds.length === 1) {
      deptOvertimeConfigApi.findByDepartment(selectedDeptIds[0])
        .then((existing) => {
          if (existing) {
            setConfigForm({
              weekdayMultiplier: String(existing.weekdayMultiplier ?? 1.5),
              weekendMultiplier: String(existing.weekendMultiplier ?? 2.0),
              holidayMultiplier: String(existing.holidayMultiplier ?? 3.0),
              nightStartHour: String(existing.nightStartHour ?? 21),
              nightAllowanceAmount: String(existing.nightAllowanceAmount ?? 50000),
              lateThresholdMinutes: String(existing.lateThresholdMinutes ?? 5),
              lateDeductionAmount: String(existing.lateDeductionAmount ?? 50000),
            });
          }
        })
        .catch(() => {});
    }
  }, [selectedDeptIds]);

  const filteredDepartments = useMemo(() => {
    if (!searchDept.trim()) return departments;
    const q = searchDept.trim().toLowerCase();
    return departments.filter(d => (d.name || '').toLowerCase().includes(q));
  }, [departments, searchDept]);

  const toggleDept = (deptId: string) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDeptIds.length === departments.length) {
      setSelectedDeptIds([]);
    } else {
      setSelectedDeptIds(departments.map(d => d.id));
    }
  };

  const handleSaveConfig = async () => {
    if (selectedDeptIds.length === 0) {
      showSnackbar('Vui lòng chọn ít nhất 1 phòng ban', 'warning');
      return;
    }
    setSavingConfig(true);
    try {
      const payload: Partial<DeptOvertimeConfig> = {
        weekdayMultiplier: parseFloat(configForm.weekdayMultiplier) || 1.5,
        weekendMultiplier: parseFloat(configForm.weekendMultiplier) || 2.0,
        holidayMultiplier: parseFloat(configForm.holidayMultiplier) || 3.0,
        nightStartHour: parseInt(configForm.nightStartHour, 10) || 21,
        nightAllowanceAmount: parseInt(configForm.nightAllowanceAmount, 10) || 50000,
        lateThresholdMinutes: parseInt(configForm.lateThresholdMinutes, 10) || 5,
        lateDeductionAmount: parseInt(configForm.lateDeductionAmount, 10) || 50000,
        isActive: true,
      };

      await Promise.all(
        selectedDeptIds.map(deptId =>
          deptOvertimeConfigApi.upsert({ ...payload, departmentId: deptId })
        )
      );

      CustomAlert.alert('Thành công', `Đã lưu quy định chấm công cho ${selectedDeptIds.length} phòng ban.`);
      // Return to attendance tab or step 1
      setActiveTab('attendance');
      setConfigStep(1);
    } catch {
      CustomAlert.alert('Thất bại', 'Không thể lưu cấu hình quy định. Vui lòng thử lại.');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Brand: movielegend PEOPLE + Title + Date Pill) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandTitle}>movielegend</Text>
              <Text style={styles.brandSubtitle}>PEOPLE</Text>
            </View>
            <Text style={styles.screenTitle}>
              {isLeader ? 'Chấm công phòng ban' : 'Quản lý chấm công'}
            </Text>
          </View>

          {/* Date Picker Pill Trigger */}
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.datePill}
            android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
          >
            <Ionicons name="calendar-outline" size={14} color="#183B2B" style={{ marginRight: 6 }} />
            <Text style={styles.datePillText}>{formattedDatePill}</Text>
            <Ionicons name="chevron-down" size={13} color="#6B7280" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* 2. Segmented Switcher [Chấm công] vs [Cấu hình] */}
        <View style={styles.segmentContainer}>
          <Pressable
            onPress={() => setActiveTab('attendance')}
            style={[styles.segmentButton, activeTab === 'attendance' && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentButtonText, activeTab === 'attendance' && styles.segmentButtonTextActive]}>
              Chấm công
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActiveTab('config');
              setConfigStep(1);
            }}
            style={[styles.segmentButton, activeTab === 'config' && styles.segmentButtonActive]}
          >
            <Text style={[styles.segmentButtonText, activeTab === 'config' && styles.segmentButtonTextActive]}>
              Cấu hình
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <CustomDatePickerModal
          visible={showDatePicker}
          initialDate={dateObj}
          onClose={() => setShowDatePicker(false)}
          onSelect={(date) => {
            setShowDatePicker(false);
            setCurrentDate(formatDateYYYYMMDD(date));
          }}
        />
      )}

      {/* TAB 1: CHẤM CÔNG (Screen 1 in Template) */}
      {activeTab === 'attendance' && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor="#1A3B2F" />}
        >
          {/* Hero Card: Dark Forest Green */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>ĐỘI NGŨ HÔM NAY</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                <Text style={styles.heroMainCount}>{presentEmployees}</Text>
                <Text style={styles.heroTotalCount}> / {totalEmployees}</Text>
              </View>
              <Text style={styles.heroSubLabel}>nhân viên có mặt</Text>
            </View>

            {/* Circular Ring Progress */}
            <View style={styles.heroRingWrapper}>
              <CircularProgressRing percentage={attendanceProgress} size={64} strokeWidth={6} />
            </View>
          </View>

          {/* 3 Metric Mini Cards */}
          <View style={styles.statsRow}>
            {/* Card 1: Đúng giờ */}
            <View style={styles.statMiniCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statValue}>{onTimePercentage}%</Text>
                <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="time" size={16} color="#166534" />
                </View>
              </View>
              <Text style={styles.statLabel}>Đúng giờ</Text>
            </View>

            {/* Card 2: Đi muộn */}
            <View style={styles.statMiniCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statValue}>{lateEmployees}</Text>
                <View style={[styles.statIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="time-outline" size={16} color="#DC2626" />
                </View>
              </View>
              <Text style={styles.statLabel}>Đi muộn</Text>
            </View>

            {/* Card 3: Chưa có mặt */}
            <View style={styles.statMiniCard}>
              <View style={styles.statIconRow}>
                <Text style={styles.statValue}>{absentEmployees}</Text>
                <View style={[styles.statIconCircle, { backgroundColor: '#F3F4F6' }]}>
                  <Ionicons name="people-outline" size={16} color="#4B5563" />
                </View>
              </View>
              <Text style={styles.statLabel}>Chưa có mặt</Text>
            </View>
          </View>

          {/* Section: Danh sách nhân viên */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Danh sách nhân viên</Text>
            <Pressable
              onPress={() => router.push(`${basePath}/attendance/report` as any)}
              style={styles.exportBtn}
              hitSlop={8}
            >
              <Ionicons name="share-outline" size={20} color="#1B382B" />
            </Pressable>
          </View>

          {/* Search Bar: Tìm tên hoặc mã nhân viên */}
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Tìm tên hoặc mã nhân viên"
              placeholderTextColor="#9CA3AF"
              value={searchEmployee}
              onChangeText={setSearchEmployee}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {searchEmployee.length > 0 && (
              <Pressable onPress={() => setSearchEmployee('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Employee Records List */}
          {reportQuery.isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#1B382B" size="small" />
              <Text style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>Đang tải danh sách chấm công...</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có bản ghi nào</Text>
              <Text style={styles.emptySubtitle}>Dữ liệu chấm công của nhân viên hôm nay sẽ xuất hiện tại đây.</Text>
            </View>
          ) : (
            <View style={styles.employeeList}>
              {filteredRecords.map((record: any) => {
                const user = record.user;
                const name = user?.profile?.fullName || user?.userCode || 'Nhân viên';
                const userCode = user?.userCode || 'NV00000';
                const time = record.checkInAt
                  ? new Date(record.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                return (
                  <Pressable
                    key={record.id}
                    onPress={() => router.push(`${basePath}/attendance/${record.id}` as any)}
                    style={styles.employeeCard}
                    android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                  >
                    {/* User Avatar with Initials */}
                    <Pressable
                      onPress={() => {
                        if (record.photo?.fileUrl) {
                          setSelectedImage(getAbsoluteImageUrl(record.photo.fileUrl) || null);
                        }
                      }}
                    >
                      <UserInitialAvatar name={name} uri={record.photo?.fileUrl || user?.profile?.avatarUrl} size={44} />
                    </Pressable>

                    {/* Employee Info */}
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.employeeCode}>{userCode}</Text>
                    </View>

                    {/* Status Pill & Check-in Time */}
                    <View style={styles.employeeStatusCol}>
                      <View style={styles.presentBadge}>
                        <Text style={styles.presentBadgeText}>Có mặt</Text>
                      </View>
                      <Text style={styles.employeeTime}>{time}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 6 }} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 2: CẤU HÌNH CHẤM CÔNG (Screen 2 & Screen 3 in Template) */}
      {activeTab === 'config' && (
        <View style={{ flex: 1 }}>
          {/* Subheader: Cấu hình chấm công & Stepper Progress */}
          <View style={styles.configSubHeader}>
            {/* Stepper Progress Bar */}
            <View style={styles.stepperContainer}>
              {/* Step 1 Node */}
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, configStep >= 1 && styles.stepCircleActive]}>
                  {configStep > 1 ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumberActive}>1</Text>
                  )}
                </View>
                <Text style={[styles.stepText, configStep >= 1 && styles.stepTextActive]}>1. Phòng ban</Text>
              </View>

              {/* Connecting Line */}
              <View style={[styles.stepDivider, configStep === 2 && styles.stepDividerActive]} />

              {/* Step 2 Node */}
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, configStep === 2 && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, configStep === 2 && styles.stepNumberActive]}>2</Text>
                </View>
                <Text style={[styles.stepText, configStep === 2 && styles.stepTextActive]}>2. Quy định</Text>
              </View>
            </View>
          </View>

          {/* STEP 1: CHỌN PHÒNG BAN ÁP DỤNG */}
          {configStep === 1 && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.configScrollContent} showsVerticalScrollIndicator={false}>
                {/* Search Box */}
                <View style={styles.searchBarWrapper}>
                  <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    placeholder="Tìm phòng ban"
                    placeholderTextColor="#9CA3AF"
                    value={searchDept}
                    onChangeText={setSearchDept}
                    style={styles.searchInput}
                    clearButtonMode="while-editing"
                  />
                </View>

                {/* Subheader: Selected Count + Select All Action */}
                <View style={styles.deptControlRow}>
                  <Text style={styles.deptCountText}>Đã chọn {selectedDeptIds.length} phòng ban</Text>
                  <Pressable onPress={toggleSelectAll} hitSlop={8}>
                    <Text style={styles.selectAllText}>
                      {selectedDeptIds.length === departments.length && departments.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Text>
                  </Pressable>
                </View>

                {/* Department Checklist */}
                {loadingDepts ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator color="#1B382B" size="small" />
                    <Text style={{ marginTop: 8, fontSize: 13, color: '#6B7280' }}>Đang tải danh sách phòng ban...</Text>
                  </View>
                ) : filteredDepartments.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="business-outline" size={40} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>Không tìm thấy phòng ban</Text>
                  </View>
                ) : (
                  <View style={styles.deptListCard}>
                    {filteredDepartments.map((dept, index) => {
                      const isSelected = selectedDeptIds.includes(dept.id);
                      const isLast = index === filteredDepartments.length - 1;
                      const locationName = dept.branch?.name || dept.branch?.region?.name || 'Hà Nội';

                      return (
                        <Pressable
                          key={dept.id}
                          onPress={() => toggleDept(dept.id)}
                          style={[styles.deptItemRow, !isLast && styles.deptItemBorder]}
                          android_ripple={{ color: 'rgba(0,0,0,0.03)' }}
                        >
                          {/* Custom Checkbox */}
                          <View style={[styles.checkboxBox, isSelected && styles.checkboxBoxSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                          </View>

                          {/* Info */}
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.deptItemName}>{dept.name}</Text>
                            <Text style={styles.deptItemLocation}>{locationName}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>

              {/* Bottom Sticky Action Button */}
              <View style={styles.bottomBar}>
                <Pressable
                  onPress={() => {
                    if (selectedDeptIds.length === 0) {
                      showSnackbar('Vui lòng chọn ít nhất 1 phòng ban để tiếp tục', 'warning');
                      return;
                    }
                    setConfigStep(2);
                  }}
                  style={styles.ctaPrimaryBtn}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  <Text style={styles.ctaPrimaryBtnText}>Tiếp tục  →</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 2: THIẾT LẬP QUY ĐỊNH */}
          {configStep === 2 && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.configScrollContent} showsVerticalScrollIndicator={false}>
                {/* Back to Step 1 pill */}
                <Pressable onPress={() => setConfigStep(1)} style={styles.backStepRow}>
                  <Ionicons name="arrow-back" size={16} color="#1B382B" />
                  <Text style={styles.backStepText}>Quay lại chọn phòng ban</Text>
                </Pressable>

                {/* Info Banner: Áp dụng cho X phòng ban */}
                <View style={styles.infoBanner}>
                  <Ionicons name="people" size={16} color="#166534" />
                  <Text style={styles.infoBannerText}>Áp dụng cho {selectedDeptIds.length} phòng ban đã chọn</Text>
                </View>

                {/* Section 1: Tăng ca & ngoài giờ */}
                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>TĂNG CA & NGOÀI GIỜ</Text>

                  {/* Field: Ngày thường */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Ngày thường</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.weekdayMultiplier}
                        onChangeText={t => setConfigForm(f => ({ ...f, weekdayMultiplier: t }))}
                        keyboardType="decimal-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>x</Text>
                    </View>
                  </View>

                  {/* Field: Cuối tuần */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Cuối tuần</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.weekendMultiplier}
                        onChangeText={t => setConfigForm(f => ({ ...f, weekendMultiplier: t }))}
                        keyboardType="decimal-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>x</Text>
                    </View>
                  </View>

                  {/* Field: Lễ / Tết */}
                  <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.fieldLabel}>Lễ / Tết</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.holidayMultiplier}
                        onChangeText={t => setConfigForm(f => ({ ...f, holidayMultiplier: t }))}
                        keyboardType="decimal-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>x</Text>
                    </View>
                  </View>
                </View>

                {/* Section 2: Làm đêm */}
                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>LÀM ĐÊM</Text>

                  {/* Field: Bắt đầu từ */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Bắt đầu từ</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.nightStartHour}
                        onChangeText={t => setConfigForm(f => ({ ...f, nightStartHour: t }))}
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>:00</Text>
                    </View>
                  </View>

                  {/* Field: Phụ cấp */}
                  <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.fieldLabel}>Phụ cấp</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.nightAllowanceAmount}
                        onChangeText={t => setConfigForm(f => ({ ...f, nightAllowanceAmount: t }))}
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>đ</Text>
                    </View>
                  </View>
                </View>

                {/* Section 3: Đi muộn */}
                <View style={styles.ruleCard}>
                  <Text style={styles.ruleCardTitle}>ĐI MUỘN</Text>

                  {/* Field: Châm chước */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Châm chước</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.lateThresholdMinutes}
                        onChangeText={t => setConfigForm(f => ({ ...f, lateThresholdMinutes: t }))}
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>phút</Text>
                    </View>
                  </View>

                  {/* Field: Khấu trừ */}
                  <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.fieldLabel}>Khấu trừ</Text>
                    <View style={styles.fieldInputSuffixWrapper}>
                      <TextInput
                        value={configForm.lateDeductionAmount}
                        onChangeText={t => setConfigForm(f => ({ ...f, lateDeductionAmount: t }))}
                        keyboardType="number-pad"
                        style={styles.fieldInput}
                      />
                      <Text style={styles.fieldSuffix}>đ</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Sticky Action Button */}
              <View style={styles.bottomBar}>
                <Pressable
                  onPress={() => void handleSaveConfig()}
                  disabled={savingConfig}
                  style={[styles.ctaPrimaryBtn, savingConfig && { opacity: 0.7 }]}
                  android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
                >
                  {savingConfig ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.ctaPrimaryBtnText}>Lưu cấu hình</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.imageModalOverlay}>
            <Pressable style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <Image source={{ uri: selectedImage }} style={styles.imageModalPreview} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#F8FAF8',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#132E22',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 1.5,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginTop: 4,
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B382B',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEFEA',
    borderRadius: 14,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#1B382B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#1B382B', // Deep forest green
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroContent: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
  },
  heroMainCount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  heroTotalCount: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  heroSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroRingWrapper: {
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  exportBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EAEFEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  employeeList: {
    gap: 10,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  employeeCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  employeeStatusCol: {
    alignItems: 'flex-end',
    marginRight: 4,
  },
  presentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  presentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  employeeTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  imageModalPreview: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },

  // --- CONFIGURATION STYLES ---
  configSubHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAF8',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1B382B',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTextActive: {
    color: '#1B382B',
    fontWeight: '700',
  },
  stepDivider: {
    width: 32,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  stepDividerActive: {
    backgroundColor: '#1B382B',
  },
  configScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 100,
  },
  deptControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  deptCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  deptListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  deptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  deptItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxSelected: {
    backgroundColor: '#1B382B',
    borderColor: '#1B382B',
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
  },
  ctaPrimaryBtn: {
    backgroundColor: '#1B382B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B382B',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  ruleCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldInputSuffixWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 80,
    justifyContent: 'flex-end',
  },
  fieldInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    padding: 0,
    minWidth: 32,
  },
  fieldSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
});
