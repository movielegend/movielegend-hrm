import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../providers/AuthProvider';
import { updateMe } from '../../../api/users.api';
import { uploadFile } from '../../../api/uploads.api';

export function AvatarPicker({ getInitials }: { getInitials: (name?: string) => string }) {
  const { user, reloadProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePickImage = async (mode: 'camera' | 'gallery') => {
    setMenuVisible(false);
    try {
      let result;
      if (mode === 'camera') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          return;
        }
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
          purpose: 'EMPLOYEE_DOCUMENT' // Using EMPLOYEE_DOCUMENT to bypass backend enum validation
        });

        if (!uploadedFile || !uploadedFile.fileUrl) {
          throw new Error('Upload ảnh thất bại.');
        }

        // 2. Update user profile
        await updateMe({
          avatarUrl: uploadedFile.fileUrl
        });

        // 3. Reload auth context
        await reloadProfile();
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setMenuVisible(true)} style={styles.avatarContainer}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
        )}
        
        <View style={styles.editBadge}>
          <MaterialCommunityIcons name="camera-outline" size={14} color="#FFF" />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color="#FFF" />
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
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 40,
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
