import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PageHeader } from '../../components/PageHeader';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { Department } from '../../types/department.types';
import type { EmployeeUser } from '../../types/employee.types';
import {
  grantProjectPackage as apiGrantProjectPackage,
  bulkGrantProjectPackage as apiBulkGrantProjectPackage,
} from '../../api/employees.api';
import { useQueryClient } from '@tanstack/react-query';

export interface GrantTarget {
  type: 'SINGLE' | 'DEPARTMENT';
  employee?: EmployeeUser;
  department?: Department;
  memberCount?: number;
}

interface AdminGrantPointsScreenProps {
  target: GrantTarget;
  onBack: () => void;
  onSuccess?: () => void;
}

const PRESET_POINTS = [
  { label: '10.000', value: 10000, desc: '10 triệu' },
  { label: '20.000', value: 20000, desc: '20 triệu' },
  { label: '50.000', value: 50000, desc: '50 triệu' },
  { label: '100.000', value: 100000, desc: '100 triệu' },
  { label: '200.000', value: 200000, desc: '200 triệu' },
  { label: '500.000', value: 500000, desc: '500 triệu' },
];

const DURATION_OPTIONS = [
  { label: '3 tháng', value: 3 },
  { label: '6 tháng', value: 6 },
  { label: '9 tháng', value: 9 },
  { label: '12 tháng (1 năm)', value: 12 },
  { label: '18 tháng (1.5 năm)', value: 18 },
  { label: '24 tháng (2 năm)', value: 24 },
  { label: '36 tháng (3 năm)', value: 36 },
];

const INTERVAL_OPTIONS = [
  { label: 'Mỗi 1 tháng', value: 1 },
  { label: 'Mỗi 2 tháng', value: 2 },
  { label: 'Mỗi 3 tháng (Quý)', value: 3 },
  { label: 'Mỗi 4 tháng', value: 4 },
  { label: 'Mỗi 6 tháng', value: 6 },
  { label: 'Mỗi 12 tháng', value: 12 },
];

export function AdminGrantPointsScreen({ target, onBack, onSuccess }: AdminGrantPointsScreenProps) {
  const queryClient = useQueryClient();

  const [grantTitle, setGrantTitle] = useState<string>(
    target.type === 'DEPARTMENT' && target.department
      ? `Thưởng Phòng ${target.department.name}`
      : 'Thưởng Dự án'
  );
  const [customPointsInput, setCustomPointsInput] = useState<string>('50000');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [startDateStr, setStartDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [grantNote, setGrantNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentDateObj = useMemo(() => {
    if (!startDateStr) return new Date();
    const parts = startDateStr.split('-').map((v) => parseInt(v, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(startDateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [startDateStr]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      const y = selectedDate.getFullYear();
      const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const d = selectedDate.getDate().toString().padStart(2, '0');
      setStartDateStr(`${y}-${m}-${d}`);
    }
  };

  const formattedSelectedDate = useMemo(() => {
    if (!startDateStr) return '';
    const parts = startDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(startDateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }, [startDateStr]);

  // Live calculation of milestones
  const calculatedMilestones = useMemo(() => {
    const pts = parseInt(customPointsInput, 10) || 0;
    const dur = durationMonths > 0 ? durationMonths : 12;
    const intv = intervalMonths > 0 ? intervalMonths : 3;
    const N = Math.max(1, Math.floor(dur / intv));
    const ptsPerMilestone = Math.floor(pts / N);
    const start = startDateStr ? new Date(startDateStr) : new Date();
    const now = new Date();
    const list = [];

    for (let i = 1; i <= N; i++) {
      const mPts = i === N ? pts - ptsPerMilestone * (N - 1) : ptsPerMilestone;
      const unlock = new Date(start);
      unlock.setMonth(unlock.getMonth() + i * intv);
      const isUnlocked = unlock <= now;
      list.push({
        index: i,
        title: `Đợt ${i} (Sau ${i * intv} tháng)`,
        unlockDate: unlock,
        dateFormatted: `${unlock.getDate().toString().padStart(2, '0')}/${(unlock.getMonth() + 1).toString().padStart(2, '0')}/${unlock.getFullYear()}`,
        points: mPts,
        cash: mPts * 1000,
        isUnlocked,
      });
    }
    return list;
  }, [customPointsInput, durationMonths, intervalMonths, startDateStr]);

  const handleConfirmGrant = async () => {
    const pts = parseInt(customPointsInput, 10);
    if (isNaN(pts) || pts <= 0) {
      Alert.alert('Số điểm không hợp lệ', 'Vui lòng nhập số điểm lớn hơn 0.');
      return;
    }
    const title = grantTitle.trim() || 'Thưởng Dự án';

    try {
      setIsSubmitting(true);
      const currentYear = new Date().getFullYear();

      if (target.type === 'SINGLE' && target.employee) {
        await apiGrantProjectPackage({
          userId: target.employee.id,
          title,
          points: pts,
          year: currentYear,
          cashValuePerPoint: 1000,
          startDate: new Date(startDateStr).toISOString(),
          durationMonths,
          intervalMonths,
          note: grantNote.trim() || undefined,
        });
        Alert.alert(
          'Trao gói thưởng thành công 🎉',
          `Đã trao gói "${title}" với ${pts.toLocaleString('vi-VN')} điểm (${(pts * 1000).toLocaleString('vi-VN')} VNĐ) chia thành ${calculatedMilestones.length} đợt trong ${durationMonths} tháng cho ${target.employee.profile?.fullName || target.employee.userCode}.`,
          [{ text: 'Hoàn tất', onPress: () => { onSuccess ? onSuccess() : onBack(); } }]
        );
      } else if (target.type === 'DEPARTMENT' && target.department) {
        await apiBulkGrantProjectPackage({
          departmentId: target.department.id,
          title,
          points: pts,
          year: currentYear,
          cashValuePerPoint: 1000,
          startDate: new Date(startDateStr).toISOString(),
          durationMonths,
          intervalMonths,
          note: grantNote.trim() || undefined,
        });
        Alert.alert(
          'Trao gói thưởng thành công 🎉',
          `Đã trao gói "${title}" (${pts.toLocaleString('vi-VN')} điểm/nhân sự) cho toàn bộ phòng ban "${target.department.name}".`,
          [{ text: 'Hoàn tất', onPress: () => { onSuccess ? onSuccess() : onBack(); } }]
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err: any) {
      Alert.alert('Lỗi trao điểm', err?.response?.data?.message || err?.message || 'Không thể trao điểm lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <PageHeader
            title="Trao Điểm Thưởng Dự Án"
            subtitle="Cấu hình hạn mức & chia đợt rút linh hoạt"
            showBack={true}
            onBack={onBack}
            right={
              <View style={styles.headerIconBox}>
                <MaterialCommunityIcons name="wallet-giftcard" size={26} color="#D97706" />
              </View>
            }
          />

          {/* 1. Target Card */}
          {target.type === 'SINGLE' && target.employee && (
            <View style={styles.targetBannerCard}>
              <View style={styles.avatarContainer}>
                {target.employee.profile?.avatarUrl ? (
                  <Image source={{ uri: target.employee.profile.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {(target.employee.profile?.fullName || 'NV').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetName}>
                  {target.employee.profile?.fullName || 'Chưa cập nhật tên'}
                </Text>
                <Text style={styles.targetMeta}>
                  Mã: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{target.employee.userCode}</Text> •{' '}
                  {target.employee.departmentLinks?.[0]?.position?.name || 'Nhân viên'} •{' '}
                  {target.employee.departmentLinks?.[0]?.department?.name || 'Chưa phân phòng'}
                </Text>
                <View style={styles.currentVaultStatsRow}>
                  <Text style={styles.currentVaultStat}>
                    Đã cấp: <Text style={{ fontWeight: '700', color: '#B45309' }}>
                      {(target.employee.retentionVaults?.[0]?.grantedPoints || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </Text>
                  {(target.employee.retentionVaults?.[0]?.instantBonusPoints || 0) > 0 && (
                    <Text style={[styles.currentVaultStat, { color: '#059669' }]}>
                      {' '}• Thưởng nóng: {target.employee.retentionVaults?.[0]?.instantBonusPoints?.toLocaleString('vi-VN')} đ
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {target.type === 'DEPARTMENT' && target.department && (
            <View style={[styles.targetBannerCard, styles.targetDeptCard]}>
              <View style={styles.deptIconBox}>
                <MaterialCommunityIcons name="domain" size={28} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.targetName, { color: '#1E3A8A' }]}>
                  {target.department.name}
                </Text>
                <Text style={[styles.targetMeta, { color: '#3B82F6' }]}>
                  Mã phòng: {target.department.code} • Áp dụng cho toàn bộ {target.memberCount} nhân sự
                </Text>
              </View>
            </View>
          )}

          {/* 2. Form Card: Package Name & Note */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#D97706" />
              <Text style={styles.sectionTitle}>1. Thông tin Gói Thưởng / Dự Án</Text>
            </View>

            <Text style={styles.inputFieldLabel}>Tên gói thưởng / Tên dự án *</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="tag-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={grantTitle}
                onChangeText={setGrantTitle}
                placeholder="VD: Thưởng Dự án ERP, Thưởng Tết 2026, Thưởng Quý..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <Text style={styles.inputFieldLabel}>Ghi chú / Điều khoản cam kết kèm theo (Tùy chọn)</Text>
            <View style={[styles.inputWrapper, { height: 72, alignItems: 'flex-start', paddingTop: 8 }]}>
              <TextInput
                style={[styles.textInput, { height: 56, textAlignVertical: 'top' }]}
                value={grantNote}
                onChangeText={setGrantNote}
                multiline
                placeholder="VD: Trao thưởng theo cam kết hoàn thành dự án xuất sắc..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* 3. Form Card: Points & Cash Amount */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="star-shooting-outline" size={20} color="#D97706" />
              <Text style={styles.sectionTitle}>2. Số Điểm Trao Thưởng</Text>
            </View>

            <Text style={styles.inputFieldLabel}>Chọn nhanh số điểm:</Text>
            <View style={styles.presetChipsWrap}>
              {PRESET_POINTS.map((preset) => {
                const isSelected = parseInt(customPointsInput, 10) === preset.value;
                return (
                  <Pressable
                    key={preset.value}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setCustomPointsInput(preset.value.toString())}
                  >
                    <Text style={[styles.presetChipPoints, isSelected && styles.presetChipPointsActive]}>
                      {preset.label} đ
                    </Text>
                    <Text style={[styles.presetChipDesc, isSelected && styles.presetChipDescActive]}>
                      ~ {preset.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputFieldLabel}>Hoặc nhập số điểm tùy chỉnh:</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { fontSize: 16, fontWeight: '700', color: '#0F172A' }]}
                keyboardType="numeric"
                value={customPointsInput}
                onChangeText={(val) => setCustomPointsInput(val.replace(/[^0-9]/g, ''))}
                placeholder="VD: 50000"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.inputUnitText}>điểm</Text>
            </View>

            {/* Cash conversion card */}
            {Boolean(parseInt(customPointsInput, 10)) && (
              <View style={styles.cashConversionBanner}>
                <View style={styles.conversionIconBox}>
                  <MaterialCommunityIcons name="cash-multiple" size={24} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.conversionLabel}>Tỷ giá quy đổi: 1 điểm = 1.000 VNĐ</Text>
                  <Text style={styles.conversionAmount}>
                    {(parseInt(customPointsInput, 10) * 1000).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 4. Form Card: Duration & Interval Configuration */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={20} color="#D97706" />
              <Text style={styles.sectionTitle}>3. Cấu Hình Thời Hạn & Chu Kỳ Mở Khóa Rút</Text>
            </View>

            <Text style={styles.inputFieldLabel}>Thời hạn cam kết rút (Số tháng):</Text>
            <View style={styles.presetChipsWrap}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = durationMonths === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setDurationMonths(opt.value)}
                  >
                    <Text style={[styles.presetChipPoints, isSelected && styles.presetChipPointsActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputFieldLabel}>Chu kỳ mở khóa rút (Khoảng cách giữa các lần rút):</Text>
            <View style={styles.presetChipsWrap}>
              {INTERVAL_OPTIONS.map((opt) => {
                const isSelected = intervalMonths === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setIntervalMonths(opt.value)}
                  >
                    <Text style={[styles.presetChipPoints, isSelected && styles.presetChipPointsActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputFieldLabel}>Ngày bắt đầu tính hạn mức:</Text>
            
            {/* Direct date picker tap card */}
            <Pressable
              style={styles.datePickerBtnCard}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.datePickerBtnLeft}>
                <View style={styles.calendarIconBox}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.datePickerBtnLabel}>Ngày bắt đầu áp dụng:</Text>
                  <Text style={styles.datePickerBtnVal}>{formattedSelectedDate || startDateStr}</Text>
                </View>
              </View>
              <View style={styles.datePickerChangeChip}>
                <MaterialCommunityIcons name="calendar-edit" size={15} color="#D97706" />
                <Text style={styles.datePickerChangeChipText}>Chọn ngày</Text>
              </View>
            </Pressable>

            {/* Quick preset chips */}
            <Text style={[styles.inputFieldLabel, { marginTop: 10, fontSize: 11, color: '#64748B' }]}>
              Hoặc chọn nhanh mốc thời gian:
            </Text>
            <View style={styles.presetChipsWrap}>
              {[
                { label: 'Hôm nay', value: new Date().toISOString().slice(0, 10) },
                {
                  label: 'Đầu tháng này',
                  value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
                },
                {
                  label: 'Đầu năm nay',
                  value: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
                },
              ].map((preset) => {
                const isSelected = startDateStr === preset.value;
                return (
                  <Pressable
                    key={preset.label}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => setStartDateStr(preset.value)}
                  >
                    <Text style={[styles.presetChipPoints, isSelected && styles.presetChipPointsActive]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 5. Live Calculated Milestones Table */}
          {calculatedMilestones.length > 0 && (
            <View style={[styles.sectionCard, styles.milestonePreviewCard]}>
              <View style={styles.previewHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="timeline-check" size={20} color="#D97706" />
                    <Text style={styles.previewTitle}>Lộ Trình Giải Ngân Chi Tiết</Text>
                  </View>
                  <Text style={styles.previewSubtitle}>
                    Tự động chia thành {calculatedMilestones.length} đợt trong thời hạn {durationMonths} tháng
                  </Text>
                </View>
                <View style={styles.previewTotalPill}>
                  <Text style={styles.previewTotalPillText}>{calculatedMilestones.length} đợt rút</Text>
                </View>
              </View>

              <View style={styles.milestoneTable}>
                {calculatedMilestones.map((m) => (
                  <View
                    key={m.index}
                    style={[
                      styles.milestoneTableRow,
                      m.isUnlocked && styles.milestoneTableRowUnlocked,
                    ]}
                  >
                    <View style={styles.milestoneTableLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons
                          name={m.isUnlocked ? 'lock-open-variant' : 'lock-clock'}
                          size={16}
                          color={m.isUnlocked ? '#059669' : '#D97706'}
                        />
                        <Text style={[styles.milestoneTableTitle, m.isUnlocked && { color: '#065F46' }]}>
                          {m.title}
                        </Text>
                      </View>
                      <Text style={styles.milestoneTableDate}>Ngày mở khóa: {m.dateFormatted}</Text>
                    </View>

                    <View style={styles.milestoneTableRight}>
                      <Text style={styles.milestoneTablePoints}>
                        {m.points.toLocaleString('vi-VN')} đ
                      </Text>
                      <View
                        style={[
                          styles.milestoneStatusTag,
                          m.isUnlocked ? styles.tagUnlocked : styles.tagLocked,
                        ]}
                      >
                        <Text
                          style={[
                            styles.milestoneStatusTagText,
                            m.isUnlocked ? styles.tagTextUnlocked : styles.tagTextLocked,
                          ]}
                        >
                          {m.isUnlocked ? 'Mở khóa ngay' : `Khóa đến ${m.dateFormatted}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Spacer for bottom CTA */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Sticky Action Bar */}
        <View style={styles.stickyBottomBar}>
          <Pressable style={styles.backButton} onPress={onBack} disabled={isSubmitting}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </Pressable>

          <Pressable
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
            onPress={handleConfirmGrant}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>XÁC NHẬN TRAO GÓI THƯỞNG</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Component / Modal */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDateObj}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerModalHeader}>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerCancelText}>Hủy</Text>
                </Pressable>
                <Text style={styles.datePickerModalTitle}>Chọn Ngày Bắt Đầu</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.datePickerDoneText}>Xong</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={currentDateObj}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.iosDatePicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  targetBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16,
    gap: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  targetDeptCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
  },
  deptIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  targetMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  currentVaultStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentVaultStat: {
    fontSize: 11,
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  inputUnitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  presetChipPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipPointsActive: {
    color: '#92400E',
  },
  presetChipDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  presetChipDescActive: {
    color: '#B45309',
    fontWeight: '600',
  },
  cashConversionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 12,
    marginTop: 4,
  },
  conversionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversionLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '500',
  },
  conversionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 1,
  },
  milestonePreviewCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  previewSubtitle: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  previewTotalPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  previewTotalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  milestoneTable: {
    gap: 8,
  },
  milestoneTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneTableRowUnlocked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  milestoneTableLeft: {
    flex: 1,
    gap: 2,
  },
  milestoneTableRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  milestoneTableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  milestoneTableDate: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 22,
  },
  milestoneTablePoints: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  milestoneStatusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagUnlocked: {
    backgroundColor: '#D1FAE5',
  },
  tagLocked: {
    backgroundColor: '#FEF3C7',
  },
  milestoneStatusTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  tagTextUnlocked: {
    color: '#065F46',
  },
  tagTextLocked: {
    color: '#92400E',
  },
  stickyBottomBar: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 6,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  datePickerBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  datePickerBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  datePickerBtnLabel: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 2,
  },
  datePickerBtnVal: {
    fontSize: 15,
    color: '#78350F',
    fontWeight: '800',
  },
  datePickerChangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  datePickerChangeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  datePickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  datePickerModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerCancelText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '600',
  },
  datePickerDoneText: {
    fontSize: 15,
    color: '#D97706',
    fontWeight: '700',
  },
  iosDatePicker: {
    height: 200,
    marginTop: 8,
  },
});
