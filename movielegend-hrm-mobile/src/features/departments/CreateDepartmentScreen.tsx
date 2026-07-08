import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function CreateDepartmentScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </Pressable>
        <Text style={styles.headerTitle}>Tạo phòng ban</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Thông tin cơ bản */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên phòng ban <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên phòng ban..."
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mã phòng ban <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.prefixIcon}>#</Text>
              <TextInput
                style={[styles.input, styles.inputNoBorder]}
                placeholder="VÍ DỤ: HR, IT-DEV, MKT..."
                placeholderTextColor="#94A3B8"
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Nhân sự & Quản lý */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={22} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Nhân sự & Quản lý</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Người quản lý trực tiếp <Text style={styles.required}>*</Text></Text>
            <Pressable style={styles.selectorCard}>
              <View style={styles.managerInfo}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' }} 
                  style={styles.managerAvatar} 
                />
                <View>
                  <Text style={styles.managerName}>Nguyễn Văn A</Text>
                  <Text style={styles.managerRole}>Giám đốc vận hành</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </Pressable>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              <Text style={styles.infoText}>Người quản lý sẽ có quyền phê duyệt các yêu cầu và giao task.</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Thành viên phòng ban</Text>
            
            {/* Mocked Member List */}
            <View style={styles.memberList}>
              <View style={styles.memberItem}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' }} 
                  style={styles.memberAvatarSmall} 
                />
                <Text style={styles.memberName}>Trần Thị Bình</Text>
                <Pressable style={styles.removeMemberBtn}>
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.addMemberBtn}>
              <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.addMemberBtnText}>Thêm thành viên mới</Text>
            </Pressable>
            
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color="#64748B" />
              <Text style={styles.infoText}>Chỉ định nhân sự vào phòng ban ngay từ bây giờ.</Text>
            </View>
          </View>
        </View>

        {/* Chi tiết bổ sung */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Chi tiết bổ sung</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả chức năng</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Nhập mô tả về nhiệm vụ và chức năng của phòng ban này..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </Pressable>
        <Pressable style={styles.submitBtn} onPress={() => {}}>
          <Text style={styles.submitBtnText}>Tạo mới</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRight: {
    width: 32, // placeholder to center title
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  prefixIcon: {
    fontSize: 16,
    color: '#64748B',
    marginRight: 8,
  },
  inputNoBorder: {
    borderWidth: 0,
    flex: 1,
    paddingHorizontal: 0,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  managerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  managerRole: {
    fontSize: 12,
    color: '#64748B',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    marginTop: 8,
  },
  addMemberBtnText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  memberList: {
    marginBottom: 8,
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 8,
    padding: 8,
  },
  memberAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  memberName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  removeMemberBtn: {
    padding: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    height: 120,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
