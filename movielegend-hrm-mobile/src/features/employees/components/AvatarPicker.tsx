import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../providers/AuthProvider';
import { updateMe } from '../../../api/users.api';
import { uploadFile } from '../../../api/uploads.api';
import {
  requestCameraPermissionWithFallback,
  requestMediaLibraryPermissionWithFallback,
} from '../../../utils/mediaPermissions';
import { CustomAlert } from '../../../components/CustomAlert';

interface AvatarPickerProps {
  getInitials: (name?: string) => string;
  size?: number;
  bgColor?: string;
  textColor?: string;
  badgeBgColor?: string;
  badgeIconColor?: string;
  badgeBorderColor?: string;
}

export function AvatarPicker({
  getInitials,
  size = 56,
  bgColor = '#E8F5E9',
  textColor = '#1B3B2B',
  badgeBgColor = '#1B3B2B',
  badgeIconColor = '#FFFFFF',
  badgeBorderColor = '#FFFFFF',
}: AvatarPickerProps) {
  const { user, reloadProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePickImage = async (mode: 'camera' | 'gallery') => {
    setMenuVisible(false);
    try {
      let result;
      if (mode === 'camera') {
        const hasPermission = await requestCameraPermissionWithFallback();
        if (!hasPermission) return;
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        const hasPermission = await requestMediaLibraryPermissionWithFallback();
        if (!hasPermission) return;
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (!selectedAsset) return;

        setLoading(true);

        // 1. Upload to server
        const uploadedFile = await uploadFile({
          uri: selectedAsset.uri,
          mimeType: selectedAsset.mimeType || 'image/jpeg',
          name: selectedAsset.fileName || 'avatar.jpg',
          purpose: 'EMPLOYEE_DOCUMENT',
        });

        if (!uploadedFile || !uploadedFile.fileUrl) {
          throw new Error('Upload ảnh thất bại.');
        }

        // 2. Update user profile
        await updateMe({
          avatarUrl: uploadedFile.fileUrl,
        });

        // 3. Reload auth context
        await reloadProfile();
      }
    } catch (error: any) {
      CustomAlert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  const radius = size / 2;
  const badgeSize = Math.max(20, Math.round(size * 0.38));
  const badgeRadius = badgeSize / 2;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setMenuVisible(true)}
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: bgColor,
          },
        ]}
      >
        {user?.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={[styles.avatarImage, { borderRadius: radius }]}
          />
        ) : (
          <Text
            style={[
              styles.avatarText,
              { color: textColor, fontSize: Math.round(size * 0.35) },
            ]}
          >
            {getInitials(user?.fullName)}
          </Text>
        )}

        {/* Camera edit badge on avatar */}
        <View
          style={[
            styles.editBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeRadius,
              backgroundColor: badgeBgColor,
              borderColor: badgeBorderColor,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="camera"
            size={Math.round(badgeSize * 0.55)}
            color={badgeIconColor}
          />
        </View>

        {loading && (
          <View style={[styles.loadingOverlay, { borderRadius: radius }]}>
            <ActivityIndicator color="#FFF" size="small" />
          </View>
        )}
      </Pressable>

      {/* ── Bottom Sheet Modal Matching Template ── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} onPress={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <View style={styles.sheetHandle} />

            {/* Close Button Top Right */}
            <Pressable
              style={styles.sheetCloseBtn}
              onPress={() => setMenuVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>

            {/* Sheet Title & Subtitle */}
            <Text style={styles.sheetTitle}>Ảnh đại diện</Text>
            <Text style={styles.sheetSubtitle}>Chọn cách cập nhật ảnh của bạn</Text>

            {/* Avatar Preview */}
            <View style={styles.previewContainer}>
              <View style={styles.previewAvatarRing}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewFallback}>
                    <Text style={styles.previewInitials}>
                      {getInitials(user?.fullName)}
                    </Text>
                  </View>
                )}
                {/* Floating camera badge */}
                <View style={styles.previewBadge}>
                  <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Action 1: Chụp ảnh mới */}
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handlePickImage('camera')}
            >
              <View style={styles.optionIconBox}>
                <MaterialCommunityIcons name="camera" size={22} color="#1B3B2B" />
              </View>
              <View style={styles.optionMetaCol}>
                <Text style={styles.optionTitle}>Chụp ảnh mới</Text>
                <Text style={styles.optionSubtitle}>Sử dụng camera của điện thoại</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Action 2: Chọn từ thư viện */}
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
              onPress={() => handlePickImage('gallery')}
            >
              <View style={styles.optionIconBox}>
                <MaterialCommunityIcons name="image" size={22} color="#1B3B2B" />
              </View>
              <View style={styles.optionMetaCol}>
                <Text style={styles.optionTitle}>Chọn từ thư viện</Text>
                <Text style={styles.optionSubtitle}>Chọn ảnh có sẵn trên thiết bị</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Bottom Sheet ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B3B2B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },

  /* ── Preview Avatar ── */
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewAvatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8F2EC',
  },
  previewImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  previewFallback: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B3B2B',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1B3B2B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  /* ── Option Cards ── */
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  optionCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  optionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionMetaCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  optionSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* ── Cancel Button ── */
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B3B2B',
  },
});
