import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { z } from 'zod';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../providers/AuthProvider';
import { mapLoginError } from '../../utils/api-error';
import { getHomeRouteForUser } from '../../utils/role-routing';
import {
  getRememberedAccounts,
  rememberAccount,
  removeRememberedAccount,
  RememberedAccount,
} from '../../storage/remembered-accounts.storage';

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

  const [rememberMe, setRememberMe] = useState(false);
  const [rememberedAccounts, setRememberedAccounts] = useState<RememberedAccount[]>([]);
  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const phoneValue = watch('phone');

  useEffect(() => {
    async function loadAccounts() {
      const accounts = await getRememberedAccounts();
      setRememberedAccounts(accounts);
    }
    void loadAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    const keyword = (phoneValue || '').trim();
    if (!keyword) return rememberedAccounts;
    return rememberedAccounts.filter((account) => account.phone.startsWith(keyword));
  }, [phoneValue, rememberedAccounts]);

  const handleSelectAccount = (account: RememberedAccount) => {
    setValue('phone', account.phone, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
    setRememberMe(true);
    setShowAccountSuggestions(false);
  };

  const handleRemoveAccount = async (phoneToRemove: string) => {
    await removeRememberedAccount(phoneToRemove);
    setRememberedAccounts((prev) => prev.filter((a) => a.phone !== phoneToRemove));
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      if (rememberMe) {
        await rememberAccount(values.phone, values.password);
      } else {
        await removeRememberedAccount(values.phone);
      }
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
              <View style={[styles.inputWrapper, errors.phone && styles.inputError, { zIndex: 10 }]}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      onBlur={() => {
                        onBlur();
                        setTimeout(() => setShowAccountSuggestions(false), 200);
                      }}
                      onFocus={() => setShowAccountSuggestions(true)}
                      onChangeText={(val) => {
                        onChange(val);
                        setShowAccountSuggestions(true);
                      }}
                      placeholder="0987654321"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      style={styles.inputText}
                      value={value}
                    />
                  )}
                />

                {showAccountSuggestions && filteredAccounts.length > 0 && (
                  <View style={styles.suggestionsDropdown}>
                    {filteredAccounts.map((account) => (
                      <View key={account.phone} style={styles.suggestionItem}>
                        <Pressable
                          style={styles.suggestionPhoneBtn}
                          onPress={() => handleSelectAccount(account)}
                        >
                          <Text style={styles.suggestionPhoneText}>{account.phone}</Text>
                        </Pressable>
                        <Pressable
                          style={styles.suggestionRemoveBtn}
                          onPress={() => handleRemoveAccount(account.phone)}
                        >
                          <Ionicons name="close" size={18} color="#9CA3AF" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
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

              <Pressable style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>

              <View style={styles.rememberMeRow}>
                <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxPressable}>
                  <Ionicons name={rememberMe ? 'checkbox' : 'square-outline'} size={20} color={rememberMe ? '#111827' : '#9CA3AF'} />
                  <Text style={styles.rememberMeText}>Ghi nhớ tài khoản và mật khẩu</Text>
                </Pressable>
              </View>

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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    height: 28,
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
    borderRadius: 12,
    height: 60,
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
    borderRadius: 12,
    height: 56,
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
  suggestionsDropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEEF3',
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionPhoneBtn: {
    flex: 1,
  },
  suggestionPhoneText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  suggestionRemoveBtn: {
    padding: 4,
  },
  rememberMeRow: {
    marginBottom: 24,
  },
  checkboxPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
});