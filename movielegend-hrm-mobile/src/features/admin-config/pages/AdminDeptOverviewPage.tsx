import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export interface DepartmentSummaryItem {
  id: string;
  name: string;
  totalLevels: number;
  topRewardName: string;
}

interface AdminDeptOverviewPageProps {
  departments: DepartmentSummaryItem[];
  selectedDeptId: string;
  onSelectDepartment: (deptId: string) => void;
  onNextToRewards: () => void;
}

export const AdminDeptOverviewPage: React.FC<AdminDeptOverviewPageProps> = ({
  departments,
  selectedDeptId,
  onSelectDepartment,
  onNextToRewards,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.sectionHeaderTitle}>CHỌN PHÒNG BAN CẦN QUẢN LÝ CẤU HÌNH:</Text>

      <View style={styles.deptGrid}>
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDeptId;
          return (
            <TouchableOpacity
              key={dept.id}
              style={[styles.deptCard, isSelected && styles.deptCardSelected]}
              onPress={() => onSelectDepartment(dept.id)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.deptName, isSelected && styles.deptNameSelected]}>
                  {dept.name}
                </Text>
                {isSelected && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>Đang chọn</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số Cấp Bậc:</Text>
                <Text style={styles.infoValue}>{dept.totalLevels} Level</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quà Thưởng Cao Nhất:</Text>
                <Text style={styles.rewardValue} numberOfLines={1}>
                  {dept.topRewardName}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, isSelected && styles.actionBtnSelected]}
                onPress={() => {
                  onSelectDepartment(dept.id);
                  onNextToRewards();
                }}
              >
                <Text style={[styles.actionBtnText, isSelected && styles.actionBtnTextSelected]}>
                  Cấu Hình Quà & Dự Án →
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  deptGrid: {
    gap: 12,
  },
  deptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptCardSelected: {
    borderColor: '#1E40AF',
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deptName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  deptNameSelected: {
    color: '#1E40AF',
  },
  activeTag: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400E',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  actionBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionBtnSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  actionBtnTextSelected: {
    color: '#FFFFFF',
  },
});
