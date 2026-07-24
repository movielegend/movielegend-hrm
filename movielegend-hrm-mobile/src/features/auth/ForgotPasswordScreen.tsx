import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/Screen';
import { requestOtpApi, verifyOtpApi, resetPasswordApi } from '../../api/auth.api';
import { removeRememberedAccount } from '../../storage/remembered-accounts.storage';

export function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập số điện thoại' });
      return;
    }
    try {
      setIsLoading(true);
      await requestOtpApi({ phone });
      Toast.show({ type: 'success', text1: 'Mã xác thực đã được gửi!' });
      setStep(2);
      setCountdown(60);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Lỗi gửi OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'OTP phải gồm 6 chữ số' });
      return;
    }
    try {
      setIsLoading(true);
      const res = await verifyOtpApi({ phone, otp });
      setResetToken(res.resetToken);
      setStep(3);
      Toast.show({ type: 'success', text1: 'Xác minh thành công!' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Mã OTP không hợp lệ' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Mật khẩu phải từ 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    try {
      setIsLoading(true);
      await resetPasswordApi({ resetToken, newPassword });
      await removeRememberedAccount(phone);
      Toast.show({ type: 'success', text1: 'Đổi mật khẩu thành công!' });
      router.replace('/login');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.message || 'Lỗi đổi mật khẩu' });
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhone = (p: string) => {
    if (p.length < 6) return p;
    return p.substring(0, 3) + '****' + p.substring(p.length - 3);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => {
            if (step > 1) setStep((s) => (s - 1) as 1|2|3);
            else router.back();
          }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.title}>Quên mật khẩu</Text>
        </View>

        <View style={styles.content}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.description}>
                Nhập số điện thoại của bạn để nhận mã OTP khôi phục mật khẩu.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 0987654321"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <Pressable
                style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                onPress={handleRequestOtp}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Gửi mã OTP</Text>}
              </Pressable>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.description}>
                Mã xác thực đã được gửi tới {maskPhone(phone)}. Mã có hiệu lực trong 5 phút.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập 6 số OTP"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Pressable
                style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                onPress={handleVerifyOtp}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Xác nhận</Text>}
              </Pressable>

              <Pressable
                style={[styles.resendBtn, countdown > 0 && styles.disabledBtn]}
                onPress={handleRequestOtp}
                disabled={countdown > 0 || isLoading}
              >
                <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                  {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã'}
                </Text>
              </Pressable>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.description}>Nhập mật khẩu mới cho tài khoản của bạn.</Text>
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                style={[styles.primaryBtn, isLoading && styles.disabledBtn]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Đổi mật khẩu</Text>}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  backBtn: { padding: 4, marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 24 },
  stepContainer: {},
  description: { fontSize: 14, color: '#4B5563', marginBottom: 24, lineHeight: 22 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  primaryBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  resendBtn: { marginTop: 24, alignItems: 'center', padding: 8 },
  resendText: { color: '#3B82F6', fontSize: 14, fontWeight: '600' },
  resendTextDisabled: { color: '#9CA3AF' }
});
