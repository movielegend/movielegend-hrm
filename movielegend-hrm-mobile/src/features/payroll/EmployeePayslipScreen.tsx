import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  submitPayslipFeedback,
  notifyLeaderPayslipDispute,
  getDepartmentPayslipBatch,
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

  // Feedback / Khiếu nại của User (Tab MY)
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Kế toán trưởng giải quyết khiếu nại (Tab COMPANY)
  const [selectedDisputeEmp, setSelectedDisputeEmp] = useState<CompanyPayslipEmployee | null>(null);
  const [isDisputeResolutionModalOpen, setIsDisputeResolutionModalOpen] = useState(false);
  const [leaderNote, setLeaderNote] = useState('');
  const [isForwardingToLeader, setIsForwardingToLeader] = useState(false);
  const [isReplacingDisputeImage, setIsReplacingDisputeImage] = useState(false);
  const [disputeOnlyFilter, setDisputeOnlyFilter] = useState(false);

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
        const items = data.items || [];

        // Đồng bộ dữ liệu khiếu nại từ các lô ảnh phòng ban (như trên Web)
        let curDepts = departments;
        if (!curDepts || curDepts.length === 0) {
          try {
            const dRes = await getDepartments();
            curDepts = dRes.items || [];
            setDepartments(curDepts);
          } catch (e) {}
        }

        const targetDeptIds =
          selectedDepartmentId !== 'ALL'
            ? [selectedDepartmentId]
            : (curDepts || []).map((d) => d.id);

        const disputeMap = new Map<
          string,
          { status: string; note?: string | null; at?: string | null }
        >();

        if (targetDeptIds.length > 0) {
          try {
            const batches = await Promise.all(
              targetDeptIds.map((dId) =>
                getDepartmentPayslipBatch({
                  departmentId: dId,
                  month: selectedMonth,
                  year: selectedYear,
                }).catch(() => null)
              )
            );

            batches.forEach((b) => {
              if (!b?.employees) return;
              b.employees.forEach((emp) => {
                if (emp.feedbackStatus === 'REJECTED' || emp.isDisputed) {
                  disputeMap.set(emp.userId, {
                    status: 'REJECTED',
                    note: emp.feedbackNote || '',
                    at: emp.feedbackAt || null,
                  });
                } else if (emp.feedbackStatus === 'CONFIRMED') {
                  disputeMap.set(emp.userId, {
                    status: 'CONFIRMED',
                    note: emp.feedbackNote || '',
                    at: emp.feedbackAt || null,
                  });
                }
              });
            });
          } catch (batchErr) {
            console.warn('Lỗi tải danh sách khiếu nại phòng ban:', batchErr);
          }
        }

        const enrichedItems = items.map((emp) => {
          const dInfo = disputeMap.get(emp.userId);
          if (dInfo) {
            return {
              ...emp,
              feedbackStatus: dInfo.status,
              employeeFeedbackStatus: dInfo.status,
              feedbackNote: dInfo.note,
              employeeFeedbackNote: dInfo.note,
              feedbackAt: dInfo.at,
              employeeFeedbackAt: dInfo.at,
              isDisputed: dInfo.status === 'REJECTED',
            };
          }
          return emp;
        });

        setCompanyPayslips(enrichedItems);
      }
    } catch (err: any) {
      CustomAlert.alert('Thông báo', err.message || 'Không thể tải dữ liệu phiếu lương');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear, activeTab, selectedDepartmentId, searchQuery, departments]);

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

  // --- Handlers xác nhận & khiếu nại (User) ---
  const handleConfirmPayslip = async () => {
    try {
      setIsSubmittingFeedback(true);
      await submitPayslipFeedback({
        action: 'CONFIRM',
        payrollId: payslip?.id,
        month: selectedMonth,
        year: selectedYear,
      });
      CustomAlert.alert('Thành công ✓', 'Bạn đã xác nhận nhận phiếu lương thành công!');
      setIsDisputeModalOpen(false);
      fetchPayslip();
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể xác nhận phiếu lương');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleRejectPayslip = async () => {
    if (!disputeNote.trim() || disputeNote.trim().length < 3) {
      CustomAlert.alert('Lỗi', 'Vui lòng nhập lý do khiếu nại (tối thiểu 3 ký tự)');
      return;
    }
    try {
      setIsSubmittingFeedback(true);
      await submitPayslipFeedback({
        action: 'REJECT',
        note: disputeNote.trim(),
        payrollId: payslip?.id,
        month: selectedMonth,
        year: selectedYear,
      });
      CustomAlert.alert(
        'Đã gửi khiếu nại ✓',
        'Khiếu nại của bạn đã được chuyển đến bộ phận Kế toán & Leader để xử lý!'
      );
      setIsDisputeModalOpen(false);
      setDisputeNote('');
      fetchPayslip();
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể gửi khiếu nại');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // --- Handlers giải quyết khiếu nại (Kế toán trưởng) ---
  const handleResolveDisputeByNewImage = async () => {
    if (!selectedDisputeEmp) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        CustomAlert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      setIsReplacingDisputeImage(true);
      const uri = result.assets[0].uri;
      const uploaded = await uploadFile({
        uri,
        name: `resolved_payslip_${selectedDisputeEmp.userId}_${selectedMonth}_${selectedYear}.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'EMPLOYEE_DOCUMENT',
      });

      const fileUrl = uploaded?.fileUrl || (uploaded as any)?.url;
      if (!fileUrl) {
        throw new Error('Tải ảnh lên thất bại');
      }

      await uploadPayslipOfficialImage({
        userId: selectedDisputeEmp.userId,
        month: selectedMonth,
        year: selectedYear,
        imageUrl: fileUrl,
        note: 'Thay thế ảnh xử lý khiếu nại bởi Kế toán trưởng',
      });

      CustomAlert.alert(
        'Đã xử lý khiếu nại ✓',
        `Đã cập nhật ảnh phiếu lương mới cho ${selectedDisputeEmp.fullName}! Hệ thống đã giải tỏa khiếu nại và chuyển về chờ nhân viên kiểm tra lại.`
      );
      setIsDisputeResolutionModalOpen(false);
      setSelectedDisputeEmp(null);
      fetchPayslip();
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể cập nhật ảnh phiếu lương mới');
    } finally {
      setIsReplacingDisputeImage(false);
    }
  };

  const handleForwardDisputeToLeader = async () => {
    if (!selectedDisputeEmp) return;
    const deptId =
      departments.find((d) => d.name === selectedDisputeEmp.departmentName)?.id ||
      (selectedDepartmentId !== 'ALL' ? selectedDepartmentId : undefined);

    if (!deptId) {
      CustomAlert.alert('Thông báo', 'Không xác định được phòng ban của nhân sự để chuyển tiếp');
      return;
    }

    try {
      setIsForwardingToLeader(true);
      await notifyLeaderPayslipDispute({
        departmentId: deptId,
        userId: selectedDisputeEmp.userId,
        employeeName: selectedDisputeEmp.fullName,
        note: leaderNote.trim() || 'Kế toán yêu cầu kiểm tra lại công/lương và thay ảnh phiếu lương',
        month: selectedMonth,
        year: selectedYear,
      });

      CustomAlert.alert(
        'Đã gửi yêu cầu ✓',
        `Đã gửi yêu cầu điều chỉnh phiếu lương của ${selectedDisputeEmp.fullName} đến Leader phòng ban!`
      );
      setIsDisputeResolutionModalOpen(false);
      setSelectedDisputeEmp(null);
      setLeaderNote('');
    } catch (err: any) {
      CustomAlert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu đến Leader');
    } finally {
      setIsForwardingToLeader(false);
    }
  };

  const totalDisputeCount = useMemo(() => {
    return companyPayslips.filter(
      (c) => c.isDisputed || c.employeeFeedbackStatus === 'REJECTED'
    ).length;
  }, [companyPayslips]);

  const displayedCompanyPayslips = useMemo(() => {
    if (!disputeOnlyFilter) return companyPayslips;
    return companyPayslips.filter(
      (c) => c.isDisputed || c.employeeFeedbackStatus === 'REJECTED'
    );
  }, [companyPayslips, disputeOnlyFilter]);

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

          {/* Feedback & Khiếu nại phiếu lương (Dành cho nhân sự) */}
          {payslip?.finalOfficialImageUrl ? (
            <View style={styles.feedbackContainer}>
              {payslip.employeeFeedbackStatus === 'CONFIRMED' ? (
                <View style={styles.feedbackConfirmedBox}>
                  <View style={styles.feedbackStatusHeader}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text style={styles.feedbackConfirmedTitle}>Đã xác nhận chính xác</Text>
                  </View>
                  <Text style={styles.feedbackConfirmedDesc}>
                    Bạn đã kiểm tra và đồng ý với nội dung ảnh phiếu lương tháng này.
                  </Text>
                </View>
              ) : payslip.employeeFeedbackStatus === 'REJECTED' || payslip.isDisputed ? (
                <View style={styles.feedbackDisputedBox}>
                  <View style={styles.feedbackStatusHeader}>
                    <Ionicons name="alert-circle" size={18} color="#DC2626" />
                    <Text style={styles.feedbackDisputedTitle}>Đang khiếu nại phiếu lương</Text>
                  </View>
                  {payslip.employeeFeedbackNote ? (
                    <Text style={styles.feedbackDisputeNoteText}>
                      &ldquo;{payslip.employeeFeedbackNote}&rdquo;
                    </Text>
                  ) : null}
                  <Text style={styles.feedbackDisputedDesc}>
                    Kế toán trưởng & Leader đang kiểm tra đối chiếu và sẽ gửi lại ảnh phiếu lương mới sớm nhất.
                  </Text>
                </View>
              ) : (
                <View style={styles.feedbackActionBox}>
                  <Text style={styles.feedbackPromptText}>
                    Vui lòng đối chiếu kỹ ảnh phiếu lương và phản hồi:
                  </Text>
                  <View style={styles.feedbackBtnRow}>
                    <Pressable
                      style={[styles.feedbackConfirmBtn, isSubmittingFeedback && { opacity: 0.7 }]}
                      onPress={handleConfirmPayslip}
                      disabled={isSubmittingFeedback}
                    >
                      {isSubmittingFeedback ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                          <Text style={styles.feedbackConfirmBtnText}>Xác nhận đúng</Text>
                        </>
                      )}
                    </Pressable>

                    <Pressable
                      style={[styles.feedbackRejectBtn, isSubmittingFeedback && { opacity: 0.7 }]}
                      onPress={() => setIsDisputeModalOpen(true)}
                      disabled={isSubmittingFeedback}
                    >
                      <Ionicons name="alert-circle-outline" size={17} color="#DC2626" />
                      <Text style={styles.feedbackRejectBtnText}>Khiếu nại</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ) : null}

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
          data={displayedCompanyPayslips}
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

              {/* Filter Chips: Tất cả / Có khiếu nại */}
              <View style={styles.disputeFilterRow}>
                <Pressable
                  style={[
                    styles.disputeFilterChip,
                    !disputeOnlyFilter && styles.disputeFilterChipActive,
                  ]}
                  onPress={() => setDisputeOnlyFilter(false)}
                >
                  <Text
                    style={[
                      styles.disputeFilterChipText,
                      !disputeOnlyFilter && styles.disputeFilterChipTextActive,
                    ]}
                  >
                    Tất cả ({companyPayslips.length})
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.disputeFilterChip,
                    disputeOnlyFilter && styles.disputeFilterChipActiveAlert,
                    totalDisputeCount > 0 && !disputeOnlyFilter && styles.disputeFilterChipHasAlert,
                  ]}
                  onPress={() => setDisputeOnlyFilter((prev) => !prev)}
                >
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={15}
                    color={disputeOnlyFilter ? '#FFFFFF' : totalDisputeCount > 0 ? '#DC2626' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.disputeFilterChipText,
                      disputeOnlyFilter && styles.disputeFilterChipTextActiveAlert,
                      totalDisputeCount > 0 && !disputeOnlyFilter && { color: '#DC2626', fontWeight: '700' },
                    ]}
                  >
                    Có khiếu nại ({totalDisputeCount})
                  </Text>
                </Pressable>
              </View>

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
              <Text style={styles.companySectionTitle}>
                Nhân sự {disputeOnlyFilter ? '(Đang khiếu nại)' : ''}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isThisUploading = uploadingUserId === item.userId;
            const isComputed = item.netSalary !== null && item.netSalary !== undefined && item.netSalary > 0;
            const isDisputed = item.isDisputed || item.employeeFeedbackStatus === 'REJECTED';
            const isConfirmed = item.employeeFeedbackStatus === 'CONFIRMED';

            return (
              <View style={[styles.companyCard, isDisputed && styles.companyCardDisputed]}>
                <View style={styles.companyCardTop}>
                  <View style={styles.companyAvatarBox}>
                    <Text style={styles.companyAvatarText}>{getInitials(item.fullName)}</Text>
                  </View>
                  <View style={styles.companyMetaCol}>
                    <Text style={styles.companyEmpName}>{item.fullName}</Text>
                    <Text style={styles.companyEmpCode}>{item.userCode}</Text>
                    <Text style={styles.companyEmpDept}>{item.departmentName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={styles.rolePill}>
                      <Text style={styles.rolePillText}>Nhân viên</Text>
                    </View>
                    {isConfirmed && (
                      <View style={styles.confirmedPillSmall}>
                        <MaterialCommunityIcons name="check" size={11} color="#059669" />
                        <Text style={styles.confirmedPillSmallText}>Đã xác nhận</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Dispute Alert Banner if Disputed */}
                {isDisputed && (
                  <View style={styles.disputeAlertBanner}>
                    <View style={styles.disputeAlertHeader}>
                      <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
                      <Text style={styles.disputeAlertTitle}>Nhân sự khiếu nại phiếu lương</Text>
                    </View>
                    {item.employeeFeedbackNote ? (
                      <Text style={styles.disputeAlertNote}>
                        &ldquo;{item.employeeFeedbackNote}&rdquo;
                      </Text>
                    ) : null}
                    {canUploadPayslip && (
                      <Pressable
                        style={styles.resolveDisputeActionBtn}
                        onPress={() => {
                          setSelectedDisputeEmp(item);
                          setIsDisputeResolutionModalOpen(true);
                        }}
                      >
                        <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.resolveDisputeActionBtnText}>Xử lý khiếu nại</Text>
                      </Pressable>
                    )}
                  </View>
                )}

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

      {/* ── Employee Dispute Modal (Nhân sự khiếu nại phiếu lương) ── */}
      <Modal
        visible={isDisputeModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDisputeModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.disputeModalCard}>
            <View style={styles.disputeModalHeader}>
              <View style={styles.disputeModalIconCircle}>
                <Ionicons name="alert-circle" size={24} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.disputeModalTitle}>Khiếu nại phiếu lương</Text>
                <Text style={styles.disputeModalSub}>
                  Tháng {selectedMonth}/{selectedYear}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsDisputeModalOpen(false);
                  setDisputeNote('');
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.disputeModalNotice}>
              Vui lòng nêu rõ lý do khiếu nại (ví dụ: sai ngày công làm việc, thiếu tiền phụ cấp/tăng ca, sai tiền tạm ứng...). Kế toán trưởng và Leader sẽ kiểm tra đối chiếu lại để điều chỉnh cho bạn.
            </Text>

            <TextInput
              style={styles.disputeTextInput}
              placeholder="Nhập chi tiết lý do khiếu nại của bạn..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={disputeNote}
              onChangeText={setDisputeNote}
              textAlignVertical="top"
            />

            <View style={styles.disputeModalBtnRow}>
              <Pressable
                style={styles.disputeModalCancelBtn}
                onPress={() => {
                  setIsDisputeModalOpen(false);
                  setDisputeNote('');
                }}
                disabled={isSubmittingFeedback}
              >
                <Text style={styles.disputeModalCancelBtnText}>Hủy bỏ</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.disputeModalSubmitBtn,
                  isSubmittingFeedback && { opacity: 0.7 },
                ]}
                onPress={handleRejectPayslip}
                disabled={isSubmittingFeedback}
              >
                {isSubmittingFeedback ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={15} color="#FFFFFF" />
                    <Text style={styles.disputeModalSubmitBtnText}>Gửi khiếu nại</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Chief Accountant Dispute Resolution Modal (Kế toán trưởng giải quyết) ── */}
      <Modal
        visible={isDisputeResolutionModalOpen && Boolean(selectedDisputeEmp)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsDisputeResolutionModalOpen(false);
          setSelectedDisputeEmp(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.resolutionModalCard}>
            <View style={styles.resolutionModalHeader}>
              <View style={styles.resolutionIconCircle}>
                <MaterialCommunityIcons name="shield-alert" size={24} color="#102739" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resolutionModalTitle}>Giải quyết khiếu nại</Text>
                <Text style={styles.resolutionModalSub}>
                  {selectedDisputeEmp?.fullName} ({selectedDisputeEmp?.userCode}) • {selectedDisputeEmp?.departmentName}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsDisputeResolutionModalOpen(false);
                  setSelectedDisputeEmp(null);
                }}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Nội dung khiếu nại của nhân sự */}
              <View style={styles.userDisputeNoticeBox}>
                <Text style={styles.userDisputeLabel}>Nội dung phản ánh từ nhân sự:</Text>
                <Text style={styles.userDisputeContent}>
                  &ldquo;{selectedDisputeEmp?.employeeFeedbackNote || 'Không có ghi chú chi tiết'}&rdquo;
                </Text>
              </View>

              {/* Cách 1: Kế toán thay ảnh mới & gửi luôn */}
              <View style={styles.resolutionOptionCard}>
                <View style={styles.resolutionOptionHeader}>
                  <View style={styles.optionNumberBadge}>
                    <Text style={styles.optionNumberText}>1</Text>
                  </View>
                  <Text style={styles.resolutionOptionTitle}>
                    Kế toán thay ảnh mới & gửi luôn cho nhân sự
                  </Text>
                </View>
                <Text style={styles.resolutionOptionDesc}>
                  Chọn ảnh phiếu lương chuẩn đã chỉnh sửa từ thiết bị. Khiếu nại sẽ được tự động giải tỏa và chuyển về trạng thái chờ nhân viên kiểm tra lại.
                </Text>
                <Pressable
                  style={[
                    styles.replaceImageBtn,
                    isReplacingDisputeImage && { opacity: 0.7 },
                  ]}
                  onPress={handleResolveDisputeByNewImage}
                  disabled={isReplacingDisputeImage}
                >
                  {isReplacingDisputeImage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-plus" size={18} color="#FFFFFF" />
                      <Text style={styles.replaceImageBtnText}>Chọn ảnh mới & Gửi luôn</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Cách 2: Chuyển tiếp cho Leader phòng ban kiểm tra & thay ảnh */}
              <View style={styles.resolutionOptionCard}>
                <View style={styles.resolutionOptionHeader}>
                  <View style={[styles.optionNumberBadge, { backgroundColor: '#F1F5F9' }]}>
                    <Text style={[styles.optionNumberText, { color: '#475569' }]}>2</Text>
                  </View>
                  <Text style={styles.resolutionOptionTitle}>
                    Gửi yêu cầu điều chỉnh cho Leader phòng ban
                  </Text>
                </View>
                <Text style={styles.resolutionOptionDesc}>
                  Gửi thông báo và hướng dẫn đến Leader của phòng ban để Leader kiểm tra lại công/phụ cấp và cắt gán lại ảnh phiếu lương.
                </Text>
                <TextInput
                  style={styles.leaderNoteInput}
                  placeholder="Ghi chú gửi Leader (VD: Kiểm tra lại 2 ngày phép...)"
                  placeholderTextColor="#94A3B8"
                  value={leaderNote}
                  onChangeText={setLeaderNote}
                  multiline
                  numberOfLines={2}
                />
                <Pressable
                  style={[
                    styles.forwardLeaderBtn,
                    isForwardingToLeader && { opacity: 0.7 },
                  ]}
                  onPress={handleForwardDisputeToLeader}
                  disabled={isForwardingToLeader}
                >
                  {isForwardingToLeader ? (
                    <ActivityIndicator size="small" color="#102739" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-arrow-right" size={18} color="#102739" />
                      <Text style={styles.forwardLeaderBtnText}>Gửi cho Leader phòng ban</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  /* ── Dispute & Feedback Section (Tab MY) ── */
  feedbackContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  feedbackConfirmedBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
  },
  feedbackStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  feedbackConfirmedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  feedbackConfirmedDesc: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },
  feedbackDisputedBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
  },
  feedbackDisputedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  feedbackDisputeNoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#991B1B',
    marginVertical: 4,
  },
  feedbackDisputedDesc: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  feedbackActionBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  feedbackPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  feedbackBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
  },
  feedbackConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    borderRadius: 10,
  },
  feedbackRejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* ── Dispute Filters in Tab COMPANY ── */
  disputeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  disputeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disputeFilterChipActive: {
    backgroundColor: '#102739',
    borderColor: '#102739',
  },
  disputeFilterChipActiveAlert: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  disputeFilterChipHasAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  disputeFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  disputeFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disputeFilterChipTextActiveAlert: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* ── Disputed Card & Banners in Tab COMPANY ── */
  companyCardDisputed: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  confirmedPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confirmedPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  disputeAlertBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  disputeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disputeAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  disputeAlertNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#991B1B',
    marginTop: 4,
    lineHeight: 16,
  },
  resolveDisputeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resolveDisputeActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Dispute Modal (User) ── */
  disputeModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  disputeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  disputeModalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  disputeModalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  disputeModalNotice: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  disputeTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    height: 90,
    marginBottom: 16,
  },
  disputeModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  disputeModalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeModalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  disputeModalSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 11,
    borderRadius: 10,
  },
  disputeModalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* ── Chief Accountant Dispute Resolution Modal ── */
  resolutionModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '92%',
    maxWidth: 480,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  resolutionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resolutionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolutionModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  resolutionModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  userDisputeNoticeBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  userDisputeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  userDisputeContent: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  resolutionOptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  resolutionOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  optionNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#102739',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resolutionOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  resolutionOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  replaceImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 10,
  },
  replaceImageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderNoteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    minHeight: 56,
    marginBottom: 10,
  },
  forwardLeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 10,
  },
  forwardLeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102739',
  },
});
