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
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  badgeBgColor = '#FFFFFF',
  badgeIconColor = '#64748B',
  badgeBorderColor = '#E2E8F0',
}: AvatarPickerProps) {
  const { user, reloadProfile } = useAuth();
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
        setLoading(true);
        const selectedAsset = result.assets[0];

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

        {/* Camera edit badge */}
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
            name="camera-outline"
            size={Math.round(badgeSize * 0.58)}
            color={badgeIconColor}
          />
        </View>

        {loading && (
          <View style={[styles.loadingOverlay, { borderRadius: radius }]}>
            <ActivityIndicator color="#FFF" size="small" />
          </View>
        )}
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Cập nhật ảnh đại diện</Text>

            <Pressable style={styles.menuItem} onPress={() => handlePickImage('camera')}>
              <MaterialCommunityIcons name="camera" size={24} color="#374151" />
              <Text style={styles.menuItemText}>Chụp ảnh mới</Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => handlePickImage('gallery')}>
              <MaterialCommunityIcons name="image-multiple" size={24} color="#374151" />
              <Text style={styles.menuItemText}>Chọn từ thư viện</Text>
            </Pressable>
          </View>
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
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    width: '80%',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
});
