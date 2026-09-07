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

export function MonthlyTimesheetScreen() {
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

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

  const isHR = user?.roles?.some(
    (r) =>
      String(r).toUpperCase().includes('HR') ||
      String(r).toUpperCase().includes('ADMIN') ||
      (String(r).toUpperCase().includes('LEADER') && (user?.department?.name || '').toLowerCase().includes('nhân sự'))
  );

  useEffect(() => {
    if (isHR) {
      getDepartments()
        .then((res) => {
          setDepartments(res.items || []);
        })
        .catch(() => {});
    }
  }, [isHR]);

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
      Alert.alert('Thông báo', err.message || 'Không thể tải dữ liệu bảng công');
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

  const doUploadTimesheetImage = async (uri: string, targetUserId?: string, targetUserName?: string) => {
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
        imageUrl: uploaded.url,
      });
      Alert.alert('Thành công', `Đã lưu ảnh bảng công cho ${targetUserName || 'bạn'} thành công!`);
      fetchTimesheet();
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải lên ảnh bảng công');
    } finally {
      setUploadingUserId(null);
    }
  };

  const handleUploadUserTimesheetImage = (targetUserId?: string, targetUserName?: string) => {
    const isPersonal = !targetUserId || targetUserId === user?.id;
    const title = isPersonal ? 'Bảng công của bạn' : `Bảng công: ${targetUserName || 'Nhân sự'}`;
    Alert.alert(
      title,
      'Chọn phương thức tải ảnh chốt bảng công:',
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
              await doUploadTimesheetImage(result.assets[0].uri, targetUserId, targetUserName);
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
              await doUploadTimesheetImage(result.assets[0].uri, targetUserId, targetUserName);
            }
          },
        },
        { text: 'Huỷ', style: 'cancel' },
      ]
    );
  };

  const renderDailyItem = ({ item }: { item: MonthlyTimesheetDailyRecord }) => {
    const isLate = item.lateMinutes > 0;
    const hasOt = item.otHours > 0;

    let badgeColor = '#10B981';
    let badgeText = 'Đủ công';

    if (item.status === 'LEAVE') {
      badgeColor = '#3B82F6';
      badgeText = item.leaveTitle || 'Nghỉ phép';
    } else if (item.status === 'WEEKEND') {
      badgeColor = '#9CA3AF';
      badgeText = 'Cuối tuần';
    } else if (item.status === 'NO_RECORD' || item.status === 'MISSING') {
      badgeColor = '#EF4444';
      badgeText = 'Vắng mặt';
    } else if (isLate) {
      badgeColor = '#F59E0B';
      badgeText = `Muộn ${item.lateMinutes}p`;
    }

    return (
      <View style={styles.dailyRow}>
        <View style={styles.dateCol}>
          <Text style={[styles.dayOfWeekText, item.isSunday && { color: '#EF4444' }]}>
            {item.dayOfWeek}
          </Text>
          <Text style={styles.dateText}>{item.date.slice(8, 10)}</Text>
        </View>

        <View style={styles.recordContent}>
          <View style={styles.recordTopRow}>
            <Text style={styles.shiftNameText}>{item.shiftName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}15` }]}>
              <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
          </View>

          <View style={styles.recordBottomRow}>
            <View style={styles.timeTag}>
              <MaterialCommunityIcons name="login" size={14} color="#10B981" />
              <Text style={styles.timeVal}>{item.checkInAt ? item.checkInAt.slice(11, 16) : '--:--'}</Text>
            </View>
            <View style={styles.timeTag}>
              <MaterialCommunityIcons name="logout" size={14} color="#EF4444" />
              <Text style={styles.timeVal}>{item.checkOutAt ? item.checkOutAt.slice(11, 16) : '--:--'}</Text>
            </View>
            {hasOt && (
              <View style={[styles.timeTag, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="clock-plus-outline" size={14} color="#D97706" />
                <Text style={[styles.timeVal, { color: '#D97706', fontWeight: '700' }]}>+{item.otHours}h OT</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCompanyItem = ({ item }: { item: CompanyTimesheetEmployee }) => {
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
          <View style={[styles.empImageBadge, item.finalOfficialImageUrl ? styles.empImageBadgeDone : styles.empImageBadgePending]}>
            <Text style={[styles.empImageBadgeText, item.finalOfficialImageUrl ? styles.empImageBadgeTextDone : styles.empImageBadgeTextPending]}>
              {item.finalOfficialImageUrl ? 'Đã có ảnh' : 'Chưa có ảnh'}
            </Text>
          </View>
        </View>

        <View style={styles.empMetricsGrid}>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Công thực tế</Text>
            <Text style={styles.empMetricVal}>{item.actualWorkingDays}/{item.standardWorkingDays}</Text>
          </View>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Tăng ca</Text>
            <Text style={[styles.empMetricVal, { color: '#D97706' }]}>{item.otHours}h</Text>
          </View>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Nghỉ phép</Text>
            <Text style={styles.empMetricVal}>{item.paidLeaveDays}p</Text>
          </View>
          <View style={styles.empMetricItem}>
            <Text style={styles.empMetricLabel}>Đi muộn</Text>
            <Text style={[styles.empMetricVal, { color: item.totalLateMinutes > 0 ? '#EF4444' : '#10B981' }]}>
              {item.totalLateMinutes}p
            </Text>
          </View>
        </View>

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
                  <Text style={styles.empViewBtnText}>Xem ảnh bảng công</Text>
                </Pressable>
                <Pressable
                  style={styles.empReuploadBtn}
                  onPress={() => handleUploadUserTimesheetImage(item.userId, item.fullName)}
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
              onPress={() => handleUploadUserTimesheetImage(item.userId, item.fullName)}
              disabled={isThisUploading}
            >
              {isThisUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
                  <Text style={styles.empUploadNewBtnText}>Tải ảnh bảng công cho nhân sự này</Text>
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

      <View style={[styles.topBarWrapper, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Bảng Chấm Công</Text>
        </View>
      </View>

      {isHR && (
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
              Toàn công ty ({companyTimesheet.length})
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.monthSelectorBar}>
        <Pressable onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </Pressable>
        <View style={styles.monthDisplay}>
          <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#111827" />
          <Text style={styles.monthTitle}>Tháng {selectedMonth} / {selectedYear}</Text>
        </View>
        <Pressable onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#374151" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Đang tải dữ liệu công...</Text>
        </View>
      ) : activeTab === 'MY' ? (
        <FlatList
          data={myTimesheet?.dailyRecords || []}
          keyExtractor={(item) => item.date}
          renderItem={renderDailyItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View style={styles.summaryContainer}>
              <View style={styles.officialSnapshotCard}>
                <View style={styles.officialCardHeader}>
                  <View style={styles.officialBadgeRow}>
                    <MaterialCommunityIcons name="shield-check" size={18} color="#059669" />
                    <Text style={styles.officialCardTitle}>Bảng công chốt chính thức (HR)</Text>
                  </View>
                  <View style={[styles.officialTag, myTimesheet?.finalOfficialImageUrl ? styles.officialTagDone : styles.officialTagPending]}>
                    <Text style={[styles.officialTagText, myTimesheet?.finalOfficialImageUrl ? styles.officialTagTextDone : styles.officialTagTextPending]}>
                      {myTimesheet?.finalOfficialImageUrl ? 'Đã có ảnh chốt' : 'Chờ HR gửi ảnh'}
                    </Text>
                  </View>
                </View>

                <View style={styles.officialCardBody}>
                  <View style={styles.officialDaysRow}>
                    <Text style={styles.officialDaysLabel}>Công thực nhận (Official):</Text>
                    <Text style={styles.officialDaysVal}>
                      {myTimesheet?.officialWorkingDays !== undefined && myTimesheet?.officialWorkingDays !== null
                        ? myTimesheet.officialWorkingDays
                        : myTimesheet?.actualWorkingDays || 0}
                      <Text style={styles.officialDaysSub}> / {myTimesheet?.standardWorkingDays || 26} ngày</Text>
                    </Text>
                  </View>

                  {myTimesheet?.finalOfficialImageUrl ? (
                    <View style={styles.imagePreviewWrap}>
                      <Pressable
                        style={styles.imagePressable}
                        onPress={() => openViewer(myTimesheet.finalOfficialImageUrl!)}
                      >
                        <Image
                          source={{ uri: myTimesheet.finalOfficialImageUrl }}
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
                        onPress={() => openViewer(myTimesheet.finalOfficialImageUrl!)}
                      >
                        <MaterialCommunityIcons name="fullscreen" size={18} color="#059669" />
                        <Text style={styles.viewFullBtnText}>Xem toàn màn hình & Phóng to</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.noImageNotice}>
                      <MaterialCommunityIcons name="image-off-outline" size={24} color="#94A3B8" />
                      <Text style={styles.noImageText}>Chưa có ảnh bảng công chốt chính thức từ HR cho tháng này</Text>
                    </View>
                  )}

                  {isHR && (
                    <Pressable
                      style={styles.uploadImageBtn}
                      onPress={() => handleUploadUserTimesheetImage(user?.id, 'bạn')}
                      disabled={uploadingUserId === 'MY' || uploadingUserId === user?.id}
                    >
                      {uploadingUserId === 'MY' || uploadingUserId === user?.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
                          <Text style={styles.uploadImageBtnText}>
                            {myTimesheet?.finalOfficialImageUrl ? 'Thay đổi ảnh chốt của bạn' : 'Tải lên ảnh bảng công của bạn'}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.mainStatCard}>
                <View style={styles.mainStatLeft}>
                  <Text style={styles.mainStatLabel}>Ghi nhận trên App / Chuẩn</Text>
                  <Text style={styles.mainStatVal}>
                    {myTimesheet?.actualWorkingDays || 0}
                    <Text style={styles.mainStatTotal}> / {myTimesheet?.standardWorkingDays || 26}</Text>
                  </Text>
                  <Text style={styles.mainStatSub}>
                    Tổng giờ làm: {myTimesheet?.totalWorkedHours || 0} giờ
                  </Text>
                </View>
                <View style={styles.mainStatRight}>
                  <View style={styles.otBadgeBox}>
                    <Text style={styles.otBadgeLabel}>Tăng ca (OT)</Text>
                    <Text style={styles.otBadgeVal}>{myTimesheet?.otHours || 0}h</Text>
                    <Text style={styles.otMultiplierHint}>x{myTimesheet?.departmentOtMultiplier || 1.5}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#3B82F6" />
                  <Text style={styles.statBoxVal}>{myTimesheet?.paidLeaveDays || 0} ngày</Text>
                  <Text style={styles.statBoxLabel}>Nghỉ phép</Text>
                </View>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="calendar-remove" size={20} color="#6B7280" />
                  <Text style={styles.statBoxVal}>{myTimesheet?.unpaidLeaveDays || 0} ngày</Text>
                  <Text style={styles.statBoxLabel}>Nghỉ không lương</Text>
                </View>
                <View style={styles.statBox}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#EF4444" />
                  <Text style={[styles.statBoxVal, { color: (myTimesheet?.totalLateMinutes || 0) > 0 ? '#EF4444' : '#10B981' }]}>
                    {myTimesheet?.totalLateMinutes || 0} p
                  </Text>
                  <Text style={styles.statBoxLabel}>Đi muộn / Về sớm</Text>
                </View>
              </View>
            </View>
          }
        />
      ) : (
        <FlatList
          data={companyTimesheet}
          keyExtractor={(item) => item.userId}
          renderItem={renderCompanyItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <View style={styles.companyFilterWrap}>
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
              <Text style={styles.emptyText}>Không có dữ liệu nhân sự phù hợp</Text>
            </View>
          }
        />
      )}

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
    backgroundColor: '#0F172A',
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
  listContent: {
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
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  deptPillTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    marginBottom: 16,
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
    gap: 10,
  },
  officialDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  officialDaysLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  officialDaysVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  officialDaysSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#065F46',
  },
  imagePreviewWrap: {
    gap: 8,
    marginTop: 4,
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
  mainStatCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainStatLeft: {
    flex: 1,
  },
  mainStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  mainStatVal: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  mainStatTotal: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748B',
  },
  mainStatSub: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 4,
  },
  mainStatRight: {
    alignItems: 'flex-end',
  },
  otBadgeBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  otBadgeLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  otBadgeVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginVertical: 2,
  },
  otMultiplierHint: {
    fontSize: 9,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
    marginRight: 10,
  },
  dayOfWeekText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordContent: {
    flex: 1,
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shiftNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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
    backgroundColor: '#0F172A',
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
