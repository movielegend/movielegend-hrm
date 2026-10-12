import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { useAppAlert } from '../../contexts/AlertContext';
import { useUserGuide } from '../../components/UserGuideManager';
import { EditProfileModal } from './components/EditProfileModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { AvatarPicker } from './components/AvatarPicker';
import { formatSeniority } from '../../utils/seniority';
import { useTabBarScroll } from '../../components/navigation/tabBarVisibility';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showGuideManual } = useUserGuide();
  const { showConfirm } = useAppAlert();
  const insets = useSafeAreaInsets();
  const tabBarScroll = useTabBarScroll();

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);

  // Accordion state: by default, Group 'Nhân sự' is open
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    hr: true,
    ops: false,
    settings: false,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isHR = user?.roles?.includes('HR');
  const regionScope = user?.scopes?.find(
    (s: any) => s.role === 'ADMIN' && s.scopeType === 'REGION' && s.scopeId,
  );
  const isSuperAdmin = user?.roles?.includes('ADMIN') && !regionScope;
  const adminRoleLabel = isSuperAdmin ? 'Super Admin' : isHR ? 'Nhân sự (HR)' : 'Admin Vùng';

  const handleLogout = () => {
    showConfirm({
      title: 'Đăng xuất tài khoản?',
      message: 'Bạn có muốn đăng xuất khỏi ứng dụng?',
      confirmLabel: 'Đăng xuất',
      onConfirm: () => void logout(),
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AL';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'AL';
    if (parts.length === 1) return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'AL';
    const first = parts[0]?.charAt(0) || '';
    const last = parts[parts.length - 1]?.charAt(0) || '';
    return (first + last).toUpperCase() || 'AL';
  };

  const seniorityText = formatSeniority(user?.joinDate || (user as any)?.createdAt) || '18 ngày';
  const userCodeText = user?.userCode || 'NV000001';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={tabBarScroll.onScroll}
        scrollEventThrottle={16}
      >
        {/* Top overscroll guard */}
        <View pointerEvents="none" style={styles.topOverscrollFill} />

        {/* ================= 1. GLOSSY HEADER ================= */}
        <LinearGradient
          colors={['#102739', '#143147', '#183B55', '#225275']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.glossyHeader, { paddingTop: Math.max(insets.top, 16) + 6 }]}
        >
          {/* Subtle Ambient Specular Light Aura */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Svg width="100%" height="100%">
              <Defs>
                <SvgLinearGradient id="profileGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                  <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </SvgLinearGradient>
              </Defs>
              <Circle cx={SCREEN_WIDTH - 20} cy={20} r={120} fill="url(#profileGlow)" />
            </Svg>
          </View>

          {/* Title Row with Quick Action Buttons */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.screenTitle}>Hồ sơ tài khoản</Text>
              <Text style={styles.screenSubtitle}>Thông tin định danh & quyền hạn hệ thống</Text>
            </View>

            <View style={styles.headerActionsGroup}>
              <Pressable
                style={styles.headerActionBtn}
                onPress={() => setIsEditing(true)}
                hitSlop={8}
                accessibilityLabel="Chỉnh sửa hồ sơ"
              >
                <MaterialCommunityIcons name="account-edit-outline" size={20} color="#FFFFFF" />
              </Pressable>

              <Pressable
                style={styles.headerActionBtn}
                onPress={showGuideManual}
                hitSlop={8}
                accessibilityLabel="Hướng dẫn sử dụng"
              >
                <Ionicons name="help-circle-outline" size={21} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* ================= 2. HERO IDENTITY CARD (AVATAR TRUNG TÂM & METRIC PILLS) ================= */}
        <View style={styles.heroCardWrapper}>
          <View style={styles.heroCard}>
            {/* Center Avatar & Identity */}
            <View style={styles.profileCenterStage}>
              <View style={styles.avatarHaloRing}>
                <AvatarPicker
                  getInitials={getInitials}
                  size={76}
                  bgColor="#E7F0F7"
                  textColor="#102739"
                  badgeBgColor="#102739"
                  badgeIconColor="#FFFFFF"
                />
              </View>

              <Text style={styles.userName} numberOfLines={1}>
                {user?.fullName || 'Admin Movie Legend'}
              </Text>

              {/* Badges Row (Role + Active Status) */}
              <View style={styles.badgePillsRow}>
                <View style={styles.adminRoleTag}>
                  <ShieldCheck size={13} color="#1D4ED8" strokeWidth={2.4} />
                  <Text style={styles.adminRoleTagText}>{adminRoleLabel}</Text>
                </View>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Đang hoạt động</Text>
                </View>
              </View>

              {/* Department & Email info */}
              <Text style={styles.userSubInfo} numberOfLines={1}>
                {user?.department?.name || 'Ban Quản Trị Hệ Thống'}
              </Text>
              <Text style={styles.userEmailText} numberOfLines={1}>
                {user?.email || 'admin@movielegend.vn'}
              </Text>
            </View>

            {/* Smart Micro-Pills Bar (Thay thế cho 3 cột kẻ vạch như thẻ chấm công) */}
            <View style={styles.infoPillsBar}>
              <View style={styles.infoPillCard}>
                <Text style={styles.infoPillLabel}>MÃ NHÂN VIÊN</Text>
                <Text style={styles.infoPillValue} numberOfLines={1}>{userCodeText}</Text>
              </View>

              <View style={styles.infoPillCard}>
                <Text style={styles.infoPillLabel}>THÂM NIÊN</Text>
                <Text style={styles.infoPillValue} numberOfLines={1}>{seniorityText}</Text>
              </View>

              <View style={styles.infoPillCard}>
                <Text style={styles.infoPillLabel}>QUYỀN HẠN</Text>
                <Text style={styles.infoPillValue} numberOfLines={1}>{isSuperAdmin ? 'Toàn công ty' : 'Phân quyền'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= 3. BODY CONTENT ================= */}
        <View style={styles.bodyContent}>
          {/* ── Card: Thông tin cá nhân ── */}
          <Pressable
            style={styles.personalInfoCard}
            onPress={() => setShowPersonalInfoModal(true)}
          >
            <View style={styles.personalIconBox}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#2563EB" />
            </View>
            <View style={styles.personalTextWrap}>
              <Text style={styles.personalTitle}>Thông tin cá nhân</Text>
              <Text style={styles.personalSubtitle}>Liên hệ, phòng ban, ngày vào làm</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* ── Section: Tiện ích của tôi ── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>Tiện ích của tôi</Text>
            <View style={styles.utilitiesRow}>
              {/* Bảng công */}
              <Pressable
                style={styles.utilityCard}
                onPress={() => router.push('/admin/timesheet' as any)}
              >
                <View style={styles.utilityIconWrap}>
                  <Ionicons name="calendar-outline" size={22} color="#2563EB" />
                </View>
                <Text style={styles.utilityTitle}>Bảng công</Text>
              </Pressable>

              {/* Phiếu lương */}
              <Pressable
                style={styles.utilityCard}
                onPress={() => router.push('/admin/payslip' as any)}
              >
                <View style={styles.utilityIconWrap}>
                  <MaterialCommunityIcons name="cash-multiple" size={22} color="#2563EB" />
                </View>
                <Text style={styles.utilityTitle}>Phiếu lương</Text>
              </Pressable>

              {/* Chấm công */}
              <Pressable
                style={styles.utilityCard}
                onPress={() => router.push('/admin/attendance' as any)}
              >
                <View style={styles.utilityIconWrap}>
                  <Ionicons name="time-outline" size={22} color="#2563EB" />
                </View>
                <Text style={styles.utilityTitle}>Chấm công</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Section: Không gian làm việc ── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>Không gian quản trị & Vận hành</Text>

            {/* ── Accordion Group 1: Nhân sự ── */}
            <View style={styles.accordionCard}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggleGroup('hr')}
              >
                <View style={styles.accordionIconBox}>
                  <MaterialCommunityIcons name="account-group-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.accordionTitleCol}>
                  <Text style={styles.accordionTitle}>Nhân sự</Text>
                  <Text style={styles.accordionSubtitle}>Tổ chức, chấm công và phê duyệt</Text>
                </View>
                <Ionicons
                  name={expandedGroups.hr ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </Pressable>

              {expandedGroups.hr && (
                <View style={styles.accordionBody}>
                  {/* Sub-group: Tổ chức & phát triển */}
                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>TỔ CHỨC & PHÁT TRIỂN</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="sitemap-outline"
                        iconType="mci"
                        title="Cơ cấu tổ chức"
                        onPress={() => router.push('/admin/branches')}
                      />
                      <FeatureItem
                        icon="layers-outline"
                        iconType="mci"
                        title="Cấp bậc & Dự án"
                        onPress={() => router.push('/admin/levels' as any)}
                      />
                      <FeatureItem
                        icon="stats-chart-outline"
                        iconType="ionicons"
                        title="Duyệt thăng cấp"
                        onPress={() => router.push('/admin/competition/review' as any)}
                      />
                      <FeatureItem
                        icon="gift-outline"
                        iconType="ionicons"
                        title="Ví thưởng"
                        onPress={() => router.push('/admin/tet-wallet' as any)}
                      />
                    </View>
                  </View>

                  <View style={styles.featureDivider} />

                  {/* Sub-group: Chấm công & phê duyệt */}
                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>CHẤM CÔNG & PHÊ DUYỆT</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="time-outline"
                        iconType="ionicons"
                        title="Dữ liệu chấm công"
                        onPress={() => router.push('/admin/attendance')}
                      />
                      <FeatureItem
                        icon="calendar-outline"
                        iconType="ionicons"
                        title="Ca làm việc"
                        onPress={() => router.push('/admin/shifts')}
                      />
                      <FeatureItem
                        icon="file-document-outline"
                        iconType="mci"
                        title="Duyệt đơn"
                        onPress={() => router.push('/leader/employee-requests')}
                      />
                      <FeatureItem
                        icon="account-outline"
                        iconType="mci"
                        title="Duyệt tài khoản"
                        onPress={() => router.push('/admin/approvals')}
                      />
                    </View>
                  </View>

                  <View style={styles.featureDivider} />

                  {/* Sub-group: Hồ sơ & quản lý */}
                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>HỒ SƠ & QUẢN LÝ</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="swap-horizontal"
                        iconType="mci"
                        title="Luân chuyển phòng ban"
                        onPress={() => router.push('/admin/cross-department')}
                      />
                      <FeatureItem
                        icon="file-document-outline"
                        iconType="mci"
                        title="Hợp đồng"
                        onPress={() => router.push('/admin/contracts')}
                      />
                      <FeatureItem
                        icon="folder-outline"
                        iconType="ionicons"
                        title="Tài liệu nội bộ"
                        onPress={() => router.push('/admin/documents' as any)}
                      />
                      <FeatureItem
                        icon="message-plus-outline"
                        iconType="mci"
                        title="Quản lý góp ý"
                        onPress={() => router.push('/admin/feedbacks' as any)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ── Accordion Group 2: Vận hành ── */}
            <View style={styles.accordionCard}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggleGroup('ops')}
              >
                <View style={styles.accordionIconBox}>
                  <MaterialCommunityIcons name="cube-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.accordionTitleCol}>
                  <Text style={styles.accordionTitle}>Vận hành</Text>
                  <Text style={styles.accordionSubtitle}>Công việc, trao đổi và vật tư</Text>
                </View>
                <Ionicons
                  name={expandedGroups.ops ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </Pressable>

              {expandedGroups.ops && (
                <View style={styles.accordionBody}>
                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>CÔNG VIỆC & TRAO ĐỔI</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="newspaper-outline"
                        iconType="ionicons"
                        title="Bảng tin"
                        onPress={() => router.push('/admin/newsfeed')}
                      />
                      <FeatureItem
                        icon="chatbubbles-outline"
                        iconType="ionicons"
                        title="Nhóm chat"
                        onPress={() => router.push('/admin/chat')}
                      />
                      <FeatureItem
                        icon="briefcase-outline"
                        iconType="ionicons"
                        title="Công việc"
                        onPress={() => router.push('/admin/tasks')}
                      />
                      <FeatureItem
                        icon="alert-circle-outline"
                        iconType="ionicons"
                        title="Báo cáo sự cố"
                        onPress={() => router.push('/admin/asset-incidents')}
                      />
                    </View>
                  </View>

                  <View style={styles.featureDivider} />

                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>KHO & VẬT TƯ</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="cube-outline"
                        iconType="mci"
                        title="Vật tư"
                        onPress={() => router.push('/admin/materials')}
                      />
                      <FeatureItem
                        icon="warehouse"
                        iconType="mci"
                        title="Kho hàng"
                        onPress={() => router.push('/admin/warehouses')}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* ── Accordion Group 3: Cài đặt ── */}
            <View style={styles.accordionCard}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggleGroup('settings')}
              >
                <View style={styles.accordionIconBox}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color="#2563EB" />
                </View>
                <View style={styles.accordionTitleCol}>
                  <Text style={styles.accordionTitle}>Cài đặt</Text>
                  <Text style={styles.accordionSubtitle}>Tài khoản và hỗ trợ</Text>
                </View>
                <Ionicons
                  name={expandedGroups.settings ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </Pressable>

              {expandedGroups.settings && (
                <View style={styles.accordionBody}>
                  <View style={styles.subGroupSection}>
                    <Text style={styles.subGroupTitle}>TÀI KHOẢN & HỆ THỐNG</Text>
                    <View style={styles.featureGrid}>
                      <FeatureItem
                        icon="help-circle-outline"
                        iconType="ionicons"
                        title="Hướng dẫn sử dụng"
                        onPress={showGuideManual}
                      />
                      <FeatureItem
                        icon="lock-closed-outline"
                        iconType="ionicons"
                        title="Đổi mật khẩu"
                        onPress={() => setIsChangingPassword(true)}
                      />
                      <FeatureItem
                        icon="shield-outline"
                        iconType="ionicons"
                        title="Quyền & Xóa tài khoản"
                        onPress={() => setIsDeleting(true)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Logout Button ── */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout-variant" size={18} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
          </Pressable>

          <Text style={styles.versionText}>Phiên bản 1.0.0 • Movie Legend HRM</Text>
        </View>
      </ScrollView>

      {/* ── Modal: Thông tin cá nhân ── */}
      <Modal
        visible={showPersonalInfoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonalInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin cá nhân</Text>
              <Pressable
                onPress={() => setShowPersonalInfoModal(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.infoModalCard}>
                <InfoItem label="Mã nhân viên" value={userCodeText} />
                <InfoItem label="Họ và tên" value={user?.fullName || 'Admin Movie Legend'} />
                <InfoItem label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} />
                <InfoItem label="Email" value={user?.email || 'Chưa cập nhật'} />
                <InfoItem
                  label="Phòng ban"
                  value={user?.department?.name || 'Ban Quản Trị Hệ Thống'}
                />
                <InfoItem label="Chức vụ" value={adminRoleLabel} />
                <InfoItem
                  label="Ngày vào làm"
                  value={
                    user?.joinDate || (user as any)?.createdAt
                      ? new Date(user?.joinDate || (user as any)?.createdAt).toLocaleDateString(
                          'vi-VN'
                        )
                      : 'Chưa cập nhật'
                  }
                />
                <InfoItem label="Thâm niên" value={seniorityText} isLast />
              </View>

              <Pressable
                style={styles.editContactBtn}
                onPress={() => {
                  setShowPersonalInfoModal(false);
                  setIsEditing(true);
                }}
              >
                <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
                <Text style={styles.editContactBtnText}>Chỉnh sửa thông tin liên hệ</Text>
              </Pressable>
            </ScrollView>

            <SafeAreaView edges={['bottom']} />
          </View>
        </View>
      </Modal>

      {/* Existing Edit, Change Password & Delete Account Modals */}
      <EditProfileModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        initialPhone={user?.phone || ''}
        initialEmail={user?.email || ''}
      />
      <ChangePasswordModal
        visible={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
      <DeleteAccountModal
        visible={isDeleting}
        onClose={() => setIsDeleting(false)}
      />
    </View>
  );
}

interface FeatureItemProps {
  icon: string;
  iconType?: 'mci' | 'ionicons';
  title: string;
  onPress: () => void;
}

function FeatureItem({ icon, iconType = 'mci', title, onPress }: FeatureItemProps) {
  return (
    <Pressable style={styles.featureItem} onPress={onPress}>
      <View style={styles.featureIconWrap}>
        {iconType === 'ionicons' ? (
          <Ionicons name={icon as any} size={18} color="#2563EB" />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={18} color="#2563EB" />
        )}
      </View>
      <Text style={styles.featureItemText} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

function InfoItem({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoItemRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoItemLabel}>{label}</Text>
      <Text style={styles.infoItemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topOverscrollFill: {
    position: 'absolute',
    top: -500,
    left: 0,
    right: 0,
    height: 500,
    backgroundColor: '#102739',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    backgroundColor: '#F5F7FA',
  },

  /* ── 1. Glossy Royal Blue Header ── */
  glossyHeader: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  headerTitleWrap: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.78)',
    marginTop: 2,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── 2. Hero Identity Profile Card ── */
  heroCardWrapper: {
    paddingHorizontal: 16,
    marginTop: -26,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    position: 'relative',
  },
  profileCenterStage: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  avatarHaloRing: {
    marginBottom: 10,
    padding: 3,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  badgePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  adminRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  adminRoleTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  userSubInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },

  /* Smart Micro-Pills Bar (3 cards riêng biệt thay cho 3 cột kẻ vạch) */
  infoPillsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoPillCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  infoPillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  /* ── 3. Body Content ── */
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Thông tin cá nhân Card */
  personalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  personalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personalTextWrap: {
    flex: 1,
  },
  personalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  personalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Sections */
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  /* Utilities Row */
  utilitiesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  utilityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },

  /* Accordion Cards */
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accordionTitleCol: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  accordionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  accordionBody: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subGroupSection: {
    marginVertical: 4,
  },
  subGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 6,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  featureItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  featureDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },

  /* Logout Button */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },

  /* Personal Info Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  infoModalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoItemLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  editContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    marginTop: 4,
  },
  editContactBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
