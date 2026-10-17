import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { useAuth } from '../../providers/AuthProvider';
import { roleBase } from '../../utils/notification-routing';
import { isUserInLiveDepartment } from '../../constants/app-registry';

export function ApprovalMenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const rawRoles = user?.roles || [];
  const userRoles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const roleCodes = userRoles.map((r: any) => (typeof r === 'string' ? r : r?.code || r?.name || '').toUpperCase());
  const userDeptName = ((user as any)?.departmentLinks?.[0]?.department?.name || user?.department?.name || '').toLowerCase();
  const isAdmin =
    roleCodes.includes('ADMIN') ||
    roleCodes.includes('SUPER_ADMIN') ||
    (user as any)?.role?.code === 'ADMIN';

  const isLiveDepartment = isUserInLiveDepartment(user);

  const isAccountantOrAdmin =
    isAdmin ||
    userDeptName.includes('kế toán') ||
    userDeptName.includes('tài chính') ||
    roleCodes.some((c: string) => c.includes('ACCOUNTANT') || c === 'KT' || c === 'KETOAN') ||
    roleCodes.includes('CHIEF_ACCOUNTANT') ||
    (user as any)?.role?.code === 'ACCOUNTANT';

  const isHr =
    roleCodes.includes('HR') ||
    roleCodes.includes('HUMAN_RESOURCE') ||
    roleCodes.includes('HR_MANAGER') ||
    userDeptName.includes('nhân sự') ||
    userDeptName.includes('hành chính') ||
    (user as any)?.role?.code === 'HR';

  const isFinancialReviewer = isAccountantOrAdmin || isHr;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#102739" translucent={false} />

      {/* 1. Header (Dark Navy #102739 with subtle wave in top-right) */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        {/* Subtle decorative wave in top right */}
        <View pointerEvents="none" style={styles.waveContainer}>
          <Svg width={200} height={120} viewBox="0 0 200 120">
            <Path
              d="M 50 -30 C 100 30, 140 65, 210 80 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.035)"
            />
            <Path
              d="M 85 -30 C 120 22, 155 48, 210 58 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.045)"
            />
            <Path
              d="M 120 -30 C 145 15, 175 30, 210 38 L 210 -30 Z"
              fill="rgba(255, 255, 255, 0.06)"
            />
          </Svg>
        </View>

        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`${roleBase(user)}/(tabs)` as any))}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Duyệt đơn từ</Text>
            <Text style={styles.subtitle}>Tập trung các yêu cầu cần xét duyệt</Text>
          </View>
        </View>
      </View>

      {/* 2. Main Curved Sheet Body */}
      <View style={styles.curvedSheet}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={28}
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

          {/* Navigation Cards List */}
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
                  size={24}
                  color="#102739"
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
                router.push(`${roleBase(user)}/approvals/account` as any)
              }
              android_ripple={{ color: '#F1F5F9' }}
            >
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={24}
                  color="#102739"
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
                  size={24}
                  color="#102739"
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

            {/* Item 4: Duyệt tài chính & Mua sắm (Accountant, Admin, HR) */}
            {isFinancialReviewer && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push(`${roleBase(user)}/financial-requests` as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="cash-check"
                    size={26}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>
                    {isAccountantOrAdmin ? 'Duyệt tài chính & Xuất Excel' : 'Đơn tài chính & Mua sắm'}
                  </Text>
                  <Text style={styles.menuCardSubtitle}>
                    {isAccountantOrAdmin
                      ? 'Thanh toán, mua sắm, tạm ứng & xuất bảng kê 13 cột'
                      : 'Đối chứng báo giá, nhận tiền & xác nhận hoàn tất mua hàng'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            )}

            {/* Item 5: Duyệt OT Live (chỉ Leader phòng Live hoặc Admin mới thấy) */}
            {(isLiveDepartment || isAdmin) && (
              <Pressable
                style={styles.menuCard}
                onPress={() => router.push('/leader/ot-report-approvals' as any)}
                android_ripple={{ color: '#F1F5F9' }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name="clock-check-outline"
                    size={24}
                    color="#102739"
                  />
                </View>
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardTitle}>Duyệt OT Live</Text>
                  <Text style={styles.menuCardSubtitle}>
                    Phê duyệt báo cáo tăng ca phiên Livestream
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102739',
  },
  header: {
    backgroundColor: '#102739',
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 3,
  },
  curvedSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102739',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 14,
    shadowColor: '#102739',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 2,
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E7F0F7',
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
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
});
