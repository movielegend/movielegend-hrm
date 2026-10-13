import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

  const seniorityText = formatSeniority(user?.joinDate || (user as any)?.createdAt) || 'Chưa cập nhật';
  const userCodeText = user?.userCode || 'NV000001';
  const departmentName = user?.department?.name || 'Ban Quản Trị Hệ Thống';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

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
        {/* ── Top Header (#102739) ── */}
        <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
          {/* Subtle Decorative Wave Curve Background */}
          <View style={styles.decorativeCurve} />

          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.brandTagline}>MOVIE LEGEND</Text>
              <Text style={styles.screenTitle}>Hồ sơ</Text>
            </View>

            <Pressable
              style={styles.helpBtn}
              onPress={showGuideManual}
              hitSlop={8}
              accessibilityLabel="Hướng dẫn sử dụng"
            >
              <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* ── Floating User Profile Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardTop}>
              <View style={styles.avatarWrap}>
                <AvatarPicker getInitials={getInitials} />
              </View>

              <View style={styles.profileMetaCol}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.fullName || 'Admin Movie Legend'}
                </Text>
                <Text style={styles.userRole}>{adminRoleLabel}</Text>
                <Text style={styles.userDepartment} numberOfLines={1}>
                  {departmentName}
                </Text>
                <View style={styles.statusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Đang hoạt động</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileDivider} />

            <View style={styles.profileCardBottom}>
              <View style={styles.profileStatCol}>
                <Text style={styles.profileStatLabel}>Mã nhân viên</Text>
                <Text style={styles.profileStatValue}>{userCodeText}</Text>
              </View>

              <View style={styles.statVerticalDivider} />

              <View style={styles.profileStatCol}>
                <Text style={styles.profileStatLabel}>Thâm niên</Text>
                <Text style={styles.profileStatValue}>{seniorityText}</Text>
              </View>

              <View style={styles.statVerticalDivider} />

              <View style={styles.profileStatCol}>
                <Text style={styles.profileStatLabel}>Quyền hạn</Text>
                <Text style={styles.profileStatValue}>{isSuperAdmin ? 'Toàn quyền' : 'Admin'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* ── Card: Thông tin cá nhân ── */}
          <Pressable
            style={styles.personalInfoCard}
            onPress={() => setShowPersonalInfoModal(true)}
          >
            <View style={styles.personalIconBox}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#102739" />
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
                  <Ionicons name="calendar-outline" size={24} color="#0F172A" />
                </View>
                <Text style={styles.utilityTitle}>Bảng công</Text>
              </Pressable>

              {/* Phiếu lương */}
              <Pressable
                style={styles.utilityCard}
                onPress={() => router.push('/admin/payslip' as any)}
              >
                <View style={styles.utilityIconWrap}>
                  <View style={styles.payslipIconBox}>
                    <Text style={styles.payslipDollarText}>$</Text>
                  </View>
                </View>
                <Text style={styles.utilityTitle}>Phiếu lương</Text>
              </Pressable>

              {/* Chấm công */}
              <Pressable
                style={styles.utilityCard}
                onPress={() => router.push('/admin/attendance' as any)}
              >
                <View style={styles.utilityIconWrap}>
                  <Ionicons name="time-outline" size={24} color="#0F172A" />
                </View>
                <Text style={styles.utilityTitle}>Chấm công</Text>
                <Text style={styles.utilitySubtitle}>Dữ liệu</Text>
              </Pressable>
            </View>
          </View>

          {/* ── Section: Không gian quản trị & Vận hành ── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>Không gian quản trị & Vận hành</Text>

            {/* ── Accordion Group 1: Nhân sự ── */}
            <View style={styles.accordionCard}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggleGroup('hr')}
              >
                <View style={styles.accordionIconBox}>
                  <MaterialCommunityIcons name="account-group-outline" size={22} color="#102739" />
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
                        title="Luân chuyển PB"
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
                  <MaterialCommunityIcons name="cube-outline" size={22} color="#102739" />
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
                      <FeatureItem
                        icon="robot"
                        iconType="mci"
                        title="Trợ lý AI"
                        onPress={() => router.push('/admin/ai-chat')}
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
                  <MaterialCommunityIcons name="cog-outline" size={22} color="#102739" />
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
                        title="Quyền & Xóa TK"
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
            <MaterialCommunityIcons name="logout-variant" size={18} color="#B91C1C" />
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
                  value={departmentName}
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
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editContactBtnText}>Chỉnh sửa thông tin</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modals hỗ trợ: Sửa hồ sơ, Đổi mật khẩu, Xóa tài khoản */}
      <EditProfileModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        initialFullName={user?.fullName || ''}
        initialPhone={user?.phone || ''}
        initialEmail={user?.email || ''}
      />
      <ChangePasswordModal visible={isChangingPassword} onClose={() => setIsChangingPassword(false)} />
      <DeleteAccountModal visible={isDeleting} onClose={() => setIsDeleting(false)} />
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
          <Ionicons name={icon as any} size={20} color="#0F172A" />
        ) : (
          <MaterialCommunityIcons name={icon as any} size={20} color="#0F172A" />
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
  scrollBody: {
    flex: 1,
  },
  scrollContent: {},

  /* ── Header (#102739) ── */
  headerContainer: {
    backgroundColor: '#102739',
    paddingHorizontal: 16,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCurve: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Profile Card ── */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  profileCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {},
  profileMetaCol: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  userDepartment: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  profileCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileStatCol: {
    flex: 1,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  profileStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },

  /* ── Body Content ── */
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* ── Thông tin cá nhân Card ── */
  personalInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  personalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E7F0F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personalTextWrap: {
    flex: 1,
  },
  personalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  personalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* ── Sections ── */
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },

  /* ── Utilities Row ── */
  utilitiesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  utilityCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  utilityIconWrap: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payslipIconBox: {
    width: 20,
    height: 26,
    borderRadius: 4,
    borderWidth: 1.8,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payslipDollarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: -1,
  },
  utilityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  utilitySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* ── Accordion Cards ── */
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E7F0F7',
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

  /* Accordion Body */
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
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
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
    paddingVertical: 7,
    paddingRight: 6,
  },
  featureIconWrap: {
    width: 24,
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

  /* ── Logout Button ── */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },

  /* ── Personal Info Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  infoModalCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  infoItemLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoItemValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  editContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#102739',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  editContactBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
