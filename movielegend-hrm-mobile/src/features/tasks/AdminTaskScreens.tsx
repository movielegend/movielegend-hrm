import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image, Modal, TouchableWithoutFeedback } from 'react-native';
import { Screen } from '../../components/Screen';
import { DateRangeModal } from '../../components/DateRangeModal';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function AdminTaskListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [filterVisible, setFilterVisible] = useState(false);
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date(2023, 9, 1));
    const [endDate, setEndDate] = useState<Date | null>(new Date(2023, 9, 31));

  
  const tabs = [
    { id: 'PENDING', label: 'Yêu cầu', count: 1 },
    { id: 'APPROVED', label: 'Chấp thuận', count: 0 },
    { id: 'REJECTED', label: 'Từ chối', count: 0 },
  ];

  return (
    <Screen>
      <View style={listStyles.container}>
        <View style={listStyles.headerContainer}>
          <View style={listStyles.topHeader}>
            <Pressable onPress={() => router.back()} style={listStyles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
            <Text style={listStyles.headerTitle}>Phê duyệt công việc</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={listStyles.tabsWrapper}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[listStyles.tabPill, isActive && listStyles.tabPillActive]}
                >
                  <Text style={[listStyles.tabText, isActive && listStyles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[listStyles.badge, isActive ? listStyles.badgeActive : listStyles.badgeInactive]}>
                    <Text style={[listStyles.badgeText, isActive && listStyles.badgeTextActive]}>{tab.count}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={listStyles.filterBar}>
            <Pressable style={listStyles.filterBtn} onPress={() => setDateFilterVisible(true)}>
              <Ionicons name="calendar-outline" size={16} color={colors.muted} />
              <Text style={listStyles.filterText}>Lọc theo ngày</Text>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </Pressable>
            <Pressable style={[listStyles.filterBtn, listStyles.filterBtnActive]} onPress={() => setFilterVisible(true)}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={listStyles.filterTextActive}>Bộ lọc</Text>
            </Pressable>
          </View>
        </View>

        {/* Task List */}
        <ScrollView contentContainerStyle={listStyles.listContent}>
          <Pressable style={listStyles.card} onPress={() => router.push('/admin/requests/1')}>
            <View style={listStyles.cardHeader}>
              <View style={listStyles.priorityBadge}>
                <Ionicons name="flag" size={12} color={colors.danger} />
                <Text style={listStyles.priorityText}>CAO</Text>
              </View>
              <Pressable>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={listStyles.cardTitle}>Phê duyệt kế hoạch truyền thông quý 3</Text>

            <View style={listStyles.metaRow}>
              <View style={listStyles.metaItem}>
                <Ionicons name="time-outline" size={16} color={colors.muted} />
                <Text style={listStyles.metaText}>Hôm nay, 17:00</Text>
              </View>
              <View style={listStyles.metaItem}>
                <Ionicons name="chatbubble-outline" size={16} color={colors.muted} />
                <Text style={listStyles.metaText}>4 bình luận</Text>
              </View>
            </View>

            <View style={listStyles.assigneeRow}>
              <View style={listStyles.avatar}>
                <Ionicons name="person" size={14} color="#fff" />
              </View>
              <Text style={listStyles.assigneeText}>
                <Text style={{ color: colors.muted }}>Giao cho: </Text>Nguyễn Văn A
              </Text>
            </View>

            <View style={listStyles.actionRow}>
              <Pressable style={[listStyles.actionBtn, listStyles.actionBtnLeft]}>
                <Ionicons name="close" size={18} color={colors.danger} />
                <Text style={[listStyles.actionText, { color: colors.danger }]}>Từ chối</Text>
              </Pressable>
              <View style={listStyles.actionDivider} />
              <Pressable style={[listStyles.actionBtn, listStyles.actionBtnRight]}>
                <Ionicons name="checkmark" size={18} color={colors.primary} />
                <Text style={[listStyles.actionText, { color: colors.primary }]}>Chấp nhận</Text>
              </Pressable>
            </View>
          </Pressable>
        </ScrollView>
        
        {/* Filter Modal */}
        <Modal visible={filterVisible} animationType="slide" transparent={true}>
          <View style={listStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
              <View style={listStyles.modalBackdrop} />
            </TouchableWithoutFeedback>
            <View style={listStyles.modalContent}>
              <View style={listStyles.modalHeader}>
                <Text style={listStyles.modalTitle}>Bộ lọc nâng cao</Text>
                <Pressable onPress={() => setFilterVisible(false)} style={listStyles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
              
              <ScrollView style={listStyles.modalScroll}>
                {/* Lọc nhân viên */}
                <View style={listStyles.filterSection}>
                  <Text style={listStyles.filterSectionTitle}>Nhân viên</Text>
                  <View style={listStyles.filterInputBox}>
                    <Text style={listStyles.filterInputText}>Chọn nhân viên</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.muted} />
                  </View>
                </View>

                {/* Lọc Loại yêu cầu */}
                <View style={listStyles.filterSection}>
                  <Text style={listStyles.filterSectionTitle}>Loại yêu cầu</Text>
                  <View style={listStyles.filterInputBox}>
                    <Text style={listStyles.filterInputText}>Tất cả loại yêu cầu</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.muted} />
                  </View>
                </View>

                {/* Lọc Phòng ban */}
                <View style={listStyles.filterSection}>
                  <Text style={listStyles.filterSectionTitle}>Phòng ban</Text>
                  <View style={listStyles.filterInputBox}>
                    <Text style={listStyles.filterInputText}>Tất cả phòng ban</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.muted} />
                  </View>
                </View>

                {/* Lọc Chi nhánh */}
                <View style={listStyles.filterSection}>
                  <Text style={listStyles.filterSectionTitle}>Chi nhánh</Text>
                  <View style={listStyles.filterInputBox}>
                    <Text style={listStyles.filterInputText}>Tất cả chi nhánh</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.muted} />
                  </View>
                </View>

                {/* Lọc Người duyệt */}
                <View style={listStyles.filterSection}>
                  <Text style={listStyles.filterSectionTitle}>Người duyệt</Text>
                  <View style={listStyles.filterInputBox}>
                    <Text style={listStyles.filterInputText}>Chọn người duyệt</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.muted} />
                  </View>
                </View>
                
                <View style={{ height: 20 }} />
              </ScrollView>
              
              <View style={listStyles.modalFooter}>
                <Pressable style={listStyles.modalBtnReset}>
                  <Text style={listStyles.modalBtnResetText}>Thiết lập lại</Text>
                </Pressable>
                <Pressable style={listStyles.modalBtnApply} onPress={() => setFilterVisible(false)}>
                  <Text style={listStyles.modalBtnApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Filter Modal */}
                
        <DateRangeModal 
          visible={dateFilterVisible} 
          onClose={() => setDateFilterVisible(false)}
          initialStart={startDate}
          initialEnd={endDate}
          onConfirm={(start: Date | null, end: Date | null) => {
            setStartDate(start);
            setEndDate(end);
            setDateFilterVisible(false);
          }}
        />

      </View>
    </Screen>
  );
}

export function AdminTaskDetailScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={detailStyles.container}>
        {/* Header */}
        <View style={detailStyles.header}>
          <Pressable onPress={() => router.back()} style={detailStyles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#0284C7" />
          </Pressable>
          <Text style={detailStyles.headerTitle}>Chi Tiết Yêu Cầu</Text>
          <Pressable style={detailStyles.iconBtn}>
            <Ionicons name="share-social-outline" size={24} color="#94A3B8" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={detailStyles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={detailStyles.profileCard}>
            <View style={detailStyles.avatarContainer}>
              <View style={detailStyles.avatarLarge}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
              <View style={detailStyles.onlineDot} />
            </View>
            <View style={detailStyles.profileInfo}>
              <View style={detailStyles.nameRow}>
                <Text style={detailStyles.name}>Nguyễn Văn An</Text>
                <View style={detailStyles.statusPill}>
                  <Text style={detailStyles.statusText}>Đang chờ</Text>
                </View>
              </View>
              <Text style={detailStyles.roleText}>Nhân viên Marketing</Text>
              <Text style={detailStyles.idText}>ID: #NV20230501 • Dept: Marketing</Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#60A5FA" />
              <Text style={detailStyles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>
            </View>
            <View style={detailStyles.detailBox}>
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailCol}>
                  <Text style={detailStyles.detailLabel}>Loại yêu cầu</Text>
                  <Text style={detailStyles.detailValue}>Nghỉ phép năm</Text>
                </View>
                <View style={detailStyles.detailCol}>
                  <Text style={detailStyles.detailLabel}>Tổng số ngày</Text>
                  <Text style={detailStyles.detailValue}>03 Ngày</Text>
                </View>
              </View>
              
              <View style={detailStyles.detailDivider} />
              
              <View style={detailStyles.detailRow}>
                <View style={detailStyles.detailCol}>
                  <Text style={detailStyles.detailLabel}>Ngày bắt đầu</Text>
                  <View style={detailStyles.dateWrap}>
                    <Ionicons name="calendar-outline" size={16} color="#60A5FA" />
                    <Text style={detailStyles.detailValue}>15 Th10, 2023</Text>
                  </View>
                </View>
                <View style={detailStyles.detailCol}>
                  <Text style={detailStyles.detailLabel}>Ngày kết thúc</Text>
                  <View style={detailStyles.dateWrap}>
                    <Ionicons name="calendar-outline" size={16} color="#60A5FA" />
                    <Text style={detailStyles.detailValue}>17 Th10, 2023</Text>
                  </View>
                </View>
              </View>

              <View style={detailStyles.detailDivider} />
              
              <View style={detailStyles.detailReasonCol}>
                <Text style={detailStyles.detailLabel}>Lý do nghỉ</Text>
                <Text style={detailStyles.detailReasonText}>
                  "Giải quyết việc gia đình cá nhân và đi thăm họ hàng ở quê. Đã bàn giao công việc cho đồng nghiệp Trần Thu Thủy."
                </Text>
              </View>
            </View>
          </View>

          {/* Attachments Section */}
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="attach" size={20} color="#60A5FA" />
              <Text style={detailStyles.sectionTitle}>TỆP ĐÍNH KÈM (02)</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detailStyles.attachmentScroll}>
              <View style={detailStyles.attachmentCard}>
                <View style={detailStyles.fileIconBox}>
                  <Ionicons name="document-text" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={detailStyles.fileName} numberOfLines={1}>Don_nghi_phep.pdf</Text>
                  <Text style={detailStyles.fileSize}>1.2 MB</Text>
                </View>
              </View>
              <View style={detailStyles.attachmentCard}>
                <View style={detailStyles.fileIconBox}>
                  <Ionicons name="image" size={20} color="#0284C7" />
                </View>
                <View>
                  <Text style={detailStyles.fileName} numberOfLines={1}>Minh_chung_viec...</Text>
                  <Text style={detailStyles.fileSize}>2.5 MB</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Timeline Section */}
          <View style={detailStyles.section}>
            <View style={detailStyles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#60A5FA" />
              <Text style={detailStyles.sectionTitle}>TIẾN ĐỘ PHÊ DUYỆT</Text>
            </View>
            <View style={detailStyles.timelineBox}>
              
              {/* Step 1 */}
              <View style={detailStyles.timelineRow}>
                <View style={detailStyles.timelineIconCol}>
                  <View style={detailStyles.timelineIconCircle}>
                    <Ionicons name="checkmark" size={14} color="#1E293B" />
                  </View>
                  <View style={detailStyles.timelineLine} />
                </View>
                <View style={detailStyles.timelineContent}>
                  <Text style={detailStyles.timelineTitle}>Gửi yêu cầu</Text>
                  <Text style={detailStyles.timelineDesc}>Bởi Nguyễn Văn An</Text>
                </View>
                <Text style={detailStyles.timelineTime}>08:30 - 12/10</Text>
              </View>

              {/* Step 2 */}
              <View style={detailStyles.timelineRow}>
                <View style={detailStyles.timelineIconCol}>
                  <View style={detailStyles.timelineIconCircle}>
                    <Ionicons name="time-outline" size={14} color="#1E293B" />
                  </View>
                  <View style={detailStyles.timelineLine} />
                </View>
                <View style={detailStyles.timelineContent}>
                  <Text style={detailStyles.timelineTitle}>Trưởng phòng xác nhận</Text>
                  <Text style={detailStyles.timelineDesc}>Đang chờ Lê Minh Tâm phê duyệt</Text>
                </View>
                <Ionicons name="remove" size={16} color="#CBD5E1" />
              </View>

              {/* Step 3 */}
              <View style={[detailStyles.timelineRow, { paddingBottom: 0 }]}>
                <View style={detailStyles.timelineIconCol}>
                  <View style={[detailStyles.timelineIconCircle, { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="alert" size={14} color="#94A3B8" />
                  </View>
                </View>
                <View style={detailStyles.timelineContent}>
                  <Text style={[detailStyles.timelineTitle, { color: '#64748B' }]}>Giám đốc ký duyệt</Text>
                  <Text style={detailStyles.timelineDesc}>Bước cuối cùng</Text>
                </View>
                <Ionicons name="remove" size={16} color="#CBD5E1" />
              </View>

            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={detailStyles.bottomBar}>
          <View style={detailStyles.bottomRow1}>
            <Pressable style={detailStyles.btnReject}>
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
              <Text style={detailStyles.btnRejectText}>Từ chối</Text>
            </Pressable>
            <Pressable style={detailStyles.btnEdit}>
              <Ionicons name="information-circle-outline" size={18} color="#1E293B" />
              <Text style={detailStyles.btnEditText}>Sửa đổi</Text>
            </Pressable>
          </View>
          <Pressable style={detailStyles.btnApprove}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={detailStyles.btnApproveText}>Phê duyệt ngay</Text>
          </Pressable>
        </View>

      </View>
    </Screen>
  );
}

const listStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  iconBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: spacing.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeInactive: {
    backgroundColor: colors.border,
  },
  badgeActive: {
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  badgeTextActive: {
    color: colors.primary,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  filterTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '500',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 48,
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnLeft: {
    borderBottomLeftRadius: 16,
  },
  actionBtnRight: {
    borderBottomRightRadius: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  filterInputText: {
    fontSize: 14,
    color: colors.muted,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  modalBtnReset: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnResetText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
  modalBtnApply: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalBtnApplyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  mockCalendar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
  },
  mockCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  mockCalendarMonth: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mockCalendarDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  mockCalendarDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  mockCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mockCalendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mockCalendarCellSelected: {
    backgroundColor: colors.primary,
  },
  mockCalendarCellBetween: {
    backgroundColor: colors.primarySoft,
  },
  mockCalendarCellText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  mockCalendarCellTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  mockCalendarCellTextBetween: {
    color: colors.primary,
    fontWeight: '600',
  },
});

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  content: {
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F8FAFC',
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  roleText: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '500',
    marginBottom: 4,
  },
  idText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  detailBox: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailCol: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailReasonCol: {
    gap: 8,
  },
  detailReasonText: {
    fontSize: 14,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  attachmentScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    width: 200,
    gap: 12,
  },
  fileIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    width: 120,
  },
  fileSize: {
    fontSize: 11,
    color: '#94A3B8',
  },
  timelineBox: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingBottom: 24,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: -24, // connect to next
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  timelineTime: {
    fontSize: 11,
    color: '#64748B',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24, // Safe area assuming
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  bottomRow1: {
    flexDirection: 'row',
    gap: 12,
  },
  btnReject: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  btnRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  btnEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  btnEditText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  btnApprove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0EA5E9',
    gap: 8,
  },
  btnApproveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
