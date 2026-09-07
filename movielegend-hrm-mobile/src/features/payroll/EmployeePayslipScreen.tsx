import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from 'react-native-image-viewing';
import { useAuth } from '../../providers/AuthProvider';
import {
  acknowledgePayslip,
  getMyPayslip,
  getCompanyMonthlyPayslips,
  MonthlyPayslipData,
  CompanyPayslipEmployee,
  uploadPayslipOfficialImage,
} from '../../api/payroll.api';
import { getDepartments } from '../../api/departments.api';
import type { Department } from '../../types/department.types';
import { uploadFile } from '../../api/uploads.api';

export function EmployeePayslipScreen() {
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

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

  const isAccountant = user?.roles?.some(
    (r) =>
      String(r).toUpperCase().includes('ACCOUNTANT') ||
      String(r).toUpperCase().includes('ADMIN') ||
      (String(r).toUpperCase().includes('LEADER') && (user?.department?.name || '').toLowerCase().includes('kế toán'))
  );

  useEffect(() => {
    if (isAccountant) {
      getDepartments()
        .then((res) => setDepartments(res.items || []))
        .catch(() => {});
    }
  }, [isAccountant]);

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
      Alert.alert('Thông báo', err.message || 'Không thể tải dữ liệu phiếu lương');
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
    setViewerImages([{ uri }]);
    setIsImageViewerVisible(true);
  };

  const doUploadPayslipImage = async (uri: string, targetUserId?: string, targetUserName?: string) => {
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
        imageUrl: uploaded.url,
      });
      Alert.alert('Thành công', `Đã lưu ảnh phiếu lương cho ${targetUserName || 'bạn'} thành công!`);
      fetchPayslip();
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải lên ảnh phiếu lương chốt');
    } finally {
      setUploadingUserId(null);
    }
  };

  const handleUploadUserPayslipImage = (targetUserId?: string, targetUserName?: string) => {
    const isPersonal = !targetUserId || targetUserId === user?.id;
    const title = isPersonal ? 'Phiếu lương của bạn' : `Phiếu lương: ${targetUserName || 'Nhân sự'}`;
    Alert.alert(
      title,
      'Chọn phương thức tải ảnh chốt phiếu lương từ Leader Kế toán:',
      [
        {
          text: 'Chụp ảnh mới',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập máy ảnh');
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
              Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh');
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
      ]
    );
  };

  const handleAcknowledge = async () => {
    if (!payslip?.id) return;
    try {
      setIsAcknowledging(true);
      await acknowledgePayslip(payslip.id);
      Alert.alert('Thành công', 'Bạn đã xác nhận phiếu lương thành công!');
      fetchPayslip();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận phiếu lương');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('vi-VN').format(val || 0) + ' đ';
  };

  const renderCompanyPayslipItem = ({ item }: { item: CompanyPayslipEmployee }) => {
    const isThisUploading = uploadingUserId === item.userId;
    return (
      <View style={styles.companyEmpCard}>
        <View style={styles.empHeader}>
          <View style={styles.empAvatarBg}>
            <Text style={styles.empAvatarText}>{item.fullName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{item.fullName}</Text>
            <Text style={styles.empDept}>{item.userCode} • {item.departmentName}</Text>
          </View>
          <View style={[styles.empImageBadge, item.employeeAcknowledgedAt ? styles.empBadgeAck : item.finalOfficialImageUrl ? styles.empImageBadgeDone : styles.empImageBadgePending]}>
            <Text style={[styles.empImageBadgeText, item.employeeAcknowledgedAt ? styles.empBadgeAckText : item.finalOfficialImageUrl ? styles.empImageBadgeTextDone : styles.empImageBadgeTextPending]}>
              {item.employeeAcknowledgedAt ? 'Đã xác nhận' : item.finalOfficialImageUrl ? 'Đã có ảnh' : 'Chưa có ảnh'}
            </Text>
          </View>
        </View>

        <View style={styles.empMetricsGrid}>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Thực lĩnh</Text>
            <Text style={[styles.empMetricVal, { color: '#059669', fontSize: 13 }]}>
              {item.hasData ? formatCurrency(item.netSalary) : 'Chưa tính'}
            </Text>
          </View>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Ngày công</Text>
            <Text style={styles.empMetricVal}>{item.actualWorkingDays}/{item.standardWorkingDays}</Text>
          </View>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Chức vụ</Text>
            <Text style={styles.empMetricVal} numberOfLines={1}>{item.positionName}</Text>
          </View>
        </View>

        {/* Action Upload / View Individual Payslip Image */}
        <View style={styles.empImageActionRow}>
          {item.finalOfficialImageUrl ? (
            <View style={styles.empUploadedImageRow}>
              <Pressable
                style={styles.empThumbPressable}
                onPress={() => openViewer(item.finalOfficialImageUrl!)}
              >
                <Image
                  source={{ uri: item.finalOfficialImageUrl }}
                  style={styles.empThumbImage}
                  resizeMode="cover"
                />
                <View style={styles.empThumbOverlay}>
                  <MaterialCommunityIcons name="magnify-plus" size={14} color="#fff" />
                </View>
              </Pressable>
              <View style={{ flex: 1, gap: 6 }}>
                <Pressable
                  style={styles.empViewBtn}
                  onPress={() => openViewer(item.finalOfficialImageUrl!)}
                >
                  <MaterialCommunityIcons name="eye-outline" size={16} color="#059669" />
                  <Text style={styles.empViewBtnText}>Xem ảnh phiếu lương</Text>
                </Pressable>
                <Pressable
                  style={styles.empReuploadBtn}
                  onPress={() => handleUploadUserPayslipImage(item.userId, item.fullName)}
                  disabled={isThisUploading}
                >
                  {isThisUploading ? (
                    <ActivityIndicator size="small" color="#64748B" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-retake-outline" size={15} color="#475569" />
                      <Text style={styles.empReuploadBtnText}>Đổi ảnh khác</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.empUploadNewBtn}
              onPress={() => handleUploadUserPayslipImage(item.userId, item.fullName)}
              disabled={isThisUploading}
            >
              {isThisUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
                  <Text style={styles.empUploadNewBtnText}>Tải ảnh phiếu lương cho nhân sự này</Text>
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
      <StatusBar style="dark" backgroundColor="#fff" />

      {/* Top Bar */}
      <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Phiếu Lương</Text>
        </View>
      </View>

      {/* Role Accountant Tabs */}
      {isAccountant && (
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'MY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MY')}
          >
            <Text style={[styles.tabText, activeTab === 'MY' && styles.tabTextActive]}>Cá nhân</Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'COMPANY' && styles.tabBtnActive]}
            onPress={() => setActiveTab('COMPANY')}
          >
            <Text style={[styles.tabText, activeTab === 'COMPANY' && styles.tabTextActive]}>
              Bảng lương nhân sự ({companyPayslips.length})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Month Selector Bar with previous/next buttons */}
      <View style={styles.monthSelectorBar}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </Pressable>
        <View style={styles.monthDisplay}>
          <Text style={styles.monthTitle}>Tháng {selectedMonth} / {selectedYear}</Text>
        </View>
        <Pressable onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#374151" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải dữ liệu lương...</Text>
        </View>
      ) : activeTab === 'MY' ? (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Official Payslip Snapshot Card */}
          <View style={styles.officialSnapshotCard}>
            <View style={styles.officialCardHeader}>
              <View style={styles.officialBadgeRow}>
                <MaterialCommunityIcons name="shield-check" size={18} color="#059669" />
                <Text style={styles.officialCardTitle}>Phiếu lương chốt chính thức (Kế toán)</Text>
              </View>
            </View>

            <View style={styles.officialCardBody}>
              {payslip?.finalOfficialImageUrl ? (
                <View style={styles.imagePreviewWrap}>
                  <Pressable
                    style={styles.imagePressable}
                    onPress={() => openViewer(payslip.finalOfficialImageUrl!)}
                  >
                    <Image
                      source={{ uri: payslip.finalOfficialImageUrl }}
                      style={styles.snapshotImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlayBadge}>
                      <MaterialCommunityIcons name="magnify-plus-outline" size={16} color="#fff" />
                      <Text style={styles.imageOverlayText}>Chạm để phóng to xem chi tiết</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.viewFullBtn}
                    onPress={() => openViewer(payslip.finalOfficialImageUrl!)}
                  >
                    <MaterialCommunityIcons name="fullscreen" size={18} color="#059669" />
                    <Text style={styles.viewFullBtnText}>Xem toàn màn hình & Phóng to</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.noImageNotice}>
                  <MaterialCommunityIcons name="image-off-outline" size={24} color="#94A3B8" />
                  <Text style={styles.noImageText}>Chưa có ảnh chụp phiếu lương chốt từ Kế toán</Text>
                </View>
              )}

              {/* Nút upload ảnh dành cho Kế toán / Leader */}
              {isAccountant && (
                <Pressable
                  style={styles.uploadImageBtn}
                  onPress={() => handleUploadUserPayslipImage(user?.id, 'bạn')}
                  disabled={uploadingUserId === 'MY' || uploadingUserId === user?.id}
                >
                  {uploadingUserId === 'MY' || uploadingUserId === user?.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
                      <Text style={styles.uploadImageBtnText}>
                        {payslip?.finalOfficialImageUrl ? 'Thay đổi ảnh phiếu lương của bạn' : 'Tải lên ảnh phiếu lương của bạn'}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          </View>

          {/* Main Net Salary Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroSub}>THỰC LĨNH (NET SALARY)</Text>
              <View style={[styles.statusTag, payslip?.employeeAcknowledgedAt ? styles.statusTagAck : styles.statusTagApproved]}>
                <Text style={[styles.statusTagText, payslip?.employeeAcknowledgedAt ? styles.statusTagTextAck : styles.statusTagTextApproved]}>
                  {payslip?.employeeAcknowledgedAt ? 'Đã xác nhận' : payslip?.hasData ? 'Đã phát hành' : 'Chưa có dữ liệu'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroNetAmount}>{formatCurrency(payslip?.netSalary)}</Text>

            <View style={styles.heroDivider} />

            <View style={styles.heroEmpRow}>
              <View>
                <Text style={styles.heroEmpName}>{payslip?.employee.fullName || user?.fullName || '---'}</Text>
                <Text style={styles.heroEmpCode}>
                  {payslip?.employee.userCode || user?.userCode} • {payslip?.employee.departmentName || user?.department?.name}
                </Text>
              </View>
              <View style={styles.workDaysBadge}>
                <Text style={styles.workDaysLabel}>Ngày công</Text>
                <Text style={styles.workDaysVal}>
                  {payslip?.actualWorkingDays || 0} / {payslip?.standardWorkingDays || 26}
                </Text>
              </View>
            </View>
          </View>

          {/* Income Breakdown Card */}
          <View style={styles.breakdownCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#059669" />
              <Text style={styles.cardSectionTitle}>Thu nhập (Earnings)</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Lương cơ bản</Text>
              <Text style={styles.itemVal}>{formatCurrency(payslip?.baseSalary)}</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>
                Lương thực tế theo ngày công{'\n'}
                <Text style={styles.itemLabelSub}>({payslip?.actualWorkingDays || 0}/{payslip?.standardWorkingDays || 26} ngày)</Text>
              </Text>
              <Text style={styles.itemVal}>{formatCurrency(payslip?.actualSalary)}</Text>
            </View>

            {(payslip?.overtimeAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>
                  Tiền làm thêm giờ (OT){'\n'}
                  <Text style={styles.itemLabelSub}>({payslip?.overtimeHours || 0} giờ)</Text>
                </Text>
                <Text style={styles.itemValGreen}>+{formatCurrency(payslip?.overtimeAmount)}</Text>
              </View>
            )}

            {(payslip?.allowanceAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Phụ cấp</Text>
                <Text style={styles.itemValGreen}>+{formatCurrency(payslip?.allowanceAmount)}</Text>
              </View>
            )}

            {(payslip?.bonusAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Thưởng hiệu quả / Dự án</Text>
                <Text style={styles.itemValGreen}>+{formatCurrency(payslip?.bonusAmount)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thu nhập (Gross)</Text>
              <Text style={styles.totalValGreen}>{formatCurrency(payslip?.grossSalary)}</Text>
            </View>
          </View>

          {/* Deductions Breakdown Card */}
          <View style={styles.breakdownCard}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="minus-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.cardSectionTitle}>Các khoản giảm trừ (Deductions)</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Bảo hiểm (BHXH, BHYT, BHTN)</Text>
              <Text style={styles.itemValRed}>-{formatCurrency(payslip?.insuranceAmount)}</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Thuế TNCN</Text>
              <Text style={styles.itemValRed}>-{formatCurrency(payslip?.taxAmount)}</Text>
            </View>

            {(payslip?.latePenaltyAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Khấu trừ đi muộn / vi phạm</Text>
                <Text style={styles.itemValRed}>-{formatCurrency(payslip?.latePenaltyAmount)}</Text>
              </View>
            )}

            {(payslip?.deductionAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Các khoản giảm trừ khác</Text>
                <Text style={styles.itemValRed}>-{formatCurrency(payslip?.deductionAmount)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng các khoản khấu trừ</Text>
              <Text style={styles.totalValRed}>
                -{formatCurrency((payslip?.insuranceAmount || 0) + (payslip?.taxAmount || 0) + (payslip?.deductionAmount || 0))}
              </Text>
            </View>
          </View>

          {/* Employee Acknowledgment Action */}
          {payslip?.hasData && (
            <View style={styles.actionCard}>
              {payslip.employeeAcknowledgedAt ? (
                <View style={styles.acknowledgedBox}>
                  <MaterialCommunityIcons name="check-decagram" size={24} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ackTitle}>Đã xác nhận nhận phiếu lương</Text>
                    <Text style={styles.ackTime}>Thời gian: {new Date(payslip.employeeAcknowledgedAt).toLocaleDateString('vi-VN')}</Text>
                  </View>
                </View>
              ) : (
                <Pressable
                  style={styles.ackBtn}
                  onPress={handleAcknowledge}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                      <Text style={styles.ackBtnText}>Xác nhận đã nhận & đồng ý</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={companyPayslips}
          keyExtractor={(item) => item.userId}
          renderItem={renderCompanyPayslipItem}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View style={styles.companyFilterWrap}>
              {/* Search Bar */}
              <View style={styles.searchBarWrap}>
                <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên hoặc mã nhân viên..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                )}
              </View>

              {/* Department Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.deptFilterScroll}
              >
                <Pressable
                  style={[styles.deptPill, selectedDepartmentId === 'ALL' && styles.deptPillActive]}
                  onPress={() => setSelectedDepartmentId('ALL')}
                >
                  <Text style={[styles.deptPillText, selectedDepartmentId === 'ALL' && styles.deptPillTextActive]}>
                    Tất cả PB
                  </Text>
                </Pressable>
                {departments.map((d) => (
                  <Pressable
                    key={d.id}
                    style={[styles.deptPill, selectedDepartmentId === d.id && styles.deptPillActive]}
                    onPress={() => setSelectedDepartmentId(d.id)}
                  >
                    <Text style={[styles.deptPillText, selectedDepartmentId === d.id && styles.deptPillTextActive]}>
                      {d.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có dữ liệu phiếu lương nhân sự</Text>
            </View>
          }
        />
      )}

      {/* Fullscreen Zoomable ImageViewing */}
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
  topBarWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  companyFilterWrap: {
    marginBottom: 14,
    gap: 10,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  deptFilterScroll: {
    gap: 8,
  },
  deptPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  deptPillTextActive: {
    color: '#fff',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  officialSnapshotCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  officialCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  officialBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  officialCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  officialCardBody: {
    gap: 12,
  },
  imagePreviewWrap: {
    gap: 8,
  },
  imagePressable: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  snapshotImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  viewFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  noImageNotice: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  uploadImageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroSub: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTagApproved: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusTagAck: {
    backgroundColor: '#10B981',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTagTextApproved: {
    color: '#ECFDF5',
  },
  statusTagTextAck: {
    color: '#fff',
  },
  heroNetAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 6,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 10,
  },
  heroEmpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEmpName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heroEmpCode: {
    color: '#A7F3D0',
    fontSize: 12,
    marginTop: 2,
  },
  workDaysBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  workDaysLabel: {
    fontSize: 9,
    color: '#A7F3D0',
  },
  workDaysVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  itemLabelSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemValGreen: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  itemValRed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  totalValRed: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  actionCard: {
    marginTop: 4,
    marginBottom: 20,
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ackBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  acknowledgedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 12,
  },
  ackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  ackTime: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  companyEmpCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  empHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  empAvatarBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  empDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  empImageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  empImageBadgeDone: {
    backgroundColor: '#D1FAE5',
  },
  empImageBadgePending: {
    backgroundColor: '#F1F5F9',
  },
  empBadgeAck: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  empBadgeAckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  empImageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  empImageBadgeTextDone: {
    color: '#059669',
  },
  empImageBadgeTextPending: {
    color: '#64748B',
  },
  empMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  empMetricItem: {
    alignItems: 'center',
  },
  empMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  empMetricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  empImageActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  empUploadedImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  empThumbPressable: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  empThumbImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  empThumbOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  empViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignSelf: 'flex-start',
  },
  empViewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  empReuploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  empReuploadBtnText: {
    fontSize: 11,
    color: '#475569',
  },
  empUploadNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
  },
  empUploadNewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
