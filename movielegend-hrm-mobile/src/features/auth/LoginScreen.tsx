import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';
import { LogoMark } from '../../components/LogoMark';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { mapLoginError } from '../../utils/api-error';
import { getHomeRouteForUser } from '../../utils/role-routing';

const loginSchema = z.object({
  phone: z.string().min(8, 'Vui lòng nhập số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [secureText, setSecureText] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      router.replace(getHomeRouteForUser(user));
    } catch (error) {
      setFormError(mapLoginError(error));
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>

            {/* Header Branding */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ width: 80, height: 80, backgroundColor: '#1E88E5', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
                <Ionicons name="film-outline" size={40} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0B3B61', letterSpacing: -0.5 }}>MovieLegend</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E88E5', letterSpacing: 2, marginTop: 4 }}>HR MANAGEMENT</Text>
            </View>

            {/* Login Form Card */}
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0B3B61', marginBottom: 6 }}>Chào mừng trở lại</Text>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Đăng nhập để tiếp tục quản lý công việc</Text>

              <View style={{ gap: 20 }}>
                {/* Phone Field */}
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B4A59', marginBottom: 8, textTransform: 'uppercase' }}>Số điện thoại</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: errors.phone ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 52 }}>
                    <Ionicons name="call-outline" size={20} color={errors.phone ? '#EF4444' : '#94A3B8'} style={{ marginRight: 8 }} />
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          keyboardType="phone-pad"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="Nhập số điện thoại"
                          placeholderTextColor="#94A3B8"
                          style={{ flex: 1, fontSize: 15, color: '#1E293B', height: '100%' }}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  {errors.phone ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.phone.message}</Text> : null}
                </View>

                {/* Password Field */}
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#3B4A59', textTransform: 'uppercase' }}>Mật khẩu</Text>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E88E5' }}>Quên mật khẩu?</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: errors.password ? '#EF4444' : '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 52 }}>
                    <Ionicons name="lock-closed-outline" size={20} color={errors.password ? '#EF4444' : '#94A3B8'} style={{ marginRight: 8 }} />
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="Nhập mật khẩu"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry={secureText}
                          style={{ flex: 1, fontSize: 15, color: '#1E293B', height: '100%' }}
                          value={value}
                        />
                      )}
                    />
                    <Pressable onPress={() => setSecureText(!secureText)} style={{ padding: 4 }}>
                      <Ionicons name={secureText ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                    </Pressable>
                  </View>
                  {errors.password ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{errors.password.message}</Text> : null}
                </View>

                {formError ? (
                  <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{formError}</Text>
                  </View>
                ) : null}

                <Pressable
                  disabled={isSubmitting}
                  onPress={onSubmit}
                  style={{ backgroundColor: isSubmitting ? '#93C5FD' : '#1E88E5', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#1E88E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>ĐĂNG NHẬP</Text>}
                </Pressable>

              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
              <Text style={{ fontSize: 14, color: '#64748B' }}>Nhân sự mới? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E88E5' }}>Đăng ký tài khoản</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  disabled: {
    opacity: 0.7,
  },
  field: {
    gap: spacing.sm,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
  },
  formError: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 8,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  keyboard: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  loginText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
  },
  passwordInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  passwordRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  registerLink: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  registerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  toggle: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});