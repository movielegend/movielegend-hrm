import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { PrimaryButton } from '../../components/Buttons';
import { Screen } from '../../components/Screen';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge, toneForStatus } from '../../components/StatusBadge';
import { useCreateEmployeeRequest, useMyEmployeeRequests } from '../../hooks/useEmployeeRequests';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { EmployeeRequestType } from '../../types/request.types';
import { normalizeApiError } from '../../utils/api-error';

const requestTypes: EmployeeRequestType[] = ['LATE_ARRIVAL', 'EARLY_LEAVE', 'BUSINESS_TRIP', 'ADVANCE', 'EXPENSE', 'PURCHASE', 'EQUIPMENT', 'OTHER'];

export function EmployeeRequestsHomeScreen() {
  const router = useRouter();
  const requests = useMyEmployeeRequests({ page: 1, limit: 20 });
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Yeu cau nhan vien" subtitle="Tao generic employee request theo backend." />
        <PrimaryButton onPress={() => router.push('/employee/requests/create')}>Tao yeu cau</PrimaryButton>
        <SectionCard title="Lich su">
          {(requests.data?.items ?? []).map((request) => (
            <SectionCard key={request.id}>
              <Text style={styles.title}>{request.title}</Text>
              <StatusBadge label={request.status} tone={toneForStatus(request.status)} />
              <Text style={styles.muted}>{request.content}</Text>
            </SectionCard>
          ))}
          {!requests.data?.items.length ? <EmptyState title="Chua co yeu cau" /> : null}
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

export function CreateEmployeeRequestScreen() {
  const mutation = useCreateEmployeeRequest();
  const [type, setType] = useState<EmployeeRequestType>('OTHER');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');

  async function submit() {
    try {
      await mutation.mutateAsync({
        type,
        title,
        content,
        ...(amount ? { amount: Number(amount) } : {}),
      });
      Alert.alert('Thanh cong', 'Da gui yeu cau');
    } catch (error) {
      const normalized = normalizeApiError(error);
      Alert.alert(normalized.code, normalized.message);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title="Tao yeu cau" subtitle="Phase 3 chi tao generic shell, khong lam business logic sau cho tung loai." />
        <SectionCard title="Loai yeu cau">
          {requestTypes.map((item) => (
            <PrimaryButton key={item} disabled={type === item} onPress={() => setType(item)}>{item}</PrimaryButton>
          ))}
        </SectionCard>
        <SectionCard>
          <FormField label="Tieu de" value={title} onChangeText={setTitle} />
          <FormField label="Noi dung" value={content} onChangeText={setContent} multiline />
          <FormField label="So tien optional" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <PrimaryButton loading={mutation.isPending} disabled={title.length < 3 || content.length < 3} onPress={() => void submit()}>Gui yeu cau</PrimaryButton>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
