import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuth } from '../../providers/AuthProvider';
import { roleBase } from '../../utils/notification-routing';

export function ApprovalMenuScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const rawRoles = user?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const userDeptName = (user?.departmentLinks?.[0]?.department?.name || user?.department?.name || '').toLowerCase();
  const isAdmin =
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN') ||
    user?.role?.code === 'ADMIN';

  const isAccountantOrAdmin =
    isAdmin ||
    userDeptName.includes('kế toán') ||
    userDeptName.includes('tài chính') ||
    roleCodes.includes('ACCOUNTANT') ||
    roleCodes.includes('ACCOUNTANT_LEAD') ||
    roleCodes.includes('CHIEF_ACCOUNTANT') ||
    user?.role?.code === 'ACCOUNTANT';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header (Back button + Title + Subtitle on same line) */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/(tabs)' as any))}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>
          <Text style={styles.title}>Duyệt đơn từ</Text>
        </View>
        <Text style={styles.subtitle}>Tập trung các yêu cầu cần xét duyệt</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Hero Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={30}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Không gian phê duyệt</Text>
            <Text style={styles.heroSubtitle}>
              Chọn nhóm yêu cầu để bắt đầu
            </Text>
          </View>
        </View>

        {/* 3. Navigation Cards List */}
        <View style={styles.menuList}>
          {/* Item 1: Duyệt yêu cầu */}
          <Pressable
            style={styles.menuCard}
            onPress={() => router.push(`${roleBase(user)}/employee-requests` as any)}
            android_ripple={{ color: '#F1F5F9' }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={22}
                color="#166534"
              />
            </View>
            <View style={styles.menuCardInfo}>
              <Text style={styles.menuCardTitle}>Duyệt yêu cầu</Text>
              <Text style={styles.menuCardSubtitle}>
                Nghỉ phép, giải trình công, thanh toán
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* Item 2: Duyệt tài khoản */}
          <Pressable
            style={styles.menuCard}
            onPress={() =>
              router.push(
                isAdmin
                  ? '/admin/approvals'
                  : (`${roleBase(user)}/approvals/account` as any)
              )
            }
            android_ripple={{ color: '#F1F5F9' }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={22}
                color="#166534"
              />
            </View>
            <View style={styles.menuCardInfo}>
              <Text style={styles.menuCardTitle}>Duyệt tài khoản</Text>
              <Text style={styles.menuCardSubtitle}>
                Xét duyệt đăng ký nhân viên mới
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* Item 3: Liên phòng ban */}
          <Pressable
            style={styles.menuCard}
            onPress={() => router.push(`${roleBase(user)}/cross-department` as any)}
            android_ripple={{ color: '#F1F5F9' }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={22}
                color="#166534"
              />
            </View>
            <View style={styles.menuCardInfo}>
              <Text style={styles.menuCardTitle}>Liên phòng ban</Text>
              <Text style={styles.menuCardSubtitle}>
                Theo dõi luân chuyển và phối hợp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {/* Item 4: Duyệt tài chính & Xuất Excel */}
          {isAccountantOrAdmin && (
            <Pressable
              style={styles.menuCard}
              onPress={() => router.push(`${roleBase(user)}/financial-requests` as any)}
              android_ripple={{ color: '#F1F5F9' }}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons
                  name="cash-register"
                  size={22}
                  color="#059669"
                />
              </View>
              <View style={styles.menuCardInfo}>
                <Text style={styles.menuCardTitle}>Duyệt tài chính & Xuất Excel</Text>
                <Text style={styles.menuCardSubtitle}>
                  Thanh toán, mua sắm, tạm ứng & xuất bảng kê 13 cột
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 32,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B382B', // Deep forest green
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF5EE', // Soft mint green
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardInfo: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
