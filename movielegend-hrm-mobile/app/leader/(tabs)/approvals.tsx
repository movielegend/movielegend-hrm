import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../../../src/components/Screen';
import { PageHeader } from '../../../src/components/PageHeader';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function ApprovalsTabScreen() {
  const router = useRouter();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <PageHeader title="Duyệt đơn từ" subtitle="Trung tâm xử lý yêu cầu của nhân viên" />
        
        <View style={styles.grid}>
          <ApprovalCard 
            title="Duyệt yêu cầu" 
            icon="file-document-multiple-outline" 
            iconBg="#FEE2E2" 
            iconColor="#EF4444"
            onPress={() => router.push('/leader/employee-requests')}
          />
          <ApprovalCard 
            title="Duyệt tài khoản" 
            icon="account-check" 
            iconBg="#FEF3C7" 
            iconColor="#F59E0B"
            onPress={() => router.push('/leader/approvals')}
          />
          <ApprovalCard 
            title="Yêu cầu VTTB" 
            icon="box-check" 
            iconBg="#FCE7F3" 
            iconColor="#DB2777"
            onPress={() => router.push('/leader/material-issues')}
          />
          <ApprovalCard 
            title="Liên phòng ban" 
            icon="transit-connection-variant" 
            iconBg="#E0F2FE" 
            iconColor="#3B82F6"
            onPress={() => router.push('/leader/cross-department')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ApprovalCard({ title, icon, iconBg, iconColor, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cardIconBg, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grid: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
