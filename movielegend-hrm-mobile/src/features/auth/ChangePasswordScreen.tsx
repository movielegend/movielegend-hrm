import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Decorative Header Background */}
      <View style={styles.headerBg}>
        {/* Mock gradient using solid color and large circles */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        
        {/* Header Content */}
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>

          <View style={styles.shieldContainer}>
            <View style={styles.shieldRing1}>
              <View style={styles.shieldRing2}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#FFF" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>Cập nhật mật khẩu để bảo mật tài khoản</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Alert Box */}
          <View style={styles.alertBox}>
            <View style={styles.alertLeftBorder} />
            <Text style={styles.alertText}>
              Sau khi đổi mật khẩu, bạn sẽ được đăng xuất và cần đăng nhập lại.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
              />
            </View>
          </View>

          {/* Submit Button */}
          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}>
            <Text style={styles.submitBtnText}>Xác nhận đổi mật khẩu</Text>
          </Pressable>

          {/* Go Back Text Button */}
          <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>&larr; Quay lại</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Lighter grey background for the bottom part
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340, // Height to cover header and some behind the card
    backgroundColor: '#7C3AED', // Base purple
    overflow: 'hidden',
  },
  circleTopRight: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24, // Space before the card overlaps
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shieldContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  shieldRing1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldRing2: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
  alertBox: {
    backgroundColor: '#FFFBEB', // Light yellow
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
    overflow: 'hidden',
  },
  alertLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#F59E0B', // Orange border
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  alertText: {
    fontSize: 14,
    color: '#D97706', // Darker orange
    fontWeight: '500',
    lineHeight: 20,
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563', // Gray 600
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Gray 100
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Gray 200
    height: 52,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  submitBtn: {
    backgroundColor: '#7C3AED',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitBtnPressed: {
    backgroundColor: '#6D28D9',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  goBackBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  goBackText: {
    color: '#7C3AED',
    fontSize: 15,
    fontWeight: '600',
  }
});
