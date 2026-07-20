import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { mapLoginError } from '../../utils/api-error';
import { getHomeRouteForUser } from '../../utils/role-routing';

const loginSchema = z.object({
  phone: z.string().min(8, 'Vui lòng nhập số điện thoại hoặc email'),
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
      <View style={styles.container}>
        <KeyboardAwareScrollView 
          contentContainerStyle={styles.scrollContent} 
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContent}>

            {/* Header Branding */}
            <View style={styles.header}>
              <Image 
                source={require('../../../assets/logo-watermark.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
              <Text style={styles.subtitleText}>Sign in to continue to Movielegend</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* Phone/Email Field */}
              <View style={[styles.inputWrapper, errors.phone && styles.inputError]}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="0987654321"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      style={styles.inputText}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone.message}</Text> : null}

              {/* Password Field */}
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={secureText}
                        style={[styles.inputText, { flex: 1 }]}
                        value={value}
                      />
                    )}
                  />
                  <Pressable onPress={() => setSecureText(!secureText)} style={styles.eyeBtn}>
                    <Ionicons name={secureText ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}

              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>

              {formError ? (
                <View style={styles.formErrorBox}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.formErrorText}>{formError}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={isSubmitting}
                onPress={onSubmit}
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Đăng nhập</Text>
                )}
              </Pressable>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Logins */}
              <Pressable style={styles.socialButton}>
                <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </Pressable>

            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.footerLink}>Sign up</Text>
              </Pressable>
            </View>

          </View>
        </KeyboardAwareScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC', // Lighter background
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoImage: {
    width: 200,
    height: 80,
    marginBottom: 24,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  inputText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    height: 24,
    padding: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingLeft: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  formErrorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  formErrorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#111827',
    borderRadius: 20,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ECEEF3',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF3',
    borderRadius: 20,
    height: 52,
    marginBottom: 16,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});