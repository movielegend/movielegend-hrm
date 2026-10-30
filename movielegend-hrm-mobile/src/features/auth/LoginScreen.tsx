import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <Screen unsafe={true}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardDismissMode="on-drag"
          >
            <View style={styles.innerContent}>
              {/* Header Branding */}
              <View style={styles.header}>
                <Image
                  source={require('../../../assets/ml-logo-only.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitleText}>MOVIE LEGEND</Text>
                <View style={styles.headerDivider} />
              </View>

              {/* Pill Badge */}
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>Chào mừng trở lại</Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.mainTitle}>Đăng nhập</Text>
              <Text style={styles.subtitleText}>Truy cập tài khoản để bắt đầu công việc.</Text>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Phone Field */}
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <View style={[styles.inputBox, errors.phone && styles.inputBoxError, { zIndex: 10 }]}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        maxLength={10}
                        onBlur={() => {
                          onBlur();
                          setTimeout(() => setShowAccountSuggestions(false), 200);
                        }}
                        onFocus={() => setShowAccountSuggestions(true)}
                        onChangeText={(val) => {
                          const cleanVal = val.replace(/\D/g, '').slice(0, 10);
                          onChange(cleanVal);
                          setShowAccountSuggestions(true);
                        }}
                        placeholder="Nhập số điện thoại"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                        style={styles.inputText}
                        value={value}
                        underlineColorAndroid="transparent"
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
                            <Ionicons name="close" size={18} color="#94A3B8" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {errors.phone ? <Text style={styles.errorText}>{errors.phone.message}</Text> : null}

                {/* Password Field */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Mật khẩu</Text>
                <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={secureText}
                        style={[styles.inputText, { flex: 1 }]}
                        value={value}
                        underlineColorAndroid="transparent"
                      />
                    )}
                  />
                  <Pressable onPress={() => setSecureText(!secureText)} hitSlop={10} style={styles.togglePasswordBtn}>
                    <Text style={styles.togglePasswordText}>{secureText ? 'Hiện' : 'Ẩn'}</Text>
                  </Pressable>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}

                {/* Remember Me & Forgot Password Row */}
                <View style={styles.optionsRow}>
                  <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberPressable} hitSlop={6}>
                    <View style={[styles.checkboxSquare, rememberMe && styles.checkboxSquareChecked]}>
                      {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                  </Pressable>

                  <Pressable onPress={() => router.push('/forgot-password')} hitSlop={6}>
                    <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                  </Pressable>
                </View>

                {formError ? (
                  <View style={styles.formErrorBox}>
                    <Ionicons name="alert-circle" size={18} color="#EF4444" />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => void onSubmit()}
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Đăng nhập</Text>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Chưa có tài khoản?</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Secondary Button */}
                <Pressable
                  onPress={() => router.push('/register')}
                  style={styles.createAccountButton}
                >
                  <Text style={styles.createAccountButtonText}>Tạo tài khoản mới</Text>
                </Pressable>
              </View>

              {/* Footer */}
              <Text style={styles.footerBrandText}>MOVIE LEGEND  ·  ML GROUP</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContent: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  logoImage: {
    width: 110,
    height: 48,
    marginBottom: 6,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 18,
  },
  pillBadge: {
    backgroundColor: '#E0EDF8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  pillBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 26,
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  inputText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    padding: 0,
    backgroundColor: 'transparent',
  },
  togglePasswordBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
  togglePasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  rememberPressable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  rememberText: {
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
  formErrorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  formErrorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  createAccountButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerBrandText: {
    marginTop: 36,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 2,
    textAlign: 'center',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionPhoneBtn: {
    flex: 1,
  },
  suggestionPhoneText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  suggestionRemoveBtn: {
    padding: 4,
  },
});
