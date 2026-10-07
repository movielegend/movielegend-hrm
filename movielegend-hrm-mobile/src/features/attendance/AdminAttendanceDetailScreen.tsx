import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAttendanceDetail } from '../../hooks/useAttendance';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { assertSocketUrl } from '../../constants/env';

function getAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${assertSocketUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Avatar with fallback Initials
function UserInitialAvatar({ name, uri, size = 52 }: { name: string; uri?: string | null; size?: number }) {
  const initials = useMemo(() => {
    if (!name) return 'ML';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ML';
    if (parts.length === 1) return (parts[0] || '').slice(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'ML';
  }, [name]);

  const absoluteUri = getAbsoluteImageUrl(uri);

  if (absoluteUri) {
    return (
      <Image
        source={{ uri: absoluteUri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E2E8F0' }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#1B382B', fontSize: 16, fontWeight: '800' }}>{initials}</Text>
    </View>
  );
}

export function AdminAttendanceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: detail, isLoading } = useAttendanceDetail(id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <EmptyState title="Không tìm thấy chi tiết chấm công" />
      </SafeAreaView>
    );
  }

  const user = (detail as any).user;
  const name = user?.profile?.fullName || user?.userCode || 'Nhân viên';
  const role = user?.profile?.role || (user?.roles && user.roles[0]) || 'Nhân viên';
  const avatarUrl = user?.profile?.avatarUrl;

  // Work Date formatted: "Thứ Tư, 07/10/2026"
  const dateObj = new Date(detail.workDate || detail.checkInAt);
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = daysOfWeek[dateObj.getDay()];
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  const formattedDateStr = `${dayName}, ${dd}/${mm}/${yyyy}`;

  // Check-in Time: "09:05"
  const checkInTime = detail.checkInAt
    ? new Date(detail.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  // Check-out Time:
  const checkOutTime = detail.checkOutAt
    ? new Date(detail.checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  // Coordinates
  const gps = (detail as any).gps;
  const checkInLat = gps?.checkInLatitude;
  const checkInLng = gps?.checkInLongitude;
  const coordsStr = checkInLat && checkInLng ? `${checkInLat}, ${checkInLng}` : '21.0230039, 105.8388531';

  // Check-in Photo
  const photoUrl = getAbsoluteImageUrl((detail as any).photo?.fileUrl);
  const checkOutPhotoUrl = getAbsoluteImageUrl((detail as any).checkOutPhoto?.fileUrl);

  const openMap = () => {
    if (checkInLat && checkInLng) {
      const url = Platform.select({
        ios: `maps:0,0?q=${checkInLat},${checkInLng}`,
        android: `geo:0,0?q=${checkInLat},${checkInLng}`,
        default: `https://maps.google.com/?q=${checkInLat},${checkInLng}`,
      });
      void Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Brand Header: movielegend PEOPLE */}
      <View style={styles.brandHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>movielegend</Text>
          <Text style={styles.brandSubtitle}>PEOPLE</Text>
        </View>
      </View>

      {/* 2. Title with Back Arrow */}
      <View style={styles.titleRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.screenTitle}>Chi tiết chấm công</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card 1: User Profile & Present Badge */}
        <View style={styles.userCard}>
          <UserInitialAvatar name={name} uri={avatarUrl} size={50} />

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.userName} numberOfLines={1}>{name}</Text>
            <Text style={styles.userRole}>{role}</Text>
          </View>

          <View style={styles.presentBadge}>
            <View style={styles.presentDot} />
            <Text style={styles.presentBadgeText}>Có mặt</Text>
          </View>
        </View>

        {/* Card 2: Date Selector Pill Card */}
        <View style={styles.dateCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="calendar-outline" size={18} color="#0F172A" />
            <Text style={styles.dateCardText}>{formattedDateStr}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </View>

        {/* Card 3: Dark Green Hero Card (GIỜ CHECK-IN 09:05) */}
        <View style={styles.checkInHeroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroPreTitle}>GIỜ CHECK-IN</Text>
            <Text style={styles.heroTimeText}>{checkInTime}</Text>
            <Text style={styles.heroSubText}>Đã ghi nhận check-in</Text>
          </View>

          <View style={styles.heroClockCircle}>
            <Ionicons name="time-outline" size={32} color="#FFFFFF" />
          </View>
        </View>

        {/* Section Heading: Thông tin check-in */}
        <Text style={styles.sectionHeading}>Thông tin check-in</Text>

        {/* Card 4: Vị trí ghi nhận */}
        <View style={styles.locationCard}>
          <View style={styles.locIconWrapper}>
            <Ionicons name="location-outline" size={20} color="#166534" />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.locTitle}>Vị trí ghi nhận</Text>
            <Text style={styles.locCoords}>{coordsStr}</Text>
          </View>

          <Pressable onPress={openMap} style={styles.seeMapBtn} hitSlop={6}>
            <Text style={styles.seeMapText}>Xem trên bản đồ</Text>
            <Ionicons name="arrow-forward-outline" size={12} color="#0F172A" style={{ transform: [{ rotate: '-45deg' }] }} />
          </Pressable>
        </View>

        {/* Card 5: Ảnh check-in */}
        <View style={styles.photoCard}>
          <View style={styles.photoCardHeader}>
            <Text style={styles.photoCardTitle}>Ảnh check-in</Text>
            {photoUrl && (
              <Pressable onPress={() => setSelectedImage(photoUrl)} hitSlop={8}>
                <Ionicons name="open-outline" size={18} color="#64748B" />
              </Pressable>
            )}
          </View>

          <View style={styles.photoCardBody}>
            {/* Thumbnail Image */}
            {photoUrl ? (
              <Pressable onPress={() => setSelectedImage(photoUrl)}>
                <Image source={{ uri: photoUrl }} style={styles.checkInThumbnail} />
              </Pressable>
            ) : (
              <View style={[styles.checkInThumbnail, styles.photoPlaceholder]}>
                <Ionicons name="image-outline" size={32} color="#94A3B8" />
              </View>
            )}

            {/* Info next to photo */}
            <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
              <Text style={styles.photoRecordedLabel}>Ghi nhận lúc</Text>
              <Text style={styles.photoRecordedTime}>{checkInTime}</Text>

              {photoUrl && (
                <Pressable onPress={() => setSelectedImage(photoUrl)} style={styles.viewPhotoLink} hitSlop={6}>
                  <Text style={styles.viewPhotoLinkText}>Xem ảnh</Text>
                  <Ionicons name="arrow-forward-outline" size={12} color="#166534" style={{ transform: [{ rotate: '-45deg' }] }} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Card 6: Check-out */}
        <View style={styles.checkOutCard}>
          <View style={styles.checkOutIconWrapper}>
            <Ionicons name="time-outline" size={20} color="#64748B" />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.checkOutTitle}>Check-out</Text>
            <Text style={styles.checkOutSubText}>
              {checkOutTime ? `Ghi nhận lúc ${checkOutTime}` : 'Chưa ghi nhận'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.imageModalOverlay}>
            <Pressable style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={36} color="#FFF" />
            </Pressable>
            <Image source={{ uri: selectedImage }} style={styles.imageModalPreview} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  brandHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#132E22',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 1.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 60,
    gap: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  presentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  presentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  presentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkInHeroCard: {
    backgroundColor: '#1B382B', // Deep forest green matching template
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1B382B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroPreTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroTimeText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 44,
  },
  heroSubText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  heroClockCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  locCoords: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  seeMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeMapText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  photoCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkInThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoRecordedLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  photoRecordedTime: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  viewPhotoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  viewPhotoLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  checkOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkOutIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkOutSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  imageModalPreview: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
});
