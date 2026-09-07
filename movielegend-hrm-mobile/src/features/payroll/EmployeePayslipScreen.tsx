import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from 'react-native-image-viewing';
import { useAuth } from '../../providers/AuthProvider';
import {
  acknowledgePayslip,
  getMyPayslip,
  MonthlyPayslipData,
  uploadPayslipOfficialImage,
} from '../../api/payroll.api';
import { uploadFile } from '../../api/uploads.api';
import { ImportPayslipModal } from './components/ImportPayslipModal';

export function EmployeePayslipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [payslip, setPayslip] = useState<MonthlyPayslipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isAccountant = user?.roles?.some(
    (r) =>
      String(r).toUpperCase().includes('ACCOUNTANT') ||
      String(r).toUpperCase().includes('ADMIN') ||
      (String(r).toUpperCase().includes('LEADER') && (user?.department?.name || '').toLowerCase().includes('kế toán'))
  );

  const fetchPayslip = useCallback(async () => {
    try {
      const data = await getMyPayslip({
        month: selectedMonth,
        year: selectedYear,
      });
      setPayslip(data);
    } catch (err: any) {
      Alert.alert('Thông báo', err.message || 'Không thể tải dữ liệu phiếu lương');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  const processImageUpload = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      const uploaded = await uploadFile({
        uri,
        name: `payslip_snapshot_${selectedMonth}_${selectedYear}.jpg`,
        mimeType: 'image/jpeg',
        purpose: 'EMPLOYEE_DOCUMENT',
      });
      await uploadPayslipOfficialImage({
        month: selectedMonth,
        year: selectedYear,
        imageUrl: uploaded.url,
      });
      Alert.alert('Thành công', 'Đã lưu ảnh phiếu lương chốt chính thức');
      fetchPayslip();
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải lên ảnh phiếu lương chốt');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadOfficialImage = () => {
    Alert.alert(
      'Ảnh phiếu lương chốt chính thức',
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
              await processImageUpload(result.assets[0].uri);
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
              await processImageUpload(result.assets[0].uri);
            }
          },
        },
        { text: 'Huỷ', style: 'cancel' },
      ]
    );
  };

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.topTitle}>Phiếu Lương Cá Nhân</Text>
        {isAccountant ? (
          <Pressable style={styles.importIconBtn} onPress={() => setShowImportModal(true)}>
            <MaterialCommunityIcons name="file-excel" size={22} color="#059669" />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Month Selector Bar */}
      <View style={styles.monthSelectorBar}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </Pressable>
        <View style={styles.monthDisplay}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#059669" />
          <Text style={styles.monthTitle}>Tháng {selectedMonth} / {selectedYear}</Text>
        </View>
        <Pressable onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#374151" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải phiếu lương...</Text>
        </View>
      ) : (
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
              <View style={[styles.officialTag, payslip?.finalOfficialImageUrl ? styles.officialTagDone : styles.officialTagPending]}>
                <Text style={[styles.officialTagText, payslip?.finalOfficialImageUrl ? styles.officialTagTextDone : styles.officialTagTextPending]}>
                  {payslip?.finalOfficialImageUrl ? 'Đã có bản chốt' : 'Chờ kế toán gửi ảnh'}
                </Text>
              </View>
            </View>

            <View style={styles.officialCardBody}>
              {payslip?.finalOfficialImageUrl ? (
                <View style={styles.imagePreviewWrap}>
                  <Pressable
                    style={styles.imagePressable}
                    onPress={() => setIsImageViewerVisible(true)}
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
                    onPress={() => setIsImageViewerVisible(true)}
                  >
                    <MaterialCommunityIcons name="fullscreen" size={18} color="#059669" />
                    <Text style={styles.viewFullBtnText}>Xem toàn màn hình & Phóng to</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.noImageNotice}>
                  <MaterialCommunityIcons name="image-off-outline" size={24} color="#94A3B8" />
                  <Text style={styles.noImageText}>Chưa có ảnh chụp phiếu lương chốt chính thức từ Kế toán cho tháng này</Text>
                </View>
              )}

              {/* Nút upload ảnh dành cho Kế toán / Leader */}
              {isAccountant && (
                <Pressable
                  style={styles.uploadImageBtn}
                  onPress={handleUploadOfficialImage}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
                      <Text style={styles.uploadImageBtnText}>
                        {payslip?.finalOfficialImageUrl ? 'Thay đổi ảnh phiếu lương chốt' : 'Tải lên ảnh phiếu lương chốt'}
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
              <View style={styles.heroEmpInfo}>
                <Text style={styles.heroEmpName}>{payslip?.employee.fullName || user?.fullName}</Text>
                <Text style={styles.heroEmpCode}>{payslip?.employee.userCode || user?.userCode} • {payslip?.employee.departmentName || user?.department?.name || 'Công ty'}</Text>
              </View>
              <View style={styles.heroWorkDays}>
                <Text style={styles.workDaysLabel}>Ngày công</Text>
                <Text style={styles.workDaysVal}>{payslip?.actualWorkingDays || 0} / {payslip?.standardWorkingDays || 26}</Text>
              </View>
            </View>
          </View>

          {/* Section: Thu nhập (Earnings) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBgGreen}>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Thu nhập (Earnings)</Text>
            </View>

            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Lương cơ bản</Text>
              <Text style={styles.itemVal}>{formatCurrency(payslip?.baseSalary)}</Text>
            </View>

            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemLabel}>Lương thực tế theo ngày công</Text>
                <Text style={styles.itemSubLabel}>({payslip?.actualWorkingDays || 0}/{payslip?.standardWorkingDays || 26} ngày)</Text>
              </View>
              <Text style={styles.itemVal}>{formatCurrency(payslip?.actualSalary)}</Text>
            </View>

            {(payslip?.overtimeHours || 0) > 0 || (payslip?.overtimeAmount || 0) > 0 ? (
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemLabel}>Làm thêm giờ (Tăng ca OT)</Text>
                  <Text style={[styles.itemSubLabel, { color: '#D97706' }]}>({payslip?.overtimeHours || 0} giờ làm thêm)</Text>
                </View>
                <Text style={[styles.itemVal, { color: '#D97706' }]}>+{formatCurrency(payslip?.overtimeAmount)}</Text>
              </View>
            ) : null}

            {(payslip?.allowanceAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Phụ cấp (Ăn trưa, đi lại, trách nhiệm)</Text>
                <Text style={styles.itemVal}>+{formatCurrency(payslip?.allowanceAmount)}</Text>
              </View>
            )}

            {(payslip?.bonusAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Thưởng KPI & Hiệu quả</Text>
                <Text style={[styles.itemVal, { color: '#059669', fontWeight: '700' }]}>+{formatCurrency(payslip?.bonusAmount)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thu nhập (Gross)</Text>
              <Text style={styles.totalValGreen}>{formatCurrency(payslip?.grossSalary)}</Text>
            </View>
          </View>

          {/* Section: Giảm trừ (Deductions) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBgRed}>
                <MaterialCommunityIcons name="minus-circle-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.sectionTitle}>Các khoản giảm trừ (Deductions)</Text>
            </View>

            {(payslip?.insuranceAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Khấu trừ BHXH, BHYT, BHTN (10.5%)</Text>
                <Text style={styles.itemValRed}>-{formatCurrency(payslip?.insuranceAmount)}</Text>
              </View>
            )}

            {(payslip?.taxAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Thuế thu nhập cá nhân (TNCN)</Text>
                <Text style={styles.itemValRed}>-{formatCurrency(payslip?.taxAmount)}</Text>
              </View>
            )}

            {(payslip?.advanceAmount || 0) > 0 && (
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Tạm ứng lương trong kỳ</Text>
                <Text style={styles.itemValRed}>-{formatCurrency(payslip?.advanceAmount)}</Text>
              </View>
            )}

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
                      <Text style={styles.ackBtnText}>Xác nhận đã nhận & đồng ý phiếu lương</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal Import Excel dành riêng cho Kế toán */}
      <ImportPayslipModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        month={selectedMonth}
        year={selectedYear}
        onSuccess={fetchPayslip}
      />

      {/* Fullscreen Zoomable ImageViewing */}
      {payslip?.finalOfficialImageUrl ? (
        <ImageViewing
          images={[{ uri: payslip.finalOfficialImageUrl }]}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  importIconBtn: {
    padding: 6,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
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
  officialTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  officialTagDone: {
    backgroundColor: '#D1FAE5',
  },
  officialTagPending: {
    backgroundColor: '#FEF3C7',
  },
  officialTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  officialTagTextDone: {
    color: '#059669',
  },
  officialTagTextPending: {
    color: '#D97706',
  },
  officialCardBody: {
    gap: 12,
  },
  imagePreviewWrap: {
    gap: 8,
  },
  imagePressable: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  snapshotImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  viewFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  noImageNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    gap: 6,
  },
  noImageText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  uploadImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  uploadImageBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagApproved: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusTagAck: {
    backgroundColor: '#10B981',
  },
  statusTagText: {
    fontSize: 11,
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
    fontWeight: '900',
    color: '#fff',
    marginVertical: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  heroEmpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroEmpInfo: {
    flex: 1,
  },
  heroEmpName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  heroEmpCode: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 2,
  },
  heroWorkDays: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  workDaysLabel: {
    fontSize: 10,
    color: '#A7F3D0',
  },
  workDaysVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  sectionIconBgGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconBgRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemLabel: {
    fontSize: 13,
    color: '#475569',
  },
  itemSubLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
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
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValGreen: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  totalValRed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  actionCard: {
    marginTop: 4,
    marginBottom: 20,
  },
  acknowledgedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  ackTime: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  ackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
