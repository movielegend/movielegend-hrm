import { Text } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { PageHeader } from '../../components/PageHeader';
import { Screen } from '../../components/Screen';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionCard } from '../../components/SectionCard';
import { useAuth } from '../../providers/AuthProvider';

export function EmployeeProfileScreen() {
  const { user } = useAuth();
  return (
    <Screen>
      <ScreenContainer>
        <PageHeader title="Hồ sơ cá nhân" subtitle="Phase này hiển thị read-only theo /auth/me." />
        <SectionCard>
          <Avatar name={user?.fullName} uri={user?.avatarUrl} />
          <Text>{user?.fullName ?? '-'}</Text>
          <Text>Mã NV: {user?.userCode ?? '-'}</Text>
          <Text>SĐT: {user?.phone ?? '-'}</Text>
          <Text>Email: {user?.email ?? '-'}</Text>
          <Text>Phòng ban: {user?.department?.name ?? '-'}</Text>
          <Text>Vị trí: {user?.position?.name ?? '-'}</Text>
          <Text>Face: {user?.hasFaceData ? 'Đã có' : 'Chưa có'}</Text>
        </SectionCard>
      </ScreenContainer>
    </Screen>
  );
}
