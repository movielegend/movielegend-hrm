import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DepartmentMemberContribution {
  id: string;
  name: string;
  role: string;
  assignedTasks: number;
  completedTaskRate: number; // e.g. 96 (%)
  overdueRate: number; // e.g. 4 (%)
  directRevenue: number; // e.g. 1200000000 (VND)
  teamContributionRate: number; // e.g. 40 (%)
  rating360: number; // e.g. 4.9
}

export const DepartmentCompetitionScreen: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<'LIVESTREAM' | 'HR' | 'WAREHOUSE' | 'CSKH' | 'MKT'>('LIVESTREAM');

  // Member data for drill-down view
  const members: DepartmentMemberContribution[] = [];

  const top1 = members[0];
  const top2 = members[1];
  const top3 = members[2];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="trophy-sharp" size={28} color="#D97706" />
          <Text style={styles.headerTitle}>Chương Trình Thi Đua Phòng Ban</Text>
        </View>

        {/* Department Tab Switcher */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <TouchableOpacity
            style={[styles.tabItem, selectedDept === 'LIVESTREAM' && styles.tabActive]}
            onPress={() => setSelectedDept('LIVESTREAM')}
          >
            <Text style={[styles.tabText, selectedDept === 'LIVESTREAM' && styles.tabTextActive]}>📹 Livestream</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, selectedDept === 'CSKH' && styles.tabActive]}
            onPress={() => setSelectedDept('CSKH')}
          >
            <Text style={[styles.tabText, selectedDept === 'CSKH' && styles.tabTextActive]}>🎧 CSKH</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, selectedDept === 'HR' && styles.tabActive]}
            onPress={() => setSelectedDept('HR')}
          >
            <Text style={[styles.tabText, selectedDept === 'HR' && styles.tabTextActive]}>🤝 HR Nhân sự</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, selectedDept === 'WAREHOUSE' && styles.tabActive]}
            onPress={() => setSelectedDept('WAREHOUSE')}
          >
            <Text style={[styles.tabText, selectedDept === 'WAREHOUSE' && styles.tabTextActive]}>📦 Kho & Tài sản</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, selectedDept === 'MKT' && styles.tabActive]}
            onPress={() => setSelectedDept('MKT')}
          >
            <Text style={[styles.tabText, selectedDept === 'MKT' && styles.tabTextActive]}>📢 Marketing</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Podium Leaderboard */}
        {members.length > 0 ? (
          <View style={styles.podiumSection}>
            <Text style={styles.sectionTitle}>🏆 Bảng Xếp Hạng Top 3 Phong Hiệu</Text>
            
            <View style={styles.podiumRow}>
              {/* Rank 2 */}
              <View style={styles.podiumItem}>
                <Ionicons name="medal" size={32} color="#9CA3AF" />
                <Text style={styles.podiumName}>{top2?.name || '---'}</Text>
                <Text style={styles.podiumRole}>{top2?.role || ''}</Text>
                <View style={[styles.podiumBar, { height: 70, backgroundColor: '#E5E7EB' }]}>
                  <Text style={styles.podiumRank}>#2</Text>
                </View>
              </View>

              {/* Rank 1 */}
              <View style={styles.podiumItem}>
                <Ionicons name="crown" size={40} color="#D97706" />
                <Text style={[styles.podiumName, { color: '#B45309', fontWeight: 'bold' }]}>{top1?.name || '---'}</Text>
                <Text style={styles.podiumRole}>{top1?.role || ''}</Text>
                <View style={[styles.podiumBar, { height: 95, backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.podiumRank, { color: '#B45309' }]}>#1</Text>
                </View>
              </View>

              {/* Rank 3 */}
              <View style={styles.podiumItem}>
                <Ionicons name="medal" size={32} color="#D97706" />
                <Text style={styles.podiumName}>{top3?.name || '---'}</Text>
                <Text style={styles.podiumRole}>{top3?.role || ''}</Text>
                <View style={[styles.podiumBar, { height: 55, backgroundColor: '#FFEDD5' }]}>
                  <Text style={styles.podiumRank}>#3</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Team Member Drill-down Contribution Table */}
        <View style={styles.drilldownSection}>
          <Text style={styles.sectionTitle}>📊 Chi Tiết Đóng Góp Cá Nhân Trong Team</Text>

          {members.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trophy-outline" size={48} color="#9CA3AF" />
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, fontWeight: '500' }}>
                Chưa có dữ liệu thi đua phòng ban.
              </Text>
            </View>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberHeaderRow}>
                  <View style={styles.memberInfoGroup}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={[styles.roleBadge, member.role.includes('Leader') ? styles.leaderBadge : styles.staffBadge]}>
                      <Text style={styles.roleText}>{member.role}</Text>
                    </View>
                  </View>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={14} color="#D97706" />
                    <Text style={styles.ratingText}>{member.rating360} / 5</Text>
                  </View>
                </View>

                <View style={styles.metricGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Tỷ lệ Hoàn thành Task</Text>
                    <Text style={styles.metricValueGreen}>{member.completedTaskRate}%</Text>
                    <Text style={styles.metricSub}>({member.assignedTasks} Task được giao)</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Tỷ lệ Trễ hạn Task</Text>
                    <Text style={member.overdueRate > 10 ? styles.metricValueRed : styles.metricValueGray}>
                      {member.overdueRate}%
                    </Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Doanh số Tác động</Text>
                    <Text style={styles.metricValueBold}>{(member.directRevenue / 1000000).toLocaleString()} tr</Text>
                  </View>

                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>% Đóng góp vào Team</Text>
                    <Text style={styles.metricValueOrange}>{member.teamContributionRate}%</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tabScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#2563EB',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  battleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  battleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  battleProgressBarBg: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  battleProgressHn: {
    backgroundColor: '#2563EB',
    height: '100%',
  },
  battleProgressHcm: {
    backgroundColor: '#DC2626',
    height: '100%',
  },
  battleTeamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  battleTeamBox: {
    flex: 1,
  },
  teamHnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  teamHcmText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  battleRevenue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  battleSub: {
    fontSize: 10,
    color: '#6B7280',
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  podiumSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  podiumItem: {
    alignItems: 'center',
    width: '30%',
  },
  podiumName: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 4,
  },
  podiumRole: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  drilldownSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
  },
  drilldownSub: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leaderBadge: {
    backgroundColor: '#FFEDD5',
  },
  staffBadge: {
    backgroundColor: '#E0E7FF',
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#C2410C',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  metricValueGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 2,
  },
  metricValueRed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  metricValueGray: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 2,
  },
  metricValueBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
  },
  metricValueOrange: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EA580C',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9,
    color: '#9CA3AF',
  },
});
