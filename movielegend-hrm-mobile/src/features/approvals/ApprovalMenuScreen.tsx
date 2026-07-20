import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '../../components/Screen';
import { spacing } from '../../theme/spacing';
import { useAuth } from '../../providers/AuthProvider';

export function ApprovalMenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const isAdmin = user?.roles?.includes('ADMIN');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0F172A" />
          </Pressable>
        </View>
        <Text style={styles.title}>Duyệt đơn từ</Text>

        <View style={styles.list}>
          <MenuRow 
            title="Duyệt yêu cầu" 
            icon="text-box-multiple-outline" 
            iconBg="#FCE7F3" 
            iconColor="#E11D48" 
            onPress={() => router.push('/leader/employee-requests' as any)} 
          />
          <MenuRow 
            title="Duyệt tài khoản" 
            icon="account-check" 
            iconBg="#FEF3C7" 
            iconColor="#D97706" 
            onPress={() => router.push('/leader/approvals/account' as any)} 
          />
          {!isAdmin && (
            <>
              <MenuRow 
                title="Yêu cầu VTTB" 
                icon="help" 
                iconBg="#FDF2F8" 
                iconColor="#DB2777" 
                onPress={() => router.push('/leader/material-issues' as any)} 
              />
              <MenuRow 
                title="Liên phòng ban" 
                icon="transit-connection-variant" 
                iconBg="#E0F2FE" 
                iconColor="#2563EB" 
                onPress={() => router.push('/leader/cross-department' as any)} 
              />
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function MenuRow({ icon, title, iconBg, iconColor, onPress }: any) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#64748B" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
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
    color: '#0F172A',
  }
});
