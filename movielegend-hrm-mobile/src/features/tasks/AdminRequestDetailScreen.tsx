import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function AdminRequestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi Tiết Yêu Cầu</Text>
        <Pressable style={styles.headerIconBtn}>
          <Ionicons name="share-social-outline" size={24} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={colors.border} />
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>Nguyễn Văn An</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>Đang chờ</Text>
                </View>
              </View>
              <Text style={styles.userRole}>Nhân viên Marketing</Text>
              <Text style={styles.userMeta}>ID: #NV20230501 • Dept: Marketing</Text>
            </View>
          </View>
        </View>

        {/* Section: Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.muted} />
            <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
          </View>
          <View style={styles.detailsCard}>
            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>Loại yêu cầu</Text>
                <Text style={styles.value}>Nghỉ phép năm</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Tổng số ngày</Text>
                <Text style={styles.value}>03 Ngày</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.rowTwoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>Ngày bắt đầu</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.value}>15 Th10, 2023</Text>
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Ngày kết thúc</Text>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.value}>17 Th10, 2023</Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.reasonContainer}>
              <Text style={styles.label}>Lý do nghỉ</Text>
              <Text style={styles.reasonText}>
                "Giải quyết việc gia đình cá nhân và đi thăm họ hàng ở quê. Đã bàn giao công việc cho đồng nghiệp Trần Thu Thủy."
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Attachments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="attach-outline" size={20} color={colors.muted} />
            <Text style={styles.sectionTitle}>TỆP ĐÍNH KÈM (02)</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsScroll}>
            <View style={styles.attachmentCard}>
              <View style={styles.attachmentIconBox}>
                <Ionicons name="document-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.attachmentName}>Don_nghi_phep.pdf</Text>
                <Text style={styles.attachmentSize}>1.2 MB</Text>
              </View>
            </View>
            <View style={styles.attachmentCard}>
              <View style={styles.attachmentIconBox}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.attachmentName}>Minh_chung_viec_ban.jpg</Text>
                <Text style={styles.attachmentSize}>2.5 MB</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Section: Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.muted} />
            <Text style={styles.sectionTitle}>TIẾN ĐỘ PHÊ DUYỆT</Text>
          </View>
          <View style={styles.timelineCard}>
            
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLineActive} />
              <View style={styles.timelineIconActive}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRowTitle}>
                  <Text style={styles.timelineTitleActive}>Gửi yêu cầu</Text>
                  <Text style={styles.timelineTime}>08:30 - 12/10</Text>
                </View>
                <Text style={styles.timelineDesc}>Bởi Nguyễn Văn An</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLinePending} />
              <View style={styles.timelineIconPending}>
                <Ionicons name="time-outline" size={20} color={colors.warning} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRowTitle}>
                  <Text style={styles.timelineTitleActive}>Trưởng phòng xác nhận</Text>
                  <Text style={styles.timelineTime}>--:--</Text>
                </View>
                <Text style={styles.timelineDesc}>Đang chờ Lê Minh Tâm phê duyệt</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconPending}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.muted} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRowTitle}>
                  <Text style={styles.timelineTitlePending}>Giám đốc ký duyệt</Text>
                  <Text style={styles.timelineTime}>--:--</Text>
                </View>
                <Text style={styles.timelineDesc}>Bước cuối cùng</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Bottom spacer for fixed footer */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.footerContainer}>
        <View style={styles.secondaryActions}>
          <Pressable style={styles.btnReject}>
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.btnRejectText}>Từ chối</Text>
          </Pressable>
          <View style={{ width: spacing.md }} />
          <Pressable style={styles.btnModify}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.muted} />
            <Text style={styles.btnModifyText}>Sửa đổi</Text>
          </Pressable>
        </View>
        <Pressable style={styles.btnApprove}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.btnApproveText}>Phê duyệt ngay</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  userCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statusPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.muted,
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowTwoCols: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  reasonContainer: {},
  reasonText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.muted,
    lineHeight: 22,
  },
  attachmentsScroll: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  attachmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    width: 220,
  },
  attachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: colors.muted,
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  timelineLineActive: {
    position: 'absolute',
    left: 11,
    top: 28,
    bottom: -28,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineLinePending: {
    position: 'absolute',
    left: 11,
    top: 28,
    bottom: -28,
    width: 2,
    backgroundColor: colors.surface,
  },
  timelineIconActive: {
    width: 24,
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  timelineIconPending: {
    width: 24,
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  timelineRowTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timelineTitleActive: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  timelineTitlePending: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.muted,
  },
  timelineDesc: {
    fontSize: 13,
    color: colors.muted,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: colors.dangerSoft,
    gap: 8,
  },
  btnRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  btnModify: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  btnModifyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
  },
  btnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  btnApproveText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});
