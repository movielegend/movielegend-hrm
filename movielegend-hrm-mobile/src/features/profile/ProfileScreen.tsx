import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { useRouter } from 'expo-router';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <Pressable style={styles.headerIcon}>
          <Ionicons name="settings-outline" size={24} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userInfoSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80' }} 
              style={styles.avatar} 
            />
            <View style={styles.statusDot} />
          </View>
          
          <Text style={styles.userName}>{user?.fullName || 'Phùng Thanh Bình'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'binh.pt@workflow.vn'}</Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Trưởng nhóm</Text>
            </View>
            <View style={styles.secondaryBadge}>
              <Ionicons name="business-outline" size={12} color="#1E293B" style={{ marginRight: 4 }} />
              <Text style={styles.secondaryBadgeText}>{user?.department?.name || 'Phòng Công nghệ'}</Text>
            </View>
          </View>
        </View>

        {/* Tiện ích nhanh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIỆN ÍCH NHANH</Text>
          <View style={styles.grid}>
            {/* Phieu luong */}
            <Pressable style={styles.gridItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="card-outline" size={24} color="#16A34A" />
              </View>
              <View style={styles.gridItemContent}>
                 <Text style={styles.gridItemTitle}>Phiếu lương</Text>
                 <Text style={styles.gridItemDesc}>Tháng 10/2023</Text>
              </View>
            </Pressable>

            {/* Tai lieu */}
            <Pressable style={styles.gridItem}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.gridItemContent}>
                 <Text style={styles.gridItemTitle}>Tài liệu</Text>
                 <Text style={styles.gridItemDesc}>Hợp đồng, Quyết định</Text>
              </View>
            </Pressable>

            {/* Thong bao */}
            <Pressable style={styles.gridItem}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="notifications-outline" size={24} color="#EA580C" />
              </View>
              <View style={styles.gridItemContent}>
                 <Text style={styles.gridItemTitle}>Thông báo</Text>
                 <Text style={styles.gridItemDesc}>2 tin mới</Text>
              </View>
            </Pressable>

            {/* Ho tro */}
            <Pressable style={styles.gridItem}>
              <View style={[styles.iconBox, { backgroundColor: '#F7FEE7' }]}>
                <Ionicons name="help-circle-outline" size={24} color="#65A30D" />
              </View>
              <View style={styles.gridItemContent}>
                 <Text style={styles.gridItemTitle}>Hỗ trợ</Text>
                 <Text style={styles.gridItemDesc}>Gửi yêu cầu trợ giúp</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Cài đặt hệ thống */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>CÀI ĐẶT HỆ THỐNG</Text>
          <View style={styles.listContainer}>
            
            <Pressable style={styles.listItem}>
              <View style={[styles.listIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Thông báo</Text>
                <Text style={styles.listItemDesc}>Âm thanh, Rung, Ưu tiên</Text>
              </View>
              <View style={styles.redBadge}>
                <Text style={styles.redBadgeText}>2</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.listItem}>
              <View style={[styles.listIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Bảo mật & Quyền</Text>
                <Text style={styles.listItemDesc}>Mật khẩu, FaceID, Quyền hạn</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.listItem}>
              <View style={[styles.listIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="globe-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Ngôn ngữ</Text>
                <Text style={styles.listItemDesc}>Tiếng Việt (Mặc định)</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

          </View>
        </View>

        {/* Other settings */}
        <View style={styles.listSection}>
          <View style={styles.listContainer}>
            <Pressable style={styles.listItem}>
              <View style={[styles.listIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Hướng dẫn sử dụng</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemDesc}>Phiên bản ứng dụng</Text>
              </View>
              <Text style={styles.listItemDesc}>v2.4.0 (Build 108)</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerIcon: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userInfoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F0F4F8',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    borderWidth: 4,
    borderColor: '#F0F4F8',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryBadgeText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridItemContent: {
    gap: 4,
  },
  gridItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  gridItemDesc: {
    fontSize: 11,
    color: '#94A3B8',
  },
  listSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  listItemDesc: {
    fontSize: 13,
    color: '#94A3B8',
  },
  redBadge: {
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  redBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 72,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
