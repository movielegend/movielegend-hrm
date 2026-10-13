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
import ImageView from '../../components/ImageViewer/ImageViewer';
import { useAuth } from '../../providers/AuthProvider';
import {
  getMyPayslip,
  getCompanyMonthlyPayslips,
  MonthlyPayslipData,
  CompanyPayslipEmployee,
  uploadPayslipOfficialImage,
} from '../../api/payroll.api';
import { getDepartments } from '../../api/departments.api';
import type { Department } from '../../types/department.types';
import { uploadFile } from '../../api/uploads.api';
import { CustomAlert } from '../../components/CustomAlert';
import { DepartmentBatchUploadModal } from './components/DepartmentBatchUploadModal';
import { DepartmentLabelingModal } from './components/DepartmentLabelingModal';
import { SalaryAdvanceModal } from './components/SalaryAdvanceModal';
import { resolveFileUrl } from '../../utils/url';

function formatVnd(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0 đ';
  return `${val.toLocaleString('vi-VN')} đ`;
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

export function EmployeePayslipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'MY' | 'COMPANY'>('MY');

  const [payslip, setPayslip] = useState<MonthlyPayslipData | null>(null);
  const [companyPayslips, setCompanyPayslips] = useState<CompanyPayslipEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [isLabelingModalOpen, setIsLabelingModalOpen] = useState(false);
  const [labelingDeptId, setLabelingDeptId] = useState<string | undefined>(undefined);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

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
  const isAccountantRole = Boolean(
    user?.roles?.some((r) => String(r).toUpperCase().includes('ACCOUNTANT')) ||
      (user as any)?.role?.code === 'ACCOUNTANT'
  );

  const isLeaderAccountant =
    isLeader &&
    (deptName.includes('kế toán') ||
      deptName.includes('tài chính') ||
      deptName.includes('accountant'));

  const canViewCompany = isAdmin || isAccountantRole || isLeaderAccountant;
  const canUploadPayslip = isLeaderAccountant;

  useEffect(() => {
    if (canViewCompany) {
      getDepartments()
        .then((res) => setDepartments(res.items || []))
        .catch(() => {});
    }
  }, [canViewCompany]);

  const fetchPayslip = useCallback(async () => {
    try {
      if (activeTab === 'MY') {
        const data = await getMyPayslip({
          month: selectedMonth,
          year: selectedYear,
        });
        setPayslip(data);
      } else {
        const data = await getCompanyMonthlyPayslips({
          month: selectedMonth,
          year: selectedYear,
          departmentId: selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined,
          search: searchQuery.trim() ? searchQuery.trim() : undefined,
        });
        setCompanyPayslips(data.items || []);
      }
    } catch (err: any) {
      CustomAlert.alert('Thông báo', err.message || 'Không thể tải dữ liệu phiếu lương');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, activeTab, selectedDepartmentId, searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    fetchPayslip();
  }, [fetchPayslip]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayslip();
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
    const fullUrl = resolveFileUrl(uri) || uri;
    setViewerImages([{ uri: fullUrl }]);
    setIsImageViewerVisible(true);
  };

  const doUploadPayslipImage = async (
    uri: string,
    targetUserId?: string,
    targetUserName?: string
  ) => {
    try {
      setUploadingUserId(targetUserId || 'MY');
      const uploaded = await uploadFile({
        uri,
        name: `payslip_${targetUserId || 'my'}_${selectedMonth}_${selectedYear}.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'EMPLOYEE_DOCUMENT',
      });
      await uploadPayslipOfficialImage({
        userId: targetUserId,
        month: selectedMonth,
        year: selectedYear,
        imageUrl: uploaded.fileUrl || (uploaded as any).url,
      });
      CustomAlert.alert(
        'Thành công',
        `Đã lưu ảnh phiếu lương cho ${targetUserName || 'bạn'} thành công!`
      );
      fetchPayslip();
    } catch (err: any) {
      CustomAlert.alert('Lỗi tải ảnh', err.message || 'Không thể tải lên ảnh phiếu lương chốt');
    } finally {
      setUploadingUserId(null);
    }
  };

  const handleUploadUserPayslipImage = (targetUserId?: string, targetUserName?: string) => {
    const isPersonal = !targetUserId || targetUserId === user?.id;
    const title = isPersonal ? 'Phiếu lương của bạn' : `Phiếu lương: ${targetUserName || 'Nhân sự'}`;
    CustomAlert.alert(title, 'Chọn phương thức tải ảnh chốt phiếu lương từ Leader Kế toán:', [
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
            await doUploadPayslipImage(result.assets[0].uri, targetUserId, targetUserName);
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
            await doUploadPayslipImage(result.assets[0].uri, targetUserId, targetUserName);
          }
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ]);
  };

  const selectedDeptLabel =
    departments.find((d) => d.id === selectedDepartmentId)?.name || 'Tất cả phòng ban';

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("vi-VN").format(val || 0) + " đ";
  };

  const netSalaryAmount = payslip?.netSalary ?? 0;
  const isDataAvailable = netSalaryAmount > 0 || Boolean(payslip?.finalOfficialImageUrl);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Top Header (#102739) ── */}
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
          <Text style={[styles.screenTitle, { flex: 1 }]}>Phiếu lương</Text>

          <View style={styles.topBarActions}>
            {/* Nút cho Kế toán: Tải lô ảnh */}
            {canViewCompany && (
              <Pressable
                style={styles.batchUploadTopBtn}
                onPress={() => setIsBatchUploadModalOpen(true)}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="folder-upload" size={15} color="#059669" />
                <Text style={styles.batchUploadTopBtnText}>Tải lô ảnh</Text>
              </Pressable>
            )}

            {/* Nút Gán nhãn cho Leader phòng ban hoặc Kế toán */}
            {(isLeader || canViewCompany) && (
              <Pressable
                style={styles.labelingTopBtn}
                onPress={() => {
                  setLabelingDeptId(selectedDepartmentId !== "ALL" ? selectedDepartmentId : undefined);
                  setIsLabelingModalOpen(true);
                }}
                hitSlop={6}
              >
                <MaterialCommunityIcons name="label-multiple" size={15} color="#FFFFFF" />
                <Text style={styles.labelingTopBtnText}>Gán nhãn phòng</Text>
              </Pressable>
            )}
          </View>
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
          <ActivityIndicator size="large" color="#102739" />
          <Text style={styles.loadingText}>Đang tải dữ liệu phiếu lương...</Text>
        </View>
      ) : activeTab === 'MY' ? (
        /* ═════════════════════════════════════════════════════════════
           TAB 03: LƯƠNG CÁ NHÂN
        ═════════════════════════════════════════════════════════════ */
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#102739"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Thực lĩnh */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTag}>THỰC LĨNH</Text>
            <Text style={styles.netSalaryText}>{formatVnd(netSalaryAmount)}</Text>

            {/* Status dot */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isDataAvailable ? '#16A34A' : '#F59E0B' },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isDataAvailable ? '#16A34A' : '#D97706' },
                ]}
              >
                {isDataAvailable ? 'Đã có dữ liệu chốt' : 'Chưa có dữ liệu'}
              </Text>
            </View>

            {/* Employee info line */}
            <View style={styles.employeeMetaBox}>
              <Text style={styles.empMainName}>
                {user?.fullName || 'Admin Movie Legend'}
              </Text>
              <Text style={styles.empSubCode}>
                {user?.userCode || 'NV000001'} • Ngày công{' '}
                {payslip?.actualWorkingDays || 0}/
                {payslip?.standardWorkingDays || 26}
              </Text>
            </View>
          </View>

          {/* Card 2: Phiếu lương chính thức */}
          <Pressable
            style={styles.officialCard}
            onPress={() => {
              if (payslip?.finalOfficialImageUrl) {
                openViewer(payslip.finalOfficialImageUrl);
              } else if (canUploadPayslip) {
                handleUploadUserPayslipImage();
              }
            }}
          >
            <View style={styles.officialIconBox}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#102739" />
            </View>
            <View style={styles.officialMetaCol}>
              <Text style={styles.officialTitle}>Phiếu lương chính thức</Text>
              <Text style={styles.officialSubtitle}>
                {payslip?.finalOfficialImageUrl
                  ? "Đã có ảnh phiếu lương"
                  : "Chờ ảnh từ Kế toán"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </Pressable>

          {/* Salary Advance (Tạm Ứng Lương) Hero Feature Card */}
          <View style={styles.advanceCard}>
            <View style={styles.advanceCardHeader}>
              <View style={styles.advanceIconCircle}>
                <MaterialCommunityIcons name="cash-fast" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.advanceTitleRow}>
                  <Text style={styles.advanceTitle}>Tạm Ứng Lương</Text>
                  <View style={styles.advanceLimitPill}>
                    <Text style={styles.advanceLimitPillText}>Tối đa 50% lương</Text>
                  </View>
                </View>
                <Text style={styles.advanceSubTitle}>
                  Leader duyệt ➔ Kế toán trưởng duyệt & đi lương
                </Text>
              </View>
            </View>

            {/* Metrics summary */}
            <View style={styles.advanceMetricsRow}>
              <View style={styles.advanceMetricItem}>
                <Text style={styles.advanceMetricLabel}>Hạn mức 50%</Text>
                <Text style={styles.advanceMetricVal}>
                  {formatCurrency(payslip?.advanceSummary?.maxAdvanceLimit ?? (payslip?.baseSalary || 0) * 0.5)}
                </Text>
              </View>
              <View style={styles.advanceMetricDivider} />
              <View style={styles.advanceMetricItem}>
                <Text style={styles.advanceMetricLabel}>Đã tạm ứng</Text>
                <Text style={[styles.advanceMetricVal, { color: '#D97706' }]}>
                  {formatCurrency(payslip?.advanceSummary?.currentMonthAdvancedAmount ?? payslip?.advanceAmount ?? 0)}
                </Text>
              </View>
              <View style={styles.advanceMetricDivider} />
              <View style={styles.advanceMetricItem}>
                <Text style={styles.advanceMetricLabel}>Khả dụng còn lại</Text>
                <Text style={[styles.advanceMetricVal, { color: '#059669', fontWeight: '800' }]}>
                  {formatCurrency(payslip?.advanceSummary?.remainingAdvanceLimit ?? ((payslip?.baseSalary || 0) * 0.5))}
                </Text>
              </View>
            </View>

            {/* Advance Request Action Button */}
            <Pressable
              style={styles.advanceActionBtn}
              onPress={() => setIsAdvanceModalOpen(true)}
            >
              <MaterialCommunityIcons name="plus-circle" size={18} color="#FFFFFF" />
              <Text style={styles.advanceActionBtnText}>Đề xuất tạm ứng lương</Text>
            </Pressable>

            {/* Advance Requests List (History in month) */}
            {payslip?.advanceSummary?.requests && payslip.advanceSummary.requests.length > 0 && (
              <View style={styles.advanceHistoryWrap}>
                <Text style={styles.advanceHistoryTitle}>Đơn tạm ứng trong tháng ({payslip.advanceSummary.requests.length}):</Text>
                {payslip.advanceSummary.requests.map((req) => {
                  const isDisbursed = req.status === 'APPROVED' || req.stage === 'DISBURSED';
                  const isPendingAccountant = req.stage === 'PENDING_ACCOUNTANT';
                  const isPendingLeader = req.stage === 'PENDING_LEADER' || (!req.stage && req.status === 'PENDING');
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <View key={req.id} style={styles.advanceReqItem}>
                      <View style={styles.advanceReqHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.advanceReqTitle}>{req.title}</Text>
                          <Text style={styles.advanceReqTime}>
                            {new Date(req.createdAt).toLocaleDateString('vi-VN')} • {req.content}
                          </Text>
                        </View>
                        <Text style={styles.advanceReqAmount}>{formatCurrency(req.amount)}</Text>
                      </View>

                      {/* Status Badge & 3-Step Timeline */}
                      <View style={styles.advanceReqStatusRow}>
                        <View
                          style={[
                            styles.advanceStatusBadge,
                            isDisbursed && styles.advanceStatusDisbursed,
                            isPendingAccountant && styles.advanceStatusAcc,
                            isPendingLeader && styles.advanceStatusLeader,
                            isRejected && styles.advanceStatusRejected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.advanceStatusBadgeText,
                              isDisbursed && styles.advanceStatusDisbursedText,
                              isPendingAccountant && styles.advanceStatusAccText,
                              isPendingLeader && styles.advanceStatusLeaderText,
                              isRejected && styles.advanceStatusRejectedText,
                            ]}
                          >
                            {isDisbursed
                              ? 'Đã đi lương (Giải ngân) 💸'
                              : isPendingAccountant
                              ? 'Leader đã duyệt • Chờ Kế toán trưởng chi'
                              : isPendingLeader
                              ? 'Chờ Leader duyệt'
                              : 'Đã từ chối'}
                          </Text>
                        </View>

                        {/* Bill image if disbursed */}
                        {req.disbursementProofUrl && (
                          <Pressable
                            style={styles.proofBtn}
                            onPress={() => openViewer(req.disbursementProofUrl!)}
                          >
                            <MaterialCommunityIcons name="receipt" size={14} color="#059669" />
                            <Text style={styles.proofBtnText}>Xem ủy nhiệm chi</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section: Chi tiết thu nhập */}
          <Text style={styles.sectionHeaderTitle}>Chi tiết thu nhập</Text>

          <View style={styles.detailTableCard}>
            {/* Group: Thu nhập */}
            <Text style={styles.tableGroupTitle}>Thu nhập</Text>
            <View style={styles.tableRow}>
              <Text style={styles.tableRowLabel}>Lương cơ bản</Text>
              <Text style={styles.tableRowVal}>{formatVnd(payslip?.baseSalary)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableRowLabel}>Lương theo ngày công</Text>
              <Text style={styles.tableRowVal}>
                {formatVnd(payslip?.actualSalary)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableRowLabel}>Phụ cấp</Text>
              <Text style={styles.tableRowVal}>
                {formatVnd(payslip?.allowanceAmount)}
              </Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableTotalRow}>
              <Text style={styles.tableTotalLabel}>Tổng thu nhập</Text>
              <Text style={styles.tableTotalVal}>
                {formatVnd(payslip?.grossSalary)}
              </Text>
            </View>

            {/* Group: Giảm trừ */}
            <Text style={[styles.tableGroupTitle, { marginTop: 18 }]}>Giảm trừ</Text>
            <View style={styles.tableRow}>
              <View>
                <Text style={styles.tableRowLabel}>Bảo hiểm</Text>
                <Text style={styles.tableRowSubLabel}>BHXH, BHYT, BHTN</Text>
              </View>
              <Text style={styles.tableRowVal}>
                {formatVnd(payslip?.insuranceAmount)}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableRowLabel}>Thuế TNCN</Text>
              <Text style={styles.tableRowVal}>{formatVnd(payslip?.taxAmount)}</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableTotalRow}>
              <Text style={styles.tableTotalLabel}>Tổng khấu trừ</Text>
              <Text style={styles.tableTotalVal}>
                {formatVnd(payslip?.deductionAmount)}
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ═════════════════════════════════════════════════════════════
           TAB 04: LƯƠNG CÔNG TY
        ═════════════════════════════════════════════════════════════ */
        <FlatList
          data={companyPayslips}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#102739"
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
          renderItem={({ item }) => {
            const isThisUploading = uploadingUserId === item.userId;
            const isComputed = item.netSalary !== null && item.netSalary !== undefined && item.netSalary > 0;

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
                  <View style={styles.rolePill}>
                    <Text style={styles.rolePillText}>Nhân viên</Text>
                  </View>
                </View>

                {/* Salary & Days Row */}
                <View style={styles.companySalaryGrid}>
                  <View style={styles.salaryGridCol}>
                    <Text style={styles.salaryGridLabel}>Thực lĩnh</Text>
                    <Text
                      style={[
                        styles.salaryGridVal,
                        isComputed ? styles.salaryGridValActive : styles.salaryGridValPending,
                      ]}
                    >
                      {isComputed ? formatVnd(item.netSalary) : 'Chưa tính'}
                    </Text>
                  </View>
                  <View style={[styles.salaryGridCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.salaryGridLabel}>Ngày công</Text>
                    <Text style={styles.daysGridVal}>
                      {item.actualWorkingDays}/{item.standardWorkingDays}
                    </Text>
                  </View>
                </View>

                {/* Image status row */}
                <View style={styles.companyImageRow}>
                  {item.finalOfficialImageUrl ? (
                    <Pressable
                      style={styles.viewImagePressable}
                      onPress={() => openViewer(item.finalOfficialImageUrl!)}
                    >
                      <MaterialCommunityIcons name="image-check-outline" size={17} color="#059669" />
                      <Text style={styles.viewImageTextDone}>Xem ảnh phiếu lương</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.noImageInlineRow}>
                      <MaterialCommunityIcons name="image-outline" size={17} color="#94A3B8" />
                      <Text style={styles.noImageInlineText}>Chưa có ảnh phiếu lương</Text>
                    </View>
                  )}

                  {canUploadPayslip && (
                    <Pressable
                      style={styles.uploadImageInlineBtn}
                      onPress={() => handleUploadUserPayslipImage(item.userId, item.fullName)}
                      disabled={isThisUploading}
                    >
                      {isThisUploading ? (
                        <ActivityIndicator size="small" color="#102739" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="camera-outline" size={15} color="#102739" />
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
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cash-multiple" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitleText}>Không có dữ liệu phiếu lương</Text>
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
                  <Ionicons name="checkmark" size={18} color="#102739" />
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
                    <Ionicons name="checkmark" size={18} color="#102739" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen Image Viewer ── */}
      {viewerImages.length > 0 ? (
        <ImageView
          images={viewerImages}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
        />
      ) : null}

      {/* Department Batch Upload Modal (Kế toán tải lô ảnh) */}
      <DepartmentBatchUploadModal
        visible={isBatchUploadModalOpen}
        onClose={() => setIsBatchUploadModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        departments={departments}
        onSuccess={() => {
          fetchPayslip();
        }}
      />

      {/* Department Labeling Modal (Leader gán nhãn cho nhân sự) */}
      <DepartmentLabelingModal
        visible={isLabelingModalOpen}
        onClose={() => setIsLabelingModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        departmentId={labelingDeptId || (selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined)}
        onAssigned={() => {
          fetchPayslip();
        }}
      />

      {/* Salary Advance Modal (Nhân viên đề xuất tạm ứng lương max 50%) */}
      <SalaryAdvanceModal
        visible={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        baseSalary={payslip?.advanceSummary?.baseSalary || payslip?.baseSalary || 0}
        maxAdvanceLimit={payslip?.advanceSummary?.maxAdvanceLimit ?? (payslip?.baseSalary || 0) * 0.5}
        currentMonthAdvancedAmount={payslip?.advanceSummary?.currentMonthAdvancedAmount ?? payslip?.advanceAmount ?? 0}
        remainingAdvanceLimit={payslip?.advanceSummary?.remainingAdvanceLimit ?? ((payslip?.baseSalary || 0) * 0.5)}
        onSuccess={() => {
          fetchPayslip();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ── Header (#102739) ── */
  modernHeader: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    display: 'none',
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
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batchUploadTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  batchUploadTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  labelingTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  labelingTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
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

  /* ── Content ── */
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },

  /* ── Tab 03: Lương cá nhân ── */
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
  netSalaryText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  employeeMetaBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  empMainName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  empSubCode: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Official Payslip Card */
  officialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
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

  /* Section Title */
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },

  /* Detail Table Card */
  detailTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  tableGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  tableRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  tableRowSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  tableRowVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
  tableTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  tableTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ── Tab 04: Lương công ty ── */
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
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#102739',
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
  rolePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  companySalaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  salaryGridCol: {
    flex: 1,
  },
  salaryGridLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  salaryGridVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  salaryGridValPending: {
    color: '#D97706',
  },
  salaryGridValActive: {
    color: '#0F172A',
  },
  daysGridVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
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
    backgroundColor: '#E7F0F7',
  },
  uploadImageInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#102739',
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
    color: '#102739',
  },

  // Salary Advance Styles
  advanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  advanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  advanceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advanceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  advanceLimitPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  advanceLimitPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  advanceSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  advanceMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  advanceMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  advanceMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  advanceMetricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  advanceMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  advanceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  advanceActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  advanceHistoryWrap: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  advanceHistoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  advanceReqItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  advanceReqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  advanceReqTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  advanceReqTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  advanceReqAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  advanceReqStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  advanceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  advanceStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  advanceStatusLeader: {
    backgroundColor: '#FEF3C7',
  },
  advanceStatusLeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  advanceStatusAcc: {
    backgroundColor: '#EFF6FF',
  },
  advanceStatusAccText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  advanceStatusDisbursed: {
    backgroundColor: '#ECFDF5',
  },
  advanceStatusDisbursedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  advanceStatusRejected: {
    backgroundColor: '#FEF2F2',
  },
  advanceStatusRejectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  proofBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
});
