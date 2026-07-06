import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboard}>
        <View style={styles.container}>
          <LogoMark />
          <View style={styles.panel}>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.caption}>Truy cập hệ thống MovieLegend HRM bằng tài khoản đã được duyệt.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Số điện thoại</Text>
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
                    style={styles.input}
                    value={value}
                  />
                )}
              />
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone.message}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.passwordRow}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Nhập mật khẩu"
                      secureTextEntry={secureText}
                      style={styles.passwordInput}
                      value={value}
                    />
                  )}
                />
                <Pressable accessibilityRole="button" onPress={() => setSecureText((current) => !current)} style={styles.toggle}>
                  <Text style={styles.toggleText}>{secureText ? 'Hiện' : 'Ẩn'}</Text>
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.fieldError}>{errors.password.message}</Text> : null}
            </View>

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={onSubmit} style={[styles.loginButton, isSubmitting && styles.disabled]}>
              {isSubmitting ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.loginText}>Đăng nhập</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={styles.registerLink}>
              <Text style={styles.registerText}>Đăng ký tài khoản mới</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
