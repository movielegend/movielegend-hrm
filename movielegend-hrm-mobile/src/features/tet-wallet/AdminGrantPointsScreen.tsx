import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
  BackHandler,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import type { Department } from '../../types/department.types';
import type { EmployeeUser } from '../../types/employee.types';
import {
  grantProjectPackage as apiGrantProjectPackage,
  bulkGrantProjectPackage as apiBulkGrantProjectPackage,
} from '../../api/employees.api';
import { useQueryClient } from '@tanstack/react-query';
import { CustomAlert } from '../../components/CustomAlert';
import { useAuth } from '../../providers/AuthProvider';

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

const PRESET_POINTS = [10000, 20000, 50000, 100000, 200000, 500000];

const DURATION_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

const INTERVAL_OPTIONS = [
  { label: 'Mỗi 1 tháng', value: 1 },
  { label: 'Mỗi 2 tháng', value: 2 },
  { label: 'Mỗi 3 tháng (Quý)', value: 3 },
  { label: 'Mỗi 6 tháng (Nửa năm)', value: 6 },
  { label: 'Mỗi 12 tháng (Hàng năm)', value: 12 },
];

export function AdminGrantPointsScreen({ target, onBack, onSuccess }: AdminGrantPointsScreenProps) {
  const { user } = useAuth();
  const isRegionAdmin = Boolean(
    user?.roles?.includes('ADMIN') &&
      user?.scopes?.some(
        (s: any) => (s.role === 'ADMIN' || s.role?.code === 'ADMIN') && s.scopeType === 'REGION'
      )
  );
  const isGlobalAdmin = Boolean(
    user?.roles?.includes('SUPER_ADMIN') || (user?.roles?.includes('ADMIN') && !isRegionAdmin)
  );
  const canGrant = isGlobalAdmin || isRegionAdmin;

  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // Wizard Step: 1 = Số điểm (Screen 3) | 2 = Lịch mở khóa (Screen 4)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form states
  const [selectedPoints, setSelectedPoints] = useState<number>(50000);
  const [isCustomPoints, setIsCustomPoints] = useState<boolean>(false);
  const [customPointsInput, setCustomPointsInput] = useState<string>('50000');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [startDateStr, setStartDateStr] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [activeDatePreset, setActiveDatePreset] = useState<'today' | 'firstMonth' | 'firstYear'>('today');
  const [showIntervalModal, setShowIntervalModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Recipient info
  const recipientName =
    target.type === 'SINGLE' && target.employee
      ? target.employee.profile?.fullName || target.employee.userCode || 'Nhân sự'
      : target.department?.name || 'Phòng ban';

  const recipientCode =
    target.type === 'SINGLE' && target.employee
      ? target.employee.userCode || ''
      : target.department?.code || '';

  const recipientDept =
    target.type === 'SINGLE' && target.employee
      ? target.employee.departmentLinks?.[0]?.department?.name || 'MOVIELEGEND'
      : `${target.memberCount || 0} nhân sự`;

  const recipientPosition =
    target.type === 'SINGLE' && target.employee
      ? target.employee.departmentLinks?.[0]?.position?.name || 'Nhân viên'
      : '';

  const grantedPointsCurrent =
    target.type === 'SINGLE' && target.employee
      ? target.employee.retentionVaults?.[0]?.grantedPoints || 0
      : 0;

  const getInitials = (name: string) => {
    if (!name) return 'NV';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NV';
    const first = parts[0] ?? '';
    if (parts.length === 1) return first.substring(0, 2).toUpperCase();
    const last = parts[parts.length - 1] ?? '';
    return ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'NV';
  };

  // Sync selectedPoints with input
  const pointsToGrant = isCustomPoints
    ? parseInt(customPointsInput.replace(/\D/g, ''), 10) || 0
    : selectedPoints;

  // Preset date pickers
  const handleSelectDatePreset = (preset: 'today' | 'firstMonth' | 'firstYear') => {
    setActiveDatePreset(preset);
    const now = new Date();
    if (preset === 'today') {
      setStartDateStr(now.toISOString().slice(0, 10));
    } else if (preset === 'firstMonth') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDateStr(firstOfMonth.toISOString().slice(0, 10));
    } else if (preset === 'firstYear') {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDateStr(firstOfYear.toISOString().slice(0, 10));
    }
  };

  // Format Date DD/MM/YYYY
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return `${d}/${m}/${y}`;
  };

  // Calculate milestones
  const calculatedMilestones = useMemo(() => {
    const totalPts = pointsToGrant;
    const dur = durationMonths || 12;
    const intv = intervalMonths || 3;
    const count = Math.max(1, Math.floor(dur / intv));
    const mPts = Math.floor(totalPts / count);

    const base = new Date(startDateStr);
    const list: Array<{ index: number; dateStr: string; points: number }> = [];

    for (let i = 1; i <= count; i++) {
      const unlock = new Date(base);
      unlock.setMonth(unlock.getMonth() + i * intv);
      const d = unlock.getDate().toString().padStart(2, '0');
      const m = (unlock.getMonth() + 1).toString().padStart(2, '0');
      const y = unlock.getFullYear();

      list.push({
        index: i,
        dateStr: `${d}/${m}/${y}`,
        points: i === count ? totalPts - mPts * (count - 1) : mPts,
      });
    }
    return list;
  }, [pointsToGrant, durationMonths, intervalMonths, startDateStr]);

  // Handle Submit
  const handleConfirmGrant = async () => {
    if (!canGrant) {
      CustomAlert.alert('Không có quyền trao điểm', 'Tài khoản của bạn không có quyền trao điểm thưởng Ví Tết.');
      return;
    }

    if (pointsToGrant <= 0) {
      CustomAlert.alert('Số điểm không hợp lệ', 'Vui lòng chọn hoặc nhập số điểm lớn hơn 0.');
      return;
    }

    const title =
      target.type === 'DEPARTMENT' && target.department
        ? `Thưởng Cuối Năm ${currentYear} - Phòng ${target.department.name}`
        : `Thưởng Cuối Năm ${currentYear}`;

    try {
      setIsSubmitting(true);
      if (target.type === 'SINGLE' && target.employee) {
        await apiGrantProjectPackage({
          userId: target.employee.id,
          title,
          points: pointsToGrant,
          year: currentYear,
          cashValuePerPoint: 1000,
          startDate: new Date(startDateStr).toISOString(),
          durationMonths,
          intervalMonths,
        });
        CustomAlert.alert(
          'Trao điểm thành công 🎉',
          `Đã trao ${pointsToGrant.toLocaleString('vi-VN')} điểm (${(pointsToGrant * 1000).toLocaleString('vi-VN')} VNĐ) cho ${recipientName}.`,
          [{ text: 'Hoàn tất', onPress: () => (onSuccess ? onSuccess() : onBack()) }]
        );
      } else if (target.type === 'DEPARTMENT' && target.department) {
        await apiBulkGrantProjectPackage({
          departmentId: target.department.id,
          title,
          points: pointsToGrant,
          year: currentYear,
          cashValuePerPoint: 1000,
          startDate: new Date(startDateStr).toISOString(),
          durationMonths,
          intervalMonths,
        });
        CustomAlert.alert(
          'Trao điểm thành công 🎉',
          `Đã trao ${pointsToGrant.toLocaleString('vi-VN')} điểm (${(pointsToGrant * 1000).toLocaleString('vi-VN')} VNĐ/nhân sự) cho toàn bộ phòng ${target.department.name}.`,
          [{ text: 'Hoàn tất', onPress: () => (onSuccess ? onSuccess() : onBack()) }]
        );
      }
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (err: any) {
      CustomAlert.alert('Lỗi trao điểm', err?.response?.data?.message || err?.message || 'Không thể trao điểm lúc này.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen backgroundColor="#F8FAFC">
      {/* ── Top Header: Back button + Title on the same row ── */}
      <View style={styles.topHeader}>
        <Pressable
          onPress={() => {
            if (currentStep === 2) {
              setCurrentStep(1);
            } else {
              onBack();
            }
          }}
          style={styles.navBackBtn}
          hitSlop={10}
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View style={styles.titleTextWrap}>
          <Text style={styles.screenTitle}>
            {currentStep === 1 ? 'Trao điểm thưởng' : 'Lịch mở khóa'}
          </Text>
        </View>
      </View>

      {/* ── Stepper Indicator (Screens 3 & 4) ── */}
      <View style={styles.stepperContainer}>
        {/* Step 1 Node */}
        <View style={styles.stepNode}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            {currentStep === 2 ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={styles.stepCircleTextActive}>1</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
            Số điểm
          </Text>
        </View>

        {/* Connecting Line */}
        <View style={[styles.stepLine, currentStep === 2 && styles.stepLineActive]} />

        {/* Step 2 Node */}
        <View style={styles.stepNode}>
          <View style={[styles.stepCircle, currentStep === 2 && styles.stepCircleActive]}>
            <Text style={[styles.stepCircleText, currentStep === 2 && styles.stepCircleTextActive]}>
              2
            </Text>
          </View>
          <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
            Lịch mở khóa
          </Text>
        </View>
      </View>

      {/* ── Step Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 ? (
          /* ======================================================== */
          /* BƯỚC 1: SỐ ĐIỂM (Screen 3)                                */
          /* ======================================================== */
          <View>
            {/* Recipient Card */}
            <View style={styles.recipientCard}>
              <View style={styles.recipientAvatar}>
                <Text style={styles.recipientAvatarText}>{getInitials(recipientName)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.recipientNameText}>{recipientName}</Text>
                <Text style={styles.recipientSubText}>
                  {recipientCode ? `${recipientCode} · ` : ''}
                  {recipientDept}
                  {recipientPosition ? ` · ${recipientPosition}` : ''}
                </Text>
              </View>
              {target.type === 'SINGLE' && (
                <Text style={styles.recipientGrantedText}>
                  Đã cấp: {grantedPointsCurrent.toLocaleString('vi-VN')} điểm
                </Text>
              )}
            </View>

            {/* Big Points Display */}
            <View style={styles.bigPointsSection}>
              <Text style={styles.fieldSectionTitle}>Số điểm trao tặng</Text>
              <View style={styles.bigPointsCenter}>
                <View style={styles.bigPointsNumberRow}>
                  <Text style={styles.bigPointsNumber}>
                    {pointsToGrant.toLocaleString('vi-VN')}
                  </Text>
                  <Text style={styles.bigPointsUnit}>điểm</Text>
                </View>
                <View style={styles.cashEquivalentPill}>
                  <Text style={styles.cashEquivalentText}>
                    = {(pointsToGrant * 1000).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            </View>

            {/* Preset Points Grid (2 rows x 3 cols) */}
            <View style={styles.presetGrid}>
              {PRESET_POINTS.map((val) => {
                const isSelected = !isCustomPoints && selectedPoints === val;
                return (
                  <Pressable
                    key={val}
                    style={[styles.presetGridBtn, isSelected && styles.presetGridBtnActive]}
                    onPress={() => {
                      setIsCustomPoints(false);
                      setSelectedPoints(val);
                      setCustomPointsInput(val.toString());
                    }}
                  >
                    <Text
                      style={[styles.presetGridBtnText, isSelected && styles.presetGridBtnTextActive]}
                    >
                      {val.toLocaleString('vi-VN')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Input Trigger */}
            <Pressable
              style={styles.customPointsHintRow}
              onPress={() => setIsCustomPoints(true)}
            >
              <Text style={styles.customPointsHintText}>
                Hoặc chạm số điểm để nhập tùy chỉnh
              </Text>
            </Pressable>

            {isCustomPoints && (
              <View style={styles.customInputBox}>
                <Text style={styles.customInputLabel}>Nhập số điểm tùy chỉnh:</Text>
                <TextInput
                  style={styles.customTextInput}
                  value={customPointsInput}
                  onChangeText={(val) => {
                    const clean = val.replace(/\D/g, '');
                    setCustomPointsInput(clean);
                  }}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 75000"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            )}

            {/* Thời hạn tích lũy */}
            <View style={styles.durationSection}>
              <Text style={styles.fieldSectionTitle}>Thời hạn tích lũy</Text>
              <Text style={styles.fieldSectionSubtitle}>
                Chọn thời gian phân bổ điểm thưởng
              </Text>

              {/* Row 1: 3, 6, 9, 12 tháng */}
              <View style={styles.durationRow}>
                {[3, 6, 9, 12].map((m) => {
                  const isSelected = durationMonths === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.durationPill, isSelected && styles.durationPillActive]}
                      onPress={() => setDurationMonths(m)}
                    >
                      <Text
                        style={[styles.durationPillText, isSelected && styles.durationPillTextActive]}
                      >
                        {m} tháng
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Row 2: 18, 24, 36 tháng */}
              <View style={[styles.durationRow, { marginTop: 8 }]}>
                {[18, 24, 36].map((m) => {
                  const isSelected = durationMonths === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.durationPill, isSelected && styles.durationPillActive]}
                      onPress={() => setDurationMonths(m)}
                    >
                      <Text
                        style={[styles.durationPillText, isSelected && styles.durationPillTextActive]}
                      >
                        {m} tháng
                      </Text>
                    </Pressable>
                  );
                })}
                {/* 4th spacer column to keep identical width as Row 1 */}
                <View style={{ flex: 1 }} />
              </View>
            </View>

            {/* Bottom conversion note */}
            <View style={styles.conversionNoteRow}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <Text style={styles.conversionNoteText}>1 điểm = 1.000 VNĐ</Text>
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* BƯỚC 2: LỊCH MỞ KHÓA (Screen 4)                          */
          /* ======================================================== */
          <View>
            {/* Summary Box */}
            <View style={styles.stepTwoSummaryBox}>
              <View style={styles.summaryBoxCol}>
                <MaterialCommunityIcons name="gift-outline" size={20} color="#204E3B" />
                <Text style={styles.summaryBoxValue}>
                  {pointsToGrant.toLocaleString('vi-VN')} điểm
                </Text>
              </View>
              <View style={styles.summaryBoxDivider} />
              <View style={styles.summaryBoxCol}>
                <Ionicons name="time-outline" size={20} color="#204E3B" />
                <Text style={styles.summaryBoxValue}>{durationMonths} tháng</Text>
              </View>
            </View>

            {/* Chu kỳ mở khóa Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Chu kỳ mở khóa</Text>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => setShowIntervalModal(true)}
              >
                <Text style={styles.dropdownBtnText}>
                  {INTERVAL_OPTIONS.find((i) => i.value === intervalMonths)?.label ||
                    `Mỗi ${intervalMonths} tháng`}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </Pressable>
            </View>

            {/* Ngày bắt đầu */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ngày bắt đầu</Text>
              <View style={styles.dateInputBox}>
                <Text style={styles.dateInputText}>{formatDateDisplay(startDateStr)}</Text>
                <Ionicons name="calendar-outline" size={18} color="#64748B" />
              </View>

              {/* Quick Date Presets */}
              <View style={styles.datePresetRow}>
                <Pressable
                  style={[
                    styles.datePresetBtn,
                    activeDatePreset === 'today' && styles.datePresetBtnActive,
                  ]}
                  onPress={() => handleSelectDatePreset('today')}
                >
                  <Text
                    style={[
                      styles.datePresetBtnText,
                      activeDatePreset === 'today' && styles.datePresetBtnTextActive,
                    ]}
                  >
                    Hôm nay
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.datePresetBtn,
                    activeDatePreset === 'firstMonth' && styles.datePresetBtnActive,
                  ]}
                  onPress={() => handleSelectDatePreset('firstMonth')}
                >
                  <Text
                    style={[
                      styles.datePresetBtnText,
                      activeDatePreset === 'firstMonth' && styles.datePresetBtnTextActive,
                    ]}
                  >
                    Đầu tháng
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.datePresetBtn,
                    activeDatePreset === 'firstYear' && styles.datePresetBtnActive,
                  ]}
                  onPress={() => handleSelectDatePreset('firstYear')}
                >
                  <Text
                    style={[
                      styles.datePresetBtnText,
                      activeDatePreset === 'firstYear' && styles.datePresetBtnTextActive,
                    ]}
                  >
                    Đầu năm
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Timeline: Lộ trình nhận thưởng */}
            <View style={styles.timelineSection}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.fieldSectionTitle}>Lộ trình nhận thưởng</Text>
                <Text style={styles.timelineCountText}>
                  {calculatedMilestones.length} đợt
                </Text>
              </View>

              <View style={styles.timelineList}>
                {calculatedMilestones.map((m, idx) => (
                  <View key={m.index} style={styles.timelineItemRow}>
                    {/* Node Circle */}
                    <View style={styles.timelineNodeCircle}>
                      <Text style={styles.timelineNodeText}>{m.index}</Text>
                    </View>

                    {/* Dotted vertical connector (if not last) */}
                    {idx < calculatedMilestones.length - 1 && (
                      <View style={styles.timelineDottedLine} />
                    )}

                    {/* Milestone Details */}
                    <View style={styles.timelineDetailCol}>
                      <Text style={styles.milestoneBatchTitle}>
                        Đợt {m.index} · {m.dateStr}
                      </Text>
                      <Text style={styles.milestonePointsText}>
                        {m.points.toLocaleString('vi-VN')} điểm
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.lockedBadge}>
                      <Ionicons name="lock-closed-outline" size={12} color="#64748B" />
                      <Text style={styles.lockedBadgeText}>Chưa mở khóa</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Action Footer ── */}
      <View style={styles.footerBar}>
        {currentStep === 1 ? (
          <View style={styles.stepOneFooterRow}>
            <Text style={styles.stepCounterText}>Bước 1 / 2</Text>
            <Pressable
              style={styles.continueBtn}
              onPress={() => {
                if (pointsToGrant <= 0) {
                  CustomAlert.alert('Chưa chọn số điểm', 'Vui lòng chọn số điểm trao tặng.');
                  return;
                }
                setCurrentStep(2);
              }}
            >
              <Text style={styles.continueBtnText}>Tiếp tục</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.stepTwoFooterCol}>
            <View style={styles.totalGrantRow}>
              <Text style={styles.totalGrantLabel}>Tổng trao tặng</Text>
              <Text style={styles.totalGrantValue}>
                {pointsToGrant.toLocaleString('vi-VN')} điểm
              </Text>
            </View>

            <Pressable
              style={styles.confirmGrantBtn}
              onPress={handleConfirmGrant}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmGrantBtnText}>Xác nhận trao điểm</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal Chọn Chu Kỳ Mở Khóa */}
      <Modal
        visible={showIntervalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowIntervalModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowIntervalModal(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalBoxTitle}>Chọn chu kỳ mở khóa</Text>
            {INTERVAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.modalOptionRow,
                  intervalMonths === opt.value && styles.modalOptionRowActive,
                ]}
                onPress={() => {
                  setIntervalMonths(opt.value);
                  setShowIntervalModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    intervalMonths === opt.value && styles.modalOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {intervalMonths === opt.value && (
                  <Ionicons name="checkmark" size={18} color="#204E3B" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /* Top Header: Back button + Title on the same row */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  navBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  /* Stepper */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  stepNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#204E3B',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepCircleTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  stepLine: {
    width: 44,
    height: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  stepLineActive: {
    backgroundColor: '#204E3B',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  /* Recipient Card */
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  recipientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2EBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#204E3B',
  },
  recipientNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  recipientSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  recipientGrantedText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Big Points Section */
  bigPointsSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  fieldSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  fieldSectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  bigPointsCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  bigPointsNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  bigPointsNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: '#111827',
  },
  bigPointsUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cashEquivalentPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  cashEquivalentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },

  /* Preset Grid */
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetGridBtn: {
    width: '31.3%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetGridBtnActive: {
    backgroundColor: '#204E3B',
    borderColor: '#204E3B',
  },
  presetGridBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  presetGridBtnTextActive: {
    color: '#FFFFFF',
  },

  customPointsHintRow: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 16,
  },
  customPointsHintText: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  customInputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  customInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  customTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },

  /* Duration Section */
  durationSection: {
    marginTop: 4,
    marginBottom: 20,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillActive: {
    backgroundColor: '#204E3B',
    borderColor: '#204E3B',
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  conversionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  conversionNoteText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },

  /* Step 2 Elements */
  stepTwoSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEEF0',
    padding: 16,
    marginBottom: 18,
  },
  summaryBoxCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  summaryBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },

  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 8,
  },
  dateInputText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  datePresetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePresetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePresetBtnActive: {
    backgroundColor: '#204E3B',
    borderColor: '#204E3B',
  },
  datePresetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  datePresetBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Timeline */
  timelineSection: {
    marginTop: 10,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineCountText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 22,
  },
  timelineNodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2EBE5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#204E3B',
  },
  timelineDottedLine: {
    position: 'absolute',
    top: 28,
    left: 13,
    width: 2,
    bottom: 0,
    backgroundColor: '#CBD5E1',
    zIndex: 1,
  },
  timelineDetailCol: {
    flex: 1,
    marginLeft: 14,
  },
  milestoneBatchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  milestonePointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#204E3B',
    marginTop: 1,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockedBadgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Footer */
  footerBar: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  stepOneFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCounterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#204E3B',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 32,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  stepTwoFooterCol: {
    gap: 10,
  },
  totalGrantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalGrantLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalGrantValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  confirmGrantBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#204E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmGrantBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Interval Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionRowActive: {
    backgroundColor: '#F9FAFB',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#111827',
  },
  modalOptionTextActive: {
    color: '#204E3B',
    fontWeight: '700',
  },
});
