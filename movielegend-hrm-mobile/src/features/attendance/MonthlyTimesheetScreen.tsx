import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from 'react-native-image-viewing';
import { useAuth } from '../../providers/AuthProvider';
import {
  getCompanyMonthlyTimesheet,
  getMyMonthlyTimesheet,
  MonthlyTimesheetDailyRecord,
  MonthlyTimesheetData,
  CompanyTimesheetEmployee,
  uploadTimesheetOfficialImage,
} from '../../api/attendance.api';
import { getDepartments } from '../../api/departments.api';
import type { Department } from '../../types/department.types';
import { uploadFile } from '../../api/uploads.api';
import { CustomAlert } from '../../components/CustomAlert';

function formatTimesheetTime(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh',
    });
  } catch {
    try {
      const d = new Date(isoString);
      const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
      const hours = String(vnTime.getUTCHours()).padStart(2, '0');
      const minutes = String(vnTime.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '--:--';
    }
  }
}

function getInitials(name?: string): string {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NV';
  const first = parts[0] || '';
  const last = parts[parts.length - 1] || '';
  if (parts.length === 1) return first.substring(0, 2).toUpperCase() || 'NV';
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'NV';
}

export function MonthlyTimesheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'MY' | 'COMPANY'>('MY');

  const [myTimesheet, setMyTimesheet] = useState<MonthlyTimesheetData | null>(null);
  const [companyTimesheet, setCompanyTimesheet] = useState<CompanyTimesheetEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

  const deptName = (
    user?.department?.name ||
    (user as any)?.departmentLinks?.[0]?.department?.name ||
    ''
  ).toLowerCase();
  const isAdmin = Boolean(
    user?.roles?.some((r) => String(r).toUpperCase().includes('ADMIN')) ||
      (user as any)?.role?.code === 'ADMIN'
  );
  const isLeader = Boolean(
    user?.roles?.some((r) => String(r).toUpperCase().includes('LEADER')) ||
      (user as any)?.role?.code === 'LEADER'
  );
  const isHRRole = Boolean(
    user?.roles?.some((r) => String(r).toUpperCase().includes('HR')) ||
      (user as any)?.role?.code === 'HR'
  );

  const isLeaderHR =
    isLeader &&
    (deptName.includes('nhân sự') || deptName.includes('hcns') || deptName.includes('hr'));
  const canViewCompany = isAdmin || isHRRole || isLeaderHR;
  const canUploadTimesheet = isLeaderHR;

  useEffect(() => {
    if (canViewCompany) {
      getDepartments()
        .then((res) => {
          setDepartments(res.items || []);
        })
        .catch(() => {});
    }
  }, [canViewCompany]);

  const fetchTimesheet = useCallback(async () => {
    try {
      if (activeTab === 'MY') {
        const data = await getMyMonthlyTimesheet({
          month: selectedMonth,
          year: selectedYear,
        });
        setMyTimesheet(data);
      } else {
        const data = await getCompanyMonthlyTimesheet({
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
        });
        setCompanyTimesheet(data.items || []);
      }
    } catch (err: any) {
      CustomAlert.alert('Thông báo', err.message || 'Không thể tải dữ liệu bảng công');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, activeTab, selectedDepartmentId, searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    fetchTimesheet();
  }, [fetchTimesheet]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTimesheet();
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const openViewer = (uri: string) => {
    setViewerImages([{ uri }]);
    setIsImageViewerVisible(true);
  };

  const doUploadTimesheetImage = async (
    uri: string,
    targetUserId?: string,
    targetUserName?: string
  ) => {
    try {
      setUploadingUserId(targetUserId || 'MY');
      const uploaded = await uploadFile({
        uri,
        name: `timesheet_${targetUserId || 'my'}_${selectedMonth}_${selectedYear}.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'ATTENDANCE',
      });
      await uploadTimesheetOfficialImage({
        userId: targetUserId,
        month: selectedMonth,
        year: selectedYear,
        imageUrl: uploaded.fileUrl || (uploaded as any).url,
      });
      CustomAlert.alert(
        'Thành công',
        `Đã lưu ảnh bảng công cho ${targetUserName || 'bạn'} thành công!`
      );
      fetchTimesheet();
    } catch (err: any) {
      CustomAlert.alert('Lỗi tải ảnh', err.message || 'Không thể tải lên ảnh bảng công');
    } finally {
      setUploadingUserId(null);
    }
  };

  const handleUploadUserTimesheetImage = (targetUserId?: string, targetUserName?: string) => {
    const isPersonal = !targetUserId || targetUserId === user?.id;
    const title = isPersonal ? 'Bảng công của bạn' : `Bảng công: ${targetUserName || 'Nhân sự'}`;
    CustomAlert.alert(title, 'Chọn phương thức tải ảnh chốt bảng công:', [
      {
        text: 'Chụp ảnh mới',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            CustomAlert.alert('Cần quyền', 'Vui lòng cho phép truy cập máy ảnh');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            await doUploadTimesheetImage(result.assets[0].uri, targetUserId, targetUserName);
          }
        },
      },
      {
        text: 'Chọn từ thư viện',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            CustomAlert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            await doUploadTimesheetImage(result.assets[0].uri, targetUserId, targetUserName);
          }
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };

  const selectedDeptLabel =
    departments.find((d) => d.id === selectedDepartmentId)?.name || 'Tất cả phòng ban';

  const renderDailyItem = ({ item }: { item: MonthlyTimesheetDailyRecord }) => {
    const isLate = item.lateMinutes > 0;
    const hasOt = item.otHours > 0;

    let badgeColor = '#16A34A';
    let badgeBg = '#DCFCE7';
    let badgeText = 'Đủ công';

    if (item.status === 'LEAVE') {
      badgeColor = '#2563EB';
      badgeBg = '#EFF6FF';
      badgeText = item.leaveTitle || 'Nghỉ phép';
    } else if (item.status === 'WEEKEND') {
      badgeColor = '#64748B';
      badgeBg = '#F1F5F9';
      badgeText = 'Cuối tuần';
    } else if (item.status === 'NO_RECORD' || item.status === 'MISSING') {
      badgeColor = '#EF4444';
      badgeBg = '#FEE2E2';
      badgeText = 'Vắng mặt';
    } else if (isLate) {
      badgeColor = '#D97706';
      badgeBg = '#FEF3C7';
      badgeText = `Muộn ${item.lateMinutes}p`;
    }

    const dayNum = item.date.slice(8, 10);
    const dayOfWeekShort = item.dayOfWeek.replace('Thứ ', 'T');
    const isSunday = item.isSunday;

    return (
      <View style={styles.dailyCard}>
        <View style={styles.dailyDateCol}>
          <Text style={[styles.dailyDayNum, isSunday && { color: '#EF4444' }]}>{dayNum}</Text>
          <Text style={[styles.dailyDayOfWeek, isSunday && { color: '#EF4444' }]}>
            {dayOfWeekShort}
          </Text>
        </View>

        <View style={styles.dailyInfoCol}>
          <Text style={styles.dailyShiftName}>{item.shiftName || 'Ca hành chính'}</Text>
          <Text style={styles.dailyTimeRow}>
            Vào {formatTimesheetTime(item.checkInAt)} • Ra {formatTimesheetTime(item.checkOutAt)}
            {hasOt ? ` • +${item.otHours}h OT` : ''}
          </Text>
        </View>

        <View style={[styles.dailyStatusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.dailyStatusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>
    );
  };

  const renderCompanyItem = ({ item }: { item: CompanyTimesheetEmployee }) => {
    const isThisUploading = uploadingUserId === item.userId;
    return (
      <View style={styles.companyCard}>
        <View style={styles.companyCardTop}>
          <View style={styles.companyAvatarBox}>
            <Text style={styles.companyAvatarText}>{getInitials(item.fullName)}</Text>
          </View>
          <View style={styles.companyMetaCol}>
            <Text style={styles.companyEmpName}>{item.fullName}</Text>
            <Text style={styles.companyEmpCode}>{item.userCode}</Text>
            <Text style={styles.companyEmpDept}>{item.departmentName}</Text>
          </View>
          <View style={styles.companyDaysCol}>
            <Text style={styles.companyDaysVal}>
              {item.actualWorkingDays}/{item.standardWorkingDays}
            </Text>
            <Text style={styles.companyDaysLabel}>Ngày công</Text>
          </View>
        </View>

        {/* Metrics Pill Row */}
        <View style={styles.companyMetricsPill}>
          <Text style={styles.companyMetricText}>OT {item.otHours}h</Text>
          <Text style={styles.companyMetricDivider}>|</Text>
          <Text style={styles.companyMetricText}>Phép {item.paidLeaveDays}p</Text>
          <Text style={styles.companyMetricDivider}>|</Text>
          <Text style={styles.companyMetricText}>Muộn {item.totalLateMinutes}p</Text>
        </View>

        {/* Bottom Image Row */}
        <View style={styles.companyImageRow}>
          {item.finalOfficialImageUrl ? (
            <Pressable
              style={styles.viewImagePressable}
              onPress={() => openViewer(item.finalOfficialImageUrl!)}
            >
              <MaterialCommunityIcons name="image-check-outline" size={17} color="#059669" />
              <Text style={styles.viewImageTextDone}>Xem ảnh bảng công</Text>
            </Pressable>
          ) : (
            <View style={styles.noImageInlineRow}>
              <MaterialCommunityIcons name="image-outline" size={17} color="#94A3B8" />
              <Text style={styles.noImageInlineText}>Chưa có ảnh bảng công</Text>
            </View>
          )}

          {canUploadTimesheet && (
            <Pressable
              style={styles.uploadImageInlineBtn}
              onPress={() => handleUploadUserTimesheetImage(item.userId, item.fullName)}
              disabled={isThisUploading}
            >
              {isThisUploading ? (
                <ActivityIndicator size="small" color="#1B3B2B" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-outline" size={15} color="#1B3B2B" />
                  <Text style={styles.uploadImageInlineBtnText}>
                    {item.finalOfficialImageUrl ? 'Đổi ảnh' : 'Tải ảnh'}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Top Header (#1B3B2B) ── */}
      <View style={[styles.modernHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.decorativeCurve} />

        <View style={styles.modernHeaderTopRow}>
          <Pressable
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.screenTitle}>Bảng công</Text>
        </View>

        {canViewCompany && (
          <View style={styles.tabsBar}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'MY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('MY')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'MY' && styles.tabBtnTextActive]}>
                Cá nhân
              </Text>
              {activeTab === 'MY' && <View style={styles.tabIndicator} />}
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'COMPANY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('COMPANY')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'COMPANY' && styles.tabBtnTextActive]}>
                Toàn công ty
              </Text>
              {activeTab === 'COMPANY' && <View style={styles.tabIndicator} />}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Month Selector Bar ── */}
      <View style={styles.monthSelectorBar}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrowBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={18} color="#64748B" />
        </Pressable>
        <Text style={styles.monthSelectorTitle}>
          Tháng {selectedMonth}, {selectedYear}
        </Text>
        <Pressable onPress={() => changeMonth(1)} style={styles.monthArrowBtn} hitSlop={8}>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1B3B2B" />
          <Text style={styles.loadingText}>Đang tải dữ liệu bảng công...</Text>
        </View>
      ) : activeTab === 'MY' ? (
        /* ═════════════════════════════════════════════════════════════
           TAB 01: CÔNG CÁ NHÂN
        ═════════════════════════════════════════════════════════════ */
        <FlatList
          data={myTimesheet?.dailyRecords || []}
          keyExtractor={(item) => item.date}
          renderItem={renderDailyItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1B3B2B"
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.personalHeaderSection}>
              {/* Card 1: Công ghi nhận */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTag}>CÔNG GHI NHẬN</Text>
                <View style={styles.mainDaysRow}>
                  <Text style={styles.actualDaysNum}>{myTimesheet?.actualWorkingDays || 0}</Text>
                  <Text style={styles.standardDaysNum}>
                    {' '}
                    / {myTimesheet?.standardWorkingDays || 26} ngày
                  </Text>
                </View>

                {/* 2 Stats row */}
                <View style={styles.hoursRow}>
                  <View style={styles.hoursCol}>
                    <Text style={styles.hoursVal}>{myTimesheet?.totalWorkedHours || 0} giờ</Text>
                    <Text style={styles.hoursLabel}>Tổng giờ làm</Text>
                  </View>
                  <View style={styles.hoursDivider} />
                  <View style={styles.hoursCol}>
                    <Text style={styles.hoursVal}>{myTimesheet?.otHours || 0} giờ</Text>
                    <Text style={styles.hoursLabel}>
                      Tăng ca • x{myTimesheet?.departmentOtMultiplier || 1.5}
                    </Text>
                  </View>
                </View>

                {/* 3 Pills Row */}
                <View style={styles.pillsRow}>
                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
                    ]}
                  >
                    <Text style={[styles.metricPillLabel, { color: '#166534' }]}>Nghỉ phép</Text>
                    <Text style={[styles.metricPillVal, { color: '#166534' }]}>
                      {myTimesheet?.paidLeaveDays || 0} ngày
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                    ]}
                  >
                    <Text style={[styles.metricPillLabel, { color: '#475569' }]}>Không lương</Text>
                    <Text style={[styles.metricPillVal, { color: '#475569' }]}>
                      {myTimesheet?.unpaidLeaveDays || 0} ngày
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricPill,
                      { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
                    ]}
                  >
                    <Text style={[styles.metricPillLabel, { color: '#B91C1C' }]}>Muộn / Sớm</Text>
                    <Text style={[styles.metricPillVal, { color: '#B91C1C' }]}>
                      {myTimesheet?.totalLateMinutes || 0} phút
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Bảng công HR */}
              <Pressable
                style={styles.officialTimesheetCard}
                onPress={() => {
                  if (myTimesheet?.finalOfficialImageUrl) {
                    openViewer(myTimesheet.finalOfficialImageUrl);
                  } else if (canUploadTimesheet) {
                    handleUploadUserTimesheetImage();
                  }
                }}
              >
                <View style={styles.officialIconBox}>
                  <MaterialCommunityIcons name="file-document-outline" size={22} color="#1B3B2B" />
                </View>
                <View style={styles.officialMetaCol}>
                  <Text style={styles.officialTitle}>Bảng công HR</Text>
                  <Text style={styles.officialSubtitle}>
                    Công thực nhận:{' '}
                    {myTimesheet?.officialWorkingDays !== undefined &&
                    myTimesheet?.officialWorkingDays !== null
                      ? myTimesheet.officialWorkingDays
                      : myTimesheet?.actualWorkingDays || 0}
                    /{myTimesheet?.standardWorkingDays || 26} ngày
                  </Text>
                </View>
                <View
                  style={[
                    styles.officialBadge,
                    {
                      backgroundColor: myTimesheet?.finalOfficialImageUrl
                        ? '#DCFCE7'
                        : '#FEF3C7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.officialBadgeText,
                      { color: myTimesheet?.finalOfficialImageUrl ? '#16A34A' : '#D97706' },
                    ]}
                  >
                    {myTimesheet?.finalOfficialImageUrl ? 'Đã có ảnh' : 'Chờ ảnh'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </Pressable>

              {/* Section: Nhật ký tháng */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitleText}>Nhật ký tháng</Text>
              </View>
            </View>
          }
        />
      ) : (
        /* ═════════════════════════════════════════════════════════════
           TAB 02: CÔNG CÔNG TY
        ═════════════════════════════════════════════════════════════ */
        <FlatList
          data={companyTimesheet}
          keyExtractor={(item) => item.userId}
          renderItem={renderCompanyItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1B3B2B"
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.companyHeaderSection}>
              {/* Search bar */}
              <View style={styles.searchBar}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#94A3B8"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm tên hoặc mã nhân viên"
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Department Dropdown Selector */}
              <Pressable
                style={styles.deptSelectorBox}
                onPress={() => setIsDeptModalVisible(true)}
              >
                <View style={styles.deptSelectorLeft}>
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color="#0F172A"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.deptSelectorText}>{selectedDeptLabel}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </Pressable>

              {/* Location Tag */}
              <View style={styles.locationTagRow}>
                <Ionicons
                  name="location-sharp"
                  size={12}
                  color="#64748B"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.locationTagText}>
                  MOVIELEGEND • {((user?.department as any)?.branch?.name || 'HÀ NỘI').toUpperCase()}
                </Text>
              </View>

              {/* Section: Nhân sự */}
              <Text style={styles.companySectionTitle}>Nhân sự</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitleText}>Không có dữ liệu nhân sự</Text>
              <Text style={styles.emptySubtitleText}>Không tìm thấy nhân viên phù hợp</Text>
            </View>
          }
        />
      )}

      {/* ── Department Picker Modal ── */}
      <Modal
        visible={isDeptModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDeptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn phòng ban</Text>
              <Pressable onPress={() => setIsDeptModalVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <Pressable
                style={[
                  styles.modalItemRow,
                  selectedDepartmentId === 'ALL' && styles.modalItemRowActive,
                ]}
                onPress={() => {
                  setSelectedDepartmentId('ALL');
                  setIsDeptModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedDepartmentId === 'ALL' && styles.modalItemTextActive,
                  ]}
                >
                  Tất cả phòng ban
                </Text>
                {selectedDepartmentId === 'ALL' && (
                  <Ionicons name="checkmark" size={18} color="#1B3B2B" />
                )}
              </Pressable>

              {departments.map((d) => (
                <Pressable
                  key={d.id}
                  style={[
                    styles.modalItemRow,
                    selectedDepartmentId === d.id && styles.modalItemRowActive,
                  ]}
                  onPress={() => {
                    setSelectedDepartmentId(d.id);
                    setIsDeptModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedDepartmentId === d.id && styles.modalItemTextActive,
                    ]}
                  >
                    {d.name}
                  </Text>
                  {selectedDepartmentId === d.id && (
                    <Ionicons name="checkmark" size={18} color="#1B3B2B" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Image Viewer ── */}
      {viewerImages.length > 0 ? (
        <ImageViewing
          images={viewerImages}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ── Header (#1B3B2B) ── */
  modernHeader: {
    backgroundColor: '#1B3B2B',
    paddingHorizontal: 16,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modernHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  /* ── Tabs Bar ── */
  tabsBar: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  /* ── Month Selector Bar ── */
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  monthArrowBtn: {
    padding: 4,
  },
  monthSelectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* ── Loading ── */
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },

  /* ── List Common ── */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  /* ── Tab 01: Công cá nhân ── */
  personalHeaderSection: {
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  mainDaysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 14,
  },
  actualDaysNum: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 50,
  },
  standardDaysNum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  hoursCol: {
    flex: 1,
  },
  hoursVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  hoursLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  hoursDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricPillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricPillVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  /* Official Timesheet Card */
  officialTimesheetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  officialIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  officialMetaCol: {
    flex: 1,
  },
  officialTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  officialSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  officialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  officialBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Section Title */
  sectionTitleRow: {
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Daily Card */
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  dailyDateCol: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dailyDayNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dailyDayOfWeek: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  dailyInfoCol: {
    flex: 1,
  },
  dailyShiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dailyTimeRow: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dailyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dailyStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Tab 02: Công công ty ── */
  companyHeaderSection: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  deptSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  deptSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deptSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  locationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  companySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },

  /* Company Employee Card */
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  companyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  companyMetaCol: {
    flex: 1,
  },
  companyEmpName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  companyEmpCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  companyEmpDept: {
    fontSize: 12,
    color: '#64748B',
  },
  companyDaysCol: {
    alignItems: 'flex-end',
  },
  companyDaysVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  companyDaysLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  companyMetricsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 6,
    marginVertical: 10,
  },
  companyMetricText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  companyMetricDivider: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  companyImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  viewImagePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewImageTextDone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  noImageInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noImageInlineText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  uploadImageInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  uploadImageInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B3B2B',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitleText: {
    fontSize: 12,
    color: '#64748B',
  },

  /* Modal Department */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalItemRowActive: {
    backgroundColor: '#F8FAFC',
  },
  modalItemText: {
    fontSize: 14,
    color: '#334155',
  },
  modalItemTextActive: {
    fontWeight: '700',
    color: '#1B3B2B',
  },
});
